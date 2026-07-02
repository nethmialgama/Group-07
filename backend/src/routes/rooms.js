const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/rooms - list all rooms
router.get("/", async (req, res) => {
  try {
    const { checkIn, checkOut, capacity } = req.query;
    const parsedCapacity = Number(capacity || 0);
    const hasDateRange = Boolean(checkIn && checkOut);

    if (hasDateRange && checkOut <= checkIn) {
      return res.status(400).json({ error: "checkOut must be after checkIn" });
    }

    const conditions = ["1=1"];
    const params = [];

    if (Number.isFinite(parsedCapacity) && parsedCapacity > 0) {
      conditions.push("rm.capacity = ?");
      params.push(parsedCapacity);
    }

    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowIso = tomorrow.toISOString().slice(0, 10);

    const rangeStart = hasDateRange ? checkIn : todayIso;
    const rangeEnd = hasDateRange ? checkOut : tomorrowIso;

    conditions.push(`NOT EXISTS (
      SELECT 1
      FROM Reservation r
      WHERE r.roomId = rm.roomId
        AND r.status IN ('Pending', 'Confirmed', 'Checked-In')
        AND NOT (DATE(r.checkOut) <= DATE(?) OR DATE(r.checkIn) >= DATE(?))
    )`);
    params.push(rangeStart, rangeEnd);

    const sql = `SELECT rm.* FROM Room rm WHERE ${conditions.join(" AND ")} ORDER BY rm.roomId`;
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/rooms/:id - get room by id
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Room WHERE roomId = ?", [
      req.params.id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ error: "Room not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
