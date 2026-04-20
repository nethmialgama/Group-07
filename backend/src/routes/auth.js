const express = require("express");
const router = express.Router();
const pool = require("../db");
const crypto = require("crypto");

// POST /api/auth/login - staff login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM Staff WHERE username = ?", [
      username,
    ]);
    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const staff = rows[0];

    // Compare password with stored hash (SHA2)
    const passwordHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");
    if (passwordHash !== staff.password_hash) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Success — return staff info (no sensitive data)
    res.json({
      success: true,
      staffId: staff.staffId,
      name: staff.name,
      role: staff.role,
      email: staff.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST /api/auth/guest-login - guest login (if needed)
router.post("/guest-login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    // For guests, we could store hashed passwords in the Guest table
    // For now, simple demo: check email only
    const [rows] = await pool.query("SELECT * FROM Guest WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0) {
      return res.status(401).json({ error: "Guest not found" });
    }

    const guest = rows[0];
    res.json({
      success: true,
      guestId: guest.guestId,
      name: guest.name,
      email: guest.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST /api/auth/signup - guest signup/registration
router.post("/signup", async (req, res) => {
  const { name, email, password, phone, nic_or_passport } = req.body;

  // Validation
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Name, email, and password are required" });
  }

  try {
    // Check if email already exists
    const [existingGuest] = await pool.query(
      "SELECT * FROM Guest WHERE email = ?",
      [email],
    );
    if (existingGuest.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Use provided NIC/passport or generate a unique fallback to satisfy UNIQUE NOT NULL constraint
    const nicValue =
      nic_or_passport && String(nic_or_passport).trim()
        ? String(nic_or_passport).trim()
        : `G${Date.now()}`;

    const [existingNic] = await pool.query(
      "SELECT * FROM Guest WHERE nic_or_passport = ?",
      [nicValue],
    );
    if (existingNic.length > 0) {
      return res.status(400).json({ error: "NIC/Passport already registered" });
    }

    // Hash password
    const passwordHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    // Insert new guest
    const [result] = await pool.query(
      "INSERT INTO Guest (nic_or_passport, name, email, phone) VALUES (?, ?, ?, ?)",
      [nicValue, name, email, phone || "0000000000"],
    );

    res.json({
      success: true,
      guestId: result.insertId,
      name: name,
      email: email,
      message: "Account created successfully",
    });
  } catch (err) {
    console.error(err);
    if (err && err.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ error: "Email or NIC/Passport already exists" });
    }
    res.status(500).json({ error: "Database error during signup" });
  }
});

module.exports = router;
