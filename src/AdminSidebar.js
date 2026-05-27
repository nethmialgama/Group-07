// src/AdminSidebar.js
import React from "react";

function AdminSidebar({ activePage, onNavigate }) {
  return (
    <div className="admin-sidebar">
      <div className="admin-logo-box">
        <img className="brand-logo-img" src="/images/logo.png" alt="CEYLONO" />
        <span className="brand-logo-text">CEYLONO</span>
      </div>

      <ul className="admin-menu">
        {/* DASHBOARD */}
        <li
          className={activePage === "dashboard" ? "active" : ""}
          onClick={() => onNavigate("admin-dashboard")}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          Dashboard
        </li>

        {/* ROOMS */}
        <li
          className={activePage === "rooms" ? "active" : ""}
          onClick={() => onNavigate("admin-rooms")}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 22h20"></path>
            <path d="M20 22V10a2 2 0 0 0-2-2h-2.12a2 2 0 0 1-1.93-1.38l-.55-1.8A2 2 0 0 0 11.47 3h-3.94a2 2 0 0 0-1.93 1.82l-.55 1.8a2 2 0 0 1-1.93 1.38H6a2 2 0 0 0-2 2v12"></path>
            <path d="M5 22v-5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5"></path>
          </svg>
          Room Management
        </li>

        {/* USERS */}
        <li
          className={activePage === "users" ? "active" : ""}
          onClick={() => onNavigate("admin-users")}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          User Management
        </li>

        {/* REFUNDS */}
        <li
          className={activePage === "refunds" ? "active" : ""}
          onClick={() => onNavigate("admin-refunds")}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
            <path d="M12 7v5l4 2"></path>
          </svg>
          Refund Management
        </li>
      </ul>
    </div>
  );
}

export default AdminSidebar;
