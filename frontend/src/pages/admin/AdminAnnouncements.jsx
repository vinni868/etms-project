import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { FaBullhorn, FaPlus, FaTrash, FaEdit, FaEye } from 'react-icons/fa';
import './AdminAnnouncements.css';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPopup, setIsPopup] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [selectedRoles, setSelectedRoles] = useState(['ALL']);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearchText, setUserSearchText] = useState('');
  const [link, setLink] = useState('');

  const rolesOptions = [
    { id: 'ALL',             label: 'All Users (Everyone)' },
    { id: 'ROLE_STUDENT',    label: 'All Students' },
    { id: 'ROLE_TRAINER',    label: 'All Trainers' },
    { id: 'ROLE_COUNSELOR',  label: 'All Counselors' },
    { id: 'ROLE_MARKETER',   label: 'All Marketers' },
    { id: 'ROLE_ADMIN',      label: 'All Admins' },
    { id: 'ROLE_SUPERADMIN', label: 'All Super Admins' },
  ];

  // Current user name for preview
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const currentUserName = currentUser.name || currentUser.email || 'Admin';

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/announcements');
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    api.get('/admin/all-users').then(r => setUsersList(r.data || [])).catch(console.error);
    api.get('/admin/batches').then(r => setBatches(r.data || [])).catch(console.error);
  }, []);

  // ── Role toggle: ALL is exclusive; others combine freely ──────────────────
  const handleRoleToggle = (roleId) => {
    if (roleId === 'ALL') {
      setSelectedRoles(prev => prev.includes('ALL') ? [] : ['ALL']);
    } else {
      setSelectedRoles(prev => {
        const without = prev.filter(r => r !== 'ALL' && r !== roleId);
        return prev.includes(roleId) ? without : [...without, roleId];
      });
    }
  };

  // ── Batch toggle ──────────────────────────────────────────────────────────
  const handleBatchToggle = (batchObj) => {
    setSelectedBatches(prev =>
      prev.some(b => b.id === batchObj.id)
        ? prev.filter(b => b.id !== batchObj.id)
        : [...prev, batchObj]
    );
  };

  // ── Individual user toggle ────────────────────────────────────────────────
  const handleUserToggle = (userObj) => {
    setSelectedUsers(prev =>
      prev.some(u => u.id === userObj.id)
        ? prev.filter(u => u.id !== userObj.id)
        : [...prev, userObj]
    );
  };

  // ── Build human-readable success message from recipient summary ───────────
  const formatRecipientMsg = (recipients) => {
    if (!recipients || Object.keys(recipients).length === 0) return 'Announcement posted!';
    if (recipients.ALL) return `Announcement sent to all ${recipients.ALL} users!`;
    const parts = [];
    const labels = { STUDENT: 'students', TRAINER: 'trainers', COUNSELOR: 'counselors', MARKETER: 'marketers', ADMIN: 'admins', SUPERADMIN: 'super admins' };
    Object.entries(labels).forEach(([k, lbl]) => { if (recipients[k]) parts.push(`${recipients[k]} ${lbl}`); });
    if (recipients.batches) {
      Object.entries(recipients.batches).forEach(([name, cnt]) => parts.push(`${cnt} students in ${name}`));
    }
    if (recipients.individuals) parts.push(`${recipients.individuals} specific individual(s)`);
    const total = recipients.total || 0;
    return parts.length ? `Announcement sent to ${total} user(s): ${parts.join(', ')}.` : 'Announcement posted!';
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    const targetingArray = [
      ...selectedRoles,
      ...selectedBatches.map(b => `BATCH_${b.id}`),
      ...selectedUsers.map(u => `USER_${u.id}`),
    ];

    if (targetingArray.length === 0) {
      setMsg({ type: 'err', text: 'Please select at least one target audience — role, batch, or specific user.' });
      return;
    }

    try {
      const payload = {
        title,
        content,
        isPopup,
        link: link || null,
        targetRoles: JSON.stringify(targetingArray),
      };
      if (expiresAt) payload.expiresAt = expiresAt;

      if (editId) {
        await api.put(`/admin/announcements/${editId}`, payload);
        setMsg({ type: 'ok', text: 'Announcement updated successfully!' });
      } else {
        const res = await api.post('/admin/announcements', payload);
        setMsg({ type: 'ok', text: formatRecipientMsg(res.data?.recipients) });
      }
      setShowModal(false);
      fetchAnnouncements();
    } catch (err) {
      setMsg({ type: 'err', text: err.response?.data?.message || 'Action failed. Please try again.' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/admin/announcements/${id}`);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch {
      alert('Delete failed.');
    }
  };

  const resetForm = () => {
    setEditId(null); setTitle(''); setContent(''); setIsPopup(false);
    setLink(''); setExpiresAt('');
    setSelectedRoles(['ALL']); setSelectedBatches([]); setSelectedUsers([]);
    setUserSearchText('');
  };

  const openNew = () => { resetForm(); setShowModal(true); };

  const openEdit = (a) => {
    setEditId(a.id); setTitle(a.title); setContent(a.content);
    setIsPopup(!!a.isPopup); setLink(a.link || '');
    setExpiresAt(a.expiresAt ? new Date(a.expiresAt).toISOString().slice(0, 16) : '');
    try {
      const parsed = JSON.parse(a.targetRoles || '["ALL"]');
      const roles   = parsed.filter(r => !r.startsWith('USER_') && !r.startsWith('BATCH_'));
      const uIds    = parsed.filter(r => r.startsWith('USER_')).map(r => +r.split('_')[1]);
      const bIds    = parsed.filter(r => r.startsWith('BATCH_')).map(r => +r.split('_')[1]);
      setSelectedRoles(roles.length ? roles : []);
      setSelectedUsers(usersList.filter(u => uIds.includes(u.id)));
      setSelectedBatches(batches.filter(b => bIds.includes(b.id)));
    } catch {
      setSelectedRoles(['ALL']); setSelectedUsers([]); setSelectedBatches([]);
    }
    setUserSearchText('');
    setShowModal(true);
  };

  // Live search: show results only when query typed
  const filteredUsers = userSearchText.trim().length < 1 ? [] :
    usersList.filter(u => {
      const q = userSearchText.toLowerCase();
      return (u.name || '').toLowerCase().includes(q)
          || (u.email || '').toLowerCase().includes(q)
          || (u.studentId || '').toLowerCase().includes(q)
          || (u.portalId || '').toLowerCase().includes(q);
    }).slice(0, 50);

  // Target display for admin card
  const getTargetDisplay = (a) => {
    try {
      const parsed = JSON.parse(a.targetRoles || '["ALL"]');
      const roles   = parsed.filter(t => !t.startsWith('USER_') && !t.startsWith('BATCH_'));
      const batchEs = parsed.filter(t => t.startsWith('BATCH_'));
      const userCnt = parsed.filter(t => t.startsWith('USER_')).length;
      const parts = [];
      if (roles.length) parts.push(roles.map(r => r === 'ALL' ? 'All Users' : r.replace('ROLE_', '')).join(', '));
      if (batchEs.length) {
        parts.push(batchEs.map(bt => {
          const bId = +bt.split('_')[1];
          const bo  = batches.find(b => b.id === bId);
          return bo ? bo.batchName : `Batch #${bId}`;
        }).join(', '));
      }
      if (a.batchId && batchEs.length === 0) parts.push(`Batch: ${a.batchName || a.batchId}`);
      if (userCnt > 0) parts.push(`+${userCnt} individual(s)`);
      return parts.join(' + ') || 'None';
    } catch { return a.targetRoles || 'Unknown'; }
  };

  const hasNoTarget = selectedRoles.length === 0 && selectedBatches.length === 0 && selectedUsers.length === 0;

  return (
    <div className="admin-page">
      {/* ── Header ── */}
      <div className="page-header">
        <div className="header-left">
          <div className="icon-wrapper bg-blue"><FaBullhorn /></div>
          <div>
            <h1>Announcements</h1>
            <p className="page-subtitle">Publish targeted alerts for roles, batches, or individuals</p>
          </div>
        </div>
        <button className="primary-btn" onClick={openNew}><FaPlus /> Post Announcement</button>
      </div>

      {/* ── Feedback bar ── */}
      {msg && (
        <div className={`alert-msg ${msg.type === 'ok' ? 'alert-success' : 'alert-error'}`}>
          {msg.text}
        </div>
      )}

      {/* ── Announcements grid ── */}
      <div className="announcements-grid">
        {loading ? (
          <div className="loading-state">Loading...</div>
        ) : announcements.length === 0 ? (
          <p className="text-muted">No announcements found.</p>
        ) : (
          announcements.map(a => (
            <div className="announcement-card" key={a.id}>
              <div className="acard-header">
                <h3>{a.title}</h3>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {!!a.isPopup && <span className="badge badge-red">Popup</span>}
                </div>
              </div>
              <p className="acard-content" style={{ whiteSpace: 'pre-wrap' }}>{a.content}</p>
              <div className="acard-meta">
                <span><strong>Targets:</strong> {getTargetDisplay(a)}</span>
                <span><strong>Posted by:</strong> {a.createdByName || 'Admin'}</span>
                <span><strong>Posted:</strong> {a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}</span>
                <span><strong>Expires:</strong> {a.expiresAt ? new Date(a.expiresAt).toLocaleDateString() : 'Never'}</span>
                {a.link && <span className="acard-link"><a href={a.link} target="_blank" rel="noreferrer">Open Resource</a></span>}
              </div>
              <div className="acard-actions">
                <button className="action-btn" onClick={() => openEdit(a)}><FaEdit /> Edit</button>
                <button className="action-btn text-red" onClick={() => handleDelete(a.id)}><FaTrash /> Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '740px' }}>
            <div className="modal-header">
              <h2>{editId ? 'Edit' : 'Post'} Target Announcement</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body" style={{ maxHeight: '85vh', overflowY: 'auto' }}>

              {/* ── 1. Message Details ── */}
              <div className="target-section-box">
                <h4>1. Message Details</h4>
                <div className="form-group" style={{ marginTop: '10px' }}>
                  <label>Title *</label>
                  <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title..." />
                </div>
                <div className="form-group">
                  <label>Message Content *</label>
                  <textarea
                    required rows="5" value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Write your message... (supports emojis and line breaks)"
                    style={{ whiteSpace: 'pre-wrap', resize: 'vertical' }}
                  />
                </div>
                <div className="form-group">
                  <label>External Resource Link (Optional)</label>
                  <input type="url" placeholder="https://example.com" value={link} onChange={e => setLink(e.target.value)} />
                </div>
              </div>

              {/* ── 2. Target Audience ── */}
              <div className="target-section-box" style={{ marginTop: '20px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc' }}>
                <h4 style={{ marginBottom: '6px' }}>2. Target Audience</h4>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                  Combine any of the options below — announcements go to everyone matched by ANY selected option.
                </p>

                {/* Roles */}
                <div className="form-group">
                  <label style={{ fontWeight: '600', marginBottom: '8px' }}>Select by Role:</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {rolesOptions.map(role => {
                      const checked = selectedRoles.includes(role.id);
                      return (
                        <label key={role.id} className={`role-checkbox-label${checked ? ' selected' : ''}`}>
                          <input
                            type="checkbox" checked={checked}
                            onChange={() => handleRoleToggle(role.id)}
                            style={{ width: 'auto' }}
                          />
                          {role.label}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Batches */}
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label style={{ fontWeight: '600', marginBottom: '8px' }}>Select Batches (targets students in those batches):</label>
                  {batches.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#94a3b8' }}>No batches available.</p>
                  ) : (
                    <div className="batch-select-list">
                      {batches.map(b => {
                        const isSel = selectedBatches.some(sb => sb.id === b.id);
                        return (
                          <label key={b.id} className={`batch-checkbox-label${isSel ? ' selected' : ''}`}>
                            <input
                              type="checkbox" checked={isSel}
                              onChange={() => handleBatchToggle(b)}
                              style={{ width: 'auto' }}
                            />
                            <span>
                              {b.batchName}
                              <span style={{ color: '#94a3b8', marginLeft: '4px' }}>({b.batchId})</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {selectedBatches.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selectedBatches.map(b => (
                        <span key={b.id} className="selected-tag tag-green">
                          {b.batchName}
                          <span className="tag-remove" onClick={() => handleBatchToggle(b)}>&times;</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Individual users */}
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label style={{ fontWeight: '600', marginBottom: '4px' }}>Target Specific Individuals (Optional):</label>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                    Search by name, email, or student/employee ID.
                  </p>
                  <input
                    type="text" placeholder="Type to search users..."
                    value={userSearchText} onChange={e => setUserSearchText(e.target.value)}
                    style={{ marginBottom: '8px' }}
                  />
                  {userSearchText.trim().length > 0 && (
                    <div className="user-search-results">
                      {filteredUsers.length === 0 ? (
                        <div style={{ padding: '10px', fontSize: '13px', color: '#64748b' }}>
                          No users found for "{userSearchText}".
                        </div>
                      ) : filteredUsers.map(u => {
                        const isSel = selectedUsers.some(su => su.id === u.id);
                        return (
                          <div key={u.id} className={`user-result-row${isSel ? ' selected' : ''}`} onClick={() => handleUserToggle(u)}>
                            <span>
                              <strong>{u.name || 'Unknown'}</strong>
                              <span style={{ color: '#94a3b8' }}> — {u.email}</span>
                              <span style={{ color: '#cbd5e1', marginLeft: '4px' }}>
                                [{(u.role?.roleName || u.role || '').toString().replace('ROLE_', '')}]
                              </span>
                              {u.studentId && <span style={{ color: '#94a3b8' }}> {u.studentId}</span>}
                            </span>
                            {isSel && <span style={{ color: '#3b82f6', fontWeight: 'bold', flexShrink: 0 }}>✓ Added</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {selectedUsers.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600' }}>Selected Individuals:</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginTop: '5px' }}>
                        {selectedUsers.map(su => (
                          <span key={su.id} className="selected-tag tag-blue">
                            {su.name}
                            <span className="tag-remove" onClick={() => handleUserToggle(su)}>&times;</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {hasNoTarget && (
                  <p style={{ color: '#f59e0b', fontSize: '12px', marginTop: '10px', fontWeight: '600' }}>
                    ⚠ Select at least one role, batch, or individual to target.
                  </p>
                )}
              </div>

              {/* ── 3. Post Settings ── */}
              <div className="target-section-box" style={{ marginTop: '20px' }}>
                <h4>3. Post Settings</h4>
                <div className="form-group" style={{ marginTop: '10px' }}>
                  <label>Expiry Date &amp; Time (Optional)</label>
                  <input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                  <input
                    type="checkbox" id="isp" checked={isPopup}
                    onChange={e => setIsPopup(e.target.checked)}
                    style={{ width: 'auto', cursor: 'pointer' }}
                  />
                  <label htmlFor="isp" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '14px' }}>
                    Show as Dashboard Popup Banner when recipients log in
                  </label>
                </div>
              </div>

              {/* ── 4. Live Preview ── */}
              {(title || content) && (
                <div className="target-section-box" style={{ marginTop: '20px' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <FaEye /> 4. Preview — how it appears on recipient portals
                  </h4>
                  <div className="ann-preview-card">
                    <div className="ann-preview-header">
                      <strong className="ann-preview-title">{title || 'Announcement Title'}</strong>
                      <span className="ann-preview-date">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <p className="ann-preview-content">{content || 'Your message will appear here...'}</p>
                    <div className="ann-preview-footer">
                      <span>Posted by: <strong>{currentUserName}</strong></span>
                      {link && <span className="ann-preview-link-btn">Open Resource</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Error inside modal */}
              {msg && msg.type === 'err' && (
                <div style={{ color: 'white', background: '#ef4444', padding: '10px', borderRadius: '6px', marginTop: '14px', fontSize: '14px' }}>
                  {msg.text}
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={hasNoTarget}>
                  {editId ? 'Update & Save Targets' : 'Broadcast Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
