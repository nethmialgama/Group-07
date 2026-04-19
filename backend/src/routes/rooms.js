const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/rooms - list all rooms
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Room');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/rooms/:id - get room by id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Room WHERE roomId = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Room not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
