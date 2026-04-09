import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import './AdminAadhaarReview.css';

const SOURCE_LABEL = {
  OFFLINE_XML:   { text: 'Offline eKYC',   color: '#0284c7', bg: '#e0f2fe' },
  DIGILOCKER_OAUTH: { text: 'DigiLocker',  color: '#7c3aed', bg: '#ede9fe' },
  ADMIN_MANUAL:  { text: 'Admin Approved', color: '#059669', bg: '#d1fae5' },
};

function sourceBadge(source) {
  const cfg = SOURCE_LABEL[source] || { text: source || 'Verified', color: '#64748b', bg: '#f1f5f9' };
  return (
    <span className="aar-source-badge" style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.text}
    </span>
  );
}

function fmtDate(str) {
  if (!str) return '—';
  try {
    return new Date(str).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return str; }
}

export default function AdminAadhaarReview() {
  const [tab, setTab]               = useState('pending');  // 'pending' | 'collected'
  const [pending, setPending]       = useState([]);
  const [collected, setCollected]   = useState([]);
  const [loadingP, setLoadingP]     = useState(true);
  const [loadingC, setLoadingC]     = useState(true);
  const [preview, setPreview]       = useState(null);       // { student, url }
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [msg, setMsg]               = useState(null);
  const [actionId, setActionId]     = useState(null);
  const [search, setSearch]         = useState('');

  const fetchPending = async () => {
    setLoadingP(true);
    try { const r = await api.get('/admin/aadhaar-reviews'); setPending(r.data || []); }
    catch (e) { console.error(e); }
    finally { setLoadingP(false); }
  };

  const fetchCollected = async () => {
    setLoadingC(true);
    try { const r = await api.get('/admin/aadhaar-collected'); setCollected(r.data || []); }
    catch (e) { console.error(e); }
    finally { setLoadingC(false); }
  };

  useEffect(() => { fetchPending(); fetchCollected(); }, []);

  const showMsg = (text, type = 'ok') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4500);
  };

  const handleApprove = async (student) => {
    setActionId(student.studentId);
    try {
      await api.put(`/admin/aadhaar-reviews/${student.studentId}/approve`);
      showMsg(`✅ Aadhaar approved for ${student.name}`);
      setPreview(null);
      fetchPending();
      fetchCollected();
    } catch { showMsg('Failed to approve. Try again.', 'err'); }
    finally { setActionId(null); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionId(rejectModal.studentId);
    try {
      await api.put(`/admin/aadhaar-reviews/${rejectModal.studentId}/reject`, {
        reason: rejectReason || 'Document was unclear or invalid.',
      });
      showMsg(`❌ Aadhaar rejected for ${rejectModal.name}. Student notified.`);
      setRejectModal(null); setRejectReason(''); setPreview(null);
      fetchPending(); fetchCollected();
    } catch { showMsg('Failed to reject. Try again.', 'err'); }
    finally { setActionId(null); }
  };

  const isImage = (url) => url && /\.(jpg|jpeg|png|webp|gif)/i.test(url);
  const isPdf   = (url) => url && /\.pdf/i.test(url);

  const filteredCollected = collected.filter(s => {
    const q = search.toLowerCase();
    return !q || s.name?.toLowerCase().includes(q)
              || s.email?.toLowerCase().includes(q)
              || s.portalId?.toLowerCase?.().includes(q);
  });

  return (
    <div className="aar-page">

      {/* ── Header ── */}
      <div className="aar-header">
        <div className="aar-header__left">
          <div className="aar-header__icon">🪪</div>
          <div>
            <h1 className="aar-header__title">Aadhaar Management</h1>
            <p className="aar-header__sub">Review pending uploads &amp; view all collected Aadhaar cards</p>
          </div>
        </div>
        <div className="aar-header__right">
          <span className="aar-count-badge aar-count-badge--pending">
            {loadingP ? '…' : pending.length} pending
          </span>
          <span className="aar-count-badge aar-count-badge--verified">
            {loadingC ? '…' : collected.length} verified
          </span>
          <button className="aar-refresh-btn" onClick={() => { fetchPending(); fetchCollected(); }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {msg && (
        <div className={`aar-msg ${msg.type === 'ok' ? 'aar-msg--ok' : 'aar-msg--err'}`}>
          {msg.text}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="aar-tabs">
        <button
          className={`aar-tab ${tab === 'pending' ? 'aar-tab--active' : ''}`}
          onClick={() => setTab('pending')}
        >
          ⏳ Pending Approval
          {pending.length > 0 && <span className="aar-tab-dot">{pending.length}</span>}
        </button>
        <button
          className={`aar-tab ${tab === 'collected' ? 'aar-tab--active' : ''}`}
          onClick={() => setTab('collected')}
        >
          🗂 Collected Aadhaar Cards
          <span className="aar-tab-count">{collected.length}</span>
        </button>
      </div>

      {/* ════════════════════════════════
          TAB 1 — PENDING APPROVAL
      ════════════════════════════════ */}
      {tab === 'pending' && (
        <div className="aar-section">
          <div className="aar-info-banner">
            <span>ℹ️</span>
            <p>
              These students uploaded a scanned Aadhaar copy and are waiting for manual verification.
              Open the document, confirm it's a valid Aadhaar card, then <strong>Approve</strong> or <strong>Reject</strong>.
              The student gets a notification either way.
            </p>
          </div>

          {loadingP ? (
            <div className="aar-list">{[1,2,3].map(i => <div key={i} className="aar-skeleton" />)}</div>
          ) : pending.length === 0 ? (
            <div className="aar-empty">
              <span className="aar-empty__icon">✅</span>
              <h3>All Clear!</h3>
              <p>No pending Aadhaar verifications right now.</p>
            </div>
          ) : (
            <div className="aar-list">
              {pending.map(student => (
                <div className="aar-card" key={student.studentId}>

                  {/* Left — student info */}
                  <div className="aar-card__left">
                    <div className="aar-avatar">{student.name?.charAt(0).toUpperCase()}</div>
                    <div className="aar-card__info">
                      <h3 className="aar-card__name">{student.name}</h3>
                      <p className="aar-card__meta">{student.email}</p>
                      {student.phone && <p className="aar-card__meta">📞 {student.phone}</p>}
                      {student.portalId && <p className="aar-card__id">🆔 {student.portalId}</p>}
                    </div>
                  </div>

                  {/* Centre — document thumbnail */}
                  <div className="aar-card__thumb" onClick={() => setPreview({ student, url: student.aadharCardUrl })}>
                    {isImage(student.aadharCardUrl) ? (
                      <img src={student.aadharCardUrl} alt="Aadhaar" className="aar-thumb-img" />
                    ) : (
                      <div className="aar-thumb-pdf"><span>📄</span><span>ZIP / PDF</span></div>
                    )}
                    <div className="aar-thumb-overlay"><span>👁 View</span></div>
                  </div>

                  {/* Right — actions */}
                  <div className="aar-card__actions">
                    <button className="aar-btn aar-btn--view"
                      onClick={() => setPreview({ student, url: student.aadharCardUrl })}>
                      👁 Open Document
                    </button>
                    <button className="aar-btn aar-btn--approve"
                      disabled={actionId === student.studentId}
                      onClick={() => handleApprove(student)}>
                      {actionId === student.studentId ? '…' : '✅ Approve'}
                    </button>
                    <button className="aar-btn aar-btn--reject"
                      disabled={actionId === student.studentId}
                      onClick={() => { setRejectModal(student); setRejectReason(''); }}>
                      ❌ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════
          TAB 2 — COLLECTED AADHAAR CARDS
      ════════════════════════════════ */}
      {tab === 'collected' && (
        <div className="aar-section">
          <div className="aar-info-banner aar-info-banner--green">
            <span>🗂</span>
            <p>
              All students whose Aadhaar has been verified — via Offline eKYC ZIP, DigiLocker OAuth, or manual admin approval.
              Click <strong>View Card</strong> to see the uploaded document.
            </p>
          </div>

          {/* Search */}
          <div className="aar-search-row">
            <input
              type="text"
              className="aar-search"
              placeholder="Search by name, email or student ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="aar-search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          {loadingC ? (
            <div className="aar-table-wrap">
              {[1,2,3,4].map(i => <div key={i} className="aar-skeleton" />)}
            </div>
          ) : filteredCollected.length === 0 ? (
            <div className="aar-empty">
              <span className="aar-empty__icon">{search ? '🔍' : '📭'}</span>
              <h3>{search ? 'No match found' : 'No verified Aadhaar cards yet'}</h3>
              <p>{search ? 'Try a different search term.' : 'Verified students will appear here.'}</p>
            </div>
          ) : (
            <div className="aar-table-wrap">
              <table className="aar-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Portal ID</th>
                    <th>Verification Method</th>
                    <th>Verified On</th>
                    <th>Aadhaar Name</th>
                    <th>Document</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCollected.map(s => (
                    <tr key={s.studentId}>
                      <td>
                        <div className="aar-tbl-student">
                          <div className="aar-tbl-avatar">{s.name?.charAt(0).toUpperCase()}</div>
                          <div>
                            <div className="aar-tbl-name">{s.name}</div>
                            <div className="aar-tbl-email">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="aar-portal-id">{s.portalId || '—'}</span></td>
                      <td>{sourceBadge(s.aadhaarVerificationSource)}</td>
                      <td className="aar-tbl-date">{fmtDate(s.aadharVerifiedAt)}</td>
                      <td className="aar-tbl-aname">{s.aadharName || '—'}</td>
                      <td>
                        {s.aadharCardUrl ? (
                          <button
                            className="aar-btn aar-btn--view aar-btn--sm"
                            onClick={() => setPreview({ student: s, url: s.aadharCardUrl })}
                          >
                            👁 View Card
                          </button>
                        ) : (
                          <span className="aar-no-doc">No file</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="aar-table-footer">
                Showing {filteredCollected.length} of {collected.length} verified students
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Document Preview Modal ── */}
      {preview && (
        <div className="aar-overlay" onClick={() => setPreview(null)}>
          <div className="aar-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="aar-preview-header">
              <div>
                <h2 className="aar-preview-name">{preview.student.name}</h2>
                <p className="aar-preview-sub">
                  {preview.student.email}
                  {preview.student.portalId && ` · ID: ${preview.student.portalId}`}
                  {preview.student.aadhaarVerificationSource && (
                    <> · {sourceBadge(preview.student.aadhaarVerificationSource)}</>
                  )}
                </p>
              </div>
              <button className="aar-close" onClick={() => setPreview(null)}>✕</button>
            </div>

            <div className="aar-preview-body">
              {isImage(preview.url) ? (
                <img src={preview.url} alt="Aadhaar Card" className="aar-preview-img" />
              ) : isPdf(preview.url) ? (
                <iframe src={preview.url} title="Aadhaar PDF" className="aar-preview-iframe" />
              ) : preview.url ? (
                <div className="aar-preview-unknown">
                  <div className="aar-preview-zip-icon">📦</div>
                  <p>This is an Offline eKYC ZIP file (not directly viewable).</p>
                  <a href={preview.url} target="_blank" rel="noreferrer" className="aar-btn aar-btn--view">
                    ⬇ Download ZIP
                  </a>
                </div>
              ) : (
                <div className="aar-preview-unknown">
                  <span>📎</span>
                  <p>No document URL available.</p>
                </div>
              )}
            </div>

            <div className="aar-preview-actions">
              {preview.url && (
                <a href={preview.url} target="_blank" rel="noreferrer" className="aar-btn aar-btn--view">
                  ↗ Open in New Tab
                </a>
              )}
              {/* Only show approve/reject if student is still pending */}
              {preview.student.isAadharVerified === false && (
                <>
                  <button className="aar-btn aar-btn--reject"
                    onClick={() => { setRejectModal(preview.student); setPreview(null); setRejectReason(''); }}>
                    ❌ Reject
                  </button>
                  <button className="aar-btn aar-btn--approve"
                    disabled={actionId === preview.student.studentId}
                    onClick={() => handleApprove(preview.student)}>
                    {actionId === preview.student.studentId ? 'Processing…' : '✅ Approve & Verify'}
                  </button>
                </>
              )}
              {preview.student.isAadharVerified === true && (
                <span className="aar-already-verified">✅ Already Verified</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Reason Modal ── */}
      {rejectModal && (
        <div className="aar-overlay" onClick={() => setRejectModal(null)}>
          <div className="aar-reject-modal" onClick={e => e.stopPropagation()}>
            <h2 className="aar-reject-title">❌ Reject Aadhaar Upload</h2>
            <p className="aar-reject-sub">
              Rejecting for <strong>{rejectModal.name}</strong>. The file will be removed and the student notified.
            </p>
            <div className="aar-reject-reasons">
              {['Image is blurry or unclear', 'Wrong document uploaded', 'Name doesn\'t match profile', 'Aadhaar number not visible', 'Suspected tampering'].map(r => (
                <button key={r} className={`aar-reason-chip ${rejectReason === r ? 'aar-reason-chip--active' : ''}`}
                  onClick={() => setRejectReason(r)}>
                  {r}
                </button>
              ))}
            </div>
            <div className="aar-reject-form">
              <label>Or type a custom reason:</label>
              <textarea
                rows={3}
                className="aar-textarea"
                placeholder="Custom rejection reason…"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
            </div>
            <div className="aar-reject-actions">
              <button className="aar-btn aar-btn--view" onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="aar-btn aar-btn--reject" onClick={handleReject}
                disabled={actionId === rejectModal.studentId}>
                {actionId === rejectModal.studentId ? 'Rejecting…' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
