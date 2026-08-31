import { useState, useEffect } from "react";
import { updateStoreSettings } from "../services/api";
import { useStoreSettings } from "../context/StoreContext";
import toast from "react-hot-toast";

export default function AdminSettings() {
  const { storeSettings, loadSettings } = useStoreSettings();
  const [form, setForm] = useState({
    store_name: "",
    store_address: "",
    store_phone: "",
    store_hours: "",
    upi_id: "",
    upi_name: "",
    upi_mc: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!storeSettings) return;
    setForm(storeSettings);
    setLoading(false);
  }, [storeSettings]);

  const set = (f) => (e) =>
    setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateStoreSettings(form);
      await loadSettings();
      toast.success("Settings saved!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div style={{ maxWidth: 640 }}>
      <form onSubmit={handleSave}>
        <div className="card">
          <div className="card-title">🏪 Store Information</div>
          <div className="form-group">
            <label className="form-label">Store Name</label>
            <input
              className="form-input"
              value={form.store_name}
              onChange={set("store_name")}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Store Address</label>
            <textarea
              className="form-textarea"
              value={form.store_address}
              onChange={set("store_address")}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                className="form-input"
                value={form.store_phone}
                onChange={set("store_phone")}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Store Hours</label>
              <input
                className="form-input"
                placeholder="8:00 AM - 10:00 PM"
                value={form.store_hours}
                onChange={set("store_hours")}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">💳 UPI Payment Settings</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">UPI ID</label>
              <input
                className="form-input"
                placeholder="yourname@upi"
                value={form.upi_id}
                onChange={set("upi_id")}
              />
            </div>
            <div className="form-group">
              <label className="form-label">UPI Display Name</label>
              <input
                className="form-input"
                placeholder="Your Store Name"
                value={form.upi_name}
                onChange={set("upi_name")}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Merchant Code (MC) - Optional
              </label>
              <input
                className="form-input"
                placeholder="e.g. 5411"
                value={form.upi_mc || ""}
                onChange={set("upi_mc")}
              />
              <div
                style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}
              >
                Prevents "Limit Reached" errors by strictly classifying as a
                Merchant (P2M) transfer.
              </div>
            </div>
          </div>
          {form.upi_id && (
            <div
              style={{
                marginTop: 12,
                padding: "16px",
                background: "var(--bg)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=upi://pay?pa=${form.upi_id}&pn=${encodeURIComponent(form.upi_name)}${form.upi_mc ? `&mc=${form.upi_mc}` : ""}`}
                alt="QR Preview"
                style={{ width: 80, height: 80, borderRadius: 8 }}
              />
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  UPI Settings Preview
                </div>
                <div style={{ fontSize: 14, color: "var(--text2)" }}>
                  {form.upi_id}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--green)",
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  ✅ Payment link will be generated after checkout
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{ padding: "14px 28px", fontSize: 16 }}
          disabled={saving}
        >
          {saving ? "⏳ Saving..." : "💾 Save Settings"}
        </button>
      </form>
    </div>
  );
}
