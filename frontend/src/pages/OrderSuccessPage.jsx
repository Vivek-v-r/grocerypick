import { useParams, useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { trackOrder } from "../services/api";
import { useStoreSettings } from "../context/StoreContext";
import UpiPaymentBlock from "../components/UpiPaymentBlock";
import toast from "react-hot-toast";

const STATUS_STEPS = [
  {
    key: "pending",
    label: "🕐 Order Placed",
    desc: "Your order has been received",
  },
  {
    key: "preparing",
    label: "📦 Preparing",
    desc: "Store is packing your groceries",
  },
  {
    key: "ready",
    label: "✅ Ready for Pickup",
    desc: "Your order is packed and ready!",
  },
  {
    key: "collected",
    label: "🎉 Collected",
    desc: "Order completed successfully",
  },
];

const STATUS_ORDER = { pending: 0, preparing: 1, ready: 2, collected: 3 };

export default function OrderSuccessPage() {
  const { orderNumber } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const { storeSettings, loadingStore } = useStoreSettings();

  useEffect(() => {
    if (!order) {
      trackOrder(orderNumber)
        .then((r) => setOrder(r.data))
        .finally(() => setLoading(false));
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(orderNumber);
    toast.success("Order number copied!");
  };

  const handleWhatsApp = () => {
    const msg = `🛒 My SPIPick Order Number: *${orderNumber}*\n\nPlease collect my groceries using this order number.\n\nTrack: ${window.location.origin}/track`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loading) return <div className="spinner" />;
  if (!order)
    return (
      <div style={{ textAlign: "center", padding: 60 }}>Order not found.</div>
    );

  const currentStep = STATUS_ORDER[order.status] ?? 0;

  const subtotal = order ? parseFloat(order.total_amount) || 0 : 0;
  const discount = order ? parseFloat(order.discount_amount) || 0 : 0;
  const finalTotal = order ? parseFloat(order.final_amount) || 0 : subtotal;

  return (
    <div className="success-page">
      <div className="success-card">
        <div className="success-icon">🎉</div>
        <div className="success-title">Order Placed!</div>
        <div className="success-sub">
          Your groceries are being prepared.
          <br />
          Share this number with whoever will collect them.
        </div>

        <div className="order-number-box">
          <div className="order-number-label">Your Pickup Order Number</div>
          <div className="order-number-value">{order.order_number}</div>
        </div>

        <div
          style={{
            background: "#fff8e1",
            border: "1px solid #ffe082",
            color: "#d84315",
            padding: "16px",
            borderRadius: "8px",
            marginBottom: "24px",
            fontSize: "14px",
            textAlign: "left",
            lineHeight: "1.5",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "8px",
              fontSize: "15px",
            }}
          >
            ⚠️ IMPORTANT
          </div>
          <div>
            Take a screenshot or remember this pickup code.
            <br />
            You may not be able to view this code again after leaving this page.
            <br />
            This code is required to collect your order from the store.
          </div>
        </div>

        {order.payment_method === "upi" &&
          order.payment_status === "pending" && (
            <div style={{ marginBottom: "24px", textAlign: "center", width: "100%" }}>
              <UpiPaymentBlock
                storeSettings={storeSettings}
                loadingStore={loadingStore}
                finalTotal={finalTotal}
              />
            </div>
          )}

        <div className="share-actions">
          <button className="share-btn share-whatsapp" onClick={handleWhatsApp}>
            💬 Share on WhatsApp
          </button>
          <button className="share-btn share-copy" onClick={handleCopy}>
            📋 Copy Number
          </button>
        </div>

        {/* Status Timeline */}
        <div className="status-timeline" style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 12,
              color: "var(--text2)",
            }}
          >
            Order Status
          </div>
          {STATUS_STEPS.filter((s) => s.key !== "cancelled").map((step, i) => (
            <div className="timeline-item" key={step.key}>
              <div
                className={`timeline-dot${i === currentStep ? " active" : i < currentStep ? " done" : ""}`}
              />
              <div
                className={`timeline-label${i === currentStep ? " active" : ""}`}
              >
                {step.label}
                {i === currentStep && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text3)",
                      display: "block",
                      fontWeight: 400,
                    }}
                  >
                    {step.desc}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Order details */}
        <div
          style={{
            background: "var(--bg)",
            borderRadius: 10,
            padding: "14px 16px",
            fontSize: 14,
            marginBottom: 20,
            textAlign: "left",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span style={{ color: "var(--text2)" }}>Customer</span>
            <span style={{ fontWeight: 600 }}>{order.customer_name}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span style={{ color: "var(--text2)" }}>Payment</span>
            <span style={{ fontWeight: 600 }}>
              {order.payment_method_display}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: discount > 0 ? 6 : 0,
            }}
          >
            <span style={{ color: "var(--text2)" }}>Subtotal</span>
            <span style={{ fontWeight: 600 }}>₹{subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span style={{ color: "var(--text2)" }}>Discount</span>
              <span style={{ fontWeight: 600, color: "var(--green)" }}>
                -₹{discount.toFixed(2)}
              </span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px dashed var(--border)",
              paddingTop: 8,
              marginTop: 8,
            }}
          >
            <span style={{ color: "var(--text2)" }}>Final Amount</span>
            <span
              style={{ fontWeight: 800, fontSize: 16, color: "var(--green)" }}
            >
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
                marginTop: 12,
              }}
            >
              🎉 You saved ₹{discount} on this order!
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link
            to={`/track?order=${orderNumber}`}
            className="btn-primary"
            style={{ flex: 1, justifyContent: "center", borderRadius: 50 }}
          >
            Track Order
          </Link>
          <Link
            to="/products"
            className="btn-secondary"
            style={{
              flex: 1,
              textAlign: "center",
              padding: "10px",
              borderRadius: 50,
            }}
          >
            Shop More
          </Link>
        </div>
      </div>
    </div>
  );
}
