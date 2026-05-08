// src/AdminUserView.js
import React, { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AccountAvatarMenu from "./AccountAvatarMenu";
import { getAuthHeaders } from "./auth";
import { showToast } from "./toast";

function AdminUserView({ onNavigate, onLogout, user }) {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const loadBookings = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(
          `http://localhost:5000/api/admin/users/${user.id}/bookings`,
          {
            headers: {
              ...getAuthHeaders(),
            },
          },
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to load booking history");
        }

        setBookings(data);
      } catch (err) {
        console.error(err);
        showToast(err.message, "error");
      }
    };

    loadBookings();
  }, [user]);

  if (!user) {
    return (
      <div className="admin-container">
        <AdminSidebar activePage="users" onNavigate={onNavigate} />
        <div className="admin-content center-content">
          <div className="admin-header-row admin-user-view-header">
            <button
              className="btn-back"
              onClick={() => onNavigate("admin-users")}
            >
              ← Back to Users
            </button>
            <AccountAvatarMenu
              onNavigate={onNavigate}
              onLogout={onLogout}
              role="Admin"
            />
          </div>
          <p>No user selected.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <AdminSidebar activePage="users" onNavigate={onNavigate} />

      <div className="admin-content center-content">
        <div className="admin-header-row admin-user-view-header">
          <button
            className="btn-back"
            onClick={() => onNavigate("admin-users")}
          >
            ← Back to Users
          </button>
          <AccountAvatarMenu
            onNavigate={onNavigate}
            onLogout={onLogout}
            role="Admin"
          />
        </div>

        <div className="user-profile-card">
          <h3>Profile</h3>
          <div className="profile-details">
            <h2>{user.name}</h2>
            <div className="detail-row">
              <label>Email</label> <span>{user.email}</span>
            </div>
            <div className="detail-row">
              <label>Phone</label> <span>{user.phone}</span>
            </div>
            <div className="detail-row">
              <label>Role</label> <span>{user.role}</span>
            </div>
            <div className="detail-row">
              <label>Status</label> <span>{user.status}</span>
            </div>
          </div>

          <h3>Booking History</h3>
          <table className="mini-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Room Type</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td>{b.room}</td>
                  <td>{new Date(b.checkIn).toLocaleDateString()}</td>
                  <td>{new Date(b.checkOut).toLocaleDateString()}</td>
                  <td>{b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminUserView;
