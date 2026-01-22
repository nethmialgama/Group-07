// src/AdminUserView.js
import React from 'react';

function AdminUserView({ onNavigate }) {
  // Mock Data for the selected user
  const user = {
    name: "Nethmi Algama",
    email: "nethmi@gmail.com",
    phone: "0771234567",
    role: "User",
    status: "Active"
  };

  const bookings = [
    { id: "B120", room: "Deluxe Double", checkIn: "Oct 15", checkOut: "Oct 18", status: "Completed" },
    { id: "B121", room: "Family Suite", checkIn: "Nov 3", checkOut: "Nov 6", status: "Cancelled" },
  ];

return (
    <div className="admin-container">
      {/* UPDATED SIDEBAR WITH ICONS */}
      <div className="admin-sidebar">
        <div className="admin-logo-box"><span className="logo-tag">Logo</span> SMART HOTEL</div>
        <ul className="admin-menu">
          <li onClick={() => onNavigate('admin-dashboard')}>
            <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            Dashboard
          </li>
          <li onClick={() => onNavigate('admin-rooms')}>
            <svg viewBox="0 0 24 24" fill="none"><path d="M2 22h20"></path><path d="M20 22V10a2 2 0 0 0-2-2h-2.12a2 2 0 0 1-1.93-1.38l-.55-1.8A2 2 0 0 0 11.47 3h-3.94a2 2 0 0 0-1.93 1.82l-.55 1.8a2 2 0 0 1-1.93 1.38H6a2 2 0 0 0-2 2v12"></path><path d="M5 22v-5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5"></path></svg>
            Room Management
          </li>
          <li className="active" onClick={() => onNavigate('admin-users')}>
             <svg viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
             User Management
          </li>
          <li onClick={() => onNavigate('home')} className="logout-btn">
             <svg viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
             Logout
          </li>
        </ul>
      </div>

      <div className="admin-content center-content">
         <button className="btn-back" onClick={() => onNavigate('admin-users')}>← Back to Users</button>
         
         <div className="user-profile-card">
            <h3>Profile</h3>
            <div className="profile-details">
               <h2>{user.name}</h2>
               <div className="detail-row"><label>Email</label> <span>{user.email}</span></div>
               <div className="detail-row"><label>Phone</label> <span>{user.phone}</span></div>
               <div className="detail-row"><label>Role</label> <span>{user.role}</span></div>
               <div className="detail-row"><label>Status</label> <span>{user.status}</span></div>
            </div>

            <h3>Booking History</h3>
            <table className="mini-table">
              <thead>
                <tr>
                   <th>Booking ID</th><th>Room Type</th><th>Check-in</th><th>Check-out</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                   <tr key={b.id}>
                      <td>{b.id}</td>
                      <td>{b.room}</td>
                      <td>{b.checkIn}</td>
                      <td>{b.checkOut}</td>
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