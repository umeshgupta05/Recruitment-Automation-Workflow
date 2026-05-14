const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDb } = require("../db/database");

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const ALLOWED_ROLES = new Set(["recruiter", "candidate", "admin"]);

function normalizeRole(role) {
  if (role === "admin") return "admin";
  if (role === "candidate") return "candidate";
  return "recruiter";
}

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// POST /api/auth/register - Register new user
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, role, company, phone } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ error: "Email, password, and name are required" });
    }

    const db = getDb();

    const normalizedRole = normalizeRole(role);
    if (!ALLOWED_ROLES.has(normalizedRole)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Check if user exists
    const existing = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email);
    if (existing) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = db
      .prepare(
        `INSERT INTO users (email, password, name, role, company, phone)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        email,
        hashedPassword,
        name,
        normalizedRole,
        company || null,
        phone || null,
      );

    const userId = result.lastInsertRowid;

    // Create JWT token
    const token = jwt.sign({ id: userId, email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      id: userId,
      email,
      name,
      role: normalizedRole,
      token,
    });
  } catch (err) {
    console.error("POST /auth/register error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login - Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const db = getDb();
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Compare password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Create JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      company: user.company,
      phone: user.phone,
      token,
    });
  } catch (err) {
    console.error("POST /auth/login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/profile - Get current user profile
router.get("/profile", verifyToken, (req, res) => {
  try {
    const db = getDb();
    const user = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      company: user.company,
      phone: user.phone,
      profilePhoto: user.profile_photo,
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error("GET /auth/profile error:", err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/auth/profile - Update user profile
router.patch("/profile", verifyToken, async (req, res) => {
  try {
    const { name, company, phone, password } = req.body;
    const db = getDb();

    const user = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let hashedPassword = user.password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    db.prepare(
      `UPDATE users SET name = ?, company = ?, phone = ?, password = ?, updated_at = datetime('now')
       WHERE id = ?`,
    ).run(
      name || user.name,
      company !== undefined ? company : user.company,
      phone || user.phone,
      hashedPassword,
      req.user.id,
    );

    const updatedUser = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(req.user.id);

    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      company: updatedUser.company,
      phone: updatedUser.phone,
      message: "Profile updated successfully",
    });
  } catch (err) {
    console.error("PATCH /auth/profile error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout - Logout (client-side token removal)
router.post("/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

module.exports = { router, verifyToken };
