import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import CartDrawer from "./CartDrawer";

export default function Navbar() {
  const { count } = useCart();
  const { isLoggedIn, customer, logout } = useCustomerAuth();
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
      setMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo">
            🛒 <span>SPI</span>Pick
          </Link>
          <form className="navbar-search" onSubmit={handleSearch}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search for groceries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <div className="navbar-actions">
            <div className="desktop-links">
              <Link to="/products" className="nav-link">
                Products
              </Link>
              <Link to="/track" className="nav-link">
                Track Order
              </Link>
              <Link to="/groups" className="nav-link">
                Groups
              </Link>
              {isLoggedIn ? (
                <>
                  <Link to="/customer/dashboard" className="nav-link">
                    My Account
                  </Link>
                  <button className="nav-link" onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>
                    Sign Out
                  </button>
                </>
              ) : (
                <Link to="/customer/login" className="nav-link">
                  Sign In
                </Link>
              )}
            </div>
            <button
              className="hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              ☰
            </button>
            <button className="cart-btn" onClick={() => setCartOpen(true)}>
              🛒 <span className="hide-mobile">Cart</span>{" "}
              {count > 0 && <span className="cart-badge">{count}</span>}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="mobile-menu">
            <Link
              to="/products"
              className="nav-link"
              onClick={() => setMenuOpen(false)}
            >
              Products
            </Link>
            <Link
              to="/track"
              className="nav-link"
              onClick={() => setMenuOpen(false)}
            >
              Track Order
            </Link>
            <Link
              to="/groups"
              className="nav-link"
              onClick={() => setMenuOpen(false)}
            >
              Groups
            </Link>
            {isLoggedIn ? (
              <>
                <Link to="/customer/dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>
                  My Account
                </Link>
                <button className="nav-link" onClick={() => { handleLogout(); setMenuOpen(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', textAlign: 'left', padding: '14px 20px', width: '100%' }}>
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/customer/login" className="nav-link" onClick={() => setMenuOpen(false)}>
                Sign In
              </Link>
            )}
          </div>
        )}
      </nav>
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
    </>
  );
}
