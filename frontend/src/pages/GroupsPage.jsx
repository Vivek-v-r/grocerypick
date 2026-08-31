import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import GroupManager from "../components/GroupManager";
import SharedCart from "../components/SharedCart";
import BillSplitter from "../components/BillSplitter";
import PaymentDashboard from "../components/PaymentDashboard";
import { groupDetails } from "../services/api";
import toast from "react-hot-toast";

export default function GroupsPage() {
  const { isLoggedIn } = useCustomerAuth();
  const navigate = useNavigate();

  const [activeGroup, setActiveGroup] = useState(null);
  const [groupData, setGroupData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  if (!isLoggedIn) {
    return (
      <div className="customer-auth-page">
        <div className="customer-auth-card" style={{ textAlign: 'center' }}>
          <div className="customer-auth-icon">🔒</div>
          <h2>Sign in Required</h2>
          <p className="customer-auth-sub">Please sign in or create an account to use Shopping Groups.</p>
          <button className="place-order-btn" onClick={() => navigate("/customer/login")} style={{ width: '100%', marginBottom: 12 }}>
            Sign In
          </button>
          <button className="btn-sm btn-secondary" onClick={() => navigate("/customer/register")} style={{ width: '100%' }}>
            Create Account
          </button>
        </div>
      </div>
    );
  }

  const handleSelectGroup = async (group) => {
    setActiveGroup(group);
    setLoadingDetails(true);
    try {
      const res = await groupDetails(group.id);
      setGroupData(res.data);
    } catch {
      toast.error("Failed to load group details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleBillCreated = (bill) => {
    setGroupData((prev) => ({
      ...prev,
      bills: [...(prev?.bills || []), bill],
    }));
  };

  const cartTotal = cartItems.reduce(
    (sum, i) => sum + parseFloat(i.price) * i.quantity,
    0,
  );

  if (!isLoggedIn) return null;

  return (
    <div className="groups-page">
      <div className="groups-container">
        {!activeGroup ? (
          <>
            <h1 className="groups-title">Shopping Groups</h1>
            <p className="groups-subtitle">
              Create or join a group to share a shopping cart and split bills
              with family, roommates, or colleagues.
            </p>
            <GroupManager onSelectGroup={handleSelectGroup} />
          </>
        ) : (
          <>
            <div className="gp-header">
              <button className="btn-sm btn-secondary" onClick={() => { setActiveGroup(null); setGroupData(null); }}>
                ← Back
              </button>
              <div>
                <h2>{activeGroup.name}</h2>
                <span className="gp-code">Code: {activeGroup.unique_join_code}</span>
              </div>
              <div className="gp-members">
                {groupData?.members?.map((m) => (
                  <span key={m.id} className="gp-member-chip">{m.customer_name}</span>
                ))}
              </div>
            </div>

            {loadingDetails ? (
              <div className="spinner" />
            ) : (
              <div className="gp-content">
                <div className="gp-left">
                  <SharedCart
                    groupId={activeGroup.id}
                    onItemsChange={setCartItems}
                  />
                </div>
                <div className="gp-right">
                  <BillSplitter
                    groupId={activeGroup.id}
                    members={groupData?.members || []}
                    cartTotal={cartTotal}
                    onBillCreated={handleBillCreated}
                  />
                  <PaymentDashboard bills={groupData?.bills || []} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
