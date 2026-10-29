import type { Core } from '@strapi/strapi';
import {
  clearAllExpiredTimeBans,
  clearExpiredTimeBanIfNeeded,
  normalizeBanFields,
  USER_MODEL_UID,
} from './utils/user-ban';

async function migrateBanTypes(strapi: Core.Strapi) {
  const legacyNoneUsers = await strapi.db.query(USER_MODEL_UID).findMany({
    where: { banType: 'none' },
  });

  for (const user of legacyNoneUsers) {
    await strapi.documents(USER_MODEL_UID).update({
      documentId: user.documentId,
      data: {
        banType: null,
        banExpiresAt: null,
        blocked: false,
      },
    });
  }

  if (legacyNoneUsers.length > 0) {
    console.log(`Cleared legacy banType=none for ${legacyNoneUsers.length} user(s)`);
  }

  const blockedUsers = await strapi.db.query(USER_MODEL_UID).findMany({
    where: {
      blocked: true,
      $or: [{ banType: { $null: true } }, { banType: 'none' }],
    },
  });

  for (const user of blockedUsers) {
    await strapi.documents(USER_MODEL_UID).update({
      documentId: user.documentId,
      data: {
        banType: 'perm',
        blocked: true,
      },
    });
  }

  if (blockedUsers.length > 0) {
    console.log(`Migrated ${blockedUsers.length} blocked user(s) to banType=perm`);
  }
}

async function setupRolePermissions(roleType: string, permissions: string[]) {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: roleType },
  });

  if (!role) return;

  for (const action of permissions) {
    const existingPermission = await strapi.db.query('plugin::users-permissions.permission').findOne({
      where: {
        role: role.id,
        action,
      },
    });

    if (!existingPermission) {
      await strapi.db.query('plugin::users-permissions.permission').create({
        data: {
          action,
          role: role.id,
        },
      });
    }
  }

  console.log(`${roleType} role permissions configured`);
}

async function createAdminRole() {
  // Check if Admin role already exists
  const existingAdminRole = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'admin' },
  });

  if (existingAdminRole) {
    console.log('Admin role already exists');
    return existingAdminRole;
  }

  // Create Admin role
  const adminRole = await strapi.db.query('plugin::users-permissions.role').create({
    data: {
      name: 'Admin',
      description: 'Administrator role with extended permissions',
      type: 'admin',
    },
  });

  console.log('Admin role created');
  return adminRole;
}

