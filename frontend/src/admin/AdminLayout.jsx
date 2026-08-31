import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { adminLogout } from "../services/api";
import AdminDashboard from "./AdminDashboard";
import AdminOrders from "./AdminOrders";
import AdminProducts from "./AdminProducts";
import AdminSettings from "./AdminSettings";
import AdminOffers from "./AdminOffers";
import toast from "react-hot-toast";

const NAV = [
  { key: "dashboard", icon: "📊", label: "Dashboard" },
  { key: "orders", icon: "📦", label: "Orders" },
  { key: "products", icon: "🛍️", label: "Products" },
  { key: "offers", icon: "📢", label: "Offers" },
  { key: "settings", icon: "⚙️", label: "Settings" },
];

const TITLES = {
  dashboard: "Dashboard",
  orders: "Order Management",
  products: "Product Management",
  offers: "Offers Management",
  settings: "Store Settings",
};

export default function AdminLayout() {
  const { adminName, logout } = useAuth();
  const [active, setActive] = useState("dashboard");

  const handleLogout = async () => {
    try {
      await adminLogout();
    } catch {}
    logout();
    toast.success("Logged out");
  };

  const pages = {
    dashboard: <AdminDashboard />,
    orders: <AdminOrders />,
    products: <AdminProducts />,
    offers: <AdminOffers />,
    settings: <AdminSettings />,
  };

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div className="admin-logo">🛒 SPIPick</div>
        <nav className="admin-nav">
          {NAV.map((n) => (
            <div
              key={n.key}
              className={`admin-nav-item${active === n.key ? " active" : ""}`}
              onClick={() => setActive(n.key)}
            >
              <span className="admin-nav-icon">{n.icon}</span>
              {n.label}
            </div>
          ))}
        </nav>
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 14,
              background: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            🚪 Sign Out
          </button>
        </div>
      </div>

      <div className="admin-main">
        <div className="admin-topbar">
          <h1>{TITLES[active]}</h1>
          <div className="admin-user">
            <div className="admin-avatar">{adminName?.[0]?.toUpperCase()}</div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{adminName}</span>
          </div>
        </div>
        <div className="admin-content">{pages[active]}</div>
      </div>
    </div>
  );
}
