import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import { customerProfile, customerOrders } from "../services/api";
import toast from "react-hot-toast";

export default function CustomerDashboardPage() {
  const { customer, isLoggedIn, logout } = useCustomerAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { navigate("/customer/login"); return; }
    Promise.all([
      customerProfile(),
      customerOrders(),
    ])
      .then(([p, o]) => {
        setProfile(p.data);
        setOrders(o.data.slice(0, 5));
      })
      .catch(() => { logout(); navigate("/customer/login"); })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    logout();
    toast.success("Logged out");
    navigate("/");
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="customer-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {profile?.name || customer?.name}!</h1>
          <p className="dashboard-sub">
            Mobile: {profile?.mobile || customer?.mobile}
          </p>
        </div>
        <button className="btn-secondary btn-sm" onClick={handleLogout}>
          Sign Out
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card-label">Total Orders</div>
          <div className="stat-card-num green">{profile?.total_orders || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Account Since</div>
          <div className="stat-card-num" style={{ fontSize: 14 }}>
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString("en-IN")
              : "Today"}
          </div>
        </div>
      </div>

      <div className="saved-details-card" style={{ marginBottom: 24 }}>
        <h3>Your Saved Details</h3>
        <div className="saved-details-grid">
          <div>
            <label>Name</label>
            <p>{profile?.name}</p>
          </div>
          <div>
            <label>Mobile</label>
            <p>{profile?.mobile}</p>
          </div>
        </div>
        <p className="saved-details-note">
          These details will be pre-filled when you place an order.
        </p>
      </div>

      <div className="dashboard-section-header">
        <h2>Recent Orders</h2>
        <Link to="/customer/orders" className="btn-sm btn-secondary">
          View All
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders yet.</p>
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
              <div className="order-card-body">
                <span>{new Date(order.created_at).toLocaleDateString("en-IN")}</span>
                <span>₹{order.final_amount}</span>
              </div>
              <div className="order-card-actions">
                <Link to={`/track?order=${order.order_number}`} className="btn-sm btn-secondary">Track</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
