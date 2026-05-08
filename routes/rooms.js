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

    const conditions = [];
    const params = [];

    if (Number.isFinite(parsedCapacity) && parsedCapacity > 0) {
      conditions.push("rm.capacity = ?");
      params.push(parsedCapacity);
    }

    let sql = `
  SELECT 
    rm.room_id AS roomId,
    rm.room_number AS roomNumber,
    rm.room_type AS roomType,
    rm.price AS roomPrice,
    rm.capacity AS capacity,
    rm.status AS status,
    rm.image AS image,
    rm.amenities AS amenities,
    rm.description AS description
    
  FROM room rm
`;

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY rm.room_id";

    const [rows] = await pool.query(sql, params);
    res.json(rows);

  } catch (err) {
    console.error("ROOM API ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// GET /api/rooms/:id
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM room WHERE room_id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Room not found" });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error("ROOM API ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;