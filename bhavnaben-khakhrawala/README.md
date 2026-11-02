# Bhavnaben Khakhrawala - website + admin 
Upload ALL files of this folder to a GitHub repo (netlify.toml, netlify/, public/, db/, README.md). Never upload passwords or tokens.


## 1. Database (Cloudflare D1, free)
1. dash.cloudflare.com > Storage & Databases > D1 > Create database (name: bhavnaben).
2. Copy: Database ID (D1 page), Account ID (dashboard), and create an API Token: My Profile > API Tokens > Create Token > Custom > Account / D1 / Edit.
3. NO console SQL needed any more: tables + starter data are created automatically on the first website/admin request. (db/ folder is only a backup copy.)

## 2. Hosting (Netlify, free, no domain needed)
1. app.netlify.com > Add new site > Import from GitHub > choose repo. Leave build command empty > Deploy.
2. Site configuration > Environment variables, add: CF_ACCOUNT_ID, CF_DATABASE_ID, CF_API_TOKEN, SESSION_SECRET (long random text), ADMIN_EMAIL, ADMIN_PASSWORD
3. Deploys > Trigger deploy.

## 3. Use
- Website: yoursite.netlify.app
- Admin: yoursite.netlify.app/admin (login with ADMIN_EMAIL / ADMIN_PASSWORD; first login creates the admin). Add staff in the Staff tab.
