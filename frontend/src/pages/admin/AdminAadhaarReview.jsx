import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import './AdminAadhaarReview.css';

export default function AdminAadhaarReview() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);   // { student, url }
  const [rejectModal, setRejectModal] = useState(null); // student
  const [rejectReason, setRejectReason] = useState('');
  const [msg, setMsg] = useState(null);
  const [actionId, setActionId] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/aadhaar-reviews');
      setPending(r.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const showMsg = (text, type = 'ok') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleApprove = async (student) => {
    setActionId(student.studentId);
    try {
      await api.put(`/admin/aadhaar-reviews/${student.studentId}/approve`);
      showMsg(`✅ Aadhaar verified for ${student.name}`);
      setPreview(null);
      fetch();
    } catch (e) {
      showMsg('Failed to approve. Try again.', 'err');
    } finally { setActionId(null); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionId(rejectModal.studentId);
    try {
      await api.put(`/admin/aadhaar-reviews/${rejectModal.studentId}/reject`, {
        reason: rejectReason || 'Document was unclear or invalid.',
      });
      showMsg(`❌ Aadhaar rejected for ${rejectModal.name}. Student notified.`);
      setRejectModal(null);
      setRejectReason('');
      setPreview(null);
      fetch();
    } catch (e) {
      showMsg('Failed to reject. Try again.', 'err');
    } finally { setActionId(null); }
  };

  const isImage = (url) => url && /\.(jpg|jpeg|png|webp|gif)/i.test(url);
  const isPdf   = (url) => url && /\.pdf/i.test(url);

  return (
    <div className="aar-page">

      {/* ── Header ── */}
      <div className="aar-header">
        <div className="aar-header__left">
          <div className="aar-header__icon">🪪</div>
          <div>
            <h1 className="aar-header__title">Aadhaar Review</h1>
            <p className="aar-header__sub">Students waiting for manual Aadhaar verification</p>
          </div>
        </div>
        <div className="aar-header__right">
          <span className="aar-count-badge">{loading ? '…' : pending.length} pending</span>
          <button className="aar-refresh-btn" onClick={fetch}>↻ Refresh</button>
        </div>
      </div>

      {msg && (
        <div className={`aar-msg ${msg.type === 'ok' ? 'aar-msg--ok' : 'aar-msg--err'}`}>
          {msg.text}
        </div>
      )}

      {/* ── Info Banner ── */}
      <div className="aar-info-banner">
        <span className="aar-info-icon">ℹ️</span>
        <p>These students uploaded a scanned Aadhaar copy for manual review. Open the image, confirm it's valid, then <strong>Approve</strong> or <strong>Reject</strong>. The student gets a notification either way.</p>
      </div>

      {/* ── Pending List ── */}
      {loading ? (
        <div className="aar-list">
          {[1,2,3].map(i => <div key={i} className="aar-skeleton" />)}
        </div>
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
              <div className="aar-card__left">
                <div className="aar-avatar">
                  {student.name?.charAt(0).toUpperCase()}
                </div>
                <div className="aar-card__info">
                  <h3 className="aar-card__name">{student.name}</h3>
                  <p className="aar-card__meta">{student.email}</p>
                  {student.phone && <p className="aar-card__meta">📞 {student.phone}</p>}
                  {student.portalId && <p className="aar-card__id">ID: {student.portalId}</p>}
                </div>
              </div>

              <div className="aar-card__thumb" onClick={() => setPreview({ student, url: student.aadharCardUrl })}>
                {isImage(student.aadharCardUrl) ? (
                  <img src={student.aadharCardUrl} alt="Aadhaar" className="aar-thumb-img" />
                ) : (
                  <div className="aar-thumb-pdf">
                    <span>📄</span>
                    <span>PDF</span>
                  </div>
                )}
                <div className="aar-thumb-overlay">
                  <span>👁 View</span>
                </div>
              </div>

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

      {/* ── Document Preview Modal ── */}
      {preview && (
        <div className="aar-overlay" onClick={() => setPreview(null)}>
          <div className="aar-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="aar-preview-header">
              <div>
                <h2 className="aar-preview-name">{preview.student.name}</h2>
                <p className="aar-preview-sub">{preview.student.email} · ID: {preview.student.portalId || '—'}</p>
              </div>
              <button className="aar-close" onClick={() => setPreview(null)}>✕</button>
            </div>

            <div className="aar-preview-body">
              {isImage(preview.url) ? (
                <img src={preview.url} alt="Aadhaar Card" className="aar-preview-img" />
              ) : isPdf(preview.url) ? (
                <iframe src={preview.url} title="Aadhaar PDF" className="aar-preview-iframe" />
              ) : (
                <div className="aar-preview-unknown">
                  <span>📎</span>
                  <a href={preview.url} target="_blank" rel="noreferrer" className="aar-doc-link">
                    Open Document →
                  </a>
                </div>
              )}
            </div>

            <div className="aar-preview-actions">
              <a href={preview.url} target="_blank" rel="noreferrer" className="aar-btn aar-btn--view">
                ↗ Open in New Tab
              </a>
              <button className="aar-btn aar-btn--reject"
                onClick={() => { setRejectModal(preview.student); setPreview(null); setRejectReason(''); }}>
                ❌ Reject
              </button>
              <button className="aar-btn aar-btn--approve"
                disabled={actionId === preview.student.studentId}
                onClick={() => handleApprove(preview.student)}>
                {actionId === preview.student.studentId ? 'Processing…' : '✅ Approve & Verify'}
              </button>
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
              Rejecting Aadhaar for <strong>{rejectModal.name}</strong>. The uploaded file will be removed and the student will be notified.
            </p>
            <div className="aar-reject-form">
              <label>Rejection Reason (sent to student)</label>
              <textarea
                rows={3}
                className="aar-textarea"
                placeholder="e.g. Image is blurry, wrong document uploaded, name doesn't match..."
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
