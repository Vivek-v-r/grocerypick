import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer({ onClose }) {
  const { cart, removeFromCart, updateQuantity, total, count } = useCart();
  const navigate = useNavigate();

  return (
    <>
      <div className="cart-overlay" onClick={onClose} />
      <div className="cart-drawer">
        <div className="cart-header">
          <h2>🛒 My Cart {count > 0 && <span style={{ fontSize: '14px', color: 'var(--text3)', fontWeight: 500 }}>({count} items)</span>}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <div className="empty-icon">🛒</div>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>Your cart is empty</p>
              <p style={{ fontSize: 14, color: 'var(--text3)' }}>Add items to start your order</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-img">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : '🛍️'}
                </div>
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">₹{item.price} / {item.unit}</div>
                  <div className="qty-control" style={{ marginTop: 6, display: 'inline-flex' }}>
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                    <span className="qty-num">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <span className="cart-item-subtotal">₹{(parseFloat(item.price) * item.quantity).toFixed(0)}</span>
                  <button className="remove-btn" onClick={() => removeFromCart(item.id)}>🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total-row">
              <span className="cart-total-label">Total Amount</span>
              <span className="cart-total-amount">₹{total.toFixed(2)}</span>
            </div>
            <button
              className="checkout-btn"
              onClick={() => { onClose(); navigate('/checkout'); }}
            >
              Proceed to Checkout →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
