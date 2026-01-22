// src/Reviews.js
import React from 'react';

function Reviews() {
  // Mock Data for Rating Bars
  const ratingsDist = [
    { star: 5, count: 150, width: '70%' }, // Yellow bar width
    { star: 4, count: 60, width: '40%' },
    { star: 3, count: 20, width: '15%' },
    { star: 2, count: 10, width: '8%' },
    { star: 1, count: 5, width: '4%' },
  ];

  // Mock Data for User Reviews
  const userReviews = [
    { 
      name: "Nethmi", 
      date: "Nov 2025", 
      text: "Amazing stay! Will visit again", 
      img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" 
    },
    { 
      name: "Malith", 
      date: "Dec 2024", 
      text: "Comfortable rooms, good food", 
      img: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80" 
    },
    { 
      name: "Afrina", 
      date: "Nov 2024", 
      text: "Loved the pool and services", 
      img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80" 
    },
  ];

  return (
    <div className="page-container" style={{background: '#f8f9fa', minHeight:'100vh', paddingBottom:'50px'}}>
      
      <div className="reviews-header-text">
        <h1>Reviews & Ratings</h1>
        <p>Read guest feedback and share your experience.</p>
      </div>

      <div className="reviews-layout">
        
        {/* MAIN RATING CARD */}
        <div className="rating-summary-card">
          
          <div className="rating-row-top">
             {/* Left: Big Score */}
             <div className="big-score-box">
                <div className="score-num">4.7 <span className="score-total">/ 5</span></div>
                <p className="total-reviews-text">Based on 245 reviews.</p>
             </div>

             {/* Right: Progress Bars */}
             <div className="rating-bars-container">
                {ratingsDist.map((r) => (
                  <div key={r.star} className="rating-bar-row">
                     <span className="star-label">{r.star}</span>
                     <div className="bar-track">
                        <div className="bar-fill" style={{width: r.width}}></div>
                     </div>
                     <span className="count-label">{r.count}</span>
                  </div>
                ))}
             </div>
          </div>

          {/* Write Review Section */}
          <div className="write-review-box">
             <h3>Write a Review</h3>
             <div className="star-input-row">
                {/* 5 Empty/Grey Stars for input */}
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
             </div>
             <textarea placeholder="Share your experience......"></textarea>
             <button className="btn-blue-review">Submit Review</button>
          </div>
        </div>

        {/* REVIEW LIST */}
        <div className="review-list-container">
           {userReviews.map((review, index) => (
             <div key={index} className="review-card-item">
                <img src={review.img} alt={review.name} className="reviewer-img" />
                <div className="review-text-content">
                   <h4>{review.name} <span className="review-date">{review.date}</span></h4>
                   <p>{review.text}</p>
                </div>
             </div>
           ))}
        </div>

      </div>
    </div>
  );
}

export default Reviews;