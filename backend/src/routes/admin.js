const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { cleanupExpiredReservations } = require("../utils/cleanup");

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

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    await cleanupExpiredReservations();
    const [[rooms]] = await pool.query("SELECT COUNT(*) AS count FROM Room");
    const [[bookings]] = await pool.query(
      "SELECT COUNT(*) AS count FROM Reservation",
    );
    const [[users]] = await pool.query("SELECT COUNT(*) AS count FROM Guest");
    const [[revenue]] = await pool.query(
      "SELECT COALESCE(SUM(total_price), 0) AS total FROM Reservation WHERE status NOT IN ('Cancelled')",
    );
    const [[available]] = await pool.query(
      "SELECT COUNT(*) AS count FROM Room WHERE status = 'Available'",
    );
    const [[occupied]] = await pool.query(
      "SELECT COUNT(*) AS count FROM Room WHERE status = 'Occupied'",
    );
    const [[cancellations]] = await pool.query(
      "SELECT COUNT(*) AS count FROM Reservation WHERE status = 'Cancelled'",
    );
    const [[avgRating]] = await pool.query(
      "SELECT ROUND(AVG(rating), 1) AS avg FROM Review",
    );

    res.json({
      rooms: rooms.count,
      bookings: bookings.count,
      users: users.count,
      revenue: Number(revenue.total || 0),
      availableRooms: available.count,
      occupiedRooms: occupied.count,
      cancellations: cancellations.count,
      avgRating: avgRating.avg || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ─── GET /api/admin/today-stats ───────────────────────────────────────────────
router.get("/today-stats", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const [[checkIns]] = await pool.query(
      "SELECT COUNT(*) AS count FROM Reservation WHERE checkIn = ? AND status NOT IN ('Cancelled')",
      [today],
    );
    const [[checkOuts]] = await pool.query(
      "SELECT COUNT(*) AS count FROM Reservation WHERE checkOut = ? AND status NOT IN ('Cancelled')",
      [today],
    );
    const [[newBookings]] = await pool.query(
      "SELECT COUNT(*) AS count FROM Reservation WHERE DATE(booking_date) = ?",
      [today],
    );
    const [[todayRevenue]] = await pool.query(
      "SELECT COALESCE(SUM(total_price), 0) AS total FROM Reservation WHERE DATE(booking_date) = ? AND status NOT IN ('Cancelled')",
      [today],
    );

    res.json({
      checkInsToday: checkIns.count,
      checkOutsToday: checkOuts.count,
      newBookingsToday: newBookings.count,
      todayRevenue: Number(todayRevenue.total || 0),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ─── GET /api/admin/booking-history ──────────────────────────────────────────
router.get("/booking-history", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         r.reservationId, r.checkIn, r.checkOut, r.status, r.total_price, r.booking_date,
         g.name AS guest,
         rm.roomType, rm.roomNumber
       FROM Reservation r
       JOIN Guest g  ON g.guestId  = r.guestId
       JOIN Room  rm ON rm.roomId  = r.roomId
       ORDER BY r.reservationId DESC
       LIMIT 200`,
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ─── GET /api/admin/recent-bookings (kept for backward compat) ────────────────
router.get("/recent-bookings", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         r.reservationId, g.name AS guest, rm.roomType, rm.roomNumber,
         r.checkIn, r.checkOut, r.status, r.total_price,
         CASE
           WHEN p.payment_method = 'Cash' THEN 'Cash'
           WHEN p.payment_method = 'Slip' AND p.status = 'Completed' THEN 'Slip (Verified)'
           WHEN p.payment_method IS NOT NULL THEN p.payment_method
           ELSE NULL
         END AS payment_method
       FROM Reservation r
       JOIN Guest g ON g.guestId = r.guestId
       JOIN Room rm ON rm.roomId = r.roomId
       LEFT JOIN Payment p ON p.reservationId = r.reservationId
       ORDER BY r.reservationId DESC
       LIMIT 10`,
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ─── GET /api/admin/bookings-monthly ─────────────────────────────────────────
router.get("/bookings-monthly", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         DATE_FORMAT(booking_date, '%b %Y') AS month,
         DATE_FORMAT(booking_date, '%Y-%m')  AS yearMonth,
         COUNT(*) AS count
       FROM Reservation
       WHERE booking_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY yearMonth, month
       ORDER BY yearMonth ASC`,
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ─── GET /api/admin/revenue-monthly ──────────────────────────────────────────
router.get("/revenue-monthly", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         DATE_FORMAT(booking_date, '%b %Y') AS month,
         DATE_FORMAT(booking_date, '%Y-%m')  AS yearMonth,
         COALESCE(SUM(total_price), 0) AS revenue
       FROM Reservation
       WHERE booking_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
         AND status NOT IN ('Cancelled')
       GROUP BY yearMonth, month
       ORDER BY yearMonth ASC`,
    );
    res.json(rows.map((r) => ({ ...r, revenue: Number(r.revenue) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT g.guestId AS id, g.name, g.email, g.phone, 'User' AS role,
              CASE WHEN EXISTS(
                SELECT 1 FROM Reservation r WHERE r.guestId = g.guestId AND r.status IN ('Confirmed','Pending','Checked-In')
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

// ─── GET /api/admin/users/:id/bookings ───────────────────────────────────────
router.get("/users/:id/bookings", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.reservationId AS id, rm.roomType AS room, rm.roomNumber, r.checkIn, r.checkOut, r.status, r.total_price
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

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────────
router.delete("/users/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM Guest WHERE guestId = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ─── GET /api/admin/rooms ─────────────────────────────────────────────────────
router.get("/rooms", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM Room ORDER BY roomNumber ASC",
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ─── POST /api/admin/rooms ────────────────────────────────────────────────────
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

// ─── PUT /api/admin/rooms/:id ─────────────────────────────────────────────────
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
      `UPDATE Room SET roomNumber=?, roomType=?, capacity=?, roomPrice=?, amenities=?, description=?, status=?
       WHERE roomId=?`,
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

// ─── GET /api/admin/payment-gateways ─────────────────────────────────────────
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

// ─── PUT /api/admin/payment-gateways/:provider ───────────────────────────────
router.put("/payment-gateways/:provider", async (req, res) => {
  const provider = String(req.params.provider || "")
    .trim()
    .toLowerCase();
  const { isEnabled, config } = req.body;
  if (!provider) return res.status(400).json({ error: "provider is required" });
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

// GET /api/admin/refunds — list all refunds
router.get("/refunds", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         rf.refundId,
         rf.reservationId,
         rf.paidAmount,
         rf.refundAmount,
         rf.refundRate,
         rf.reason,
         rf.status,
         rf.requestedAt,
         rf.processedAt,
         g.name  AS guestName,
         g.email AS guestEmail,
         g.phone AS guestPhone,
         rm.roomType,
         r.checkIn,
         r.checkOut
       FROM Refund rf
       JOIN Guest       g  ON g.guestId       = rf.guestId
       JOIN Reservation r  ON r.reservationId = rf.reservationId
       JOIN Room        rm ON rm.roomId        = r.roomId
       ORDER BY
         CASE rf.status WHEN 'Pending' THEN 0 WHEN 'Processed' THEN 1 ELSE 2 END,
         rf.requestedAt DESC`,
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// PUT /api/admin/refunds/:id — update refund status (Processed or Rejected)
router.put("/refunds/:id", async (req, res) => {
  const { status } = req.body;

  if (!["Processed", "Rejected"].includes(status)) {
    return res
      .status(400)
      .json({ error: "Status must be Processed or Rejected" });
  }

  try {
    await pool.query(
      `UPDATE Refund SET status = ?, processedAt = NOW() WHERE refundId = ?`,
      [status, req.params.id],
    );

    // Send email only when marking as Processed
    if (status === "Processed") {
      const [rows] = await pool.query(
        `SELECT
           rf.refundId, rf.reservationId, rf.paidAmount,
           rf.refundAmount, rf.refundRate,
           g.name  AS guestName,
           g.email AS guestEmail,
           rm.roomType,
           r.checkIn, r.checkOut
         FROM Refund rf
         JOIN Guest       g  ON g.guestId       = rf.guestId
         JOIN Reservation r  ON r.reservationId = rf.reservationId
         JOIN Room        rm ON rm.roomId        = r.roomId
         WHERE rf.refundId = ?`,
        [req.params.id],
      );

      if (rows.length) {
        const { sendRefundEmail } = require("../services/invoiceService");
        await sendRefundEmail(rows[0]);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ─── GET /api/admin/revenue-by-room-type ─────────────────────────────────────
router.get("/revenue-by-room-type", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        rm.roomType,
        COUNT(r.reservationId) AS booking_count,
        COALESCE(SUM(r.total_price), 0) AS revenue
      FROM Reservation r
      JOIN Room rm ON rm.roomId = r.roomId
      WHERE r.status NOT IN ('Cancelled')
      GROUP BY rm.roomType
      ORDER BY revenue DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/admin/pending-slips
router.get("/pending-slips", async (req, res) => {
  try {
    await cleanupExpiredReservations();
    const [rows] = await pool.query(
      `SELECT p.paymentId, p.amount, p.date, p.payment_method, p.status, p.slip_image,
              r.reservationId, r.checkIn, r.checkOut, r.total_price,
              g.name AS guestName, g.email AS guestEmail, g.phone AS guestPhone,
              rm.roomType, rm.roomNumber
       FROM Payment p
       JOIN Reservation r  ON r.reservationId = p.reservationId
       JOIN Guest g         ON g.guestId       = r.guestId
       JOIN Room rm         ON rm.roomId        = r.roomId
       WHERE p.payment_method = 'Slip' AND p.status = 'Pending'
       ORDER BY p.date DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/admin/slip-history
router.get("/slip-history", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.paymentId, p.amount, p.date, p.payment_method, p.status,
              r.reservationId, r.checkIn, r.checkOut, r.total_price,
              g.name AS guestName, g.email AS guestEmail, g.phone AS guestPhone,
              rm.roomType, rm.roomNumber
       FROM Payment p
       JOIN Reservation r  ON r.reservationId = p.reservationId
       JOIN Guest g         ON g.guestId       = r.guestId
       JOIN Room rm         ON rm.roomId        = r.roomId
       WHERE p.payment_method = 'Slip' AND p.status IN ('Completed', 'Failed')
       ORDER BY p.date DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// PUT /api/admin/confirm-slip/:paymentId
router.put("/confirm-slip/:paymentId", async (req, res) => {
  const { action } = req.body; // 'approve' or 'reject'
  try {
    const [paymentRows] = await pool.query(
      "SELECT reservationId, amount FROM Payment WHERE paymentId = ?",
      [req.params.paymentId]
    );
    if (!paymentRows.length) {
      return res.status(404).json({ error: "Payment not found" });
    }
    const { reservationId, amount } = paymentRows[0];
    
    if (action === "approve") {
      // Update Payment Status
      await pool.query(
        "UPDATE Payment SET status = 'Completed' WHERE paymentId = ?",
        [req.params.paymentId]
      );
      // Update Reservation Status
      await pool.query(
        "UPDATE Reservation SET status = 'Confirmed' WHERE reservationId = ?",
        [reservationId]
      );
      
      // Send invoice email to guest
      try {
        const [invoiceRows] = await pool.query(
          `SELECT p.paymentId, p.amount, p.payment_method,
                  r.reservationId, r.checkIn, r.checkOut, r.total_price,
                  rm.roomType,
                  g.name, g.email, g.phone
           FROM Payment p
           JOIN Reservation r  ON r.reservationId = p.reservationId
           JOIN Room rm         ON rm.roomId       = r.roomId
           JOIN Guest g         ON g.guestId       = r.guestId
           WHERE p.paymentId = ?`,
          [req.params.paymentId]
        );
        if (invoiceRows.length) {
          const { sendInvoiceEmail } = require("../services/invoiceService");
          await sendInvoiceEmail({
            paymentId: invoiceRows[0].paymentId,
            paidAmount: Number(invoiceRows[0].amount),
            remaining: 0,
            title: `${invoiceRows[0].roomType} Room`,
            checkIn: invoiceRows[0].checkIn,
            checkOut: invoiceRows[0].checkOut,
            cardBrand: "Bank Slip",
            cardLast4: "",
            billing: {
              fullName: invoiceRows[0].name,
              email: invoiceRows[0].email,
              phone: invoiceRows[0].phone,
              address: ""
            }
          });
        }
      } catch (emailErr) {
        console.error("Invoice send failed on slip approval:", emailErr);
      }
    } else {
      // Reject
      await pool.query(
        "UPDATE Payment SET status = 'Failed' WHERE paymentId = ?",
        [req.params.paymentId]
      );
      await pool.query(
        "UPDATE Reservation SET status = 'Cancelled' WHERE reservationId = ?",
        [reservationId]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;

