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
    in_stock: true,
    is_popular: true,
    description: "Juicy and ripe tomatoes.",
  },
  {
    id: "sample-2",
    name: "Green Spinach",
    category_name: "Fruits & Vegetables",
    mrp: 25,
    price: 20,
    unit: "250 g",
    stock: 80,
    in_stock: true,
    is_popular: false,
    description: "Fresh leafy spinach.",
  },
  {
    id: "sample-3",
    name: "Bananas",
    category_name: "Fruits & Vegetables",
    mrp: 50,
    price: 45,
    unit: "1 dozen",
    stock: 60,
    in_stock: true,
    is_popular: true,
    description: "Naturally sweet bananas.",
  },
  {
    id: "sample-4",
    name: "Onions",
    category_name: "Fruits & Vegetables",
    mrp: 32,
    price: 25,
    unit: "1 kg",
    stock: 200,
    in_stock: true,
    is_popular: true,
    description: "Fresh red onions.",
  },
  {
    id: "sample-5",
    name: "Amul Full Cream Milk",
    category_name: "Dairy & Eggs",
    mrp: 65,
    price: 60,
    unit: "1 litre",
    stock: 100,
    in_stock: true,
    is_popular: true,
    description: "Fresh farm milk.",
  },
  {
    id: "sample-6",
    name: "Farm Eggs",
    category_name: "Dairy & Eggs",
    mrp: 90,
    price: 80,
    unit: "12 pcs",
    stock: 75,
    in_stock: true,
    is_popular: true,
    description: "Free-range farm eggs.",
  },
  {
    id: "sample-7",
    name: "Amul Butter",
    category_name: "Dairy & Eggs",
    mrp: 60,
    price: 55,
    unit: "100 g",
    stock: 50,
    in_stock: true,
    is_popular: false,
    description: "Creamy salted butter.",
  },
  {
    id: "sample-8",
    name: "Whole Wheat Bread",
    category_name: "Bakery",
    mrp: 45,
    price: 40,
    unit: "400 g",
    stock: 40,
    in_stock: true,
    is_popular: true,
    description: "Soft, whole wheat bread.",
  },
  {
    id: "sample-9",
    name: "Britannia Biscuits",
    category_name: "Snacks",
    mrp: 40,
    price: 35,
    unit: "200 g",
    stock: 120,
    in_stock: true,
    is_popular: true,
    description: "Classic tea-time biscuits.",
  },
  {
    id: "sample-10",
    name: "Lays Chips",
    category_name: "Snacks",
    mrp: 25,
    price: 20,
    unit: "26 g",
    stock: 200,
    in_stock: true,
    is_popular: true,
    description: "Crunchy potato chips.",
  },
  {
    id: "sample-11",
    name: "Tata Tea Premium",
    category_name: "Beverages",
    mrp: 190,
    price: 175,
    unit: "500 g",
    stock: 60,
    in_stock: true,
    is_popular: true,
    description: "Strong, aromatic tea.",
  },
  {
    id: "sample-12",
    name: "Tropicana Orange Juice",
    category_name: "Beverages",
    mrp: 110,
    price: 99,
    unit: "1 litre",
    stock: 45,
    in_stock: true,
    is_popular: false,
    description: "100% pure orange juice.",
  },
  {
    id: "sample-13",
    name: "Basmati Rice",
    category_name: "Grains & Pulses",
    mrp: 135,
    price: 120,
    unit: "1 kg",
    stock: 90,
    in_stock: true,
    is_popular: true,
    description: "Long grain fragrant rice.",
  },
  {
    id: "sample-14",
    name: "Toor Dal",
    category_name: "Grains & Pulses",
    mrp: 155,
    price: 140,
    unit: "1 kg",
    stock: 70,
    in_stock: true,
    is_popular: true,
    description: "Premium toor dal.",
  },
  {
    id: "sample-15",
    name: "Fortune Sunflower Oil",
    category_name: "Oil & Spices",
    mrp: 200,
    price: 180,
    unit: "1 litre",
    stock: 55,
    in_stock: true,
    is_popular: true,
    description: "Pure refined sunflower oil.",
  },
  {
    id: "sample-16",
    name: "MDH Chaat Masala",
    category_name: "Oil & Spices",
    mrp: 50,
    price: 45,
    unit: "100 g",
    stock: 80,
    in_stock: true,
    is_popular: false,
    description: "Tangy chaat seasoning.",
  },
  {
    id: "sample-17",
    name: "Colgate Toothpaste",
    category_name: "Personal Care",
    mrp: 75,
    price: 65,
    unit: "200 g",
    stock: 60,
    in_stock: true,
    is_popular: false,
    description: "Fresh mint toothpaste.",
  },
  {
    id: "sample-18",
    name: "Dove Soap",
    category_name: "Personal Care",
    mrp: 55,
    price: 48,
    unit: "75 g",
    stock: 90,
    in_stock: true,
    is_popular: false,
    description: "Gentle moisturizing soap.",
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
    if (import.meta.env.DEV)
      console.log("ProductsPage: fetching with", params);
    getProducts(params)
      .then((r) => {
        if (import.meta.env.DEV)
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
            import.meta.env.DEV ? (
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
