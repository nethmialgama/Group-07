const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticate } = require("../middleware/auth");

// GET /api/reviews
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM reviews ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// POST /api/reviews
router.post("/", authenticate, async (req, res) => {
  const { review, rating } = req.body;
  const name = req.user.name; // Use authenticated user's name

  if (!review || !rating) {
    return res.status(400).json({ error: "Review text and rating are required" });
  }

  try {
    // Ensure table exists (optional, but good for first run)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        review TEXT NOT NULL,
        rating INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(
      "INSERT INTO reviews (name, review, rating) VALUES (?, ?, ?)",
      [name, review, rating],
    );

    res.json({ success: true, message: "Review added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
