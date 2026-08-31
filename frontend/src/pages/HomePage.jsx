import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProducts, getCategories, getStoreSettings, getActiveOffers } from "../services/api";
import ProductCard from "../components/ProductCard";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [storeInfo, setStoreInfo] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getProducts({ popular: "true" }),
      getCategories(),
      getStoreSettings(),
      getActiveOffers(),
    ])
      .then(([p, c, s, o]) => {
        if (process.env.NODE_ENV !== "production")
          console.log(
            "HomePage: fetched products",
            Array.isArray(p?.data) ? p.data.length : p?.data,
          );
        setProducts(p.data || []);
        setCategories(c.data || []);
        setStoreInfo(s.data || null);
        setOffers(o.data || []);
      })
      .catch((err) => {
        console.error("HomePage: fetch error", err);
        setProducts([]);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim())
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg-shape" />
        <div className="hero-bg-shape hero-bg-shape-2" />
        <div className="hero-inner">
          <div className="hero-card">
            <span className="hero-badge">✦ Smart Grocery Pre-Order</span>
            <img
              src="/logo.png"
              alt="SPIPick Logo"
              className="hero-logo"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <h1>Save Time. Save Arguments.</h1>
            <div className="hero-subtitle">Wife orders. Husband collects.</div>
            <p className="hero-copy">Order from anywhere. Pick up anytime.</p>
            <div className="hero-actions">
              <Link to="/products" className="btn-white hero-btn">
                Shop Now
              </Link>
              <Link to="/track" className="btn-outline-white hero-btn">
                Track Order
              </Link>
            </div>
          </div>
          <div className="hero-accent">
            <span className="hero-accent-icon">⟡</span>
            <div className="hero-accent-copy">
              Order easier, pickup when you are free.
            </div>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-icon">◈</div>
              <div className="hero-stat-num">1–2</div>
              <div className="hero-stat-label">Minute Pickup</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-icon">◈</div>
              <div className="hero-stat-num">100+</div>
              <div className="hero-stat-label">Grocery Items</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-icon">◈</div>
              <div className="hero-stat-num">Instant</div>
              <div className="hero-stat-label">Order via Phone</div>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Offers */}
      {offers.length > 0 && (
        <section className="offers-section">
          <div className="offers-header">
            <span className="offers-fire">🔥</span>
            <h2>Today's Special Offers</h2>
          </div>
          <div className="offers-scroll">
            {offers.map((offer) => (
              <div key={offer.id} className="offer-card" style={{ backgroundImage: offer.image_url ? `url(${offer.image_url})` : 'none' }}>
                <div className="offer-card-overlay">
                  <h3 className="offer-title">{offer.title}</h3>
                  {offer.description && <p className="offer-desc">{offer.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="how-it-works">
        <div className="section-title">How It Works</div>
        <div className="section-sub">3 simple steps to skip the queue</div>
        <div className="steps-grid">
          {[
            {
              icon: "🛒",
              title: "Browse & Add to Cart",
              desc: "Select products from home, office, or anywhere.",
            },
            {
              icon: "📱",
              title: "Place Your Order",
              desc: "Checkout and get your unique pickup order number.",
            },
            {
              icon: "🤝",
              title: "Share & Collect",
              desc: "Share the order number with anyone. They collect it in minutes.",
            },
          ].map((s, i) => (
            <div className="step-card" key={i}>
              <span className="step-num">{i + 1}</span>
              <span className="step-icon">{s.icon}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Search Bar */}
      <div
        style={{
          background: "white",
          padding: "24px 20px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <form
          onSubmit={handleSearch}
          style={{
            maxWidth: 600,
            margin: "0 auto",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <input
            className="form-input"
            style={{
              borderRadius: 50,
              padding: "12px 20px",
              fontSize: 15,
              flex: "1 1 200px",
            }}
            placeholder="Search for tomatoes, milk, bread..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{
              whiteSpace: "nowrap",
              borderRadius: 50,
              flex: "1 1 100px",
              justifyContent: "center",
            }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Categories */}
      <div className="container">
        <div className="page-section">
          <div
            className="section-title"
            style={{ textAlign: "left", marginBottom: 20, fontSize: 22 }}
          >
            Shop by Category
          </div>
          <div className="categories-scroll">
            {categories.map((cat) => (
              <Link
                to={`/products?category=${cat.id}`}
                key={cat.id}
                className="cat-chip"
              >
                <span className="cat-icon">{cat.icon}</span>
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Popular Products */}
        <div className="page-section" style={{ paddingTop: 0 }}>
          <div
            className="flex items-center justify-between mb-4"
            style={{ marginBottom: 20 }}
          >
            <div
              className="section-title"
              style={{ textAlign: "left", fontSize: 22 }}
            >
              ⭐ Popular Products
            </div>
            <Link
              to="/products"
              className="nav-link"
              style={{ color: "var(--green)", fontWeight: 600 }}
            >
              View All →
            </Link>
          </div>
          {loading ? (
            <div className="spinner" />
          ) : (
            <div className="products-grid">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Store Info */}
      {storeInfo && (
        <section className="store-info-section">
          <div className="section-title">Visit Our Store</div>
          <div className="section-sub">
            Your groceries will be ready and waiting for you
          </div>
          <div className="store-info-grid">
            {[
              { icon: "📍", label: "Address", value: storeInfo.store_address },
              { icon: "📞", label: "Phone", value: storeInfo.store_phone },
              {
                icon: "🕐",
                label: "Store Hours",
                value: storeInfo.store_hours,
              },
              {
                icon: "⚡",
                label: "Pickup Time",
                value: "Ready in 1–2 minutes",
              },
            ].map((info, i) => (
              <div className="store-info-card" key={i}>
                <div className="store-info-icon">{info.icon}</div>
                <div>
                  <div className="store-info-label">{info.label}</div>
                  <div className="store-info-value">{info.value}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="footer">
        <p>
          © 2024 <strong>SPIPick</strong> — Order from anywhere, Pick up in
          minutes.
        </p>
      </footer>
    </div>
  );
}
