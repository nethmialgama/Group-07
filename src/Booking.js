// src/Booking.js
import React, { useState, useEffect } from "react";
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
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/auth/profile", {
          headers: { ...getAuthHeaders() },
        });
        const data = await response.json();
        if (response.ok) {
          setPhone(data.phone || "");
          setAddress(data.address || "");
        }
      } catch (err) {
        console.error("Failed to load profile for autofill", err);
      }
    };
    loadProfile();
  }, []);

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

    // Validation for phone and address
    const cleanPhone = phone.replace(/\s/g, "");
    if (!cleanPhone || cleanPhone.length !== 10 || !/^\d+$/.test(cleanPhone)) {
      showToast("Mobile number must be exactly 10 digits", "warning");
      return;
    }

    if (!address || address.length < 8) {
      showToast("Address must be at least 8 characters long", "warning");
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
              readOnly
              className="readonly-input"
            />

            <label>Check-out Date</label>
            <input
              type="date"
              value={checkOut}
              readOnly
              className="readonly-input"
            />

            <label>Guests</label>
            <select value={guests} disabled className="readonly-input">
              <option value="1-adult">1 Adult</option>
              <option value="2-adults">2 Adults</option>
              <option value="2-adults-1-kid">2 Adults, 1 Child</option>
            </select>
            <p className="booking-note" style={{ fontSize: "0.85rem", color: "#666", marginTop: "-10px", marginBottom: "15px" }}>
              * To change dates or guest count, please go back to the <span style={{ color: "#007bff", cursor: "pointer", textDecoration: "underline" }} onClick={() => onNavigate("home")}>home page</span> and search again.
            </p>

            <label>Mobile Number</label>
            <input
              type="text"
              placeholder="e.g. 0771234567"
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                if (val.length <= 10) setPhone(val);
              }}
            />

            <label>Address</label>
            <input
              type="text"
              placeholder="Your home address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

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
