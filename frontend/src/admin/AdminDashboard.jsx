import { useState, useEffect } from 'react';
import { getDashboardStats, adminGetOrders, adminUpdateOrderStatus } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([getDashboardStats(), adminGetOrders({ status: 'pending' })]).then(([s, o]) => {
      setStats(s.data);
      setRecentOrders(o.data.slice(0, 5));
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  const updateStatus = async (id, status) => {
    await adminUpdateOrderStatus(id, { status });
    toast.success(`Order marked as ${status}`);
    load();
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      {stats?.new_orders > 0 && (
        <div style={{ marginBottom: 20 }}>
          <span className="new-order-badge">🔔 {stats.new_orders} New Order{stats.new_orders > 1 ? 's' : ''} Waiting!</span>
        </div>
      )}

      <div className="stats-grid">
        {[
          { label: 'Total Orders', num: stats?.total || 0, cls: '' },
          { label: 'Pending', num: stats?.pending || 0, cls: 'orange' },
          { label: 'Preparing', num: stats?.preparing || 0, cls: 'blue' },
          { label: 'Ready for Pickup', num: stats?.ready || 0, cls: 'green' },
          { label: 'Collected', num: stats?.collected || 0, cls: 'green' },
          { label: 'Cancelled', num: stats?.cancelled || 0, cls: 'red' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-card-label">{s.label}</div>
            <div className={`stat-card-num ${s.cls}`}>{s.num}</div>
          </div>
        ))}
      </div>

      {/* Pending Orders */}
      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <h2>🕐 Pending Orders</h2>
          <button className="btn-secondary btn-sm" onClick={load}>🔄 Refresh</button>
        </div>
        {recentOrders.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <p style={{ fontWeight: 600 }}>No pending orders</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id}>
                  <td><strong style={{ color: 'var(--green)', fontSize: 15 }}>{order.order_number}</strong></td>
                  <td>{order.customer_name}</td>
                  <td>{order.customer_phone}</td>
                  <td>{order.items.length} items</td>
                  <td><strong>₹{order.total_amount}</strong></td>
                  <td>
                    <span className={`badge badge-${order.payment_method}`}>{order.payment_method_display}</span>
                  </td>
                  <td>
                    <div className="status-actions">
                      <button className="btn-sm btn-preparing" onClick={() => updateStatus(order.id, 'preparing')}>📦 Prepare</button>
                      <button className="btn-sm btn-cancel" onClick={() => updateStatus(order.id, 'cancelled')}>✕ Cancel</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
