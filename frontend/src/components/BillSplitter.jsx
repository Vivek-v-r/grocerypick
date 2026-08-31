import { useState } from "react";
import { splitBill } from "../services/api";
import toast from "react-hot-toast";

export default function BillSplitter({ groupId, members, cartTotal, onBillCreated }) {
  const [splitType, setSplitType] = useState("equal");
  const [customAmounts, setCustomAmounts] = useState({});
  const [splitting, setSplitting] = useState(false);

  const handleCustomAmount = (customerId, value) => {
    setCustomAmounts((prev) => ({ ...prev, [customerId]: value }));
  };

  const validateCustom = () => {
    const total = members.reduce((sum, m) => {
      return sum + (parseFloat(customAmounts[m.customer_id] || 0) || 0);
    }, 0);
    return Math.abs(total - cartTotal) < 0.01;
  };

  const handleSplit = async () => {
    if (cartTotal <= 0) return toast.error("Cart is empty, nothing to split");
    if (members.length === 0) return toast.error("No members in group");

    if (splitType === "custom" && !validateCustom()) {
      return toast.error("Custom amounts must add up to the cart total");
    }

    setSplitting(true);
    try {
      const payload = { split_type: splitType };
      if (splitType === "custom") {
        payload.amounts = {};
        members.forEach((m) => {
          payload.amounts[m.customer_id] = parseFloat(customAmounts[m.customer_id] || 0) || 0;
        });
      }
      const res = await splitBill(groupId, payload);
      toast.success("Bill split created!");
      if (onBillCreated) onBillCreated(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to split bill");
    } finally {
      setSplitting(false);
    }
  };

  if (cartTotal <= 0) return null;

  const perPerson = members.length > 0 ? (cartTotal / members.length).toFixed(2) : "0.00";

  return (
    <div className="bill-splitter">
      <h3>Split Bill</h3>
      <div className="bs-total">Cart Total: <strong>₹{cartTotal.toFixed(2)}</strong></div>

      <div className="bs-type-select">
        <label className={`bs-type ${splitType === "equal" ? "active" : ""}`}>
          <input type="radio" name="splitType" value="equal" checked={splitType === "equal"} onChange={() => setSplitType("equal")} />
          Equal Split
        </label>
        <label className={`bs-type ${splitType === "custom" ? "active" : ""}`}>
          <input type="radio" name="splitType" value="custom" checked={splitType === "custom"} onChange={() => setSplitType("custom")} />
          Custom Split
        </label>
      </div>

      <div className="bs-breakdown">
        {splitType === "equal" ? (
          members.map((m) => (
            <div key={m.customer_id} className="bs-row">
              <span>{m.customer_name}</span>
              <span className="bs-amount">₹{perPerson}</span>
            </div>
          ))
        ) : (
          members.map((m) => (
            <div key={m.customer_id} className="bs-row">
              <span>{m.customer_name}</span>
              <input
                className="form-input"
                type="number"
                step="0.01"
                min="0"
                placeholder="Amount"
                value={customAmounts[m.customer_id] || ""}
                onChange={(e) => handleCustomAmount(m.customer_id, e.target.value)}
                style={{ width: 120 }}
              />
            </div>
          ))
        )}
      </div>

      <button className="btn-primary" onClick={handleSplit} disabled={splitting} style={{ width: "100%", marginTop: 12 }}>
        {splitting ? "Splitting..." : "Split Bill"}
      </button>
    </div>
  );
}
