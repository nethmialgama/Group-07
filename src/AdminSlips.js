import React, { useEffect, useState, useRef } from "react";
import AdminSidebar from "./AdminSidebar";
import AccountAvatarMenu from "./AccountAvatarMenu";
import { getAuthHeaders } from "./auth";
import { showToast } from "./toast";

function AdminSlips({ onNavigate, onLogout }) {
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null); // For fullscreen preview modal
  const hasFetched = useRef(false);

  const loadSlips = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/admin/pending-slips", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load bank slips");
      setSlips(data);
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
    loadSlips();
  }, []);

  const handleConfirmSlip = async (paymentId, action) => {
    setUpdating(paymentId);
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/confirm-slip/${paymentId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ action }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      // Remove from list or change status
      setSlips((prev) => prev.filter((s) => s.paymentId !== paymentId));
      showToast(`Slip payment ${action}ed successfully!`, "success");
    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="admin-container">
      <AdminSidebar activePage="slips" onNavigate={onNavigate} />

      <div className="admin-content">
        <div className="admin-header-row">
          <h2>Bank Slip Verification</h2>
          <AccountAvatarMenu
            onNavigate={onNavigate}
            onLogout={onLogout}
            role="Admin"
          />
        </div>

        {loading ? (
          <p style={{ color: "#888", padding: "20px" }}>Loading pending slips...</p>
        ) : slips.length === 0 ? (
          <div className="empty-refunds" style={{ textAlign: "center", padding: "40px", background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <p style={{ color: "#64748b", margin: 0, fontSize: "16px" }}>No pending bank slip approvals found.</p>
          </div>
        ) : (
          <div className="table-card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Check-in / Out</th>
                  <th>Amount</th>
                  <th>Uploaded Date</th>
                  <th>Slip Preview</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slips.map((s) => (
                  <tr key={s.paymentId}>
                    <td>{s.paymentId}</td>
                    <td>
                      <strong>{s.guestName}</strong>
                      <br />
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{s.guestEmail}</span>
                      <br />
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{s.guestPhone}</span>
                    </td>
                    <td>
                      <strong>Room {s.roomNumber}</strong>
                      <br />
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{s.roomType}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: "13px" }}>
                        {new Date(s.checkIn).toLocaleDateString()} to {new Date(s.checkOut).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "#1a3c5e" }}>LKR {Number(s.amount).toLocaleString()}</strong>
                    </td>
                    <td style={{ fontSize: "12px", color: "#64748b" }}>
                      {new Date(s.date).toLocaleString()}
                    </td>
                    <td>
                      {s.slip_image ? (
                        <img
                          src={`http://localhost:5000/uploads/${s.slip_image}`}
                          alt="Slip"
                          style={{
                            width: "60px",
                            height: "60px",
                            objectFit: "cover",
                            borderRadius: "4px",
                            cursor: "pointer",
                            border: "1px solid #cbd5e1"
                          }}
                          onClick={() => setSelectedImage(`http://localhost:5000/uploads/${s.slip_image}`)}
                        />
                      ) : (
                        <span style={{ color: "#dc2626", fontSize: "12px" }}>No Image</span>
                      )}
                    </td>
                    <td>
                      <div className="refund-action-btns" style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="btn-process"
                          disabled={updating === s.paymentId}
                          onClick={() => handleConfirmSlip(s.paymentId, "approve")}
                          style={{ background: "#059669", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}
                        >
                          {updating === s.paymentId ? "..." : "Approve"}
                        </button>
                        <button
                          className="btn-reject"
                          disabled={updating === s.paymentId}
                          onClick={() => handleConfirmSlip(s.paymentId, "reject")}
                          style={{ background: "#dc2626", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 99999,
            cursor: "zoom-out"
          }}
        >
          <img
            src={selectedImage}
            alt="Slip Zoom"
            style={{
              maxHeight: "90%",
              maxWidth: "90%",
              borderRadius: "8px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            }}
          />
        </div>
      )}
    </div>
  );
}

export default AdminSlips;
