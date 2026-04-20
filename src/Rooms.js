// src/Rooms.js
import React from "react";

function Rooms({ onNavigate }) {
  // Mock data for the rooms shown in your image
  const roomsData = [
    {
      id: 1,
      title: "Deluxe Double Room",
      tags: ["Wi-Fi", "AC", "Mini Fridge", "Balcony"],
      price: "6,000",
      rating: 5,
      image:
        "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 2,
      title: "Superior Room",
      tags: ["Wi-Fi", "AC", "Smart TV", "Breakfast"],
      price: "8,500",
      rating: 4,
      image:
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 3,
      title: "Family Suite",
      tags: ["Wi-Fi", "AC", "2 Bedrooms", "Dining Area"],
      price: "10,000",
      rating: 5,
      image:
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 4,
      title: "Standard Single Room",
      tags: ["Wi-Fi", "AC", "TV"],
      price: "6,000",
      rating: 4,
      image:
        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 5,
      title: "Penthouse Suite",
      tags: ["Wi-Fi", "AC", "Rooftop View", "Private Pool"],
      price: "40,000",
      rating: 5,
      image:
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 6,
      title: "Luxury King Suite",
      tags: ["Wi-Fi", "AC", "Pool Access", "Living Room"],
      price: "25,000",
      rating: 5,
      image:
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=500&q=80",
    },
  ];

  return (
    <div className="page-container">
      {/* Page Title */}
      <div className="rooms-header">
        <h1>Available Rooms</h1>
        <p>Choose from a variety of room types to suit your needs</p>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <button className="filter-btn">Sort by ▼</button>
          <button className="filter-toggle">Wi-Fi</button>
          <button className="filter-toggle">AC</button>
          <button className="filter-toggle">Pool</button>
        </div>
        <div className="search-rooms">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search rooms..." />
        </div>
      </div>

      {/* Room Grid */}
      <div className="room-grid">
        {roomsData.map((room) => (
          <div key={room.id} className="room-card">
            <img src={room.image} alt={room.title} />
            <div className="room-info">
              <h3>{room.title}</h3>
              <p className="room-tags">{room.tags.join(", ")}</p>
              <div className="price-row">
                <div className="price">
                  LKR {room.price} <small>/ night</small>
                </div>
              </div>

              {/* Star Rating Helper */}
              <div className="rating">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    style={{ color: i < room.rating ? "#fbbf24" : "#e5e7eb" }}
                  >
                    ★
                  </span>
                ))}
              </div>

              <div className="card-buttons">
                {/* When clicked, navigate to 'room-details' */}
                <button
                  className="btn-outline"
                  onClick={() => onNavigate("room-details", room)}
                >
                  View Details
                </button>
                <button
                  className="btn-fill"
                  onClick={() => onNavigate("booking", room)}
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Rooms;
