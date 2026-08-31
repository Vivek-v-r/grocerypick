import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { myGroups, addCartItem } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CATEGORY_ICONS = {
  'Fruits & Vegetables': '🥦', 'Dairy & Eggs': '🥛', 'Bakery': '🍞',
  'Beverages': '🧃', 'Snacks': '🍿', 'Grains & Pulses': '🌾',
  'Oil & Spices': '🧂', 'Personal Care': '🧴',
};

export default function ProductCard({ product, index = 0 }) {
  const { cart, addToCart, updateQuantity } = useCart();
  const { isLoggedIn } = useCustomerAuth();
  const navigate = useNavigate();
  const cartItem = cart.find(i => i.id === product.id);
  const [anim, setAnim] = useState('');
  const [showChoice, setShowChoice] = useState(false);
  const [step, setStep] = useState('choose');
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const handleAdd = () => {
    setStep('choose');
    setShowChoice(true);
  };

  const addToMainCart = () => {
    addToCart(product);
    setAnim('add-pulse');
    setTimeout(() => {
      setAnim('');
      setShowChoice(false);
    }, 400);
  };

  const openGroups = async () => {
    if (!isLoggedIn) {
      toast.error('Sign in to use group carts');
      setShowChoice(false);
      navigate('/customer/login');
      return;
    }
    setStep('groups');
    setLoadingGroups(true);
    try {
      const res = await myGroups();
      setGroups(res.data || []);
    } catch {
      toast.error('Failed to load groups');
    } finally {
      setLoadingGroups(false);
    }
  };

  const addToGroup = async (group) => {
    try {
      await addCartItem(group.id, {
        item_name: product.name,
        price: product.price,
        quantity: 1,
      });
      toast.success(`Added to ${group.name}`);
      setShowChoice(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add to group cart');
    }
  };

  return (
    <>
      <div className="product-card" style={{ animationDelay: `${index * 60}ms` }}>
        <div className="product-img-wrap">
          {product.image_url
            ? <img src={product.image_url} alt={product.name} loading="lazy" />
            : <span className="product-img-placeholder">{CATEGORY_ICONS[product.category_name] || '🛍️'}</span>
          }
        </div>
        <div className="product-body">
          <div className="product-category">{product.category_name}</div>
          <div className="product-name">{product.name}</div>
          <div className="product-unit">{product.unit}</div>
          <div className="product-footer">
            <div className="product-price">₹{product.price}</div>
            <span className={`stock-badge ${!product.in_stock ? 'out' : product.stock < 10 ? 'low' : 'ok'}`}>
              {!product.in_stock ? 'Out of Stock' : `${product.stock}`}
            </span>
          </div>
          <div className="product-footer" style={{ marginTop: 6 }}>
            {!product.in_stock ? null : cartItem ? (
              <div className="qty-control">
                <button className="qty-btn" onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}>−</button>
                <span className="qty-num">{cartItem.quantity}</span>
                <button className="qty-btn" onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}>+</button>
              </div>
            ) : (
              <button className={`add-btn ${anim}`} onClick={handleAdd}>+</button>
            )}
          </div>
        </div>
      </div>

      {showChoice && (
        <div className="modal-overlay" onClick={() => setShowChoice(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add “{product.name}”</h2>
              <button className="close-btn" onClick={() => setShowChoice(false)}>✕</button>
            </div>
            <div className="modal-body">
              {step === 'choose' ? (
                <div className="add-choice-list">
                  <button className="add-choice-btn" onClick={addToMainCart}>
                    <span className="add-choice-icon">🛒</span>
                    <span className="add-choice-text">
                      <strong>Main Cart</strong>
                      <small>Your personal cart</small>
                    </span>
                  </button>
                  <button className="add-choice-btn" onClick={openGroups}>
                    <span className="add-choice-icon">👥</span>
                    <span className="add-choice-text">
                      <strong>Group Cart</strong>
                      <small>Add to a shared shopping group</small>
                    </span>
                  </button>
                </div>
              ) : (
                <div>
                  <p className="add-sub">Choose which group to add to:</p>
                  {loadingGroups ? (
                    <div className="spinner" />
                  ) : groups.length === 0 ? (
                    <div className="empty-state" style={{ padding: "20px 0", textAlign: "center" }}>
                      <p>No groups yet. Create one to start sharing a cart.</p>
                      <button className="btn-sm btn-primary" style={{ marginTop: 10 }} onClick={() => { setShowChoice(false); navigate('/groups'); }}>
                        Create a Group
                      </button>
                    </div>
                  ) : (
                    <div className="gm-pick-list">
                      {groups.map((g) => (
                        <button key={g.id} className="gm-pick-btn" onClick={() => addToGroup(g)}>
                          <span className="gm-pick-name">{g.name}</span>
                          <span className="gm-pick-code">
                            {g.unique_join_code} · {g.member_count} member{g.member_count !== 1 ? 's' : ''}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}