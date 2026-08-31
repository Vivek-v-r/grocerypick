import { useState } from "react";
import { Link } from "react-router-dom";
import { customerForgotPassword } from "../services/api";
import toast from "react-hot-toast";

export default function CustomerForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ mobile: "", new_password: "", confirm: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.mobile || !form.new_password)
      return toast.error("Please fill all fields");
    if (form.new_password !== form.confirm)
      return toast.error("Passwords do not match");
    if (form.new_password.length < 4)
      return toast.error("Password must be at least 4 characters");
    setLoading(true);
    try {
      await customerForgotPassword({ mobile: form.mobile, new_password: form.new_password });
      toast.success("Password updated! Please sign in.");
      setForm({ mobile: "", new_password: "", confirm: "" });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-auth-page">
      <div className="customer-auth-card">
        <div className="customer-auth-icon">🔑</div>
        <h2>Reset Password</h2>
        <p className="customer-auth-sub">Enter your mobile number and new password</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input
              className="form-input"
              placeholder="+91 98765 43210"
              value={form.mobile}
              onChange={(e) => setForm(f => ({ ...f, mobile: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Enter new password"
              value={form.new_password}
              onChange={(e) => setForm(f => ({ ...f, new_password: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Confirm new password"
              value={form.confirm}
              onChange={(e) => setForm(f => ({ ...f, confirm: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="place-order-btn" disabled={loading} style={{ width: '100%' }}>
            {loading ? "⏳ Resetting..." : "Reset Password"}
          </button>
        </form>
        <div className="customer-auth-links">
          <Link to="/customer/login">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
