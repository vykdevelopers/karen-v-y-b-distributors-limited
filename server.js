import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import db from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

function createToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, username: user.username || user.email },
    process.env.JWT_SECRET || "dev_secret",
    { expiresIn: "7d" }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
}

function getUserByIdentifier(identifier) {
  return db.prepare(`
    SELECT * FROM users
    WHERE username = ?
       OR email = ?
       OR phone = ?
  `).get(identifier, identifier, identifier);
}

function getProductById(productId) {
  return db.prepare("SELECT * FROM products WHERE id = ?").get(productId);
}

function sendOtpEmail(email, otp) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("SMTP is not configured. OTP not sent.");
    console.log(`OTP for ${email}: ${otp}`);
    return Promise.resolve();
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return transporter.sendMail({
    from: process.env.SMTP_FROM || "Karen-V-Y-B Distributors <no-reply@example.com>",
    to: email,
    subject: "Password Reset OTP - Karen-V-Y-B",
    text: `Your OTP is: ${otp}. It expires in 10 minutes.`
  });
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/catalog", (req, res) => {
  const rows = db.prepare("SELECT * FROM products ORDER BY created_at DESC").all();
  res.json(rows);
});

app.post("/api/signup", async (req, res) => {
  const { name, email, phone, businessName, password, confirmPassword } = req.body;

  if (!name || !email || !phone || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      message: "Password must contain uppercase, lowercase, number and special character. Minimum 8 characters."
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  const existing = db.prepare(`
    SELECT id FROM users
    WHERE email = ? OR phone = ?
  `).get(email.trim(), phone.trim());

  if (existing) {
    return res.status(400).json({ message: "A customer with that email or phone already exists." });
  }

  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    username: null,
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    business_name: businessName ? businessName.trim() : null,
    password: bcrypt.hashSync(password, 10),
    role: "customer",
    created_at: new Date().toISOString()
  };

  db.prepare(`
    INSERT INTO users (id, name, username, email, phone, business_name, password, role, created_at)
    VALUES (@id, @name, @username, @email, @phone, @business_name, @password, @role, @created_at)
  `).run(user);

  res.status(201).json({ message: "Account created successfully." });
});

app.post("/api/login", async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: "Identifier and password are required." });
  }

  const user = getUserByIdentifier(identifier.trim());

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const token = createToken(user);

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      businessName: user.business_name,
      role: user.role
    }
  });
});

app.post("/api/forgot-password", (req, res) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ message: "Email or phone is required." });
  }

  const user = getUserByIdentifier(identifier.trim());
  if (!user) {
    return res.status(404).json({ message: "No account found." });
  }

  const otpCode = String(Math.floor(100000 + Math.random() * 900000));
  const id = crypto.randomUUID();

  db.prepare(`
    INSERT INTO otps (id, user_id, otp_code, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    id,
    user.id,
    otpCode,
    new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    new Date().toISOString()
  );

  sendOtpEmail(user.email, otpCode).catch(err => {
    console.error("OTP email error:", err);
  });

  res.json({
    message: "OTP sent successfully.",
    otp: otpCode,
    target: user.email
  });
});

app.post("/api/reset-password", async (req, res) => {
  const { identifier, otp, newPassword } = req.body;

  if (!identifier || !otp || !newPassword) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({
      message: "Password must contain uppercase, lowercase, number and special character."
    });
  }

  const user = getUserByIdentifier(identifier.trim());
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const otpRow = db.prepare(`
    SELECT * FROM otps
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(user.id);

  if (!otpRow) {
    return res.status(400).json({ message: "No OTP found for this user." });
  }

  if (otpRow.otp_code !== otp) {
    return res.status(400).json({ message: "Invalid OTP." });
  }

  if (new Date(otpRow.expires_at).getTime() < Date.now()) {
    return res.status(400).json({ message: "OTP has expired." });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hash, user.id);

  res.json({ message: "Password reset successfully." });
});

