import { factories } from '@strapi/strapi';
import { USER_MODEL_UID } from '../../../utils/user-ban';

const LIKE_UID = 'api::like.like';
const POST_UID = 'api::post.post';

type PostAuthor = {
  id?: number;
  documentId?: string;
  banType?: string | null;
};

type PostEntity = {
  documentId?: string;
  likesTotal?: number | string;
  author?: PostAuthor | number | null;
};

type AuthUser = {
  id: number;
  documentId?: string;
  banType?: string | null;
};

function viewerIsShadowbanned(viewer: { banType?: string | null } | undefined): boolean {
  return viewer?.banType === 'shadow';
}

function isPostHiddenByShadowban(
  author: PostAuthor | null,
  viewer: AuthUser | undefined,
): boolean {
  if (!author || author.banType !== 'shadow') {
    return false;
  }

  if (viewerIsShadowbanned(viewer)) {
    return false;
  }

  return !viewer?.id || viewer.id !== author.id;
}

async function resolvePostAuthor(
  strapi: { db: { query: Function } },
  post: PostEntity,
): Promise<PostAuthor | null> {
  const author = post.author;

  if (author && typeof author === 'object') {
    return author;
  }

  if (!author) {
    return null;
  }

  return strapi.db.query(USER_MODEL_UID).findOne({
    where: { id: author },
    select: ['id', 'documentId', 'banType'],
  });
}

async function updateLikesTotal(
  strapi: { db: { query: Function } },
  postDocumentId: string,
  delta: number,
): Promise<number> {
  const postRow = (await strapi.db.query(POST_UID).findOne({
    where: { documentId: postDocumentId, publishedAt: { $notNull: true } },
    select: ['likesTotal'],
  })) as PostEntity | null;
  const current = Number(postRow?.likesTotal ?? 0) || 0;
  const next = Math.max(0, current + delta);

  await strapi.db.query(POST_UID).updateMany({
    where: { documentId: postDocumentId },
    data: { likesTotal: next },
  });

  return next;
}

export default factories.createCoreService(LIKE_UID, ({ strapi }) => ({
  async toggle(payload: { postDocumentId: string; user: AuthUser }) {
    const { postDocumentId, user } = payload;

    const postRow = await strapi.db.query(POST_UID).findOne({
      where: { documentId: postDocumentId, publishedAt: { $notNull: true } },
      select: ['id', 'documentId'],
      populate: { author: { select: ['id', 'documentId', 'banType'] } },
    });

    if (!postRow?.documentId) {
      const error = new Error('Post not found');
      (error as Error & { status: number }).status = 404;
      throw error;
    }

    const author = await resolvePostAuthor(strapi, {
      author: postRow.author as PostAuthor | number | null,
    });
    if (isPostHiddenByShadowban(author, user)) {
      const error = new Error('Post not found');
      (error as Error & { status: number }).status = 404;
      throw error;
    }

    const existingLike = await strapi.db.query(LIKE_UID).findOne({
      where: {
        user: user.id,
        post: postRow.id,
      },
    });

    if (existingLike) {
      await strapi.documents(LIKE_UID).delete({
        documentId: existingLike.documentId,
      });
      const likesTotal = await updateLikesTotal(strapi, postDocumentId, -1);
      return { liked: false, likesTotal };
    }

    await strapi.documents(LIKE_UID).create({
      data: {
        user: user.id,
        post: postRow.id,
      },
    });
    const likesTotal = await updateLikesTotal(strapi, postDocumentId, 1);
    return { liked: true, likesTotal };
  },

  async getLikedPostIds(payload: {
    postDocumentIds: string[];
    userId: number;
  }): Promise<string[]> {
    const { postDocumentIds, userId } = payload;
    const uniqueIds = [...new Set(postDocumentIds.filter(Boolean))];

    if (!uniqueIds.length) {
      return [];
    }

    const likes = await strapi.db.query(LIKE_UID).findMany({
      where: {
        user: userId,
        post: { documentId: { $in: uniqueIds } },
      },
      populate: { post: { select: ['documentId'] } },
    });

    return likes
      .map((like: { post?: { documentId?: string } | null }) => like.post?.documentId)
      .filter((id: string | undefined): id is string => !!id);
  },
}));
