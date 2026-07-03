// src/AdminDashboard.js
import React, { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AccountAvatarMenu from "./AccountAvatarMenu";
import { getAuthHeaders } from "./auth";
import { showToast } from "./toast";

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
  const [stats, setStats] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [revenueByRoomType, setRevenueByRoomType] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
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
        const monthlyDataRes = await monthlyRes.json();
        const revenueRoomData = await revenueRoomRes.json();

        setStats([
          {
            title: "Rooms",
            value: String(statsData.rooms || 0),
            icon: "/images/rooms.png",
          },
          {
            title: "Bookings",
            value: String(statsData.bookings || 0),
            icon: "/images/bookings.png",
          },
          {
            title: "Users",
            value: String(statsData.users || 0),
            icon: "/images/users.png",
          },
          {
            title: "Revenue",
            value: `LKR ${Number(statsData.revenue || 0).toLocaleString()}`,
            icon: "/images/revenue.png",
          },
        ]);

        setRecentBookings(
          bookingsData.map((item) => ({
            id: `#${item.reservationId}`,
            guest: item.guest || item.name,
            room: item.roomType,
            in: new Date(item.checkIn).toLocaleDateString(),
            out: new Date(item.checkOut).toLocaleDateString(),
            totalPrice: item.total_price != null ? Number(item.total_price) : null,
            paymentMethod: item.payment_method || null,
          })),
        );

        setMonthlyData(monthlyDataRes);
        setRevenueByRoomType(revenueRoomData);
      } catch (err) {
        console.error(err);
        showToast("Failed to load dashboard data", "error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Charts Data (same as before)
  const lineData = {
    labels: monthlyData.map((item) => item.month),
    datasets: [
      {
        label: "Bookings",
        data: monthlyData.map((item) => item.count),
        borderColor: "#8B5CF6",
        backgroundColor: "rgba(139, 92, 246, 0.15)",
        tension: 0.4,
        fill: true,
        yAxisID: "y",
      },
      {
        label: "Revenue (LKR)",
        data: monthlyData.map((item) => item.revenue || 0),
        borderColor: "#4C1D95",
        backgroundColor: "rgba(76, 29, 149, 0.15)",
        tension: 0.4,
        fill: true,
        yAxisID: "y1",
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "Bookings & Revenue Trend",
        font: { size: 16 },
      },
    },
    scales: {
      y: {
        type: "linear",
        position: "left",
        title: { display: true, text: "Bookings" },
      },
      y1: {
        type: "linear",
        position: "right",
        grid: { drawOnChartArea: false },
        title: { display: true, text: "Revenue (LKR)" },
      },
    },
  };

  const totalRevenue = revenueByRoomType.reduce(
    (sum, item) => sum + Number(item.revenue || 0),
    0,
  );

  const pieData = {
    labels: revenueByRoomType.map((item) => item.roomType),
    datasets: [
      {
        data: revenueByRoomType.map((item) => Number(item.revenue || 0)),
        backgroundColor: [
          "#8B5CF6",
          "#A78BFA",
          "#C4B5FD",
          "#6D28D9",
          "#4C1D95",
        ],
        borderColor: "#ffffff",
        borderWidth: 3,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { padding: 20, usePointStyle: true },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw;
            const percentage = totalRevenue
              ? ((value / totalRevenue) * 100).toFixed(1)
              : 0;
            return ` LKR ${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
      title: {
        display: true,
        text: `Revenue by Room Type (Total: LKR ${totalRevenue.toLocaleString()})`,
        font: { size: 16 },
      },
    },
  };

  return (
    <div className="admin-container">
      <AdminSidebar activePage="dashboard" onNavigate={onNavigate} />

      <div className="admin-content">
        <div className="admin-quick-nav">
          <div className="admin-quick-brand" onClick={() => onNavigate("home")}>
            <img
              className="brand-logo-img"
              src="/images/logo.png"
              alt="CEYLONO"
            />
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

        {/* Stats Grid with Images */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon-box">
                <img src={stat.icon} alt={stat.title} className="stat-image" />
              </div>
              <div className="stat-info">
                <p>{stat.title}</p>
                <h3>{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="charts-section">
          <div className="chart-card line-chart-box">
            <h3>Bookings & Revenue Trend</h3>
            <div style={{ height: "360px" }}>
              {loading ? (
                <div className="chart-loading">Loading trend data...</div>
              ) : monthlyData.length > 0 ? (
                <Line data={lineData} options={lineOptions} />
              ) : (
                <div className="chart-empty">
                  No monthly data available yet.
                </div>
              )}
            </div>
          </div>

          <div className="chart-card pie-chart-box">
            <h3>Revenue by Room Type</h3>
            <div style={{ height: "360px" }}>
              {loading ? (
                <div className="chart-loading">
                  Loading revenue distribution...
                </div>
              ) : revenueByRoomType.length > 0 ? (
                <Pie data={pieData} options={pieOptions} />
              ) : (
                <div className="chart-empty">
                  No revenue data available yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bottom-dashboard-row">
          <div className="dashboard-card table-card">
            <h3>Recent Bookings</h3>
            <table className="mini-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Total Paid</th>
                  <th>Payment</th>
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
                    <td>
                      {b.totalPrice != null
                        ? `LKR ${b.totalPrice.toLocaleString()}`
                        : "-"}
                    </td>
                    <td>
                      {b.paymentMethod ? (
                        <span
                          className={`payment-badge ${
                            b.paymentMethod === "Cash"
                              ? "payment-badge-cash"
                              : "payment-badge-slip"
                          }`}
                        >
                          {b.paymentMethod}
                        </span>
                      ) : (
                        <span className="payment-badge payment-badge-none">—</span>
                      )}
                    </td>
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
