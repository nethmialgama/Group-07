// src/CancelBooking.js
import React, { useState } from 'react';

function CancelBooking({ onNavigate, booking }) {
  // Mock data if accessed directly
  const room = booking || {
    title: "Deluxe Double Room",
    checkIn: "2025-10-08",
    checkOut: "2025-10-15",
    guests: "2 Adults",
    totalPaid: "26,500",
    image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=500&q=80"
  };

  const [reason, setReason] = useState("");
  // NEW: State to hold the written reason if "Other" is selected
  const [otherReason, setOtherReason] = useState("");

  const handleCancel = () => {
    // Validation 1: Dropdown must be selected
    if (!reason) {
      alert("Please select a reason for cancellation.");
      return;
    }
    
    // Validation 2: If "Other" is selected, text box cannot be empty
    if (reason === 'other' && !otherReason.trim()) {
      alert("Please write the reason for cancellation.");
      return;
    }

    if (window.confirm("Are you sure you want to cancel this booking? This cannot be undone.")) {
      // In a real app, you would send 'otherReason' to the backend here
      alert("Booking Cancelled. Refund will be processed shortly.");
      onNavigate('dashboard');
    }
  };

  return (
    <div className="page-container">
      <div className="cancel-header">
        <h1>Cancel Booking</h1>
        <p>Cancel your booking below. Refund eligibility is based on hotel policy.</p>
      </div>

      <div className="cancel-content">
        
        {/* Booking Summary Card */}
        <div className="booking-summary-card">
          <div className="summary-image">
            <img src={room.image} alt="Room" />
          </div>
          <div className="summary-details">
            <h2>{room.title}</h2>
            <div className="summary-grid">
              <p><strong>Check-in:</strong> {room.checkIn}</p>
              <p><strong>Check-out:</strong> {room.checkOut}</p>
              <p><strong>Guests:</strong> {room.guests || "2 Adults"}</p>
              <p><strong>Total Paid:</strong> LKR {room.totalPaid || room.price}</p>
            </div>
          </div>
        </div>

        {/* Refund Policy Table */}
        <div className="refund-section">
          <h3>Refund Eligibility</h3>
          <div className="refund-table">
            <div className="refund-row">
              <span>More than 30 days</span> <span>80% Refund</span>
            </div>
            <div className="refund-row">
              <span>30–20 days</span> <span>70% Refund</span>
            </div>
            <div className="refund-row">
              <span>20–7 days</span> <span>60% Refund</span>
            </div>
            <div className="refund-row">
              <span>7–3 days</span> <span>40% Refund</span>
            </div>
            <div className="refund-row">
              <span>Less than 3 days</span> <span>No Refund</span>
            </div>
          </div>
        </div>

        {/* Reason & Action */}
        <div className="reason-section">
          <label>Reason</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">Select a reason...</option>
            <option value="plans">Change of plans</option>
            <option value="price">Found a better price</option>
            <option value="emergency">Personal emergency</option>
            <option value="other">Other</option>
          </select>
          
          {/* NEW: Conditional Rendering for the Text Box */}
          {reason === 'other' && (
            <div className="other-reason-container">
               <label className="sub-label">Please specify:</label>
               <textarea 
                 className="other-reason-box"
                 placeholder="Type your reason here..."
                 value={otherReason}
                 onChange={(e) => setOtherReason(e.target.value)}
               ></textarea>
            </div>
          )}
          
          <div className="warning-text">
            ⚠️ Once cancelled, this action cannot be undone.
          </div>

          <button className="btn-cancel-danger" onClick={handleCancel}>Cancel Booking</button>
          <button className="btn-keep" onClick={() => onNavigate('dashboard')}>Keep Booking</button>
        </div>

      </div>
    </div>
  );
}

export default CancelBooking;