import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import { customerOrders, reorder } from "../services/api";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";

const FILTERS = [
  { key: "", label: "Recent" },
  { key: "completed", label: "Completed" },
  { key: "pending", label: "Pending" },
];

export default function CustomerOrdersPage() {
  const { isLoggedIn, logout } = useCustomerAuth();
  const navigate = useNavigate();
  const { setCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [reordering, setReordering] = useState(null);

  // Map completed statuses
  const getStatusFilter = (key) => {
    if (key === "completed") return "collected";
    if (key === "pending") return "pending";
    return "";
  };

  const loadOrders = () => {
    setLoading(true);
    const statusParam = getStatusFilter(filter);
    const params = statusParam ? { status: statusParam } : {};
    customerOrders(params)
      .then((res) => setOrders(res.data))
      .catch(() => { logout(); navigate("/customer/login"); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isLoggedIn) { navigate("/customer/login"); return; }
    loadOrders();
  }, [filter]);

  const handleReorder = async (orderId) => {
    setReordering(orderId);
    try {
      const res = await reorder(orderId);
      const { items, message, details } = res.data;
      const cartItems = items.map((i) => ({
        id: i.product_id,
        name: i.product_name,
        price: parseFloat(i.price),
        quantity: i.quantity,
        stock: i.stock,
      }));
      setCart(cartItems);
      if (message || details?.length) {
        toast(message || "Some products were adjusted based on current stock.", { duration: 4000 });
      }
      navigate("/checkout");
    } catch (err) {
      toast.error(err.response?.data?.error || "Reorder failed");
    } finally {
      setReordering(null);
    }
  };

  return (
    <div className="customer-orders-page">
      <div className="orders-page-header">
        <h1>My Orders</h1>
        <Link to="/customer/dashboard" className="btn-secondary btn-sm">
          Dashboard
        </Link>
      </div>

      <div className="filter-tabs">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`filter-tab ${filter === f.key ? "active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="spinner" />
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders found.</p>
          <Link to="/products" className="btn-primary" style={{ display: 'inline-block', marginTop: 12, padding: '10px 24px', borderRadius: 50 }}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-card-header">
                <span className="order-card-number">{order.order_number}</span>
                <span className={`order-status-badge status-${order.status}`}>
                  {order.status_display}
                </span>
              </div>
              <div className="order-card-meta">
                {new Date(order.created_at).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </div>
              <div className="order-card-items">
                {order.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="order-card-item">
                    {item.product_name} × {item.quantity}
                  </div>
                ))}
                {order.items.length > 3 && (
                  <div className="order-card-more">+{order.items.length - 3} more</div>
                )}
              </div>
              <div className="order-card-pricing">
                <div className="order-card-amounts">
                  <span>₹{order.total_amount}</span>
                  {parseFloat(order.discount_amount) > 0 && (
                    <span className="discount-amount" style={{ color: 'var(--green)', fontSize: 12 }}>
                      -₹{order.discount_amount}
                    </span>
                  )}
                  <span className="final-amount">₹{order.final_amount}</span>
                </div>
              </div>
              <div className="order-card-actions">
                <Link to={`/track?order=${order.order_number}`} className="btn-sm btn-secondary">
                  Track
                </Link>
                <button
                  className="btn-sm btn-primary"
                  onClick={() => handleReorder(order.id)}
                  disabled={reordering === order.id}
                  style={{ background: 'var(--green)', color: 'white', border: 'none' }}
                >
                  {reordering === order.id ? "⏳" : "🔄 Reorder"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
