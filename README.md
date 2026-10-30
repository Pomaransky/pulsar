# Pulsar (still under development - new features etc.)
A full-stack social platform for publishing posts and comments, with an admin panel for user moderation.

#### Tech stack:
- **Monorepo:** `/frontend` (Angular) and `/strapi` (Strapi backend)
- **Frontend:** Angular 22 (standalone components, Angular Signals, zoneless change detection), NgRx Signal Store, RxJS, PrimeNG 22, Tailwind, ngx-translate, date-fns
- **Backend:** Strapi 5, PostgreSQL (Neon)
- **Hosting:** Render (backend, migrated from Strapi Cloud), Netlify (frontend), Cloudinary (media)
- **Testing:** Karma, Jasmine

#### Demo: https://pulsar-app.netlify.app/
#### The demo backend runs on a free server that goes to sleep when idle. The first load may take up to 2 minutes, thanks for your patience.
Test admin credentials:
- Username: **admin**
- Password: **zaq1@WSX**

Test user credentials:
- Username/Email: **userExample** or **userexample@email.com**
- Password: **zaq1@WSX**

#### Features:
- Publishing posts and comments with media attachments, likes and paginated feeds
- Role-based access control with an admin panel for user management and moderation
- User moderation system with permanent bans, time-based bans and shadow bans for content visibility control
- Light/dark theme switching
- Multi-language support with ngx-translate and PrimeNG locale

#### To develop locally:

1. Run **npm install** in the **/strapi** directory
2. Create a **.env** file based on **.env.example** in the **/strapi** directory
3. Run **npm run dev** in the **/strapi** directory
4. Create a Strapi admin account (local)
5. (Optional) To test admin features, create a user with the **Admin** role in **Content Manager → User**, or register via the frontend and change the role to **Admin**

6. Run **npm install** in the **/frontend** directory
7. Run **npm run start** in the **/frontend** directory
8. Log in to the created admin/user or register a new user

