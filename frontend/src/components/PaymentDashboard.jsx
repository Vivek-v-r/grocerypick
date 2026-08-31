import { useState, useEffect } from "react";
import { updatePaymentStatus, getStoreSettings } from "../services/api";
import UpiPaymentBlock from "./UpiPaymentBlock";
import toast from "react-hot-toast";

export default function PaymentDashboard({ bills }) {
  const [updating, setUpdating] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);
  const [loadingStore, setLoadingStore] = useState(true);

  useEffect(() => {
    getStoreSettings()
      .then((res) => setStoreSettings(res.data))
      .catch(() => setStoreSettings(null))
      .finally(() => setLoadingStore(false));
  }, []);

  const handleMarkPaid = async (paymentId) => {
    setUpdating(paymentId);
    try {
      const res = await updatePaymentStatus(paymentId);
      toast.success("Payment confirmed!");
      setPayingId(null);
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update");
      return null;
    } finally {
      setUpdating(null);
    }
  };

  if (!bills || bills.length === 0) {
    return (
      <div className="payment-dashboard">
        <h3>Payment Status</h3>
        <div className="empty-state" style={{ padding: "30px 0" }}>
          <p>No bills yet. Split a bill to see payment status here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-dashboard">
      <h3>Payment Status</h3>
      {bills.map((bill) => (
        <div key={bill.id} className="pd-bill">
          <div className="pd-bill-header">
            <span>Bill #{bill.id}</span>
            <span className="pd-split-type">{bill.split_type}</span>
            <span className="pd-total">₹{parseFloat(bill.total_amount).toFixed(2)}</span>
          </div>
          <div className="pd-payments">
            {bill.payments.map((p) => (
              <div key={p.id} className={`pd-payment ${p.status}`}>
                <div className="pd-pay-info">
                  <span className="pd-pay-name">{p.customer_name}</span>
                  <span className="pd-pay-amount">₹{parseFloat(p.amount_owed).toFixed(2)}</span>
                </div>
                <div className="pd-pay-status">
                  {p.status === "paid" ? (
                    <span className="pd-paid-badge">Paid</span>
                  ) : (
                    <button
                      className="btn-sm btn-primary"
                      onClick={() => setPayingId(payingId === p.id ? null : p.id)}
                      style={{ background: "var(--green)", color: "white", border: "none" }}
                    >
                      {payingId === p.id ? "Close" : "Pay via UPI"}
                    </button>
                  )}
                </div>

                {p.status !== "paid" && payingId === p.id && (
                  <div className="pd-upi-box">
                    <UpiPaymentBlock
                      storeSettings={storeSettings}
                      loadingStore={loadingStore}
                      finalTotal={parseFloat(p.amount_owed)}
                    />
                    <button
                      className="btn-primary"
                      onClick={() => handleMarkPaid(p.id)}
                      disabled={updating === p.id}
                      style={{ width: "100%", marginTop: 12 }}
                    >
                      {updating === p.id ? "Confirming..." : "I have paid — Confirm"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}