import { useState, useEffect } from "react";
import { groupCart, deleteCartItem, toggleItemPurchased } from "../services/api";
import AddItemForm from "./AddItemForm";
import toast from "react-hot-toast";

export default function SharedCart({ groupId, onItemsChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadItems = () => {
    setLoading(true);
    groupCart(groupId)
      .then((res) => {
        setItems(res.data);
        if (onItemsChange) onItemsChange(res.data);
      })
      .catch(() => toast.error("Failed to load cart"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (groupId) loadItems();
  }, [groupId]);

  const handleDelete = async (itemId) => {
    try {
      await deleteCartItem(groupId, itemId);
      const updated = items.filter((i) => i.id !== itemId);
      setItems(updated);
      if (onItemsChange) onItemsChange(updated);
      toast.success("Item removed");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete");
    }
  };

  const handleToggle = async (itemId) => {
    try {
      const res = await toggleItemPurchased(groupId, itemId);
      const updated = items.map((i) => (i.id === itemId ? res.data : i));
      setItems(updated);
      if (onItemsChange) onItemsChange(updated);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update");
    }
  };

  const total = items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);

  return (
    <div className="shared-cart">
      <div className="sc-header">
        <h3>Shared Cart</h3>
        <span className="sc-total">Total: ₹{total.toFixed(2)}</span>
      </div>

      <AddItemForm groupId={groupId} onItemAdded={loadItems} />

      {loading ? (
        <div className="spinner" />
      ) : items.length === 0 ? (
        <div className="empty-state" style={{ padding: "30px 0" }}>
          <p>Cart is empty. Add some items above!</p>
        </div>
      ) : (
        <div className="sc-items">
          {items.map((item) => (
            <div key={item.id} className={`sc-item ${item.is_purchased ? "purchased" : ""}`}>
              <div className="sc-item-info">
                <span className="sc-item-name">{item.item_name}</span>
                <span className="sc-item-by">by {item.added_by_name}</span>
              </div>
              <div className="sc-item-qty">x{item.quantity}</div>
              <div className="sc-item-price">₹{(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
              <div className="sc-item-actions">
                <button className="btn-sm btn-secondary" onClick={() => handleToggle(item.id)} title="Toggle purchased">
                  {item.is_purchased ? "Undo" : "Done"}
                </button>
                <button className="btn-sm" style={{ color: "var(--red)", background: "none", border: "none", cursor: "pointer" }} onClick={() => handleDelete(item.id)} title="Delete item">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
