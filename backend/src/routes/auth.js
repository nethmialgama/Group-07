const express = require("express");
const router = express.Router();
const pool = require("../db");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { authenticate, getJwtSecret } = require("../middleware/auth");

let guestPasswordColumnEnsured = false;

async function ensureGuestPasswordColumn() {
  if (guestPasswordColumnEnsured) return;

  const [columns] = await pool.query(
    "SHOW COLUMNS FROM Guest LIKE 'password_hash'",
  );
  if (columns.length === 0) {
    await pool.query(
      "ALTER TABLE Guest ADD COLUMN password_hash VARCHAR(255) NULL AFTER email",
    );
  }

  guestPasswordColumnEnsured = true;
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function createToken(payload, rememberMe = false) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: rememberMe ? "30d" : "8h",
  });
}

// POST /api/auth/login - staff or guest login
router.post("/login", async (req, res) => {
  const { username, password, rememberMe } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username/email and password required" });
  }

  try {
    await ensureGuestPasswordColumn();

    const [staffRows] = await pool.query(
      "SELECT * FROM Staff WHERE username = ? OR email = ?",
      [username, username],
    );

    // 1) Staff login path (username)
    if (staffRows.length > 0) {
      const staff = staffRows[0];
      const passwordHash = hashPassword(password);
      if (passwordHash !== staff.password_hash) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const token = createToken(
        {
          userType: "staff",
          id: staff.staffId,
          role: staff.role,
          email: staff.email,
          name: staff.name,
        },
        !!rememberMe,
      );

      return res.json({
        success: true,
        token,
        staffId: staff.staffId,
        name: staff.name,
        role: staff.role,
        email: staff.email,
      });
    }

    // 2) Guest login path (signup users use email)
    const [guestRows] = await pool.query(
      "SELECT * FROM Guest WHERE email = ?",
      [username],
    );

    if (guestRows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const guest = guestRows[0];
    const passwordHash = hashPassword(password);
    if (!guest.password_hash || passwordHash !== guest.password_hash) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = createToken(
      {
        userType: "guest",
        id: guest.guestId,
        role: "Guest",
        email: guest.email,
        name: guest.name,
      },
      !!rememberMe,
    );

    return res.json({
      success: true,
      token,
      guestId: guest.guestId,
      name: guest.name,
      role: "Guest",
      email: guest.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST /api/auth/guest-login - guest login (if needed)
router.post("/guest-login", async (req, res) => {
  const { email, password, rememberMe } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    await ensureGuestPasswordColumn();
    const [rows] = await pool.query("SELECT * FROM Guest WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0) {
      return res.status(401).json({ error: "Guest not found" });
    }

    const guest = rows[0];
    const passwordHash = hashPassword(password);
    if (!guest.password_hash || passwordHash !== guest.password_hash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = createToken(
      {
        userType: "guest",
        id: guest.guestId,
        role: "Guest",
        email: guest.email,
        name: guest.name,
      },
      !!rememberMe,
    );

    res.json({
      success: true,
      token,
      guestId: guest.guestId,
      name: guest.name,
      email: guest.email,
      role: "Guest",
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
    await ensureGuestPasswordColumn();

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
    const passwordHash = hashPassword(password);

    // Insert new guest
    const [result] = await pool.query(
      "INSERT INTO Guest (nic_or_passport, name, email, password_hash, phone) VALUES (?, ?, ?, ?, ?)",
      [nicValue, name, email, passwordHash, phone || "0000000000"],
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

// GET /api/auth/profile - get current user profile
router.get("/profile", authenticate, async (req, res) => {
  try {
    if (req.user.userType === "staff") {
      const [rows] = await pool.query(
        "SELECT staffId, name, email, phone, role FROM Staff WHERE staffId = ?",
        [req.user.id],
      );
      if (rows.length === 0)
        return res.status(404).json({ error: "User not found" });
      return res.json(rows[0]);
    }

    const [rows] = await pool.query(
      "SELECT guestId, name, email, phone FROM Guest WHERE guestId = ?",
      [req.user.id],
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    return res.json({ ...rows[0], role: "Guest" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// PUT /api/auth/profile - guest can update email and phone
router.put("/profile", authenticate, async (req, res) => {
  const { email, phone } = req.body;

  if (req.user.userType !== "guest") {
    return res
      .status(403)
      .json({ error: "Only guests can update this profile" });
  }

  if (!email || !phone) {
    return res.status(400).json({ error: "Email and phone are required" });
  }

  try {
    const [existing] = await pool.query(
      "SELECT guestId FROM Guest WHERE email = ? AND guestId <> ?",
      [email, req.user.id],
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already in use" });
    }

    await pool.query(
      "UPDATE Guest SET email = ?, phone = ? WHERE guestId = ?",
      [email, phone, req.user.id],
    );

    return res.json({ success: true, message: "Profile updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
