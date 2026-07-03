// src/AdminSidebar.js
import React from "react";

function AdminSidebar({ activePage, onNavigate }) {
  return (
    <div className="admin-sidebar">
      {/* Empty top box - no logo or text */}
      <div className="admin-logo-box"></div>

      <ul className="admin-menu">
        {/* DASHBOARD */}
        <li
          className={activePage === "dashboard" ? "active" : ""}
          onClick={() => onNavigate("admin-dashboard")}
        >
          <img
            src="/images/dashboard.png"
            alt="Dashboard"
            className="menu-icon"
          />
          Dashboard
        </li>

        {/* ROOMS */}
        <li
          className={activePage === "rooms" ? "active" : ""}
          onClick={() => onNavigate("admin-rooms")}
        >
          <img src="/images/rooms.png" alt="Rooms" className="menu-icon" />
          Room Management
        </li>

        {/* USERS */}
        <li
          className={activePage === "users" ? "active" : ""}
          onClick={() => onNavigate("admin-users")}
        >
          <img src="/images/users.png" alt="Users" className="menu-icon" />
          User Management
        </li>

        {/* REFUNDS / BOOKINGS */}
        <li
          className={activePage === "refunds" ? "active" : ""}
          onClick={() => onNavigate("admin-refunds")}
        >
          <img src="/images/refunds.png" alt="Refunds" className="menu-icon" />
          Refund Management
        </li>

        {/* SLIPS */}
        <li
          className={activePage === "slips" ? "active" : ""}
          onClick={() => onNavigate("admin-slips")}
        >
          <img src="/images/slip.png" alt="Slips" className="menu-icon" />
          Slip Verification
        </li>
      </ul>
    </div>
  );
}

export default AdminSidebar;
