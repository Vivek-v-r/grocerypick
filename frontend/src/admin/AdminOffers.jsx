import { useState, useEffect } from "react";
import { adminGetOffers, adminCreateOffer, adminUpdateOffer, adminDeleteOffer, adminToggleOffer } from "../services/api";
import toast from "react-hot-toast";

const EMPTY = { title: "", description: "", start_date: "", end_date: "", priority: 0, is_active: true };

export default function AdminOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [showForm, setShowForm] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  const load = () => {
    setLoading(true);
    adminGetOffers().then((r) => setOffers(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ ...EMPTY });
    setEditing(null);
    setImageFile(null);
    setShowForm(true);
  };

  const openEdit = (offer) => {
    setForm({
      title: offer.title,
      description: offer.description || "",
      start_date: offer.start_date?.slice(0, 16) || "",
      end_date: offer.end_date?.slice(0, 16) || "",
      priority: offer.priority,
      is_active: offer.is_active,
    });
    setEditing(offer.id);
    setImageFile(null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.start_date || !form.end_date) {
      return toast.error("Title, start date, and end date are required");
    }

    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("start_date", form.start_date);
    fd.append("end_date", form.end_date);
    fd.append("priority", form.priority);
    fd.append("is_active", form.is_active);
    if (imageFile) fd.append("image", imageFile);

    try {
      if (editing) {
        await adminUpdateOffer(editing, fd);
        toast.success("Offer updated");
      } else {
        await adminCreateOffer(fd);
        toast.success("Offer created");
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save offer");
    }
  };

  const handleToggle = async (id) => {
    try {
      await adminToggleOffer(id);
      toast.success("Offer toggled");
      load();
    } catch { toast.error("Failed to toggle"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this offer?")) return;
    try {
      await adminDeleteOffer(id);
      toast.success("Offer deleted");
      load();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div>
      <div className="admin-table-header">
        <h2>📢 Offers Management</h2>
        <button className="btn-primary btn-sm" onClick={openCreate}>+ New Offer</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12 }}>{editing ? "Edit Offer" : "Create Offer"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Start Date *</label>
                <input className="form-input" type="datetime-local" value={form.start_date} onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">End Date *</label>
                <input className="form-input" type="datetime-local" value={form.end_date} onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))} required />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Priority</label>
                <input className="form-input" type="number" value={form.priority} onChange={(e) => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Active</label>
                <select className="form-input" value={form.is_active} onChange={(e) => setForm(f => ({ ...f, is_active: e.target.value === "true" }))}>
                  <option value="true">Active</option>
                  <option value="false">Disabled</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Banner Image</label>
              <input className="form-input" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0] || null)} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" className="btn-primary btn-sm">{editing ? "Update" : "Create"}</button>
              <button type="button" className="btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="spinner" /> : offers.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📢</div>
          <p style={{ fontWeight: 600 }}>No offers created yet</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Start</th>
                <th>End</th>
                <th>Banner</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer.id} style={{ opacity: offer.is_active ? 1 : 0.5 }}>
                  <td><strong>{offer.title}</strong></td>
                  <td>
                    <span className={`badge badge-${offer.is_active ? 'success' : 'secondary'}`}>
                      {offer.is_active ? 'Active' : 'Disabled'}
                    </span>
                    {offer.is_expired && <span className="badge badge-danger" style={{ marginLeft: 4 }}>Expired</span>}
                  </td>
                  <td>{offer.priority}</td>
                  <td style={{ fontSize: 12 }}>{new Date(offer.start_date).toLocaleDateString("en-IN")}</td>
                  <td style={{ fontSize: 12 }}>{new Date(offer.end_date).toLocaleDateString("en-IN")}</td>
                  <td>{offer.image_url ? <img src={offer.image_url} alt="" style={{ width: 50, height: 30, objectFit: 'cover', borderRadius: 4 }} /> : '—'}</td>
                  <td>
                    <div className="status-actions">
                      <button className="btn-sm btn-preparing" onClick={() => openEdit(offer)}>✏️ Edit</button>
                      <button className="btn-sm" style={{ background: 'var(--orange)', color: 'white', border: 'none' }} onClick={() => handleToggle(offer.id)}>
                        {offer.is_active ? '⏸ Disable' : '▶ Enable'}
                      </button>
                      <button className="btn-sm btn-cancel" onClick={() => handleDelete(offer.id)}>🗑 Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
