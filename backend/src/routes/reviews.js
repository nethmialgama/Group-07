const express = require("express");
const router = express.Router();

const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "hotel_db",
});

// GET reviews
router.get("/reviews", (req, res) => {
  const sql = "SELECT * FROM reviews ORDER BY id DESC";

  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    }

    res.json(result);
  });
});

// POST review
router.post("/reviews", (req, res) => {
  console.log("BODY:", req.body);

  const name = req.body.name;
  const review = req.body.review;
  const rating = req.body.rating;

  if (!name || !review || !rating) {
    return res.status(400).json({
      message: "Missing data",
    });
  }

  const sql = "INSERT INTO reviews (name, review,rating) VALUES (?, ?, ?)";

  db.query(sql, [name, review, rating], (err, result) => {
    if (err) {
      console.log("DB ERROR:", err);

      return res.status(500).json(err);
    }

    res.json({
      message: "Review added successfully",
    });
  });
});

module.exports = router;
