const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticate } = require("../middleware/auth");

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
    // Get room price
    const [roomRows] = await pool.query(
      "SELECT roomPrice, status FROM Room WHERE roomId = ?",
      [roomId],
    );
    if (roomRows.length === 0)
      return res.status(400).json({ error: "Invalid roomId" });
    if (roomRows[0].status !== "Available") {
      return res
        .status(400)
        .json({ error: "Room is not available for booking" });
    }
    const roomPrice = parseFloat(roomRows[0].roomPrice || 0);

    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    const msPerDay = 24 * 60 * 60 * 1000;
    const nights = Math.max(1, Math.ceil((outDate - inDate) / msPerDay));
    const totalPrice = (roomPrice * nights).toFixed(2);

    const [result] = await pool.query(
      `INSERT INTO Reservation (checkIn, checkOut, booking_date, status, total_price, guestId, roomId, staffId)
       VALUES (?, ?, NOW(), 'Confirmed', ?, ?, ?, ?)`,
      [checkIn, checkOut, totalPrice, guestId, roomId, staffId || null],
    );

    // Update room status to Occupied
    await pool.query("UPDATE Room SET status = ? WHERE roomId = ?", [
      "Occupied",
      roomId,
    ]);

    res.status(201).json({ reservationId: result.insertId, totalPrice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/reservations/my - get all reservations for the logged-in guest ONLY
router.get("/my", authenticate, async (req, res) => {
  // Only guests can call this endpoint
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
      [req.user.id], // <-- uses the JWT id, never trusts client input
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// PUT /api/reservations/:id/cancel - guest cancels their own booking
router.put("/:id/cancel", authenticate, async (req, res) => {
  const reservationId = req.params.id;

  try {
    // Fetch the reservation first to verify ownership and status
    const [rows] = await pool.query(
      "SELECT guestId, roomId, status FROM Reservation WHERE reservationId = ?",
      [reservationId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    const reservation = rows[0];

    // Guests can only cancel their own reservations
    if (
      req.user.userType === "guest" &&
      Number(reservation.guestId) !== Number(req.user.id)
    ) {
      return res
        .status(403)
        .json({ error: "Not authorised to cancel this booking" });
    }

    // Only allow cancelling Pending or Confirmed bookings
    if (!["Pending", "Confirmed"].includes(reservation.status)) {
      return res.status(400).json({
        error: `Cannot cancel a booking with status: ${reservation.status}`,
      });
    }

    // Cancel the reservation
    await pool.query(
      "UPDATE Reservation SET status = 'Cancelled' WHERE reservationId = ?",
      [reservationId],
    );

    // Free up the room back to Available
    await pool.query(
      "UPDATE Room SET status = 'Available' WHERE roomId = ? AND status = 'Occupied'",
      [reservation.roomId],
    );

    res.json({ success: true, message: "Booking cancelled successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
