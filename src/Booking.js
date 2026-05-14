// src/Booking.js
import React, { useState } from "react";
import { getAuthHeaders, getStoredAuth } from "./auth";
import { showToast } from "./toast";

function Booking({ onNavigate, room, searchCriteria }) {
  // 1. Handle Fallback: If page loaded directly without clicking a room, show default
  const selectedRoom = room || {
    title: "Deluxe Double Room",
    price: "6,000",
    image:
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=500&q=80",
    rating: 4.6,
    tags: ["Wi-Fi", "AC", "Breakfast"], // Note: Rooms.js uses 'tags', mock used 'facilities'
  };

  const [checkIn, setCheckIn] = useState(searchCriteria?.checkIn || "");
  const [checkOut, setCheckOut] = useState(searchCriteria?.checkOut || "");
  const [guests, setGuests] = useState(searchCriteria?.guestSelection || "2-adults");
  
  const [nights, setNights] = useState(() => {
    if (searchCriteria?.checkIn && searchCriteria?.checkOut) {
      const inDate = new Date(searchCriteria.checkIn);
      const outDate = new Date(searchCriteria.checkOut);
      const diff = Math.ceil((outDate - inDate) / (24 * 60 * 60 * 1000));
      return diff > 0 ? diff : 1;
    }
    return 1;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Fix Price Calculation: Remove commas from "6,000" and turn into number
  // "6,000" -> "6000" -> 6000
  const pricePerNight = parseInt(selectedRoom.price.replace(/,/g, ""), 10);

  const roomTotal = pricePerNight * nights;
  const taxes = roomTotal * 0.1;
  const serviceCharge = 1500;
  const finalTotal = roomTotal + taxes + serviceCharge;

  const handleConfirmBooking = async () => {
    const auth = getStoredAuth();
    const user = auth.user;

    if (!checkIn || !checkOut) {
      showToast("Please select check-in and check-out dates", "warning");
      return;
    }

    if (!user?.guestId) {
      showToast("Only guest accounts can create bookings", "error");
      return;
    }

    if (!selectedRoom.roomId) {
      showToast("Please book a room from the available rooms page", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:5000/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          guestId: user.guestId,
          roomId: selectedRoom.roomId,
          checkIn,
          checkOut,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create reservation");
      }

      showToast("Booking created. Continue to payment.", "success");
      onNavigate("payment", {
        ...selectedRoom,
        reservationId: data.reservationId,
        totalPrice: data.totalPrice,
        checkIn,
        checkOut,
      });
    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <div className="price">
                LKR {selectedRoom.price} <small>/ night</small>
              </div>
              <div className="rating">⭐ {selectedRoom.rating}</div>
            </div>
          </div>

          <div className="booking-form">
            <label>Check-in Date</label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => {
                const value = e.target.value;
                setCheckIn(value);
                if (value && checkOut) {
                  const inDate = new Date(value);
                  const outDate = new Date(checkOut);
                  const diff = Math.ceil((outDate - inDate) / (24 * 60 * 60 * 1000));
                  setNights(diff > 0 ? diff : 1);
                }
              }}
            />

            <label>Check-out Date</label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => {
                const value = e.target.value;
                setCheckOut(value);
                if (checkIn && value) {
                  const inDate = new Date(checkIn);
                  const outDate = new Date(value);
                  const diff = Math.ceil((outDate - inDate) / (24 * 60 * 60 * 1000));
                  setNights(diff > 0 ? diff : 1);
                }
              }}
            />

            <label>Guests</label>
            <select value={guests} onChange={(e) => setGuests(e.target.value)}>
              <option value="1-adult">1 Adult</option>
              <option value="2-adults">2 Adults</option>
              <option value="2-adults-1-kid">2 Adults, 1 Child</option>
            </select>

            <label>Special Requests</label>
            <textarea placeholder="Any specific preferences?"></textarea>

            <div className="action-buttons">
              <button
                className="btn-confirm"
                disabled={isSubmitting}
                onClick={handleConfirmBooking}
              >
                {isSubmitting ? "Confirming..." : "Confirm Booking"}
              </button>
              <button
                className="btn-cancel"
                onClick={() => onNavigate("rooms")}
              >
                Cancel
              </button>
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
