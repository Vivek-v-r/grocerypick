import { buildUpiQrUrl, copyUpiId } from "../pages/upi";
import toast from "react-hot-toast";

export default function UpiPaymentBlock({ storeSettings, loadingStore, finalTotal }) {
  if (!storeSettings) return null;

  const hasUpiSettings = Boolean(
    storeSettings?.upi_id?.trim() && storeSettings?.upi_name?.trim(),
  );

  const qrData = hasUpiSettings
    ? buildUpiQrUrl(storeSettings.upi_id, storeSettings.upi_name, finalTotal)
    : "";

  if (loadingStore) {
    return (
      <button className="btn-primary" disabled style={{ display: "block", padding: "14px", borderRadius: "8px", width: "100%" }}>
        Loading payment options...
      </button>
    );
  }

  if (!hasUpiSettings) {
    return <div style={{ fontSize: 13, color: "var(--text3)" }}>UPI payment is not configured for this store.</div>;
  }

  return (
    <div style={{ background: "white", padding: "16px", borderRadius: "8px", color: "var(--text1)", textAlign: "left", border: "1px solid var(--border)" }}>
      <div style={{ fontWeight: "700", fontSize: "16px", marginBottom: "8px" }}>
        Pay via UPI
      </div>
      <p style={{ fontSize: "14px", marginBottom: "16px", color: "var(--text2)" }}>
        Open your UPI app, scan the QR code or enter the UPI ID below. Pay <strong>₹{finalTotal.toFixed(2)}</strong>.
      </p>

      {qrData ? (
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`}
          alt="UPI QR Code"
          style={{ width: "150px", height: "150px", borderRadius: "8px", border: "1px solid var(--border)", display: "block", margin: "0 auto 16px" }}
        />
      ) : (
        <div style={{ width: "150px", height: "150px", borderRadius: "8px", border: "1px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", color: "var(--text3)", textAlign: "center", padding: "8px", margin: "0 auto 16px" }}>
          QR code unavailable
        </div>
      )}

      <div style={{ background: "var(--bg)", padding: "12px", borderRadius: "6px", marginBottom: "12px" }}>
        <div style={{ fontSize: "12px", color: "var(--text3)", textTransform: "uppercase", fontWeight: "700", marginBottom: "4px" }}>
          Store Name
        </div>
        <div style={{ fontSize: "15px", fontWeight: "600", marginBottom: "12px" }}>
          {storeSettings.upi_name.trim()}
        </div>

        <div style={{ fontSize: "12px", color: "var(--text3)", textTransform: "uppercase", fontWeight: "700", marginBottom: "4px" }}>
          UPI ID
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", border: "1px solid var(--border)", padding: "8px 12px", borderRadius: "4px" }}>
          <span style={{ fontSize: "15px", fontWeight: "600", wordBreak: "break-all" }}>
            {storeSettings.upi_id.trim()}
          </span>
          <button
            className="btn-secondary"
            style={{ padding: "6px 12px", fontSize: "13px", borderRadius: "4px", flexShrink: "0", marginLeft: "10px" }}
            onClick={async () => {
              const ok = await copyUpiId(storeSettings.upi_id);
              toast.success(ok ? "UPI ID copied!" : "Failed to copy");
            }}
          >
            Copy
          </button>
        </div>
      </div>

      <div style={{ fontSize: "13px", color: "var(--orange)", fontWeight: "600", background: "var(--orange-light)", padding: "10px 12px", borderRadius: "6px", lineHeight: "1.4" }}>
        Please keep the payment confirmation ready during pickup.
      </div>
    </div>
  );
}
