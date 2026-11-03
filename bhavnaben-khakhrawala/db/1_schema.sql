-- Cloudflare D1 schema backup (v8). The website creates/upgrades all tables by itself, you do not need to run this.
CREATE TABLE IF NOT EXISTS categories(id INTEGER PRIMARY KEY, slug TEXT UNIQUE, name TEXT, description TEXT, image TEXT, shelf_life TEXT, sort INTEGER DEFAULT 0, active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY, category_id INTEGER REFERENCES categories(id), slug TEXT UNIQUE, name TEXT, description TEXT, image TEXT, active INTEGER DEFAULT 1, in_stock INTEGER DEFAULT 1, sort INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sizes(id INTEGER PRIMARY KEY, product_id INTEGER REFERENCES products(id) ON DELETE CASCADE, label TEXT, grams INTEGER, in_stock INTEGER DEFAULT 1, active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS flavours(id INTEGER PRIMARY KEY, product_id INTEGER REFERENCES products(id) ON DELETE CASCADE, name TEXT, grp TEXT, image TEXT, in_stock INTEGER DEFAULT 1, active INTEGER DEFAULT 1, sort INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY, order_no TEXT UNIQUE, name TEXT, phone TEXT, email TEXT, address TEXT, city TEXT, pincode TEXT, notes TEXT, coupon TEXT, subtotal REAL, discount REAL DEFAULT 0, total REAL, phone10 TEXT, status TEXT DEFAULT 'new', label_printed INTEGER DEFAULT 0, source TEXT DEFAULT 'online', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS order_items(id INTEGER PRIMARY KEY, order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE, product_name TEXT, flavour TEXT, size_label TEXT, qty INTEGER);
CREATE TABLE IF NOT EXISTS reviews(id INTEGER PRIMARY KEY, name TEXT, city TEXT, rating INTEGER, body TEXT, image TEXT, status TEXT DEFAULT 'pending', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS wholesale_inquiries(id INTEGER PRIMARY KEY, business_name TEXT, contact_name TEXT, phone TEXT, email TEXT, city TEXT, business_type TEXT, products_interested TEXT, monthly_qty TEXT, message TEXT, status TEXT DEFAULT 'new', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE, name TEXT, password_hash TEXT, role TEXT CHECK(role IN('admin','staff')) DEFAULT 'staff', active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS coupons(id INTEGER PRIMARY KEY, code TEXT UNIQUE, note TEXT, active INTEGER DEFAULT 1, type TEXT DEFAULT 'percent', value REAL, min_order REAL DEFAULT 0, max_uses INTEGER, per_customer INTEGER DEFAULT 1, max_discount REAL, expires TEXT);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE TABLE IF NOT EXISTS images(id INTEGER PRIMARY KEY, mime TEXT, data TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS banners(id INTEGER PRIMARY KEY, image TEXT, title TEXT, link TEXT, ends TEXT, active INTEGER DEFAULT 1, sort INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
