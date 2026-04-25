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

// ── Forgot / Reset Password ──────────────────────────────────────────────────
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    // Check guest first, then staff
    const [guests] = await pool.query("SELECT * FROM Guest WHERE email = ?", [
      email,
    ]);
    const [staff] = await pool.query("SELECT * FROM Staff WHERE email = ?", [
      email,
    ]);

    // Always return success — never reveal whether email exists (security best practice)
    if (guests.length === 0 && staff.length === 0) {
      return res.json({
        success: true,
        message: "If this email is registered, a reset link has been sent.",
      });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate any existing tokens for this email
    await pool.query("DELETE FROM PasswordResetTokens WHERE email = ?", [
      email,
    ]);

    // Store new token
    await pool.query(
      "INSERT INTO PasswordResetTokens (email, token, expiresAt) VALUES (?, ?, ?)",
      [email, token, expiresAt],
    );

    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"Smart Hotel" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request – Smart Hotel",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #1a1a2e; border-bottom: 2px solid #c9a84c; padding-bottom: 10px;">Smart Hotel – Password Reset</h2>
          <p>Hello,</p>
          <p>We received a request to reset the password for your Smart Hotel account.</p>
          <p>Click the button below to reset your password. This link is valid for <strong>1 hour</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}"
               style="background-color: #c9a84c; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
              Reset My Password
            </a>
          </div>
          <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
          <p style="color: #888; font-size: 0.85rem;">For security, this link expires in 1 hour and can only be used once.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
          <p style="color: #888; font-size: 0.8rem; text-align: center;">© 2025 Smart Hotel. All rights reserved.</p>
        </div>
      `,
    });

    return res.json({
      success: true,
      message: "If this email is registered, a reset link has been sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res
      .status(500)
      .json({ error: "Failed to process request. Please try again." });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password)
    return res
      .status(400)
      .json({ error: "Token and new password are required" });
  if (password.length < 8)
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });

  try {
    const [rows] = await pool.query(
      "SELECT * FROM PasswordResetTokens WHERE token = ? AND used = FALSE AND expiresAt > NOW()",
      [token],
    );

    if (rows.length === 0) {
      return res
        .status(400)
        .json({ error: "This reset link is invalid or has expired." });
    }

    const { email } = rows[0];
    const passwordHash = hashPassword(password);

    // Update whichever account holds this email
    await pool.query("UPDATE Guest SET password_hash = ? WHERE email = ?", [
      passwordHash,
      email,
    ]);
    await pool.query("UPDATE Staff SET password_hash = ? WHERE email = ?", [
      passwordHash,
      email,
    ]);

    // Mark token as used
    await pool.query(
      "UPDATE PasswordResetTokens SET used = TRUE WHERE token = ?",
      [token],
    );

    return res.json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res
      .status(500)
      .json({ error: "Failed to reset password. Please try again." });
  }
});

module.exports = router;
