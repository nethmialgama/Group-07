// src/AdminDashboard.js
import React, { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AccountAvatarMenu from "./AccountAvatarMenu";
import { getAuthHeaders } from "./auth";
import { showToast } from "./toast";

// Import Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

function AdminDashboard({ onNavigate, onLogout }) {
  const [stats, setStats] = useState([
    { title: "Rooms", value: "0", icon: "🛏️" },
    { title: "Bookings", value: "0", icon: "📅" },
    { title: "Users", value: "0", icon: "👤" },
    { title: "Revenue", value: "LKR 0", icon: "💰" },
  ]);

  const [recentBookings, setRecentBookings] = useState([]);
  const [monthlyBookings, setMonthlyBookings] = useState([]);
  const [revenueByRoomType, setRevenueByRoomType] = useState([]);

  // Load all dashboard data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, bookingsRes, monthlyRes, revenueRoomRes] =
          await Promise.all([
            fetch("http://localhost:5000/api/admin/stats", {
              headers: getAuthHeaders(),
            }),
            fetch("http://localhost:5000/api/admin/recent-bookings", {
              headers: getAuthHeaders(),
            }),
            fetch("http://localhost:5000/api/admin/bookings-monthly", {
              headers: getAuthHeaders(),
            }),
            fetch("http://localhost:5000/api/admin/revenue-by-room-type", {
              headers: getAuthHeaders(),
            }),
          ]);

        const statsData = await statsRes.json();
        const bookingsData = await bookingsRes.json();
        const monthlyData = await monthlyRes.json();
        const revenueRoomData = await revenueRoomRes.json();

        // Update stats
        setStats([
          { title: "Rooms", value: String(statsData.rooms || 0), icon: "🛏️" },
          {
            title: "Bookings",
            value: String(statsData.bookings || 0),
            icon: "📅",
          },
          { title: "Users", value: String(statsData.users || 0), icon: "👤" },
          {
            title: "Revenue",
            value: `LKR ${Number(statsData.revenue || 0).toLocaleString()}`,
            icon: "💰",
          },
        ]);

        setRecentBookings(
          bookingsData.map((item) => ({
            id: `#${item.reservationId}`,
            guest: item.guest || item.name,
            room: item.roomType,
            in: new Date(item.checkIn).toLocaleDateString(),
            out: new Date(item.checkOut).toLocaleDateString(),
          })),
        );

        setMonthlyBookings(monthlyData);
        setRevenueByRoomType(revenueRoomData || []);
      } catch (err) {
        console.error(err);
        showToast(err.message || "Failed to load dashboard data", "error");
      }
    };

    loadData();
  }, []);

  // Bookings Per Month - Line Chart
  const bookingsLineData = {
    labels: monthlyBookings.map((item) => item.month),
    datasets: [
      {
        label: "Bookings",
        data: monthlyBookings.map((item) => item.count),
        borderColor: "#c9a84c",
        backgroundColor: "rgba(201, 168, 76, 0.2)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Bookings Per Month" },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  // Revenue by Room Type - Pie Chart
  const pieData = {
    labels: revenueByRoomType.map((item) => item.roomType || item.room_type),
    datasets: [
      {
        data: revenueByRoomType.map((item) =>
          Number(item.revenue || item.total_revenue || 0),
        ),
        backgroundColor: [
          "#c9a84c",
          "#1a1a2e",
          "#4a90e2",
          "#e94b3c",
          "#2ecc71",
          "#9b59b6",
          "#f1c40f",
          "#34495e",
        ],
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
      title: { display: true, text: "Revenue by Room Type" },
    },
  };

  return (
    <div className="admin-container">
      <AdminSidebar activePage="dashboard" onNavigate={onNavigate} />

      <div className="admin-content">
        <div className="admin-quick-nav">
          <div
            className="admin-quick-brand"
            onClick={() => onNavigate("home")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onNavigate("home");
            }}
          >
            <img
              className="brand-logo-img"
              src="/images/logo.png"
              alt="CEYLONO"
            />
            <span className="brand-logo-text">CEYLONO</span>
          </div>
          <div className="admin-quick-links">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("home");
              }}
            >
              Home
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("rooms");
              }}
            >
              Rooms
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("offers");
              }}
            >
              Offers
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("gallery");
              }}
            >
              Gallery
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("contact");
              }}
            >
              Contact
            </a>
          </div>
        </div>

        <div className="admin-header-row">
          <h2>Admin Dashboard</h2>
          <AccountAvatarMenu
            onNavigate={onNavigate}
            onLogout={onLogout}
            role="Admin"
          />
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

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-card line-chart-box">
            <h3>Bookings per month</h3>
            <div style={{ height: "320px" }}>
              {monthlyBookings.length > 0 ? (
                <Line data={bookingsLineData} options={lineOptions} />
              ) : (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#aaa",
                  }}
                >
                  Loading bookings chart...
                </div>
              )}
            </div>
          </div>

          <div className="chart-card pie-chart-box">
            <h3>Revenue by Room Type</h3>
            <div style={{ height: "320px" }}>
              {revenueByRoomType.length > 0 ? (
                <Pie data={pieData} options={pieOptions} />
              ) : (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#aaa",
                  }}
                >
                  Loading revenue distribution...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Bookings Table */}
        <div className="bottom-dashboard-row">
          <div className="dashboard-card table-card">
            <h3>Recent Bookings</h3>
            <table className="mini-table">
              <thead>
                <tr>
                  <th>id</th>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td>{b.guest}</td>
                    <td>{b.room}</td>
                    <td>{b.in}</td>
                    <td>{b.out}</td>
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
