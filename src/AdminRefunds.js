// src/AdminRefunds.js
import React, { useEffect, useState, useRef } from "react";
import AdminSidebar from "./AdminSidebar";
import AccountAvatarMenu from "./AccountAvatarMenu";
import { getAuthHeaders } from "./auth";
import { showToast } from "./toast";

const STATUS_COLORS = {
  Pending: { bg: "#fff4e0", color: "#a05a00" },
  Processed: { bg: "#e8f8ef", color: "#1a7a3c" },
  Rejected: { bg: "#fef0f0", color: "#c0392b" },
};

function AdminRefunds({ onNavigate, onLogout }) {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Pending"); // Pending | Processed | Rejected | All
  const [updating, setUpdating] = useState(null); // refundId being updated
  const hasFetched = useRef(false);

  // ── Load refunds ───────────────────────────────────────────────────────────
  const loadRefunds = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/admin/refunds", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load refunds");
      setRefunds(data);
    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadRefunds();
  }, []);

  // ── Update refund status ───────────────────────────────────────────────────
  const handleUpdateStatus = async (refundId, newStatus) => {
    setUpdating(refundId);
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/refunds/${refundId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      // Update locally without refetching
      setRefunds((prev) =>
        prev.map((r) =>
          r.refundId === refundId
            ? { ...r, status: newStatus, processedAt: new Date().toISOString() }
            : r,
        ),
      );
      showToast(`Refund marked as ${newStatus}`, "success");
    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
    } finally {
      setUpdating(null);
    }
  };

  // ── Filter + Stats ─────────────────────────────────────────────────────────
  const filtered =
    filter === "All" ? refunds : refunds.filter((r) => r.status === filter);

  const pendingCount = refunds.filter((r) => r.status === "Pending").length;
  const pendingTotal = refunds
    .filter((r) => r.status === "Pending")
    .reduce((sum, r) => sum + Number(r.refundAmount), 0);
  const processedTotal = refunds
    .filter((r) => r.status === "Processed")
    .reduce((sum, r) => sum + Number(r.refundAmount), 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="admin-container">
      <AdminSidebar activePage="refunds" onNavigate={onNavigate} />

      <div className="admin-content">
        {/* Header */}
        <div className="admin-header-row">
          <h2>Refund Management</h2>
          <AccountAvatarMenu
            onNavigate={onNavigate}
            onLogout={onLogout}
            role="Admin"
          />
        </div>

        {/* Stats row */}
        <div className="refund-stats-row">
          <div className="refund-stat-card orange">
            <p className="stat-label">Pending Refunds</p>
            <p className="stat-value">{pendingCount}</p>
            <p className="stat-sub">
              LKR {pendingTotal.toLocaleString()} to pay out
            </p>
          </div>
          <div className="refund-stat-card green">
            <p className="stat-label">Total Processed</p>
            <p className="stat-value">
              {refunds.filter((r) => r.status === "Processed").length}
            </p>
            <p className="stat-sub">
              LKR {processedTotal.toLocaleString()} paid out
            </p>
          </div>
          <div className="refund-stat-card blue">
            <p className="stat-label">Total Refunds</p>
            <p className="stat-value">{refunds.length}</p>
            <p className="stat-sub">All time</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="refund-filter-tabs">
          {["Pending", "Processed", "Rejected", "All"].map((tab) => (
            <button
              key={tab}
              className={`filter-tab ${filter === tab ? "active" : ""}`}
              onClick={() => setFilter(tab)}
            >
              {tab}
              {tab !== "All" && (
                <span className="tab-count">
                  {refunds.filter((r) => r.status === tab).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <p style={{ color: "#888", padding: "20px" }}>Loading refunds...</p>
        ) : filtered.length === 0 ? (
          <div className="empty-refunds">
            <p>
              No {filter === "All" ? "" : filter.toLowerCase()} refunds found.
            </p>
          </div>
        ) : (
          <div className="table-card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Check-in</th>
                  <th>Paid</th>
                  <th>Refund</th>
                  <th>Rate</th>
                  <th>Reason</th>
                  <th>Requested</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const sc = STATUS_COLORS[r.status] || {};
                  return (
                    <tr key={r.refundId}>
                      <td>{r.refundId}</td>
                      <td>
                        <strong>{r.guestName}</strong>
                        <br />
                        <span style={{ fontSize: "12px", color: "#888" }}>
                          {r.guestEmail}
                        </span>
                        <br />
                        <span style={{ fontSize: "12px", color: "#888" }}>
                          {r.guestPhone}
                        </span>
                      </td>
                      <td>{r.roomType}</td>
                      <td>{r.checkIn}</td>
                      <td>LKR {Number(r.paidAmount).toLocaleString()}</td>
                      <td>
                        <strong style={{ color: "#1a3c5e" }}>
                          LKR {Number(r.refundAmount).toLocaleString()}
                        </strong>
                      </td>
                      <td>{Math.round(Number(r.refundRate) * 100)}%</td>
                      <td
                        style={{
                          maxWidth: "140px",
                          fontSize: "13px",
                          color: "#555",
                        }}
                      >
                        {r.reason || "-"}
                      </td>
                      <td style={{ fontSize: "12px", color: "#888" }}>
                        {new Date(r.requestedAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <span
                          className="status-badge"
                          style={{ background: sc.bg, color: sc.color }}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td>
                        {r.status === "Pending" && (
                          <div className="refund-action-btns">
                            <button
                              className="btn-process"
                              disabled={updating === r.refundId}
                              onClick={() =>
                                handleUpdateStatus(r.refundId, "Processed")
                              }
                            >
                              {updating === r.refundId ? "..." : "✓ Processed"}
                            </button>
                            <button
                              className="btn-reject"
                              disabled={updating === r.refundId}
                              onClick={() =>
                                handleUpdateStatus(r.refundId, "Rejected")
                              }
                            >
                              ✕ Reject
                            </button>
                          </div>
                        )}
                        {r.status === "Processed" && (
                          <span style={{ fontSize: "12px", color: "#888" }}>
                            {r.processedAt
                              ? new Date(r.processedAt).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "Done"}
                          </span>
                        )}
                        {r.status === "Rejected" && (
                          <span style={{ fontSize: "12px", color: "#c0392b" }}>
                            Rejected
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminRefunds;
