# Pulsar (still under development - new features etc.)
A platform for publishing posts and comments. Users can create posts, browse the feed on the home page, and open individual posts with a paginated list of comments. Admin can view and block users. The app supports a light/dark theme and multiple languages with ngx-translate and PrimeNG locale.

#### Demo: https://pulsar-app.netlify.app/
#### The demo backend runs on a free server that goes to sleep when idle. The first load may take up to a minute, thanks for your patience.
Test admin credentials:
- Username: **admin**
- Password: **zaq1@WSX**

Test user credentials:
- Username/Email: **userExample** or **userexample@email.com**
- Password: **zaq1@WSX**

#### To develop locally:

1. Run **npm install** in the **/strapi** directory
2. Create a **.env** file based on **.env.example** in the **/strapi** directory
3. Run **npm run dev** in the **/strapi** directory
4. Create a Strapi admin account (local)
5. (Optional) To test admin features, create a user with the **Admin** role in **Content Manager → User**, or register via the frontend and change the role to **Admin**

6. Run **npm install** in the **/frontend** directory
7. Run **npm run start** in the **/frontend** directory
8. Log in to the created admin/user or register a new user

