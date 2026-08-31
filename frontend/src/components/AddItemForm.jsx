import { useState } from "react";
import { addCartItem } from "../services/api";
import toast from "react-hot-toast";

export default function AddItemForm({ groupId, onItemAdded }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Item name is required");
    const itemPrice = parseFloat(price);
    if (isNaN(itemPrice) || itemPrice <= 0) return toast.error("Valid price is required");
    setAdding(true);
    try {
      const res = await addCartItem(groupId, {
        item_name: name.trim(),
        price: itemPrice,
        quantity: parseInt(quantity) || 1,
      });
      toast.success("Item added to cart!");
      setName("");
      setPrice("");
      setQuantity(1);
      if (onItemAdded) onItemAdded(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add item");
    } finally {
      setAdding(false);
    }
  };

  return (
    <form className="add-item-form" onSubmit={handleSubmit}>
      <input className="form-input" placeholder="Item name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className="form-input" type="number" step="0.01" min="0.01" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} required />
      <input className="form-input" type="number" min="1" placeholder="Qty" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={{ width: 80 }} />
      <button className="btn-primary btn-sm" type="submit" disabled={adding}>
        {adding ? "Adding..." : "+ Add"}
      </button>
    </form>
  );
}
