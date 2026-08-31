import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useStoreSettings } from "../context/StoreContext";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import { customerProfile, createOrder } from "../services/api";
import toast from "react-hot-toast";

export default function CheckoutPage() {
  const { cart, total, clearCart } = useCart();
  const { storeSettings, loadingStore } = useStoreSettings();
  const { customer, isLoggedIn } = useCustomerAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    payment_method: "pickup",
    transaction_id: "",
    notes: "",
  });

  useEffect(() => {
    if (cart.length === 0) navigate("/products");
  }, []);

  useEffect(() => {
    if (isLoggedIn && customer) {
      // Pre-fill name and phone from customer account
      setForm((f) => ({
        ...f,
        name: customer.name || f.name,
        phone: customer.mobile || f.phone,
      }));
      // Try to get latest saved address from profile
      customerProfile().then((res) => {
        // We don't store address on customer, so just use name/phone
      }).catch(() => {});
    }
  }, [isLoggedIn, customer]);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const subtotal = total;
  let discount = 0;
  if (subtotal >= 300) {
    discount = 15;
  } else if (subtotal >= 100) {
    discount = 5;
  }
  const finalTotal = subtotal - discount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address)
      return toast.error("Please fill all required fields");

    setLoading(true);
    try {
      const payload = {
        customer: isLoggedIn && customer ? customer.id : null,
        customer_name: form.name,
        customer_phone: form.phone,
        customer_address: form.address,
        payment_method: form.payment_method,
        transaction_id: form.transaction_id,
        notes: form.notes || "",
        items: cart.map((i) => ({ product_id: i.id, quantity: i.quantity })),
      };
      const res = await createOrder(payload);
      clearCart();
      navigate(`/order-success/${res.data.order_number}`, {
        state: { order: res.data },
      });
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Failed to place order. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) return null;

  return (
    <form onSubmit={handleSubmit}>
      <div className="checkout-layout">
        {/* Left */}
        <div>
          {/* Customer Info */}
          <div className="card">
            <div className="card-title">👤 Your Details</div>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                className="form-input"
                placeholder="Enter your name"
                value={form.name}
                onChange={set("name")}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                className="form-input"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={set("phone")}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Address / Pickup Note *</label>
              <textarea
                className="form-textarea"
                placeholder="Your address or any note for the store..."
                value={form.address}
                onChange={set("address")}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Special Instructions (Optional)
              </label>
              <textarea
                className="form-textarea"
                style={{ minHeight: 60 }}
                placeholder="e.g. ripen bananas, fresh tomatoes..."
                value={form.notes}
                onChange={set("notes")}
              />
            </div>
          </div>

          {/* Payment */}
          <div className="card">
            <div className="card-title">💳 Payment Method</div>
            <div className="payment-options">
              {[
                {
                  value: "upi",
                  icon: "📲",
                  title: "UPI Payment",
                  desc: "Pay via UPI / QR Code",
                },
                {
                  value: "pickup",
                  icon: "🏪",
                  title: "Pay On Pickup",
                  desc: "Pay when you collect",
                },
              ].map((opt) => (
                <div
                  key={opt.value}
                  className={`payment-option${form.payment_method === opt.value ? " selected" : ""}`}
                  onClick={() =>
                    setForm((f) => ({ ...f, payment_method: opt.value }))
                  }
                >
                  <div className="payment-option-icon">{opt.icon}</div>
                  <div className="payment-option-title">{opt.title}</div>
                  <div className="payment-option-desc">{opt.desc}</div>
                </div>
              ))}
            </div>

            {form.payment_method === "upi" && (
              <div
                className="upi-box"
                style={{
                  padding: "16px",
                  background: "rgba(33, 150, 243, 0.1)",
                  border: "1px solid rgba(33, 150, 243, 0.3)",
                  borderRadius: "8px",
                  marginTop: "16px",
                  wordWrap: "break-word",
                }}
              >
                <div style={{ fontSize: "14px", color: "var(--text1)" }}>
                  You have selected UPI Payment.
                  <br />
                  <br />
                  After placing the order, you will be shown a QR code and UPI
                  ID to complete your payment.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right — Order Summary */}
        <div>
          <div className="card" style={{ position: "sticky", top: 80 }}>
            <div className="card-title">🧾 Order Summary</div>
            {cart.map((item) => (
              <div key={item.id} className="order-summary-item">
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text3)" }}>
                    ₹{item.price} × {item.quantity}
                  </div>
                </div>
                <div style={{ fontWeight: 700 }}>
                  ₹{(parseFloat(item.price) * item.quantity).toFixed(0)}
                </div>
              </div>
            ))}
            <div
              className="summary-total"
              style={{ paddingBottom: "8px", marginBottom: 0 }}
            >
              <span
                style={{
                  fontSize: "14px",
                  color: "var(--text2)",
                  fontWeight: 600,
                }}
              >
                Subtotal
              </span>
              <span style={{ fontSize: "14px", fontWeight: 600 }}>
                ₹{subtotal.toFixed(2)}
              </span>
            </div>
            {discount > 0 && (
              <div
                className="summary-total"
                style={{
                  borderTop: "none",
                  margin: 0,
                  paddingTop: 0,
                  paddingBottom: "8px",
                  color: "var(--green)",
                }}
              >
                <span style={{ fontSize: "14px", fontWeight: 600 }}>
                  Discount
                </span>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>
                  -₹{discount.toFixed(2)}
                </span>
              </div>
            )}
            <div
              className="summary-total"
              style={{
                borderTop: "1px dashed var(--border)",
                margin: 0,
                paddingTop: "12px",
              }}
            >
              <span>Final Total</span>
              <span>₹{finalTotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div
                style={{
                  textAlign: "center",
                  fontSize: 13,
                  color: "var(--green)",
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                🎉 You saved ₹{discount} on this order!
              </div>
            )}
            <div
              style={{
                background: "var(--green-light)",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
                color: "var(--green)",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              ⚡ Order ready for pickup in 1–2 minutes after placing
            </div>
            <button
              type="submit"
              className="place-order-btn"
              disabled={loading}
            >
              {loading
                ? "⏳ Placing Order..."
                : "✅ Place Order & Get Pickup Number"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
