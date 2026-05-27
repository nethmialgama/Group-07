import React, { useState, useEffect } from "react";

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");

  const ratingsDist = [
    { star: 5, count: 150, width: "70%" },
    { star: 4, count: 60, width: "40%" },
    { star: 3, count: 20, width: "15%" },
    { star: 2, count: 10, width: "8%" },
    { star: 1, count: 5, width: "4%" },
  ];

  // static reviews (your concept kept)
  const userReviews = [
    {
      name: "Nethmi",
      date: "Nov 2025",
      text: "Amazing stay! Will visit again",
      img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    },
    {
      name: "Malith",
      date: "Dec 2024",
      text: "Comfortable rooms, good food",
      img: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80",
    },
    {
      name: "Afrina",
      date: "Nov 2024",
      text: "Loved the pool and services",
      img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80",
    },
  ];

  const fetchReviews = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/reviews");
      const data = await res.json();
      setReviews(data);
    } catch (err) {
      console.log("GET ERROR:", err);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleAddReview = async () => {
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }

    if (rating === 0) {
      alert("Please select rating");
      return;
    }

    const payload = {
      name,
      review: reviewText,
      rating,
    };

    try {
      await fetch("http://localhost:5000/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      setReviewText("");
      setRating(0);
      fetchReviews();
    } catch (err) {
      console.log("POST ERROR:", err);
    }
  };

  return (
    <div
      className="page-container"
      style={{ background: "#f8f9fa", paddingTop: "0", paddingBottom: "30px" }}
    >
      {/* HEADER */}
      <div className="reviews-header-text">
        <h1>Reviews & Ratings</h1>
        <p>Read guest feedback and share your experience.</p>
      </div>

      <div className="reviews-layout">
        {/* ================= RATING CARD ================= */}
        <div className="rating-summary-card">
          <div className="rating-row-top">
            <div className="big-score-box">
              <div className="score-num">
                4.7 <span className="score-total">/ 5</span>
              </div>
              <p className="total-reviews-text">Based on 245 reviews.</p>
            </div>

            <div className="rating-bars-container">
              {ratingsDist.map((r) => (
                <div key={r.star} className="rating-bar-row">
                  <span className="star-label">{r.star}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: r.width }}></div>
                  </div>
                  <span className="count-label">{r.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ================= WRITE REVIEW ================= */}
          <div className="write-review-box">
            <h3>Write a Review</h3>

            {/* STAR (simple version - you can improve later) */}
            <div className="star-input-row">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  style={{ cursor: "pointer", color: s <= rating ? "gold" : "gray" }}
                  onClick={() => setRating(s)}
                >
                  ★
                </span>
              ))}
            </div>

            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <textarea
              placeholder="Share your experience......"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />

            <button className="btn-blue-review" onClick={handleAddReview}>
              Submit Review
            </button>
          </div>
        </div>

        {/* ================= STATIC REVIEWS ================= */}
        <div className="review-list-container">
          {userReviews.map((review, index) => (
            <div key={index} className="review-card-item">
              <img src={review.img} alt={review.name} className="reviewer-img" />
              <div className="review-text-content">
                <h4>
                  {review.name} <span className="review-date">{review.date}</span>
                </h4>
                <p>{review.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ================= BACKEND REVIEWS ================= */}
        <div style={{ marginTop: "30px" }}>
          {reviews.map((r) => (
            <div
              key={r.id}
              style={{ borderBottom: "1px solid #ccc", padding: "10px" }}
            >
              <strong>{r.name}</strong>
              <p>{r.review}</p>
              <small>{r.created_at}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Reviews;