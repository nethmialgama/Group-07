// src/AdminDashboard.js
import React from 'react';
import AdminSidebar from './AdminSidebar'; // <--- Import the new sidebar

function AdminDashboard({ onNavigate }) {
  const stats = [
    { title: "Rooms", value: "45", icon: "🛏️" },
    { title: "Bookings", value: "128", icon: "📅" },
    { title: "Users", value: "450", icon: "👤" },
    { title: "Revenue", value: "LKR 2,450,000", icon: "💰" },
  ];

  const recentBookings = [
    { id: "#1024", guest: "Nethmi", room: "Deluxe-Double", in: "Jun 15", out: "Jun 18" },
    { id: "#1025", guest: "Yasas", room: "Suite", in: "Aug 25", out: "Aug 30" },
  ];

  return (
    <div className="admin-container">
      {/* USE THE NEW SHARED SIDEBAR */}
      <AdminSidebar activePage="dashboard" onNavigate={onNavigate} />

      {/* Main Content */}
      <div className="admin-content">
        <div className="admin-header-row">
          <h2>Admin Dashboard</h2>
          <div className="admin-user-profile">
            <span className="user-icon">👤</span> Admin
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon-box">{stat.icon}</div>
              <div className="stat-info">
                <p>{stat.title}</p>
                <h3>{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>
        
        {/* Charts and Tables... (Keep the rest of your dashboard code here) */}
        <div className="charts-section">
             {/* ... (Your Chart Code) ... */}
             <div className="chart-card line-chart-box">
                <h3>Bookings per month</h3>
                {/* SVG Chart Placeholder */}
                <div style={{height: '150px', background: '#f9f9f9', display: 'flex', alignItems:'center', justifyContent:'center', color:'#aaa'}}>Chart Area</div>
             </div>
             <div className="chart-card pie-chart-box">
                <h3>Revenue</h3>
                <div style={{height: '150px', background: '#f9f9f9', display: 'flex', alignItems:'center', justifyContent:'center', color:'#aaa'}}>Pie Chart Area</div>
             </div>
        </div>

        <div className="bottom-dashboard-row">
          <div className="dashboard-card table-card">
            <h3>Recent Bookings</h3>
            <table className="mini-table">
              <thead>
                <tr>
                  <th>id</th><th>Guest</th><th>Room</th><th>Check-in</th><th>Check-out</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td>{b.id}</td><td>{b.guest}</td><td>{b.room}</td><td>{b.in}</td><td>{b.out}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;