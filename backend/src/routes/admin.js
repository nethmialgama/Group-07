const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticate, requireAdmin } = require("../middleware/auth");

let paymentGatewayTableEnsured = false;

async function ensurePaymentGatewayTable() {
  if (paymentGatewayTableEnsured) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS PaymentGatewaySettings (
      provider VARCHAR(50) PRIMARY KEY,
      is_enabled BOOLEAN DEFAULT TRUE,
      config_json TEXT,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  paymentGatewayTableEnsured = true;
}

router.use(authenticate, requireAdmin);

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    const [[rooms]] = await pool.query("SELECT COUNT(*) AS count FROM Room");
    const [[bookings]] = await pool.query(
      "SELECT COUNT(*) AS count FROM Reservation",
    );
    const [[users]] = await pool.query("SELECT COUNT(*) AS count FROM Guest");
    const [[revenue]] = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM Payment WHERE status = 'Completed'",
    );

    res.json({
      rooms: rooms.count,
      bookings: bookings.count,
      users: users.count,
      revenue: Number(revenue.total || 0),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/admin/recent-bookings
router.get("/recent-bookings", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.reservationId, g.name AS guest, rm.roomType, r.checkIn, r.checkOut
       FROM Reservation r
       JOIN Guest g ON g.guestId = r.guestId
       JOIN Room rm ON rm.roomId = r.roomId
       ORDER BY r.reservationId DESC
       LIMIT 10`,
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT g.guestId AS id, g.name, g.email, g.phone, 'User' AS role,
              CASE WHEN EXISTS(
                SELECT 1 FROM Reservation r WHERE r.guestId = g.guestId AND r.status IN ('Confirmed','Pending')
              ) THEN 'Active' ELSE 'Inactive' END AS status
       FROM Guest g
       ORDER BY g.guestId DESC`,
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/admin/users/:id/bookings
router.get("/users/:id/bookings", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.reservationId AS id, rm.roomType AS room, r.checkIn, r.checkOut, r.status
       FROM Reservation r
       JOIN Room rm ON rm.roomId = r.roomId
       WHERE r.guestId = ?
       ORDER BY r.reservationId DESC`,
      [req.params.id],
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM Guest WHERE guestId = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/admin/rooms
router.get("/rooms", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Room ORDER BY roomId DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST /api/admin/rooms
router.post("/rooms", async (req, res) => {
  const {
    roomNumber,
    roomType,
    capacity,
    roomPrice,
    amenities,
    description,
    status,
  } = req.body;

  if (!roomNumber || !roomType || roomPrice == null) {
    return res
      .status(400)
      .json({ error: "roomNumber, roomType, roomPrice required" });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO Room (roomNumber, roomType, capacity, roomPrice, amenities, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        roomNumber,
        roomType,
        capacity || 2,
        roomPrice,
        amenities || "",
        description || "",
        status || "Available",
      ],
    );
    res.status(201).json({ roomId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// PUT /api/admin/rooms/:id
router.put("/rooms/:id", async (req, res) => {
  const {
    roomNumber,
    roomType,
    capacity,
    roomPrice,
    amenities,
    description,
    status,
  } = req.body;

  if (!roomNumber || !roomType || roomPrice == null) {
    return res
      .status(400)
      .json({ error: "roomNumber, roomType, roomPrice required" });
  }

  try {
    await pool.query(
      `UPDATE Room
       SET roomNumber = ?, roomType = ?, capacity = ?, roomPrice = ?, amenities = ?, description = ?, status = ?
       WHERE roomId = ?`,
      [
        roomNumber,
        roomType,
        capacity || 2,
        roomPrice,
        amenities || "",
        description || "",
        status || "Available",
        req.params.id,
      ],
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/admin/payment-gateways
router.get("/payment-gateways", async (req, res) => {
  try {
    await ensurePaymentGatewayTable();
    const [rows] = await pool.query(
      "SELECT provider, is_enabled, config_json, updatedAt FROM PaymentGatewaySettings ORDER BY provider ASC",
    );
    res.json(
      rows.map((row) => ({
        provider: row.provider,
        isEnabled: !!row.is_enabled,
        config: row.config_json ? JSON.parse(row.config_json) : {},
        updatedAt: row.updatedAt,
      })),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// PUT /api/admin/payment-gateways/:provider
router.put("/payment-gateways/:provider", async (req, res) => {
  const provider = String(req.params.provider || "")
    .trim()
    .toLowerCase();
  const { isEnabled, config } = req.body;

  if (!provider) {
    return res.status(400).json({ error: "provider is required" });
  }

  try {
    await ensurePaymentGatewayTable();
    await pool.query(
      `INSERT INTO PaymentGatewaySettings (provider, is_enabled, config_json)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled), config_json = VALUES(config_json)`,
      [provider, !!isEnabled, JSON.stringify(config || {})],
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
