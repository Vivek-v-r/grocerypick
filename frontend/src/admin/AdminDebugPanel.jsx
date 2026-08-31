import { useState, useEffect } from "react";

export default function AdminDebugPanel() {
  const [token, setToken] = useState("");
  const [header, setHeader] = useState("");

  const refresh = () => {
    try {
      setToken(localStorage.getItem("adminToken") || "");
      setHeader(window.__lastAuthHeader || "");
    } catch (e) {
      setToken("error");
      setHeader("error");
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, []);

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 12,
        bottom: 12,
        background: "rgba(0,0,0,0.6)",
        color: "#fff",
        padding: 12,
        borderRadius: 8,
        fontSize: 12,
        zIndex: 9999,
        width: 360,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Debug: Auth</div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ opacity: 0.8, fontSize: 11 }}>
            localStorage.adminToken
          </div>
          <div style={{ wordBreak: "break-all" }}>{token || <i>empty</i>}</div>
        </div>
        <div style={{ width: 1, background: "rgba(255,255,255,0.08)" }} />
        <div style={{ flex: 1 }}>
          <div style={{ opacity: 0.8, fontSize: 11 }}>last Authorization</div>
          <div style={{ wordBreak: "break-all" }}>{header || <i>empty</i>}</div>
        </div>
      </div>
      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        <button
          onClick={refresh}
          style={{
            background: "var(--bg)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.06)",
            padding: "6px 10px",
            borderRadius: 6,
          }}
        >
          Refresh
        </button>
        <div style={{ opacity: 0.7, fontSize: 11, marginLeft: "auto" }}>
          Dev only
        </div>
      </div>
    </div>
  );
}
