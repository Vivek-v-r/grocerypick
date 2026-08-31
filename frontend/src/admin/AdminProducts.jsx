import { useState, useEffect, useRef } from "react";
import {
  adminGetProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  getCategories,
} from "../services/api";
import toast from "react-hot-toast";

const EMPTY = {
  name: "",
  category: "",
  price: "",
  mrp: "",
  unit: "1 kg",
  stock: "",
  description: "",
  is_popular: false,
  is_active: true,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const load = () => {
    setLoading(true);
    Promise.all([adminGetProducts(), getCategories()])
      .then(([p, c]) => {
        if (process.env.NODE_ENV !== "production")
          console.log(
            "AdminProducts: loaded",
            Array.isArray(p.data) ? p.data.length : p.data,
          );
        setProducts(p.data || []);
        setCategories(c.data || []);
      })
      .catch((err) => {
        console.error("AdminProducts: load error", err);
        setProducts([]);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setImageFile(null);
    setImagePreview("");
    setShowModal(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      category: p.category || "",
      mrp: p.mrp || "",
      price: p.price,
      unit: p.unit,
      stock: p.stock,
      description: p.description,
      is_popular: p.is_popular,
      is_active: p.is_active,
    });
    setImageFile(null);
    setImagePreview(p.image_url || "");
    setShowModal(true);
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "category" && !v) return;
        fd.append(k, v);
      });
      if (imageFile) fd.append("image", imageFile);
      if (editing) await adminUpdateProduct(editing.id, fd);
      else await adminCreateProduct(fd);
      toast.success(editing ? "Product updated!" : "Product added!");
      setShowModal(false);
      load();
    } catch (err) {
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Deactivate this product?")) return;
    await adminDeleteProduct(id);
    toast.success("Product deactivated");
    load();
  };

  const set = (f) => (e) =>
    setForm((prev) => ({
      ...prev,
      [f]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  return (
    <div>
      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <h2>
            Products{" "}
            {!loading && (
              <span
                style={{ fontSize: 14, color: "var(--text3)", fontWeight: 500 }}
              >
                ({products.length})
              </span>
            )}
          </h2>
          <button className="btn-primary" onClick={openAdd}>
            + Add Product
          </button>
        </div>
        {loading ? (
          <div className="spinner" />
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Unit</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 8,
                        background: "var(--bg)",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 24,
                      }}
                    >
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        "🛍️"
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    {p.is_popular && (
                      <span
                        style={{
                          fontSize: 11,
                          background: "var(--orange-light)",
                          color: "var(--orange)",
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontWeight: 600,
                        }}
                      >
                        ⭐ Popular
                      </span>
                    )}
                  </td>
                  <td style={{ color: "var(--text2)" }}>{p.category_name}</td>
                  <td>
                    <strong>₹{p.price}</strong>
                  </td>
                  <td style={{ color: "var(--text3)" }}>{p.unit}</td>
                  <td>
                    <span
                      style={{
                        fontWeight: 700,
                        color:
                          p.stock === 0
                            ? "var(--red)"
                            : p.stock < 10
                              ? "var(--orange)"
                              : "var(--green)",
                      }}
                    >
                      {p.stock === 0 ? "Out of Stock" : p.stock}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${p.is_active ? "badge-ready" : "badge-cancelled"}`}
                    >
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="status-actions">
                      <button
                        className="btn-sm btn-preparing"
                        onClick={() => openEdit(p)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn-sm btn-cancel"
                        onClick={() => handleDelete(p.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? "✏️ Edit Product" : "➕ Add Product"}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body product-form">
                {/* Image Upload */}
                <div
                  className="image-upload-area"
                  onClick={() => fileRef.current?.click()}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImage}
                    style={{ display: "none" }}
                  />
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      className="upload-preview"
                      alt="preview"
                    />
                  ) : (
                    <div>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>📸</div>
                      <div style={{ fontWeight: 600 }}>
                        Click to upload image
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text3)",
                          marginTop: 4,
                        }}
                      >
                        JPG, PNG (optional)
                      </div>
                    </div>
                  )}
                  {imagePreview && (
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>
                      Click to change image
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Product Name *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Fresh Tomatoes"
                      value={form.name}
                      onChange={set("name")}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={form.category}
                      onChange={set("category")}
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">MRP (₹) - Optional</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={form.mrp}
                      onChange={set("mrp")}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Selling Price (₹) *</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={form.price}
                      onChange={set("price")}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <input
                      className="form-input"
                      placeholder="e.g. 1 kg, 500 g, 1 dozen"
                      value={form.unit}
                      onChange={set("unit")}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock Quantity *</label>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="100"
                      value={form.stock}
                      onChange={set("stock")}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 60 }}
                    placeholder="Product description..."
                    value={form.description}
                    onChange={set("description")}
                  />
                </div>

                <div style={{ display: "flex", gap: 20 }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.is_popular}
                      onChange={set("is_popular")}
                    />
                    ⭐ Mark as Popular
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={set("is_active")}
                    />
                    ✅ Active
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving
                    ? "⏳ Saving..."
                    : editing
                      ? "💾 Update Product"
                      : "➕ Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
