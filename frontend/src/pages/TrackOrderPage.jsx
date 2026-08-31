import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { trackOrder } from "../services/api";
import { useStoreSettings } from "../context/StoreContext";
import UpiPaymentBlock from "../components/UpiPaymentBlock";

const STATUS_STEPS = [
  { key: "pending", label: "🕐 Order Placed" },
  { key: "preparing", label: "📦 Preparing" },
  { key: "ready", label: "✅ Ready for Pickup" },
  { key: "collected", label: "🎉 Collected" },
];
const STATUS_ORDER = {
  pending: 0,
  preparing: 1,
  ready: 2,
  collected: 3,
  cancelled: -1,
};

export default function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const [input, setInput] = useState(searchParams.get("order") || "");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { storeSettings, loadingStore } = useStoreSettings();

  useEffect(() => {
    if (searchParams.get("order")) handleTrack(searchParams.get("order"));
  }, []);

  const handleTrack = async (num) => {
    const orderNum = (num || input).trim().toUpperCase();
    if (!orderNum) return;
    setLoading(true);
    setError("");
    try {
      const res = await trackOrder(orderNum);
      setOrder(res.data);
    } catch {
      setError("Order not found. Please check your order number.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const currentStep = order ? (STATUS_ORDER[order.status] ?? 0) : -1;

  const subtotal = order ? parseFloat(order.total_amount) || 0 : 0;
  const discount = order ? parseFloat(order.discount_amount) || 0 : 0;
  const finalTotal = order ? parseFloat(order.final_amount) || 0 : subtotal;

  return (
    <div className="track-page">
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
        📦 Track Your Order
      </h1>
      <p style={{ color: "var(--text2)", marginBottom: 28, fontSize: 15 }}>
        Enter your pickup order number to see the current status.
      </p>

      <div className="track-input-group">
        <input
          className="track-input"
          placeholder="GP-1001"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleTrack()}
        />
        <button
          className="track-btn"
          onClick={() => handleTrack()}
          disabled={loading}
        >
          {loading ? "⏳" : "🔍 Track"}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#ffebee",
            color: "var(--red)",
            padding: "14px 18px",
            borderRadius: 10,
            marginBottom: 20,
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          ❌ {error}
        </div>
      )}

      {order && (
        <div className="order-detail-card">
          <div className="order-detail-header">
            <div className="order-detail-num">{order.order_number}</div>
            <div className="order-detail-time">
              {new Date(order.created_at).toLocaleString("en-IN")}
            </div>
            <div className="order-status-badge">{order.status_display}</div>
          </div>

          <div className="order-detail-body">
            {/* Status */}
            {order.status === "cancelled" ? (
              <div
                style={{
                  background: "#ffebee",
                  color: "var(--red)",
                  padding: "12px 16px",
                  borderRadius: 8,
                  fontWeight: 700,
                  marginBottom: 20,
                }}
              >
                ❌ This order has been cancelled.
              </div>
            ) : (
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--text2)",
                    marginBottom: 12,
                  }}
                >
                  Order Progress
                </div>
                {STATUS_STEPS.map((step, i) => (
                  <div className="timeline-item" key={step.key}>
                    <div
                      className={`timeline-dot${i === currentStep ? " active" : i < currentStep ? " done" : ""}`}
                    />
                    <div
                      className={`timeline-label${i === currentStep ? " active" : ""}`}
                    >
                      {step.label}
                    </div>
                    {i === 2 && currentStep >= 2 && (
                      <span
                        style={{
                          marginLeft: 8,
                          background: "var(--green)",
                          color: "white",
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 50,
                          fontWeight: 700,
                        }}
                      >
                        READY!
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Customer Info */}
            <div className="order-info-grid">
              <div className="order-info-item">
                <label>Customer</label>
                <p>{order.customer_name}</p>
              </div>
              <div className="order-info-item">
                <label>Phone</label>
                <p>{order.customer_phone}</p>
              </div>
              <div className="order-info-item">
                <label>Payment</label>
                <p>{order.payment_method_display}</p>
              </div>
              <div className="order-info-item">
                <label>Payment Status</label>
                <p>{order.payment_status}</p>
              </div>
            </div>

            {/* Items */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                Ordered Items
              </div>
              {order.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid var(--border)",
                    fontSize: 14,
                  }}
                >
                  <span>
                    {item.product_name}{" "}
                    <span style={{ color: "var(--text3)" }}>
                      × {item.quantity}
                    </span>
                  </span>
                  <span style={{ fontWeight: 700 }}>₹{item.subtotal}</span>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  fontSize: 14,
                }}
              >
                <span style={{ color: "var(--text2)" }}>Subtotal</span>
                <span style={{ fontWeight: 700 }}>₹{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    fontSize: 14,
                  }}
                >
                  <span style={{ color: "var(--text2)" }}>Discount</span>
                  <span style={{ fontWeight: 700, color: "var(--green)" }}>
                    -₹{discount.toFixed(2)}
                  </span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderTop: "1px dashed var(--border)",
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                <span>Final Amount</span>
                <span style={{ color: "var(--green)" }}>
                  ₹{finalTotal.toFixed(2)}
                </span>
              </div>
              {discount > 0 && (
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 13,
                    color: "var(--green)",
                    fontWeight: 700,
                    marginTop: 4,
                  }}
                >
                  🎉 You saved ₹{discount}!
                </div>
              )}

              {order.payment_method === "upi" &&
                order.payment_status === "pending" && (
                  <div style={{ marginTop: "20px", textAlign: "center", background: "rgba(33, 150, 243, 0.05)", padding: "16px", borderRadius: "8px" }}>
                    <UpiPaymentBlock
                      storeSettings={storeSettings}
                      loadingStore={loadingStore}
                      finalTotal={finalTotal}
                    />
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
