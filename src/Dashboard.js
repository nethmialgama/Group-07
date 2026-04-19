// src/Dashboard.js
import React from 'react';

function Dashboard({ onNavigate, user, recentBooking, onLogout }) {
  // Mock data if no real booking exists yet
  const booking = recentBooking || {
    title: "Deluxe Double Room",
    checkIn: "2025-10-08",
    checkOut: "2025-10-15",
    price: "26,500",
    status: "confirmed",
    image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=500&q=80"
  };

  return (
    <div className="page-container dashboard-container">
      
      {/* LEFT SIDEBAR */}
      <div className="dashboard-sidebar">
        <button className="sidebar-btn" onClick={() => onNavigate('home')}>Hotel Details</button>
        <button className="sidebar-btn" onClick={() => onNavigate('rooms')}>Rooms</button>
        <button className="sidebar-btn active">Payment</button>
        <button className="sidebar-btn" onClick={() => onNavigate('cancel')}>Cancel booking</button>
        
        {/* UPDATED: Navigates to Profile Settings */}
        <button className="sidebar-btn" onClick={() => onNavigate('profile-settings')}>Profile setting</button>
        
        {/* UPDATED: Calls the onLogout function passed from App.js */}
        <button className="sidebar-btn logout" onClick={onLogout}>Logout</button>
      </div>

      {/* MAIN CONTENT */}
      <div className="dashboard-content">
        <div className="welcome-header">
          <h1>Welcome back user 👋</h1>
          <p>Here’s your upcoming trips and booking history</p>
        </div>

        <h2 className="section-title">Upcoming Bookings</h2>

        <div className="booking-status-card">
          <div className="booking-info-left">
            <h3>{booking.title}</h3>
            
            <div className="dates-row">
              <div className="date-group">
                <label>Check-in</label>
                <span>{booking.checkIn}</span>
              </div>
              <div className="date-group">
                <label>Check-out</label>
                <span>{booking.checkOut}</span>
              </div>
            </div>

            <div className="status-row">
              <div className="price-tag">
                LKR {booking.price} <br/>
                <span className="status-badge">{booking.status}</span>
              </div>
              <button className="btn-view-details">View Details</button>
            </div>
          </div>

          <div className="booking-image-right">
            <img src={booking.image} alt="Room" />
          </div>
        </div>
      </div>

    </div>
  );
}

export default Dashboard;