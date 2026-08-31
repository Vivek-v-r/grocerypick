import { useState, useEffect, Fragment } from "react";
import { adminGetOrders, adminUpdateOrderStatus } from "../services/api";
import toast from "react-hot-toast";

const FILTERS = [
  { key: "", label: "All" },
  { key: "pending", label: "🕐 Pending" },
  { key: "preparing", label: "📦 Preparing" },
  { key: "ready", label: "✅ Ready" },
  { key: "collected", label: "🎉 Collected" },
  { key: "cancelled", label: "✕ Cancelled" },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState(null);

  const load = (f = filter) => {
    setLoading(true);
    const params = f ? { status: f } : {};
    adminGetOrders(params)
      .then((r) => setOrders(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [filter]);

  const updateStatus = async (id, status, paymentStatus) => {
    const data = { status };
    if (paymentStatus) data.payment_status = paymentStatus;
    await adminUpdateOrderStatus(id, data);
    toast.success("Order updated");
    load();
  };

  const getStatusActions = (order) => {
    const { id, status } = order;
    switch (status) {
      case "pending":
        return (
          <>
            <button
              className="btn-sm btn-preparing"
              onClick={() => updateStatus(id, "preparing")}
            >
              📦 Start Preparing
            </button>
            <button
              className="btn-sm btn-cancel"
              onClick={() => updateStatus(id, "cancelled")}
            >
              ✕ Cancel
            </button>
          </>
        );
      case "preparing":
        return (
          <>
            <button
              className="btn-sm btn-ready"
              onClick={() => updateStatus(id, "ready")}
            >
              ✅ Mark Ready
            </button>
            <button
              className="btn-sm btn-cancel"
              onClick={() => updateStatus(id, "cancelled")}
            >
              ✕ Cancel
            </button>
          </>
        );
      case "ready":
        return (
          <button
            className="btn-sm btn-collected"
            onClick={(e) => {
              e.stopPropagation();
              if (order.payment_status === "paid") {
                if (!window.confirm("Payment already completed.\n\nMark order as collected?")) return;
              } else if (order.payment_method === "pickup") {
                if (!window.confirm("Confirm payment has been received before handing over the order.")) return;
              } else if (order.payment_method === "upi") {
                if (!window.confirm("UPI payment has not been verified. Check your payment app before handing over groceries.")) return;
              }
              updateStatus(id, "collected", "paid");
            }}
          >
            🎉 Mark Collected
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div className="filter-tabs">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`filter-tab${filter === f.key ? " active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <h2>
            Orders{" "}
            {!loading && (
              <span
                style={{ fontSize: 14, color: "var(--text3)", fontWeight: 500 }}
              >
                ({orders.length})
              </span>
            )}
          </h2>
          <button className="btn-secondary btn-sm" onClick={() => load()}>
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : orders.length === 0 ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "var(--text3)",
            }}
          >
            No orders found
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <Fragment key={order.id}>
                  <tr
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      setExpanded(expanded === order.id ? null : order.id)
                    }
                  >
                    <td>
                      <strong style={{ color: "var(--green)" }}>
                        {order.order_number}
                      </strong>
                    </td>
                    <td>{order.customer_name}</td>
                    <td>{order.customer_phone}</td>
                    <td>
                      <strong>₹{order.final_amount || order.total_amount}</strong>
                      {parseFloat(order.discount_amount) > 0 && (
                        <div style={{ fontSize: 11, color: "var(--green)", fontWeight: 600 }}>
                          -₹{order.discount_amount} off
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${order.payment_method}`}>
                        {order.payment_method_display}
                      </span>{" "}
                      <span className={`badge badge-${order.payment_status}`}>
                        {order.payment_method === 'upi' && order.payment_status === 'pending' ? 'PENDING VERIFICATION' : order.payment_status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${order.status}`}>
                        {order.status_display}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text3)" }}>
                      {new Date(order.created_at).toLocaleString("en-IN", {
                        hour12: true,
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="status-actions">
                        {getStatusActions(order)}
                      </div>
                    </td>
                  </tr>
                  {expanded === order.id && (
                    <tr key={`exp-${order.id}`}>
                      <td
                        colSpan={8}
                        style={{
                          background: "var(--bg)",
                          padding: "16px 20px",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 16,
                            marginBottom: 12,
                          }}
                        >
                          <div>
                            <strong>Address:</strong>{" "}
                            <span style={{ color: "var(--text2)" }}>
                              {order.customer_address}
                            </span>
                          </div>
                          {order.transaction_id && (
                            <div>
                              <strong>Transaction ID:</strong>{" "}
                              <span style={{ color: "var(--text2)" }}>
                                {order.transaction_id}
                              </span>
                            </div>
                          )}
                          {order.notes && (
                            <div>
                              <strong>Notes:</strong>{" "}
                              <span style={{ color: "var(--text2)" }}>
                                {order.notes}
                              </span>
                            </div>
                          )}
                        </div>
                        {order.payment_method === 'upi' && order.payment_status === 'pending' && (
                          <div style={{ background: 'rgba(33, 150, 243, 0.1)', color: 'var(--blue)', padding: '10px 14px', borderRadius: '6px', marginBottom: '12px', fontWeight: '500', fontSize: '14px', border: '1px solid rgba(33, 150, 243, 0.2)' }}>
                            <div style={{ marginBottom: '8px' }}>
                              📱 Customer marked payment as completed (Please verify in your UPI app)
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="btn-sm" 
                                style={{ background: 'var(--green)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                onClick={(e) => { e.stopPropagation(); updateStatus(order.id, order.status, 'paid'); }}
                              >
                                ✅ Mark Payment Received
                              </button>
                              <button 
                                className="btn-sm" 
                                style={{ background: 'var(--red)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                onClick={(e) => { e.stopPropagation(); updateStatus(order.id, order.status, 'failed'); }}
                              >
                                ❌ Payment Not Received
                              </button>
                            </div>
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            marginBottom: 8,
                          }}
                        >
                          Items Ordered:
                        </div>
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "6px 0",
                              borderBottom: "1px solid var(--border)",
                              fontSize: 14,
                            }}
                          >
                            <span>
                              {item.product_name}{" "}
                              <span style={{ color: "var(--text3)" }}>
                                × {item.quantity}
                              </span>
                            </span>
                            <span style={{ fontWeight: 700 }}>
                              ₹{item.subtotal}
                            </span>
                          </div>
                        ))}
                        <div
                          style={{
                            textAlign: "right",
                            fontWeight: 800,
                            fontSize: 16,
                            marginTop: 10,
                            color: "var(--green)",
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 4 }}>
                            Original: ₹{order.total_amount}
                            {parseFloat(order.discount_amount) > 0 && (
                              <span style={{ color: "var(--green)", marginLeft: 12 }}>
                                Discount: -₹{order.discount_amount}
                              </span>
                            )}
                          </div>
                          Final Amount: ₹{order.final_amount || order.total_amount}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
