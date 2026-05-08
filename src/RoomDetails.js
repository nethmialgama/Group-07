import React from "react";

function RoomDetails({ onNavigate, room }) {
  const selectedRoom = room || {
    title: "Deluxe Double Room",
    tags: ["Wi-Fi", "AC", "Mini Fridge"],
    price: "6,000",
    rating: 4.6,
    image:
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
  };

  return (
    <div className="page-container">
      <div className="room-details-wrap">
        <img
          className="room-details-image"
          src={selectedRoom.image}
          alt={selectedRoom.title}
        />

        <div className="room-details-content">
          <h1>{selectedRoom.title}</h1>
          <p className="room-details-rating">⭐ {selectedRoom.rating}</p>

          <div className="room-details-tags">
            {(selectedRoom.tags || []).map((tag) => (
              <span key={tag} className="room-details-tag">
                {tag}
              </span>
            ))}
          </div>

          <p className="room-details-price">
            LKR {selectedRoom.price} <small>/ night</small>
          </p>

          <p className="room-details-text">
            Enjoy a comfortable stay with modern amenities, clean interiors, and
            excellent service. This room is ideal for leisure and business
            travelers.
          </p>

          <div className="room-details-actions">
            <button
              className="btn-fill"
              onClick={() => onNavigate("booking", selectedRoom)}
            >
              Book This Room
            </button>
            <button className="btn-outline" onClick={() => onNavigate("rooms")}>
              Back to Rooms
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomDetails;
