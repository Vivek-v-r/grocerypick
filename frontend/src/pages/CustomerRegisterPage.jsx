import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { customerRegister } from "../services/api";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import toast from "react-hot-toast";

export default function CustomerRegisterPage() {
  const { login } = useCustomerAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", mobile: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.mobile || !form.password)
      return toast.error("Please fill all fields");
    if (form.password.length < 4)
      return toast.error("Password must be at least 4 characters");
    setLoading(true);
    try {
      const res = await customerRegister(form);
      login(res.data.token, res.data.customer);
      toast.success("Account created successfully!");
      navigate("/customer/dashboard");
    } catch (err) {
      const msg = err.response?.data?.error
        || err.response?.data?.mobile?.[0]
        || "Registration failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-auth-page">
      <div className="customer-auth-card">
        <div className="customer-auth-icon">✨</div>
        <h2>Create Account</h2>
        <p className="customer-auth-sub">Register to save your details and track orders</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              placeholder="Enter your name"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
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
              placeholder="Create a password"
              value={form.password}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="place-order-btn" disabled={loading} style={{ width: '100%' }}>
            {loading ? "⏳ Creating account..." : "Create Account"}
          </button>
        </form>
        <div className="customer-auth-links">
          <Link to="/customer/login">Already have an account? Sign in</Link>
        </div>
      </div>
    </div>
  );
}
