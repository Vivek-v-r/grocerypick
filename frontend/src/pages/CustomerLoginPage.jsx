import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { customerLogin } from "../services/api";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import toast from "react-hot-toast";

export default function CustomerLoginPage() {
  const { login } = useCustomerAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ mobile: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.mobile || !form.password)
      return toast.error("Please fill all fields");
    setLoading(true);
    try {
      const res = await customerLogin(form);
      login(res.data.token, res.data.customer);
      toast.success("Welcome back!");
      navigate("/customer/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-auth-page">
      <div className="customer-auth-card">
        <div className="customer-auth-icon">👤</div>
        <h2>Customer Login</h2>
        <p className="customer-auth-sub">Sign in to view your orders and more</p>
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
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="place-order-btn" disabled={loading} style={{ width: '100%' }}>
            {loading ? "⏳ Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="customer-auth-links">
          <Link to="/customer/register">Create an account</Link>
          <Link to="/customer/forgot-password">Forgot password?</Link>
        </div>
      </div>
    </div>
  );
}
