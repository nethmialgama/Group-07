// src/Offers.js
import React from 'react';

function Offers({ onNavigate }) {
// Inside src/Offers.js

const offers = [
    {
      id: 1,
      title: "Weekend Special 15% Off",
      desc: "Valid for stays Fri- Sun",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80"
    },
    {
      id: 2,
      title: "Family Package 20% Off",
      desc: "Valid until 30th Nov 2025",
      image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=500&q=80"
    },
    {
      id: 3,
      title: "Honeymoon Deal Free Dinner",
      desc: "Valid until 30th Nov 2025",
      // UPDATED IMAGE LINK BELOW:
      image: "https://images.unsplash.com/photo-1544148103-0773bf10d330?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
    }
  ];

  return (
    <div className="page-container">
      <div className="offers-header">
        <h1>Discounts & Offers</h1>
        <p>Grab the best deals and save more on your stay.</p>
      </div>

      {/* Hero Offer Banner */}
      <div className="offer-hero">
        <div className="offer-hero-content">
          <h2>Early Bird Offer - Save 20% on bookings made 30 days in advance!</h2>
        </div>
      </div>

      {/* Offers Grid */}
      <div className="offers-grid">
        {offers.map((offer) => (
          <div key={offer.id} className="offer-card">
            <img src={offer.image} alt={offer.title} />
            <div className="offer-info">
              <h3>{offer.title}</h3>
              <p>{offer.desc}</p>
              <button className="btn-book-offer" onClick={() => onNavigate('rooms')}>Book Now</button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA Section */}
      <div className="offers-cta">
        <h2>Don’t miss out! Book now and enjoy exclusive discounts</h2>
        <button className="btn-explore" onClick={() => onNavigate('rooms')}>Explore Rooms</button>
      </div>
    </div>
  );
}

export default Offers;