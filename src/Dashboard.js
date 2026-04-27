// src/Dashboard.js
import React, { useEffect, useState } from "react";
import { getStoredAuth, getAuthHeaders } from "./auth";
import { showToast } from "./toast";

const STATUS_COLORS = {
  Confirmed: { bg: "#e6f4ea", color: "#2e7d32", label: "Confirmed" },
  Pending: { bg: "#fff8e1", color: "#f57f17", label: "Pending" },
  "Checked-In": { bg: "#e3f2fd", color: "#1565c0", label: "Checked-In" },
  "Checked-Out": { bg: "#f3e5f5", color: "#6a1b9a", label: "Checked-Out" },
  Cancelled: { bg: "#fce4ec", color: "#b71c1c", label: "Cancelled" },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || {
    bg: "#f5f5f5",
    color: "#555",
    label: status,
  };
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        borderRadius: "20px",
        padding: "3px 12px",
        fontSize: "12px",
        fontWeight: 600,
        letterSpacing: "0.3px",
      }}
    >
      {s.label}
    </span>
  );
}

function Dashboard({ onNavigate, onLogout }) {
  const auth = getStoredAuth();
  const displayName =
    String(auth?.user?.name || auth?.user?.fullName || "").trim() || "User";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming"); // "upcoming" | "history"

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/reservations/my", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load bookings");
      setBookings(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (reservationId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?"))
      return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/reservations/${reservationId}/cancel`,
        { method: "PUT", headers: getAuthHeaders() },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel booking");
      showToast("Booking cancelled successfully.", "success");
      fetchBookings();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingBookings = bookings.filter((b) => {
    const checkOut = new Date(b.checkOut);
    return (
      checkOut >= today &&
      b.status !== "Cancelled" &&
      b.status !== "Checked-Out"
    );
  });

  const historyBookings = bookings.filter((b) => {
    const checkOut = new Date(b.checkOut);
    return (
      checkOut < today || b.status === "Cancelled" || b.status === "Checked-Out"
    );
  });

  const displayedBookings =
    activeTab === "upcoming" ? upcomingBookings : historyBookings;

  const canCancel = (booking) =>
    booking.status === "Confirmed" || booking.status === "Pending";

  return (
    <div className="page-container dashboard-container">
      {/* LEFT SIDEBAR */}
      <div className="dashboard-sidebar">
        <button className="sidebar-btn" onClick={() => onNavigate("home")}>
          🏨 Hotel Details
        </button>
        <button className="sidebar-btn" onClick={() => onNavigate("rooms")}>
          🛏️ Browse Rooms
        </button>
        <button className="sidebar-btn active">📋 My Bookings</button>
        <button
          className="sidebar-btn"
          onClick={() => onNavigate("profile-settings")}
        >
          ⚙️ Profile Settings
        </button>
        <button className="sidebar-btn sidebar-btn-logout" onClick={onLogout}>
          🚪 Logout
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="dashboard-content">
        <div className="welcome-header">
          <h1>Welcome back, {displayName} 👋</h1>
          <p>Manage your reservations and booking history</p>
        </div>

        {/* STATS ROW */}
        <div className="dashboard-stats-row">
          <div className="dash-stat-card">
            <span className="dash-stat-icon">📅</span>
            <div>
              <div className="dash-stat-value">{upcomingBookings.length}</div>
              <div className="dash-stat-label">Upcoming</div>
            </div>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-icon">🕐</span>
            <div>
              <div className="dash-stat-value">{bookings.length}</div>
              <div className="dash-stat-label">Total Bookings</div>
            </div>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-icon">✅</span>
            <div>
              <div className="dash-stat-value">
                {bookings.filter((b) => b.status === "Checked-Out").length}
              </div>
              <div className="dash-stat-label">Completed</div>
            </div>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-icon">❌</span>
            <div>
              <div className="dash-stat-value">
                {bookings.filter((b) => b.status === "Cancelled").length}
              </div>
              <div className="dash-stat-label">Cancelled</div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="dashboard-tabs">
          <button
            className={`dash-tab ${activeTab === "upcoming" ? "active" : ""}`}
            onClick={() => setActiveTab("upcoming")}
          >
            Upcoming Bookings
            {upcomingBookings.length > 0 && (
              <span className="tab-badge">{upcomingBookings.length}</span>
            )}
          </button>
          <button
            className={`dash-tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            Booking History
          </button>
        </div>

        {/* BOOKING LIST */}
        {loading ? (
          <div className="dashboard-loading">
            <div className="loading-spinner" />
            <p>Loading your bookings...</p>
          </div>
        ) : displayedBookings.length === 0 ? (
          <div className="dashboard-empty">
            <div className="empty-icon">🛏️</div>
            <h3>
              {activeTab === "upcoming"
                ? "No upcoming bookings"
                : "No booking history yet"}
            </h3>
            <p>
              {activeTab === "upcoming"
                ? "Ready for your next stay? Browse our rooms!"
                : "Your completed and cancelled bookings will appear here."}
            </p>
            {activeTab === "upcoming" && (
              <button className="btn-fill" onClick={() => onNavigate("rooms")}>
                Browse Rooms
              </button>
            )}
          </div>
        ) : (
          <div className="booking-cards-list">
            {displayedBookings.map((booking) => {
              const checkIn = new Date(booking.checkIn);
              const checkOut = new Date(booking.checkOut);
              const nights = Math.max(
                1,
                Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)),
              );

              return (
                <div key={booking.reservationId} className="booking-card-item">
                  <div className="booking-card-left">
                    <div className="booking-room-type">{booking.roomType}</div>
                    <div className="booking-room-number">
                      Room {booking.roomNumber}
                    </div>

                    <div className="booking-dates-row">
                      <div className="booking-date-block">
                        <label>Check-in</label>
                        <span>
                          {checkIn.toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="booking-date-arrow">→</div>
                      <div className="booking-date-block">
                        <label>Check-out</label>
                        <span>
                          {checkOut.toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="booking-meta-row">
                      <span className="booking-nights">
                        🌙 {nights} night{nights > 1 ? "s" : ""}
                      </span>
                      <StatusBadge status={booking.status} />
                    </div>
                  </div>

                  <div className="booking-card-right">
                    <div className="booking-price-block">
                      <div className="booking-price">
                        LKR {Number(booking.total_price || 0).toLocaleString()}
                      </div>
                      <div className="booking-price-label">Total Amount</div>
                    </div>

                    <div className="booking-id-label">
                      #{booking.reservationId}
                    </div>

                    {canCancel(booking) && (
                      <button
                        className="btn-cancel-booking"
                        onClick={() => handleCancel(booking.reservationId)}
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
