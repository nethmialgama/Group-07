const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/payments - create a payment record
router.post('/', async (req, res) => {
  const { reservationId, amount, payment_method, status } = req.body;
  if (!reservationId || !amount || !payment_method) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO Payment (amount, date, payment_method, status, reservationId) VALUES (?, NOW(), ?, ?, ?)',
      [amount, payment_method, status || 'Completed', reservationId]
    );

    // Optionally update reservation status if payment completed
    if ((status || 'Completed') === 'Completed') {
      await pool.query('UPDATE Reservation SET status = ? WHERE reservationId = ?', ['Confirmed', reservationId]);
    }

    res.status(201).json({ paymentId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
