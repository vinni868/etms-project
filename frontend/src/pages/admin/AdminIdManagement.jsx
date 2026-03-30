import { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import "./AdminIdManagement.css";

const PORTAL_ICONS = {
  STUDENT:  { icon: "🎓", color: "#2563eb" },
  TRAINER:  { icon: "👨‍🏫", color: "#7c3aed" },
  ADMIN:    { icon: "🛡️", color: "#16a34a" },
  MARKETER: { icon: "📣", color: "#f97316" },
  BATCH:    { icon: "🗂️", color: "#0891b2" },
  COURSE:   { icon: "📚", color: "#db2777" },
  INVOICE:  { icon: "🧾", color: "#d97706" },
};

export default function AdminIdManagement() {
  const [sequences, setSequences]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [preview, setPreview]       = useState({});
  const [editSeq, setEditSeq]       = useState(null); // currently editing portal
  const [editForm, setEditForm]     = useState({ seq: 0, prefix: "", year: new Date().getFullYear() });
  const [toast, setToast]           = useState({ type: "", msg: "" });
  const [activeTab, setActiveTab]   = useState("overview");

  useEffect(() => { fetchSequences(); }, []);

  const fetchSequences = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/id-sequences/all");
      setSequences(res.data || []);
      // Build preview map
      const previewMap = {};
      (res.data || []).forEach(s => {
        previewMap[s.portal] = buildNextId(s);
      });
      setPreview(previewMap);
    } catch (err) {
      showToast("error", "Failed to load ID sequences.");
    } finally {
      setLoading(false);
    }
  };

  const buildNextId = (seq) => {
    const next = seq.currentSeq + 1;
    return `${seq.prefix}-${seq.year}-${String(next).padStart(4, "0")}`;
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast({ type: "", msg: "" }), 3500);
  };

  const handleEditOpen = (seq) => {
    setEditSeq(seq.portal);
    setEditForm({ seq: seq.currentSeq, prefix: seq.prefix, year: seq.year });
  };

  const handleSaveEdit = async () => {
    if (!editSeq) return;
    try {
      // Update sequence counter
      await api.put(`/admin/id-sequences/reset/${editSeq}`, {
        seq:  editForm.seq,
        year: editForm.year,
      });
      // Update prefix if changed
      const original = sequences.find(s => s.portal === editSeq);
      if (original && original.prefix !== editForm.prefix.toUpperCase()) {
        await api.put(`/admin/id-sequences/prefix/${editSeq}`, { prefix: editForm.prefix });
      }
      showToast("success", `✅ Sequence updated for ${editSeq}`);
      setEditSeq(null);
      fetchSequences();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Update failed.");
    }
  };

  if (loading) return (
    <div className="idm-loader">
      <div className="idm-spinner" />
      <p>Loading ID Control Panel…</p>
    </div>
  );

  return (
    <div className="idm-page">

      {/* Toast */}
      {toast.msg && (
        <div className={`idm-toast idm-toast--${toast.type}`}>{toast.msg}</div>
      )}

      {/* Hero */}
      <div className="idm-hero">
        <div className="idm-hero__orb idm-hero__orb--1" />
        <div className="idm-hero__orb idm-hero__orb--2" />
        <div className="idm-hero__inner">
          <div>
            <div className="idm-hero__chip">🔢 ID Control Panel</div>
            <h1 className="idm-hero__title">ID Sequence Manager</h1>
            <p className="idm-hero__sub">
              View, preview and control portal ID sequences across the EtMS system.
            </p>
          </div>
          <button className="idm-refresh-btn" onClick={fetchSequences} title="Refresh">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="idm-tabs">
        {["overview", "control"].map(t => (
          <button
            key={t}
            className={`idm-tab ${activeTab === t ? "idm-tab--active" : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t === "overview" ? "📊 Overview" : "⚙️ Control"}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB - cards grid */}
      {activeTab === "overview" && (
        <div className="idm-cards-grid">
          {sequences.map(seq => {
            const meta = PORTAL_ICONS[seq.portal] || { icon: "🔢", color: "#2f59e0" };
            const nextId = buildNextId(seq);
            return (
              <div key={seq.portal} className="idm-seq-card">
                <div className="idm-seq-card__header" style={{ background: `${meta.color}15`, borderLeft: `4px solid ${meta.color}` }}>
                  <span className="idm-seq-card__icon">{meta.icon}</span>
                  <div>
                    <h3 className="idm-seq-card__portal" style={{ color: meta.color }}>{seq.portal}</h3>
                    <span className="idm-seq-card__prefix">Prefix: <strong>{seq.prefix}</strong></span>
                  </div>
                </div>
                <div className="idm-seq-card__body">
                  <div className="idm-seq-card__stat">
                    <span className="idm-seq-card__stat-label">Current Sequence</span>
                    <span className="idm-seq-card__stat-val">{seq.currentSeq}</span>
                  </div>
                  <div className="idm-seq-card__stat">
                    <span className="idm-seq-card__stat-label">Year</span>
                    <span className="idm-seq-card__stat-val">{seq.year}</span>
                  </div>
                </div>
                <div className="idm-seq-card__footer">
                  <span className="idm-next-id-label">Next ID will be:</span>
                  <code className="idm-next-id-badge" style={{ borderColor: meta.color, color: meta.color }}>
                    {nextId}
                  </code>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONTROL TAB - edit table */}
      {activeTab === "control" && (
        <div className="idm-table-wrap">
          <div className="idm-table-header">
            <h2>Sequence Control</h2>
            <p>Edit prefix, current sequence number and year for each portal.</p>
          </div>

          <table className="idm-table responsive-card-table">
            <thead>
              <tr>
                <th>Portal</th>
                <th>Prefix</th>
                <th>Current #</th>
                <th>Year</th>
                <th>Next ID Preview</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sequences.map(seq => {
                const meta = PORTAL_ICONS[seq.portal] || { icon: "🔢", color: "#2f59e0" };
                const isEditing = editSeq === seq.portal;
                return (
                  <tr key={seq.portal} className={isEditing ? "idm-row--editing" : ""}>
                    <td data-label="Portal">
                      <span className="idm-portal-cell">
                        <span>{meta.icon}</span>
                        <strong style={{ color: meta.color }}>{seq.portal}</strong>
                      </span>
                    </td>
                    <td data-label="Prefix">
                      {isEditing ? (
                        <input
                          className="idm-inline-input"
                          value={editForm.prefix}
                          onChange={e => setEditForm({ ...editForm, prefix: e.target.value.toUpperCase() })}
                          maxLength={6}
                        />
                      ) : (
                        <code className="idm-prefix-badge">{seq.prefix}</code>
                      )}
                    </td>
                    <td data-label="Current">
                      {isEditing ? (
                        <input
                          className="idm-inline-input"
                          type="number"
                          min="0"
                          value={editForm.seq}
                          onChange={e => setEditForm({ ...editForm, seq: parseInt(e.target.value) || 0 })}
                        />
                      ) : (
                        <span className="idm-seq-num">{seq.currentSeq}</span>
                      )}
                    </td>
                    <td data-label="Year">
                      {isEditing ? (
                        <input
                          className="idm-inline-input"
                          type="number"
                          min="2020"
                          max="2099"
                          value={editForm.year}
                          onChange={e => setEditForm({ ...editForm, year: parseInt(e.target.value) || new Date().getFullYear() })}
                        />
                      ) : (
                        <span>{seq.year}</span>
                      )}
                    </td>
                    <td data-label="Next ID">
                      {isEditing ? (
                        <code className="idm-preview-id" style={{ color: meta.color }}>
                          {`${editForm.prefix}-${editForm.year}-${String(editForm.seq + 1).padStart(4, "0")}`}
                        </code>
                      ) : (
                        <code className="idm-preview-id" style={{ color: meta.color }}>
                          {buildNextId(seq)}
                        </code>
                      )}
                    </td>
                    <td data-label="Actions">
                      {isEditing ? (
                        <div className="idm-action-group">
                          <button className="idm-btn idm-btn--save" onClick={handleSaveEdit}>
                            💾 Save
                          </button>
                          <button className="idm-btn idm-btn--cancel" onClick={() => setEditSeq(null)}>
                            ✕ Cancel
                          </button>
                        </div>
                      ) : (
                        <button className="idm-btn idm-btn--edit" onClick={() => handleEditOpen(seq)}>
                          ✏️ Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="idm-info-box">
            <span>⚠️</span>
            <div>
              <strong>Important:</strong> Changing the sequence resets the counter. The next user registered after this change will receive an ID with the new sequence. 
              Resetting to <code>0</code> means the next ID will end in <code>-0001</code>.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
