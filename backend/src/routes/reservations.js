// backend/src/routes/reservations.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticate } = require("../middleware/auth");
const { getRefundQuote } = require("../services/paymentPolicy");

// POST /api/reservations - create a reservation
router.post("/", authenticate, async (req, res) => {
  const { guestId, roomId, checkIn, checkOut, staffId } = req.body;
  if (!guestId || !roomId || !checkIn || !checkOut) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (
    req.user.userType === "guest" &&
    Number(guestId) !== Number(req.user.id)
  ) {
    return res
      .status(403)
      .json({ error: "You can only create reservations for your own account" });
  }

  try {
    const [roomRows] = await pool.query(
      "SELECT roomPrice FROM Room WHERE roomId = ?",
      [roomId],
    );
    if (roomRows.length === 0)
      return res.status(400).json({ error: "Invalid roomId" });

    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    if (Number.isNaN(inDate.getTime()) || Number.isNaN(outDate.getTime())) {
      return res
        .status(400)
        .json({ error: "Invalid check-in/check-out dates" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (inDate < today) {
      return res
        .status(400)
        .json({ error: "Past check-in dates are not allowed" });
    }

    if (outDate <= inDate) {
      return res.status(400).json({ error: "checkOut must be after checkIn" });
    }

    const [conflicts] = await pool.query(
      `SELECT reservationId
       FROM Reservation
       WHERE roomId = ?
         AND status IN ('Pending', 'Confirmed', 'Checked-In')
         AND NOT (DATE(checkOut) <= DATE(?) OR DATE(checkIn) >= DATE(?))
       LIMIT 1`,
      [roomId, checkIn, checkOut],
    );

    if (conflicts.length > 0) {
      return res
        .status(400)
        .json({ error: "Room is not available for selected dates" });
    }

    const roomPrice = parseFloat(roomRows[0].roomPrice || 0);
    const msPerDay = 24 * 60 * 60 * 1000;
    const nights = Math.max(1, Math.ceil((outDate - inDate) / msPerDay));
    const totalPrice = (roomPrice * nights).toFixed(2);

    const [result] = await pool.query(
      `INSERT INTO Reservation (checkIn, checkOut, booking_date, status, total_price, guestId, roomId, staffId)
       VALUES (?, ?, NOW(), 'Pending', ?, ?, ?, ?)`,
      [checkIn, checkOut, totalPrice, guestId, roomId, staffId || null],
    );

    res.status(201).json({ reservationId: result.insertId, totalPrice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/reservations/my
router.get("/my", authenticate, async (req, res) => {
  if (req.user.userType !== "guest") {
    return res.status(403).json({ error: "Only guests can access this route" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT
         r.reservationId,
         r.checkIn,
         r.checkOut,
         r.booking_date,
         r.status,
         r.total_price,
         rm.roomType,
         rm.roomNumber,
         rm.amenities,
         rm.capacity
       FROM Reservation r
       JOIN Room rm ON rm.roomId = r.roomId
       WHERE r.guestId = ?
       ORDER BY r.reservationId DESC`,
      [req.user.id],
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// PUT /api/reservations/:id/cancel
router.put("/:id/cancel", authenticate, async (req, res) => {
  const reservationId = req.params.id;
  const { reason } = req.body;

  try {
    // ── 1. Load reservation ──────────────────────────────────────────────────
    const [rows] = await pool.query(
      "SELECT guestId, roomId, status, checkIn, total_price FROM Reservation WHERE reservationId = ?",
      [reservationId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    const reservation = rows[0];

    // ── 2. Ownership check ───────────────────────────────────────────────────
    if (
      req.user.userType === "guest" &&
      Number(reservation.guestId) !== Number(req.user.id)
    ) {
      return res
        .status(403)
        .json({ error: "Not authorised to cancel this booking" });
    }

    // ── 3. Status check ──────────────────────────────────────────────────────
    if (!["Pending", "Confirmed"].includes(reservation.status)) {
      return res.status(400).json({
        error: `Cannot cancel a booking with status: ${reservation.status}`,
      });
    }

    // ── 4. Calculate refund ──────────────────────────────────────────────────
    const [paymentRows] = await pool.query(
      "SELECT amount FROM Payment WHERE reservationId = ? LIMIT 1",
      [reservationId],
    );
    const paidAmount = Number(paymentRows[0]?.amount || 0);
    const quote = getRefundQuote(paidAmount, reservation.checkIn);

    // ── 5. Cancel the reservation ────────────────────────────────────────────
    await pool.query(
      "UPDATE Reservation SET status = 'Cancelled' WHERE reservationId = ?",
      [reservationId],
    );

    // ── 6. Free up the room ──────────────────────────────────────────────────
    await pool.query(
      "UPDATE Room SET status = 'Available' WHERE roomId = ? AND status = 'Occupied'",
      [reservation.roomId],
    );

    // ── 7. Create refund record (only if refund amount is greater than 0) ────
    if (paidAmount > 0 && quote.refundAmount > 0) {
      await pool.query(
        `INSERT INTO Refund
           (reservationId, guestId, paidAmount, refundAmount, refundRate, reason, status)
         VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
        [
          reservationId,
          reservation.guestId,
          paidAmount,
          quote.refundAmount,
          quote.rate,
          reason || null,
        ],
      );
    }

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      paidAmount,
      refundAmount: quote.refundAmount,
      refundRate: quote.rate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
