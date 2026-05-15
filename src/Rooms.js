// src/Rooms.js
import React from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { showToast } from "./toast";

const getRoomImage = (roomType = "", idx = 0, capacity = 0) => {
  const normalized = String(roomType).trim().toLowerCase();

  if (normalized.includes("single")) {
    const singleImages = ["/images/single1.png", "/images/single2.png"];
    return singleImages[idx % singleImages.length];
  }

  if (normalized.includes("double")) {
    const doubleImages = [
      "/images/double1.png",
      "/images/double2.png",
      "/images/double3.png",
    ];
    return doubleImages[idx % doubleImages.length];
  }

  // Support both "trible" (existing file name) and "triple" text values.
  if (
    normalized.includes("trible") ||
    normalized.includes("triple") ||
    normalized.includes("family") ||
    Number(capacity) === 3
  ) {
    const tribleImages = ["/images/trible1.png", "/images/trible2.png"];
    return tribleImages[idx % tribleImages.length];
  }

  return "/images/single1.png";
};

function Rooms({ onNavigate, searchCriteria }) {
  const [roomsData, setRoomsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acFilter, setAcFilter] = useState("all");
  const [bedFilter, setBedFilter] = useState("all");

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const params = new URLSearchParams();
        if (searchCriteria?.checkIn)
          params.set("checkIn", searchCriteria.checkIn);
        if (searchCriteria?.checkOut) {
          params.set("checkOut", searchCriteria.checkOut);
        }
        if (searchCriteria?.capacity) {
          params.set("capacity", String(searchCriteria.capacity));
        }

        const url = params.toString()
          ? `http://localhost:5000/api/rooms?${params.toString()}`
          : "http://localhost:5000/api/rooms";

        const response = await fetch(url);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to load rooms");
        }

        const mapped = data.map((room, idx) => ({
          id: room.roomId,
          roomId: room.roomId,
          roomType: room.roomType,
          capacity: Number(room.capacity || 0),
          title: `${room.roomType} Room`,
          tags: (room.amenities || "Wi-Fi, AC")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          amenitiesText: String(room.amenities || ""),
          descriptionText: String(room.description || ""),
          price: Number(room.roomPrice || 0).toLocaleString(),
          rating: 4 + (idx % 10) / 10,
          image: getRoomImage(room.roomType, idx, room.capacity),
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
  }, [searchCriteria]);

  useEffect(() => {
    const capacity = Number(searchCriteria?.capacity || 0);
    if (capacity === 1) setBedFilter("single");
    else if (capacity === 2) setBedFilter("double");
    else if (capacity === 3) setBedFilter("triple");
    else setBedFilter("all");
    setAcFilter("all");
  }, [searchCriteria]);

  const filteredRooms = roomsData.filter((room) => {
    const roomText =
      `${room.amenitiesText || ""} ${room.descriptionText || ""}`.toLowerCase();
    const typeText = `${room.roomType || ""} ${room.title || ""}`.toLowerCase();

    const hasNonAc = /\bnon[-\s]?ac\b/.test(roomText);
    const hasAc =
      (/\bac\b/.test(roomText) ||
        /\ba\s*\/\s*c\b/.test(roomText) ||
        /\bair\s?condition(ed)?\b/.test(roomText)) &&
      !hasNonAc;

    const acMatches =
      acFilter === "all" ||
      (acFilter === "ac" && hasAc) ||
      (acFilter === "non-ac" && hasNonAc);

    const bedMatches =
      bedFilter === "all" ||
      (bedFilter === "single" &&
        (room.capacity === 1 || typeText.includes("single"))) ||
      (bedFilter === "double" &&
        (room.capacity === 2 || typeText.includes("double"))) ||
      (bedFilter === "triple" &&
        (room.capacity === 3 ||
          typeText.includes("triple") ||
          typeText.includes("trible") ||
          typeText.includes("family")));

    return acMatches && bedMatches;
  });

  return (
    <div className="page-container">
      {/* Page Title */}
      <motion.div 
        className="rooms-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>Available Rooms</h1>
        <p>Choose from a variety of room types to suit your needs</p>
      </motion.div>

      {/* Filter Bar */}
      <motion.div 
        className="filter-bar"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="filter-group">
          <select
            className="filter-btn"
            value={acFilter}
            onChange={(e) => setAcFilter(e.target.value)}
          >
            <option value="all">AC Filter: All</option>
            <option value="ac">AC</option>
            <option value="non-ac">Non AC</option>
          </select>
          <select
            className="filter-btn"
            value={bedFilter}
            onChange={(e) => setBedFilter(e.target.value)}
          >
            <option value="all">Bed Filter: All</option>
            <option value="single">Single Bed</option>
            <option value="double">Double Bed</option>
            <option value="triple">Triple Bed</option>
          </select>
        </div>
      </motion.div>

      {/* Room Grid */}
      {loading ? <p>Loading rooms...</p> : null}

      <div className="room-grid">
        {filteredRooms.map((room, index) => (
          <motion.div 
            key={room.id} 
            className="room-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * index }}
            whileHover={{ y: -10 }}
          >
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
          </motion.div>
        ))}
      </div>
      {!loading && filteredRooms.length === 0 ? <p>No rooms found.</p> : null}
    </div>
  );
}

export default Rooms;
