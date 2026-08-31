import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts, getCategories } from "../services/api";
import ProductCard from "../components/ProductCard";

const DEV_FALLBACK_PRODUCTS = [
  {
    id: "sample-1",
    name: "Fresh Tomatoes",
    category_name: "Fruits & Vegetables",
    mrp: 40,
    price: 30,
    unit: "1 kg",
    stock: 150,
    is_popular: true,
    description: "Juicy and ripe tomatoes.",
  },
  {
    id: "sample-2",
    name: "Amul Full Cream Milk",
    category_name: "Dairy & Eggs",
    mrp: 65,
    price: 60,
    unit: "1 litre",
    stock: 100,
    is_popular: true,
    description: "Fresh farm milk.",
  },
  {
    id: "sample-3",
    name: "Whole Wheat Bread",
    category_name: "Bakery",
    mrp: 45,
    price: 40,
    unit: "400 g",
    stock: 40,
    is_popular: false,
    description: "Soft, whole wheat bread.",
  },
];

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const selectedCategory = searchParams.get("category") || "";
  const searchQuery = searchParams.get("search") || "";

  useEffect(() => {
    getCategories().then((r) => setCategories(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (searchQuery) params.search = searchQuery;
    if (selectedCategory) params.category = selectedCategory;
    if (process.env.NODE_ENV !== "production")
      console.log("ProductsPage: fetching with", params);
    getProducts(params)
      .then((r) => {
        if (process.env.NODE_ENV !== "production")
          console.log(
            "ProductsPage: received",
            Array.isArray(r.data) ? r.data.length : r.data,
          );
        setProducts(r.data || []);
      })
      .catch((err) => {
        console.error("ProductsPage: fetch error", err);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [searchQuery, selectedCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    const p = {};
    if (search.trim()) p.search = search.trim();
    if (selectedCategory) p.category = selectedCategory;
    setSearchParams(p);
  };

  const setCategory = (id) => {
    const p = {};
    if (id) p.category = id;
    if (searchQuery) p.search = searchQuery;
    setSearchParams(p);
  };

  return (
    <div>
      <div className="products-page-header">
        <div className="container">
          <form
            onSubmit={handleSearch}
            style={{ display: "flex", gap: 10, maxWidth: 500 }}
          >
            <input
              className="form-input"
              style={{ borderRadius: 50 }}
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ borderRadius: 50, whiteSpace: "nowrap" }}
            >
              Search
            </button>
            {(searchQuery || selectedCategory) && (
              <button
                type="button"
                className="btn-secondary"
                style={{ borderRadius: 50 }}
                onClick={() => {
                  setSearch("");
                  setSearchParams({});
                }}
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      <div className="products-layout">
        {/* Sidebar */}
        <div className="sidebar-filters">
          <div className="sidebar-section">
            <h3>Categories</h3>
            <div
              className={`filter-option${!selectedCategory ? " active" : ""}`}
              onClick={() => setCategory("")}
            >
              🛒 All Products
            </div>
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`filter-option${selectedCategory === String(cat.id) ? " active" : ""}`}
                onClick={() => setCategory(String(cat.id))}
              >
                {cat.icon} {cat.name}
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 11,
                    background: "var(--border)",
                    padding: "2px 6px",
                    borderRadius: 10,
                    color: "var(--text3)",
                  }}
                >
                  {cat.product_count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Products */}
        <div className="products-main">
          <div
            style={{
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ fontWeight: 700, fontSize: 20 }}>
                {selectedCategory
                  ? categories.find((c) => String(c.id) === selectedCategory)
                      ?.name
                  : "All Products"}
              </span>
              {!loading && (
                <span
                  style={{ color: "var(--text3)", fontSize: 14, marginLeft: 8 }}
                >
                  ({products.length} items)
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="spinner" />
          ) : products.length === 0 ? (
            process.env.NODE_ENV !== "production" ? (
              <div>
                <div
                  style={{
                    textAlign: "center",
                    padding: "24px 20px",
                    color: "var(--text3)",
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 12 }}>
                    🧪 Sample products for testing
                  </div>
                  <p style={{ fontSize: 14, marginTop: 8 }}>
                    Your backend appears empty, so these sample items are shown
                    for local testing.
                  </p>
                </div>
                <div className="products-grid">
                  {DEV_FALLBACK_PRODUCTS.map((p) => (
                    <ProductCard key={p.id} product={p} index={0} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <p className="empty-title">No products found</p>
                <p className="empty-desc">Try a different search or category</p>
              </div>
            )
          ) : (
            <div className="products-grid">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
