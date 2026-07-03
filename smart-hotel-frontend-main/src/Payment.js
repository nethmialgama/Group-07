// src/Payment.js
import React, { useState } from 'react';

function Payment({ onNavigate, room }) {
  // Fallback data if page is refreshed directly
  const selectedRoom = room || {
    title: "Deluxe Double Room",
    price: "6,000",
    checkIn: "2025-10-08",
    checkOut: "2025-10-09",
    total: "6,000"
  };

  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card', 'paypal', 'bank'

  const handlePay = () => {
    alert("Payment Successful! Booking Confirmed.");
    onNavigate('dashboard'); // We will build this page next
  };

  return (
    <div className="page-container">
      <div className="payment-header">
        <h1>Payment</h1>
        <p>Complete your payment to confirm booking</p>
      </div>

      <div className="payment-layout">
        
        {/* LEFT COLUMN: Billing Info */}
        <div className="billing-section">
          <h2>Billing Information</h2>
          <form className="billing-form" onSubmit={(e) => e.preventDefault()}>
            <label>Full Name</label>
            <input type="text" placeholder="Enter your full name" />

            <label>Email</label>
            <input type="email" placeholder="example@gmail.com" />

            <label>Phone</label>
            <input type="tel" placeholder="+94 77 123 4567" />

            <label>Billing Address</label>
            <input type="text" placeholder="Street address, City" />

            <div className="policy-check" style={{marginTop: '20px'}}>
               <input type="checkbox" id="policy" />
               <label htmlFor="policy">I agree to cancellation and refund policy</label>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Payment Details */}
        <div className="payment-details-section">
          
          {/* Order Summary Card */}
          <div className="summary-card">
            <h3>Booking Summary</h3>
            <div className="summary-row">
              <span>Room:</span> <strong>{selectedRoom.title}</strong>
            </div>
            <div className="summary-row">
              <span>Dates:</span> <span>Oct 08 - Oct 09</span>
            </div>
            <div className="summary-row total">
              <span>Total to pay:</span> 
              <span>LKR {selectedRoom.price}</span>
            </div>
          </div>

          <h3>Payment Options</h3>
          
          {/* Credit Card Option */}
          <div className={`payment-option-card ${paymentMethod === 'card' ? 'active' : ''}`} 
               onClick={() => setPaymentMethod('card')}>
            <div className="option-header">
              <span>Credit / Debit Card</span>
              <span className="icons">💳</span>
            </div>
            
            {/* Show inputs only if Card is selected */}
            {paymentMethod === 'card' && (
              <div className="card-inputs">
                <label>Cardholder Name</label>
                <input type="text" />
                
                <label>Card Number</label>
                <input type="text" placeholder="0000 0000 0000 0000" />
                
                <div className="row-inputs">
                  <div>
                    <label>Expiry</label>
                    <input type="text" placeholder="MM/YY" />
                  </div>
                  <div>
                    <label>CVV</label>
                    <input type="text" placeholder="123" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PayPal Option */}
          <div className={`payment-option-card ${paymentMethod === 'paypal' ? 'active' : ''}`}
               onClick={() => setPaymentMethod('paypal')}>
             <div className="option-header">
              <span>Paypal</span>
              <span className="icons">🅿️</span>
            </div>
          </div>

          {/* Bank Transfer Option */}
          <div className={`payment-option-card ${paymentMethod === 'bank' ? 'active' : ''}`}
               onClick={() => setPaymentMethod('bank')}>
             <div className="option-header">
              <span>Bank Transfer</span>
              <span className="icons">🏦</span>
            </div>
          </div>

          <div className="payment-actions">
            <button className="btn-pay" onClick={handlePay}>Pay Now</button>
            <button className="btn-cancel-pay" onClick={() => onNavigate('booking')}>Cancel</button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Payment;