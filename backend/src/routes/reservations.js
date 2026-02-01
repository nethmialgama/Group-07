const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/reservations - create a reservation
router.post('/', async (req, res) => {
  const { guestId, roomId, checkIn, checkOut, staffId } = req.body;
  if (!guestId || !roomId || !checkIn || !checkOut) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Get room price
    const [roomRows] = await pool.query('SELECT roomPrice FROM Room WHERE roomId = ?', [roomId]);
    if (roomRows.length === 0) return res.status(400).json({ error: 'Invalid roomId' });
    const roomPrice = parseFloat(roomRows[0].roomPrice || 0);

    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    const msPerDay = 24 * 60 * 60 * 1000;
    const nights = Math.max(1, Math.ceil((outDate - inDate) / msPerDay));
    const totalPrice = (roomPrice * nights).toFixed(2);

    const [result] = await pool.query(
      `INSERT INTO Reservation (checkIn, checkOut, booking_date, status, total_price, guestId, roomId, staffId)
       VALUES (?, ?, NOW(), 'Confirmed', ?, ?, ?, ?)`,
      [checkIn, checkOut, totalPrice, totalPrice, guestId, roomId, staffId || null]
    );

    // Optionally update room status to 'Occupied'
    await pool.query('UPDATE Room SET status = ? WHERE roomId = ?', ['Occupied', roomId]);

    res.status(201).json({ reservationId: result.insertId, totalPrice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
