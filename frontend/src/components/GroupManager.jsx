import { useState, useEffect } from "react";
import { createGroup, joinGroup, myGroups } from "../services/api";
import toast from "react-hot-toast";

export default function GroupManager({ onSelectGroup }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const loadGroups = () => {
    setLoading(true);
    myGroups()
      .then((res) => setGroups(res.data))
      .catch(() => toast.error("Failed to load groups"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadGroups(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return toast.error("Enter a group name");
    setLoading(true);
    try {
      const res = await createGroup({ name: groupName });
      toast.success(`Group created! Code: ${res.data.unique_join_code}`);
      setGroupName("");
      setShowCreate(false);
      loadGroups();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return toast.error("Enter a join code");
    setLoading(true);
    try {
      const res = await joinGroup({ code: joinCode });
      toast.success(`Joined ${res.data.name}!`);
      setJoinCode("");
      setShowJoin(false);
      loadGroups();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to join group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group-manager">
      <div className="gm-header">
        <h2>My Shopping Groups</h2>
        <div className="gm-actions">
          <button className="btn-sm btn-primary" onClick={() => { setShowCreate(true); setShowJoin(false); }}>
            + Create
          </button>
          <button className="btn-sm btn-secondary" onClick={() => { setShowJoin(true); setShowCreate(false); }}>
            Join
          </button>
        </div>
      </div>

      {showCreate && (
        <form className="gm-form" onSubmit={handleCreate}>
          <input className="form-input" placeholder="Group name" value={groupName} onChange={(e) => setGroupName(e.target.value)} autoFocus />
          <button className="btn-primary btn-sm" disabled={loading} type="submit">
            {loading ? "Creating..." : "Create Group"}
          </button>
          <button className="btn-sm btn-secondary" type="button" onClick={() => setShowCreate(false)}>Cancel</button>
        </form>
      )}

      {showJoin && (
        <form className="gm-form" onSubmit={handleJoin}>
          <input className="form-input" placeholder="Enter 8-character code" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} maxLength={8} autoFocus />
          <button className="btn-primary btn-sm" disabled={loading} type="submit">
            {loading ? "Joining..." : "Join Group"}
          </button>
          <button className="btn-sm btn-secondary" type="button" onClick={() => setShowJoin(false)}>Cancel</button>
        </form>
      )}

      {loading && !showCreate && !showJoin ? (
        <div className="spinner" />
      ) : groups.length === 0 ? (
        <div className="empty-state" style={{ padding: "40px 0" }}>
          <p>No groups yet. Create or join one to start sharing a cart!</p>
        </div>
      ) : (
        <div className="gm-list">
          {groups.map((g) => (
            <div key={g.id} className="gm-card" onClick={() => onSelectGroup(g)}>
              <div className="gm-card-name">{g.name}</div>
              <div className="gm-card-meta">
                <span>Code: <strong>{g.unique_join_code}</strong></span>
                <span>{g.member_count} member{g.member_count !== 1 ? "s" : ""}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
