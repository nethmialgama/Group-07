// src/Rooms.js
import React from "react";
import { useEffect, useState } from "react";
import { showToast } from "./toast";

function Rooms({ onNavigate }) {
  const [roomsData, setRoomsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/rooms");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to load rooms");
        }

        const mapped = data
          .filter((room) => room.status === "Available")
          .map((room, idx) => ({
            id: room.roomId,
            roomId: room.roomId,
            title: `${room.roomType} Room`,
            tags: (room.amenities || "Wi-Fi, AC")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            price: Number(room.roomPrice || 0).toLocaleString(),
            rating: 4 + (idx % 10) / 10,
            image:
              "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=500&q=80",
            status: room.status,
          }));

        setRoomsData(mapped);
      } catch (err) {
        console.error(err);
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, []);

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
      {loading ? <p>Loading rooms...</p> : null}

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