app.get("/api/customer/orders", authMiddleware, (req, res) => {
  if (req.user.role !== "customer") {
    return res.status(403).json({ message: "Customer access only." });
  }

  const rows = db.prepare(`
    SELECT * FROM orders
    WHERE customer_id = ?
    ORDER BY created_at DESC
  `).all(req.user.id);

  res.json(rows);
});

app.post("/api/orders", authMiddleware, (req, res) => {
  if (req.user.role !== "customer") {
    return res.status(403).json({ message: "Customer access only." });
  }

  const { productId, quantity, location } = req.body;
  if (!productId || !quantity || !location) {
    return res.status(400).json({ message: "Product, quantity and location are required." });
  }

  const product = getProductById(productId);
  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);

  const order = {
    id: crypto.randomUUID(),
    customer_id: user.id,
    customer_name: user.name,
    product_id: product.id,
    product_name: product.name,
    quantity: Number(quantity),
    location: location.trim(),
    total: Number(product.price) * Number(quantity),
    status: "Pending",
    created_at: new Date().toISOString()
  };

  db.prepare(`
    INSERT INTO orders (id, customer_id, customer_name, product_id, product_name, quantity, location, total, status, created_at)
    VALUES (@id, @customer_id, @customer_name, @product_id, @product_name, @quantity, @location, @total, @status, @created_at)
  `).run(order);

  res.status(201).json({ message: "Order placed successfully.", order });
});

app.get("/api/admin/summary", authMiddleware, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only." });
  }

  const customerCount = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'customer'").get().count;
  const orderCount = db.prepare("SELECT COUNT(*) AS count FROM orders").get().count;
  const productCount = db.prepare("SELECT COUNT(*) AS count FROM products").get().count;

  res.json({
    customerCount,
    orderCount,
    productCount
  });
});

app.get("/api/admin/customers", authMiddleware, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only." });
  }

  const rows = db.prepare(`
    SELECT id, name, username, email, phone, business_name, role, created_at
    FROM users
    WHERE role = 'customer'
    ORDER BY created_at DESC
  `).all();

  res.json(rows);
});

app.get("/api/admin/orders", authMiddleware, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only." });
  }

  const rows = db.prepare(`
    SELECT * FROM orders
    ORDER BY created_at DESC
  `).all();

  res.json(rows);
});

app.post("/api/admin/products", authMiddleware, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only." });
  }

  const { name, category, price, stock, description, image } = req.body;

  if (!name || !category || !price || !stock) {
    return res.status(400).json({ message: "Name, category, price and stock are required." });
  }

  const product = {
    id: crypto.randomUUID(),
    name: name.trim(),
    category: category.trim(),
    price: Number(price),
    stock: Number(stock),
    description: description ? description.trim() : "",
    image: image || "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80",
    created_at: new Date().toISOString()
  };

  db.prepare(`
    INSERT INTO products (id, name, category, price, stock, description, image, created_at)
    VALUES (@id, @name, @category, @price, @stock, @description, @image, @created_at)
  `).run(product);

  res.status(201).json({ message: "Product added successfully.", product });
});

app.put("/api/admin/products/:id", authMiddleware, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only." });
  }

  const { id } = req.params;
  const { name, category, price, stock, description, image } = req.body;

  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  if (!existing) {
    return res.status(404).json({ message: "Product not found." });
  }

  db.prepare(`
    UPDATE products
    SET name = ?, category = ?, price = ?, stock = ?, description = ?, image = ?
    WHERE id = ?
  `).run(
    name || existing.name,
    category || existing.category,
    Number(price || existing.price),
    Number(stock || existing.stock),
    description !== undefined ? description : existing.description,
    image || existing.image,
    id
  );

  res.json({ message: "Product updated successfully." });
});

app.delete("/api/admin/products/:id", authMiddleware, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only." });
  }

  const { id } = req.params;
  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id);

  if (!existing) {
    return res.status(404).json({ message: "Product not found." });
  }

  db.prepare("DELETE FROM products WHERE id = ?").run(id);
  res.json({ message: "Product deleted successfully." });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
