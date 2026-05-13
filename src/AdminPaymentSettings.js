import React, { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AccountAvatarMenu from "./AccountAvatarMenu";
import { getAuthHeaders } from "./auth";
import { showToast } from "./toast";

const DEFAULT_GATEWAYS = [
  { provider: "card", isEnabled: true, config: { providerName: "Stripe" } },
  { provider: "bank", isEnabled: false, config: { accountNumber: "" } },
];

function AdminPaymentSettings({ onNavigate, onLogout }) {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadGateways = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/payment-gateways",
        {
          headers: {
            ...getAuthHeaders(),
          },
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load payment gateways");
      }

      if (!data.length) {
        setGateways(DEFAULT_GATEWAYS);
      } else {
        setGateways(data);
      }
    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
      setGateways(DEFAULT_GATEWAYS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGateways();
  }, []);

  const updateGateway = async (gateway) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/payment-gateways/${gateway.provider}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            isEnabled: gateway.isEnabled,
            config: gateway.config,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update gateway");
      }

      showToast(`${gateway.provider} settings saved`, "success");
    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
    }
  };

  return (
    <div className="admin-container">
      <AdminSidebar activePage="payments" onNavigate={onNavigate} />
      <div className="admin-content">
        <div className="admin-header-row">
          <h2>Payment Gateway Settings</h2>
          <AccountAvatarMenu
            onNavigate={onNavigate}
            onLogout={onLogout}
            role="Admin"
          />
        </div>

        {loading ? (
          <p>Loading gateways...</p>
        ) : (
          <div className="table-card">
            {gateways.map((gateway) => (
              <div
                key={gateway.provider}
                style={{ borderBottom: "1px solid #eee", padding: "16px 0" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3 style={{ textTransform: "capitalize", margin: 0 }}>
                    {gateway.provider}
                  </h3>
                  <label
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <input
                      type="checkbox"
                      checked={!!gateway.isEnabled}
                      onChange={(e) => {
                        const next = gateways.map((g) =>
                          g.provider === gateway.provider
                            ? { ...g, isEnabled: e.target.checked }
                            : g,
                        );
                        setGateways(next);
                      }}
                    />
                    Enabled
                  </label>
                </div>

                <textarea
                  rows={3}
                  style={{ width: "100%", marginTop: 10 }}
                  value={JSON.stringify(gateway.config || {}, null, 2)}
                  onChange={(e) => {
                    let parsed = {};
                    try {
                      parsed = JSON.parse(e.target.value || "{}");
                    } catch (err) {
                      return;
                    }

                    const next = gateways.map((g) =>
                      g.provider === gateway.provider
                        ? { ...g, config: parsed }
                        : g,
                    );
                    setGateways(next);
                  }}
                />

                <div style={{ marginTop: 10 }}>
                  <button
                    className="btn-blue"
                    onClick={() => updateGateway(gateway)}
                  >
                    Save {gateway.provider}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPaymentSettings;
