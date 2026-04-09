import { useState, useEffect, useRef } from 'react';
import api from '../../api/axiosConfig';
import './CounselorLeads.css';

const PIPELINE = [
  { key: 'NEW',           label: 'New',         color: '#6366f1', bg: '#eef2ff' },
  { key: 'CONTACTED',     label: 'Contacted',   color: '#0ea5e9', bg: '#e0f2fe' },
  { key: 'INTERESTED',    label: 'Interested',  color: '#f59e0b', bg: '#fef3c7' },
  { key: 'DEMO_BOOKED',   label: 'Demo Booked', color: '#8b5cf6', bg: '#f5f3ff' },
  { key: 'ENROLLED',      label: 'Enrolled',    color: '#10b981', bg: '#d1fae5' },
  { key: 'LOST',          label: 'Lost',        color: '#ef4444', bg: '#fee2e2' },
];

const PRIORITY_COLOR = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#94a3b8' };
const PRIORITY_ICON  = { HIGH: '🔥', MEDIUM: '⭐', LOW: '❄️' };

export default function CounselorLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const [activeLead, setActiveLead] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [notes, setNotes]     = useState([]);
  const [noteForm, setNoteForm] = useState({ noteText: '', callOutcome: 'ANSWERED', callDurationMinutes: '' });
  const [statusForm, setStatusForm] = useState({ status: '', nextFollowupDate: '', demoScheduledAt: '' });
  const [msg, setMsg]   = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('notes');

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const r = await api.get('/counselor/leads');
      setLeads(r.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeads(); }, []);

  const openDetail = async (lead) => {
    setActiveLead({ ...lead });
    setStatusForm({ status: lead.status, nextFollowupDate: lead.nextFollowupDate || '', demoScheduledAt: '' });
    setNoteForm({ noteText: '', callOutcome: 'ANSWERED', callDurationMinutes: '' });
    setMsg(null);
    setActiveTab('notes');
    setShowDetail(true);
    // Load notes
    try {
      const r = await api.get(`/counselor/leads/${lead.id}/notes`);
      setNotes(r.data || []);
    } catch (e) { setNotes([]); }
  };

  const handleStatusUpdate = async () => {
    setSaving(true); setMsg(null);
    try {
      await api.put(`/counselor/leads/${activeLead.id}/status`, statusForm);
      setMsg({ type: 'ok', text: 'Status updated!' });
      await fetchLeads();
      setActiveLead(prev => ({ ...prev, status: statusForm.status }));
    } catch (e) {
      setMsg({ type: 'err', text: 'Update failed.' });
    } finally { setSaving(false); }
  };

  const handleFollowup = async () => {
    setSaving(true); setMsg(null);
    try {
      await api.put(`/counselor/leads/${activeLead.id}/followup`, {
        nextFollowupDate: statusForm.nextFollowupDate,
      });
      setMsg({ type: 'ok', text: 'Follow-up scheduled!' });
      await fetchLeads();
    } catch (e) {
      setMsg({ type: 'err', text: 'Failed to set follow-up.' });
    } finally { setSaving(false); }
  };

  const handleAddNote = async () => {
    if (!noteForm.noteText.trim()) return;
    setSaving(true); setMsg(null);
    try {
      await api.post(`/counselor/leads/${activeLead.id}/notes`, noteForm);
      setMsg({ type: 'ok', text: 'Note logged!' });
      const r = await api.get(`/counselor/leads/${activeLead.id}/notes`);
      setNotes(r.data || []);
      setNoteForm({ noteText: '', callOutcome: 'ANSWERED', callDurationMinutes: '' });
      await fetchLeads();
    } catch (e) {
      setMsg({ type: 'err', text: 'Failed to add note.' });
    } finally { setSaving(false); }
  };

  const waLink = (phone) => `https://wa.me/91${(phone || '').replace(/\D/g, '')}`;

  const filtered = leads.filter(l => {
    const matchFilter = filter === 'ALL' || l.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || l.name?.toLowerCase().includes(q) || l.phone?.includes(q)
      || l.courseInterest?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="crl-page">

      {/* ── Page Header ── */}
      <div className="crl-header">
        <div className="crl-header__left">
          <div className="crl-header__icon">🎯</div>
          <div>
            <h1 className="crl-header__title">My Leads Pipeline</h1>
            <p className="crl-header__sub">Call · Follow-up · Convert</p>
          </div>
        </div>
        <div className="crl-header__right">
          <span className="crl-total-badge">{leads.length} leads assigned</span>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="crl-filters">
        <div className="crl-search-wrap">
          <span className="crl-search-icon">🔍</span>
          <input
            className="crl-search"
            placeholder="Search by name, phone, course..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="crl-tabs">
          {[{ key: 'ALL', label: 'All' }, ...PIPELINE].map(p => (
            <button
              key={p.key}
              className={`crl-tab ${filter === p.key ? 'active' : ''}`}
              onClick={() => setFilter(p.key)}
              style={filter === p.key && p.color ? { borderColor: p.color, color: p.color } : {}}
            >
              {p.label}
              {p.key !== 'ALL' && (
                <span className="crl-tab-count">{leads.filter(l => l.status === p.key).length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Leads Grid ── */}
      {loading ? (
        <div className="crl-grid">
          {[1,2,3,4,5,6].map(i => <div key={i} className="crl-skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="crl-empty">
          <span className="crl-empty__icon">📭</span>
          <p>No leads found. {filter !== 'ALL' ? 'Try changing the filter.' : 'Marketer will assign leads to you.'}</p>
        </div>
      ) : (
        <div className="crl-grid">
          {filtered.map(lead => {
            const stage = PIPELINE.find(p => p.key === lead.status) || PIPELINE[0];
            const isOverdue = lead.nextFollowupDate && lead.nextFollowupDate < today;
            const isDueToday = lead.nextFollowupDate === today;
            return (
              <div
                className={`crl-card ${isOverdue ? 'crl-card--overdue' : ''} ${isDueToday ? 'crl-card--today' : ''}`}
                key={lead.id}
                onClick={() => openDetail(lead)}
              >
                <div className="crl-card__top">
                  <div className="crl-card__avatar" style={{ background: PRIORITY_COLOR[lead.priority] }}>
                    {lead.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="crl-stage-pill" style={{ background: stage.bg, color: stage.color }}>
                    {stage.label}
                  </span>
                </div>

                <div className="crl-card__body">
                  <h3 className="crl-card__name">{lead.name}</h3>
                  {lead.courseInterest && <p className="crl-card__course">{lead.courseInterest}</p>}
                  <p className="crl-card__phone">📞 {lead.phone}</p>
                </div>

                <div className="crl-card__meta">
                  <span className="crl-priority-dot" style={{ color: PRIORITY_COLOR[lead.priority] }}>
                    {PRIORITY_ICON[lead.priority]} {lead.priority}
                  </span>
                  {lead.nextFollowupDate && (
                    <span className={`crl-followup-tag ${isOverdue ? 'overdue' : isDueToday ? 'today' : ''}`}>
                      {isOverdue ? '⚠️ Overdue' : isDueToday ? '🔔 Today' : `📅 ${lead.nextFollowupDate}`}
                    </span>
                  )}
                </div>

                <div className="crl-card__actions" onClick={e => e.stopPropagation()}>
                  <a href={`tel:${lead.phone}`} className="crl-quick-btn crl-quick-btn--call">📞 Call</a>
                  <a href={waLink(lead.whatsappNumber || lead.phone)} target="_blank" rel="noreferrer"
                     className="crl-quick-btn crl-quick-btn--wa">💬 WhatsApp</a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Lead Detail Drawer ── */}
      {showDetail && activeLead && (
        <div className="crl-overlay" onClick={() => setShowDetail(false)}>
          <div className="crl-drawer" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="crl-drawer__header">
              <div>
                <h2 className="crl-drawer__name">{activeLead.name}</h2>
                <p className="crl-drawer__sub">{activeLead.courseInterest || 'No course specified'}</p>
              </div>
              <button className="crl-close" onClick={() => setShowDetail(false)}>✕</button>
            </div>

            {/* Contact Quick-Actions */}
            <div className="crl-drawer__contact">
              <a href={`tel:${activeLead.phone}`} className="crl-contact-btn crl-contact-btn--call">
                📞 {activeLead.phone}
              </a>
              <a href={waLink(activeLead.whatsappNumber || activeLead.phone)} target="_blank" rel="noreferrer"
                 className="crl-contact-btn crl-contact-btn--wa">
                💬 WhatsApp
              </a>
              {activeLead.email && (
                <a href={`mailto:${activeLead.email}`} className="crl-contact-btn crl-contact-btn--email">
                  ✉️ {activeLead.email}
                </a>
              )}
            </div>

            {/* Info Grid */}
            <div className="crl-drawer__info">
              <div className="crl-info-item">
                <span className="crl-info-label">Source</span>
                <span className="crl-info-val">{activeLead.source || '—'}</span>
              </div>
              <div className="crl-info-item">
                <span className="crl-info-label">Priority</span>
                <span className="crl-info-val" style={{ color: PRIORITY_COLOR[activeLead.priority] }}>
                  {PRIORITY_ICON[activeLead.priority]} {activeLead.priority}
                </span>
              </div>
              <div className="crl-info-item">
                <span className="crl-info-label">Lead Date</span>
                <span className="crl-info-val">{activeLead.createdAt?.split('T')[0] || '—'}</span>
              </div>
              {activeLead.lastContactedAt && (
                <div className="crl-info-item">
                  <span className="crl-info-label">Last Contacted</span>
                  <span className="crl-info-val">{new Date(activeLead.lastContactedAt).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            {msg && (
              <div className={`crl-msg ${msg.type === 'ok' ? 'crl-msg--ok' : 'crl-msg--err'}`}>{msg.text}</div>
            )}

            {/* Tabs */}
            <div className="crl-drawer__tabs">
              {['notes', 'status', 'followup'].map(t => (
                <button key={t} className={`crl-dtab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
                  {t === 'notes' ? '📝 Call Notes' : t === 'status' ? '🔄 Update Status' : '📅 Follow-up'}
                </button>
              ))}
            </div>

            {/* Tab: Notes */}
            {activeTab === 'notes' && (
              <div className="crl-drawer__tab-content">
                <div className="crl-note-form">
                  <textarea
                    className="crl-textarea"
                    placeholder="Log what happened on this call..."
                    rows={3}
                    value={noteForm.noteText}
                    onChange={e => setNoteForm({ ...noteForm, noteText: e.target.value })}
                  />
                  <div className="crl-note-row">
                    <select className="crl-select" value={noteForm.callOutcome}
                      onChange={e => setNoteForm({ ...noteForm, callOutcome: e.target.value })}>
                      <option value="ANSWERED">✅ Answered</option>
                      <option value="NO_ANSWER">📵 No Answer</option>
                      <option value="BUSY">⏳ Busy</option>
                      <option value="CALLBACK">🔄 Callback Requested</option>
                      <option value="WHATSAPP_SENT">💬 WhatsApp Sent</option>
                    </select>
                    <input type="number" className="crl-input" placeholder="Duration (min)"
                      value={noteForm.callDurationMinutes}
                      onChange={e => setNoteForm({ ...noteForm, callDurationMinutes: e.target.value })}
                      style={{ width: '130px' }}
                    />
                    <button className="crl-btn crl-btn--primary" onClick={handleAddNote} disabled={saving}>
                      {saving ? '…' : 'Log Note'}
                    </button>
                  </div>
                </div>

                <div className="crl-notes-history">
                  {notes.length === 0 ? (
                    <p className="crl-no-notes">No call notes yet. Log your first interaction above.</p>
                  ) : notes.map(n => (
                    <div className="crl-note-item" key={n.id}>
                      <div className="crl-note-item__header">
                        <span className="crl-note-outcome">{n.callOutcome?.replace('_', ' ')}</span>
                        {n.callDurationMinutes && <span className="crl-note-duration">{n.callDurationMinutes} min</span>}
                        <span className="crl-note-time">{new Date(n.createdAt).toLocaleString('en-IN')}</span>
                      </div>
                      <p className="crl-note-text">{n.noteText}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Status */}
            {activeTab === 'status' && (
              <div className="crl-drawer__tab-content">
                <p className="crl-tab-hint">Move this lead through the conversion pipeline:</p>
                <div className="crl-status-grid">
                  {PIPELINE.map(stage => (
                    <button
                      key={stage.key}
                      className={`crl-status-btn ${statusForm.status === stage.key ? 'active' : ''}`}
                      style={statusForm.status === stage.key
                        ? { background: stage.bg, borderColor: stage.color, color: stage.color }
                        : {}}
                      onClick={() => setStatusForm({ ...statusForm, status: stage.key })}
                    >
                      {stage.label}
                    </button>
                  ))}
                </div>
                {statusForm.status === 'DEMO_BOOKED' && (
                  <div className="crl-form-group">
                    <label>Demo Date & Time</label>
                    <input type="datetime-local" className="crl-input crl-input--full"
                      value={statusForm.demoScheduledAt}
                      onChange={e => setStatusForm({ ...statusForm, demoScheduledAt: e.target.value })}
                    />
                  </div>
                )}
                <button className="crl-btn crl-btn--primary crl-btn--full" onClick={handleStatusUpdate} disabled={saving}>
                  {saving ? 'Saving…' : 'Update Status'}
                </button>
              </div>
            )}

            {/* Tab: Follow-up */}
            {activeTab === 'followup' && (
              <div className="crl-drawer__tab-content">
                <p className="crl-tab-hint">Schedule when to call this lead next:</p>
                <div className="crl-form-group">
                  <label>Next Follow-up Date</label>
                  <input type="date" className="crl-input crl-input--full"
                    value={statusForm.nextFollowupDate}
                    min={today}
                    onChange={e => setStatusForm({ ...statusForm, nextFollowupDate: e.target.value })}
                  />
                </div>
                <button className="crl-btn crl-btn--primary crl-btn--full" onClick={handleFollowup} disabled={saving}>
                  {saving ? 'Saving…' : 'Set Follow-up'}
                </button>
                {activeLead.nextFollowupDate && (
                  <p className="crl-tab-hint" style={{ marginTop: '.75rem' }}>
                    Current: <strong>{activeLead.nextFollowupDate}</strong>
                  </p>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
