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

## Changes in v6 (Part 1: Prices)
- Prices per product / group / pack size, with optional Vacuum price (admin > Prices tab).
- New product: Home Made Khakhra (prices empty, set them in admin > Prices; photos in admin > Products).
- Cart, checkout and order confirmation show prices and total. Server recalculates prices itself.
- Database upgrades itself automatically on first request (no SQL needed). Old carts of customers reset once.

## Changes in v6 (Part 2 + 6: WhatsApp + home page)
- Checkout: order is saved in database, then WhatsApp opens (Paras Shah 99988 02435) with a formatted order message. Change number: `WA` constant in public/index.html.
- Admin > Orders > WhatsApp button now opens a formatted message to the customer (order, items, total, status).
- Home page: Bhavnaben photo (public/images/bhavnaben.jpg), logo without white box (transparent) with TM.

## Changes in v7 (Bill + Coupons + WhatsApp +91)
- **Customer bill**: after an order is placed the customer gets a proper bill (logo, shop details, name, products, rate, qty, subtotal, coupon discount, total) at `/bill.html`. It can be printed / saved as PDF. The bill link is also inside the WhatsApp order message. Each bill link has a secret token, so nobody can guess other customers' bills.
- **Admin invoice**: Admin > Orders now has "Invoice" and "Print" buttons (same bill design with logo). Orders show subtotal, discount and total.
- **Coupon system** (Admin > Coupons): percentage or flat discount, minimum order amount, total uses limit, uses per customer (1 = once, any number, or 0 = unlimited), optional max-discount cap for % coupons, optional expiry date, Active / Inactive switch any time, edit and delete. Usage count is shown for each coupon. Customers enter the code on the Checkout page. The server always re-checks the coupon and recalculates the price itself.
- **WhatsApp +91**: admin WhatsApp buttons (and the bill page) automatically add country code 91. Works with 9876543210, 09876543210, +91 98765 43210 etc.
- **Extra**: monthly revenue (after discounts) in Admin > Stats; CSV export now has coupon, discount and total columns.
- Database upgrades itself automatically on first request (new columns are added; old orders and old data stay safe). No SQL needed. Old orders show their bill without discount.

## Changes in v8 (Month details + Customers + Banners)
- **Stats > tap any month**: full month page with revenue, orders, average order, packs sold, discount given, new vs returning customers, a day-by-day chart, a customer table (who ordered, how many times, how much amount, WhatsApp button), what sold, and every order with an Invoice button. Previous/next month arrows, month picker, and CSV download (orders and customers). Months now follow Indian time (IST).
- **Customers tab** (new): every customer with total orders, total spent, first/last order, repeat badge, search, sort (top spenders / most orders / latest), tap "Orders" to see their order history, WhatsApp button, CSV download.
- **Easier daily work**: dashboard cards on Orders (today's orders and sales, new orders to pack, this month), status filter, one-tap "next status" button (new > packed > shipped > delivered), new-order beep + browser-tab count (checks every minute while the admin page is open).
- **Festival / offer banners** (Admin > Banners): upload a photo (auto-resized), optional title, optional tap link, optional auto-hide date, show/hide, reorder, edit, delete. On the website home page the banners show at the top; more than one slides automatically (swipe, arrows and dots also work). Delete a banner and it disappears from the site and its photo is removed from the database; with no banner, no empty space is shown.
- Order numbers now have a small random ending, so two orders in the same instant can never clash.
- Database upgrades itself on first request (new banners table, old orders get their phone key filled in). No SQL needed.