async function setupDefaultRolesAndPermissions() {
  await createAdminRole();

  // Permissions for Public role
  const publicPermissions = [
    'api::analytics-event.analytics-event.track',
  ];

  // Permissions for Authenticated role
  const authenticatedPermissions = [
    // User
    'plugin::users-permissions.user.me',
    'plugin::users-permissions.user.updateMe',
    'plugin::users-permissions.user.find',
    'plugin::users-permissions.user.findOne',
    // Auth
    'plugin::users-permissions.auth.changePassword',
    'plugin::users-permissions.auth.register',
    // Role
    'plugin::users-permissions.role.find',
    'plugin::users-permissions.role.findOne',
    // Post
    'api::post.post.find',
    'api::post.post.findOne',
    'api::post.post.create',
    // Upload
    'plugin::upload.content-api.upload',
    'plugin::upload.content-api.destroy',
    // Like
    'api::like.like.toggle',
    'api::like.like.status',
    // Analytics
    'api::analytics-event.analytics-event.track',
  ];

  // Permissions for Admin role
  const adminPermissions = [
    // Auth
    'plugin::users-permissions.auth.callback',
    'plugin::users-permissions.auth.changePassword',
    'plugin::users-permissions.auth.connect',
    'plugin::users-permissions.auth.emailConfirmation',
    'plugin::users-permissions.auth.forgotPassword',
    'plugin::users-permissions.auth.register',
    'plugin::users-permissions.auth.resetPassword',
    'plugin::users-permissions.auth.sendEmailConfirmation',
    // Permissions
    'plugin::users-permissions.permissions.getPermissions',
    // Role
    'plugin::users-permissions.role.createRole',
    'plugin::users-permissions.role.deleteRole',
    'plugin::users-permissions.role.find',
    'plugin::users-permissions.role.findOne',
    'plugin::users-permissions.role.updateRole',
    // User
    'plugin::users-permissions.user.count',
    'plugin::users-permissions.user.create',
    'plugin::users-permissions.user.destroy',
    'plugin::users-permissions.user.find',
    'plugin::users-permissions.user.findOne',
    'plugin::users-permissions.user.me',
    'plugin::users-permissions.user.update',
    'plugin::users-permissions.user.updateMe',
    // Post
    'api::post.post.find',
    'api::post.post.findOne',
    'api::post.post.create',
    // Upload
    'plugin::upload.content-api.upload',
    'plugin::upload.content-api.destroy',
    // Like
    'api::like.like.toggle',
    'api::like.like.status',
    // Analytics
    'api::analytics-event.analytics-event.track',
    'api::analytics-event.analytics-event.find',
    'api::analytics-event.analytics-event.findOne',
    'api::analytics-counter.analytics-counter.find',
    'api::analytics-counter.analytics-counter.findOne',
  ];

  await setupRolePermissions('public', publicPermissions);
  await setupRolePermissions('authenticated', authenticatedPermissions);
  await setupRolePermissions('admin', adminPermissions);
}

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    strapi.documents.use(async (context, next) => {
      if (context.uid === USER_MODEL_UID && context.action === 'update') {
        const data = context.params?.data as Record<string, unknown> | undefined;
        if (data) {
          try {
            normalizeBanFields(data);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Invalid ban configuration';
            throw new Error(message);
          }
        }
      }

      return next();
    });

    strapi.documents.use(async (context, next) => {
      if (context.uid !== 'api::post.post') return next();
      const isCreate = context.action === 'create';
      const isDelete = context.action === 'delete';

      let parentDocumentId: string | null = null;
      if (isDelete && context.params?.documentId) {
        try {
          const doc = await strapi.documents('api::post.post').findOne({
            documentId: context.params.documentId,
            populate: { parent: true },
          }) as { parent?: { documentId?: string } | string } | null;
          parentDocumentId =
            typeof doc?.parent === 'object' && doc?.parent?.documentId
              ? doc.parent.documentId
              : typeof doc?.parent === 'string'
                ? doc.parent
                : null;
        } catch (e) {
          strapi.log.warn('Post middleware: could not read parent for delete', e);
        }
      }

      const result = await next();

      try {
        if (isCreate && result) {
          const data = context.params?.data as {
            parent?: string | { set?: string[] };
          } | undefined;
          const created = result as { parent?: { documentId?: string } | string };
          const parentFromPayload =
            typeof data?.parent === 'string'
              ? data.parent
              : Array.isArray(data?.parent?.set) && data.parent.set[0]
                ? data.parent.set[0]
                : null;
          const parentFromResult =
            typeof created.parent === 'object' && created.parent?.documentId
              ? created.parent.documentId
              : typeof created.parent === 'string'
                ? created.parent
                : null;
          const parent = parentFromPayload ?? parentFromResult;
          if (parent) {
            const parentDoc = await strapi.documents('api::post.post').findOne({
              documentId: parent,
              status: 'published',
              fields: ['commentsTotal'],
            }) as unknown as { commentsTotal?: number | string } | null;
            const current = Number(parentDoc?.commentsTotal ?? 0) || 0;
            await strapi.documents('api::post.post').update({
              documentId: parent,
              status: 'published',
              data: { commentsTotal: current + 1 },
            });
          }
        }

        if (isDelete && parentDocumentId) {
          const parentDoc = await strapi.documents('api::post.post').findOne({
            documentId: parentDocumentId,
            status: 'published',
            fields: ['commentsTotal'],
          }) as unknown as { commentsTotal?: number | string } | null;
          const current = Number(parentDoc?.commentsTotal ?? 0) || 0;
          await strapi.documents('api::post.post').update({
            documentId: parentDocumentId,
            status: 'published',
            data: { commentsTotal: Math.max(0, current - 1) },
          });
        }
      } catch (e) {
        strapi.log.warn('Post middleware: could not update commentsTotal', e);
      }

      return result;
    });
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await migrateBanTypes(strapi);
    await setupDefaultRolesAndPermissions();

    const cronTask = async () => {
      try {
        const cleared = await clearAllExpiredTimeBans(strapi);
        if (cleared > 0) {
          strapi.log.info(`Cleared ${cleared} expired time ban(s)`);
        }
      } catch (error) {
        strapi.log.warn('Failed to clear expired time bans', error);
      }
    };

    cronTask();
    setInterval(cronTask, 60 * 1000);
  },
};
