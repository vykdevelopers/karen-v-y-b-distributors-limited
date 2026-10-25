import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const db = new Database("./data.db");
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    business_name TEXT,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER NOT NULL,
    description TEXT,
    image TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    location TEXT,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS otps (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

function ensureAdmin() {
  const username = process.env.ADMIN_USERNAME || "karen6765";
  const password = process.env.ADMIN_PASSWORD || "karen6765";

  const row = db.prepare("SELECT id FROM users WHERE username = ?").get(username);

  if (!row) {
    const adminUser = {
      id: crypto.randomUUID(),
      name: "Karen Admin",
      username,
      email: "admin@karenvyb.com",
      phone: "0118078137",
      business_name: "Karen-V-Y-B",
      password: bcrypt.hashSync(password, 10),
      role: "admin",
      created_at: new Date().toISOString()
    };

    db.prepare(`
      INSERT INTO users (id, name, username, email, phone, business_name, password, role, created_at)
      VALUES (@id, @name, @username, @email, @phone, @business_name, @password, @role, @created_at)
    `).run(adminUser);

    const defaultProducts = [
      {
        id: crypto.randomUUID(),
        name: "Industrial Drill Machine",
        category: "Power Tools",
        price: 4800,
        stock: 18,
        description: "Heavy-duty drilling machine for construction and industrial use.",
        image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80",
        created_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: "Safety Helmet Set",
        category: "Safety Gear",
        price: 950,
        stock: 40,
        description: "High-impact protective helmets for industrial workers.",
        image: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80",
        created_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: "Electrical Cable Pack",
        category: "Electrical",
        price: 2200,
        stock: 52,
        description: "Premium grade electrical cable pack for buildings and workshops.",
        image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=800&q=80",
        created_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: "Hydraulic Jack",
        category: "Workshop Tools",
        price: 7600,
        stock: 12,
        description: "Heavy-duty hydraulic jack for garage and workshop use.",
        image: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=800&q=80",
        created_at: new Date().toISOString()
      }
    ];

    db.prepare(`
      INSERT INTO products (id, name, category, price, stock, description, image, created_at)
      VALUES (@id, @name, @category, @price, @stock, @description, @image, @created_at)
    `).run(defaultProducts.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      stock: item.stock,
      description: item.description,
      image: item.image,
      created_at: item.created_at
    })));
  }
}

ensureAdmin();

export default db;
