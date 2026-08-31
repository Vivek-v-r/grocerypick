import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { adminLogin } from "../services/api";
import toast from "react-hot-toast";

export default function AdminLoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        username: form.username.trim(),
        password: form.password,
      };
      const res = await adminLogin(payload);
      if (process.env.NODE_ENV !== "production")
        console.debug("[AdminLoginPage] login response", res.data);
      login(res.data.token, res.data.username);
      toast.success("Welcome back!");
    } catch (err) {
      console.error("[AdminLoginPage] login error", err);
      const message =
        err?.response?.status === 401
          ? "Invalid credentials. Please verify your login details."
          : err?.response?.status === 429
            ? "Too many login attempts. Please wait a moment and try again."
            : "Unable to reach backend. Make sure Django is running on http://127.0.0.1:8000.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🛒</div>
        <div
          style={{
            textAlign: "center",
            fontWeight: 800,
            fontSize: 24,
            marginBottom: 6,
          }}
        >
          SPIPick
        </div>
        <div className="login-subtitle">
          Owner Dashboard — Sign in to manage your store
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              placeholder="superuser"
              value={form.username}
              onChange={(e) =>
                setForm((f) => ({ ...f, username: e.target.value }))
              }
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              required
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "⏳ Signing in..." : "🔐 Sign In"}
          </button>
        </form>
        <div
          style={{
            textAlign: "center",
            marginTop: 20,
            fontSize: 12,
            color: "var(--text3)",
          }}
        >
          Use your Django superuser username/password. If login still fails,
          make sure the Django backend is running at http://localhost:8000 and
          your account exists.
        </div>
      </div>
    </div>
  );
}
