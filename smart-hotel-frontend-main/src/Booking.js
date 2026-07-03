// src/Booking.js
import React, { useState } from 'react';

function Booking({ onNavigate, room }) {
  
  // 1. Handle Fallback: If page loaded directly without clicking a room, show default
  const selectedRoom = room || {
    title: "Deluxe Double Room",
    price: "6,000",
    image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=500&q=80",
    rating: 4.6,
    tags: ["Wi-Fi", "AC", "Breakfast"] // Note: Rooms.js uses 'tags', mock used 'facilities'
  };

  const [nights, setNights] = useState(1);
  
  // 2. Fix Price Calculation: Remove commas from "6,000" and turn into number
  // "6,000" -> "6000" -> 6000
  const pricePerNight = parseInt(selectedRoom.price.replace(/,/g, ''), 10);
  
  const roomTotal = pricePerNight * nights;
  const taxes = roomTotal * 0.10; 
  const serviceCharge = 1500;
  const finalTotal = roomTotal + taxes + serviceCharge;

  return (
    <div className="page-container">
      <div className="booking-header">
        <h1>Room Booking</h1>
        <p>Confirm your booking details below</p>
      </div>

      <div className="booking-layout">
        
        {/* LEFT COLUMN */}
        <div className="booking-left">
          <div className="selected-room-card">
            <img src={selectedRoom.image} alt="Room" />
            <div className="selected-room-info">
              {/* Use dynamic title */}
              <h2>{selectedRoom.title}</h2>
              {/* Display tags safely */}
              <p className="facilities">
                {selectedRoom.tags ? selectedRoom.tags.join(", ") : "Wi-Fi, AC"}
              </p>
              <div className="price">LKR {selectedRoom.price} <small>/ night</small></div>
              <div className="rating">⭐ {selectedRoom.rating}</div>
            </div>
          </div>

          <div className="booking-form">
            <label>Check-in Date</label>
            <input type="date" />
            
            <label>Check-out Date</label>
            {/* Simple mock logic to change nights */}
            <input type="date" onChange={() => setNights(2)} /> 

            <label>Guests</label>
            <select>
              <option>1 Adult</option>
              <option>2 Adults</option>
              <option>2 Adults, 1 Child</option>
            </select>

            <label>Special Requests</label>
            <textarea placeholder="Any specific preferences?"></textarea>

            <div className="action-buttons">
              <button className="btn-confirm" onClick={() => onNavigate('payment')}>Confirm Booking</button>
              <button className="btn-cancel" onClick={() => onNavigate('rooms')}>Cancel</button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="booking-right">
          
          <div className="price-box">
            <h3>Price Breakdown</h3>
            <div className="price-row">
              <span>Room Price x {nights} nights</span>
              <span>LKR {roomTotal.toLocaleString()}</span>
            </div>
            <div className="price-row">
              <span>Taxes (10%)</span>
              <span>LKR {taxes.toLocaleString()}</span>
            </div>
            <div className="price-row">
              <span>Service Charges</span>
              <span>LKR {serviceCharge.toLocaleString()}</span>
            </div>
            <div className="total-row">
              <span>Total</span>
              <span>LKR {finalTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="payment-select-box">
            <h3>Payment Options</h3>
            <div className="payment-option">
              <input type="radio" name="payment" id="card" defaultChecked />
              <label htmlFor="card">Credit Card 💳</label>
            </div>
            <div className="payment-option">
              <input type="radio" name="payment" id="paypal" />
              <label htmlFor="paypal">PayPal 🅿️</label>
            </div>
            
            <div className="policy-check">
              <input type="checkbox" />
              <label>I agree to cancellation and refund policy</label>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Booking;