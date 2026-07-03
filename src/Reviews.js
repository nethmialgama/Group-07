import React, { useState, useEffect } from "react";
import { getAuthHeaders, getStoredAuth } from "./auth";
import { showToast } from "./toast";

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(true);

  const auth = getStoredAuth();
  const isLoggedIn = !!auth.token;

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/reviews");
      const data = await res.json();
      if (Array.isArray(data)) {
        setReviews(data);
      }
    } catch (err) {
      console.error("Fetch reviews error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleAddReview = async () => {
    if (!reviewText.trim()) {
      showToast("Please write something about your experience", "warning");
      return;
    }

    if (rating === 0) {
      showToast("Please select a rating", "warning");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          review: reviewText,
          rating,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add review");

      showToast("Thank you for your review!", "success");
      setReviewText("");
      setRating(0);
      fetchReviews();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Calculate statistics
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : "0.0";

  const getDistribution = (star) => {
    if (totalReviews === 0) return 0;
    const count = reviews.filter(r => r.rating === star).length;
    return Math.round((count / totalReviews) * 100);
  };

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
    <div className="page-container" style={{ background: "#f8f9fa", paddingBottom: "60px" }}>
      <div className="reviews-header-text">
        <h1>Guest Reviews</h1>
        <p>Real experiences from our valued guests.</p>
      </div>

      <div className="reviews-layout">
        <div className="rating-summary-card">
          <div className="rating-row-top">
            <div className="big-score-box">
              <div className="score-num">
                {avgRating} <span className="score-total">/ 5</span>
              </div>
              <p className="total-reviews-text">Based on {totalReviews} reviews</p>
            </div>

            <div className="rating-bars-container">
              {[5, 4, 3, 2, 1].map((star) => {
                const percent = getDistribution(star);
                return (
                  <div key={star} className="rating-bar-row">
                    <span className="star-label">{star} ★</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${percent}%` }}></div>
                    </div>
                    <span className="count-label">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="write-review-box">
            {isLoggedIn ? (
              <>
                <h3>Share Your Experience</h3>
                <div className="star-input-row" style={{ fontSize: "24px", marginBottom: "15px" }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      style={{
                        cursor: "pointer",
                        color: s <= rating ? "#FFD700" : "#ddd",
                        marginRight: "5px"
                      }}
                      onClick={() => setRating(s)}
                    >
                      ★
                    </span>
                  ))}
                </div>

                <textarea
                  placeholder="How was your stay? We'd love to hear from you..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  style={{ minHeight: "100px", marginBottom: "15px" }}
                />

                <button className="btn-blue-review" onClick={handleAddReview}>
                  Post Review
                </button>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <p style={{ color: "#666", marginBottom: "15px" }}>Login to share your experience with us.</p>
                <button className="btn-blue-review" style={{ width: "auto" }} onClick={() => window.location.hash = "#login"}>
                  Login Now
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="review-list-container">
          {loading ? (
            <p style={{ textAlign: "center", color: "#888" }}>Loading reviews...</p>
          ) : reviews.length > 0 ? (
            reviews.map((r) => (
              <div key={r.id} className="review-card-item">
                <div className="reviewer-avatar">
                  {r.name.charAt(0).toUpperCase()}
                </div>
                <div className="review-text-content">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h4>{r.name}</h4>
                    <div style={{ color: "#FFD700" }}>
                      {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                    </div>
                  </div>
                  <span className="review-date">
                    {new Date(r.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                  <p style={{ marginTop: "10px", color: "#444", lineHeight: "1.6" }}>{r.review}</p>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
              <p>No reviews yet. Be the first to leave one!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reviews;
