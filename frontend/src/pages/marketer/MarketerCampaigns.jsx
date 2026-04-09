import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import './MarketerCampaigns.css';

const CHANNELS = ['FACEBOOK', 'INSTAGRAM', 'GOOGLE', 'WHATSAPP', 'YOUTUBE', 'EMAIL', 'OFFLINE', 'REFERRAL', 'WEBSITE'];
const STATUSES = ['ACTIVE', 'PAUSED', 'ENDED', 'DRAFT'];

const CHANNEL_ICONS = {
  FACEBOOK: '📘', INSTAGRAM: '📷', GOOGLE: '🔍', WHATSAPP: '💬',
  YOUTUBE: '▶️', EMAIL: '✉️', OFFLINE: '🏫', REFERRAL: '🤝', WEBSITE: '🌐',
};
const CHANNEL_COLORS = {
  FACEBOOK: '#1877f2', INSTAGRAM: '#e1306c', GOOGLE: '#ea4335', WHATSAPP: '#25d366',
  YOUTUBE: '#ff0000', EMAIL: '#3b82f6', OFFLINE: '#f59e0b', REFERRAL: '#8b5cf6', WEBSITE: '#0ea5e9',
};
const STATUS_STYLE = {
  ACTIVE: { bg: '#d1fae5', color: '#059669' },
  PAUSED: { bg: '#fef3c7', color: '#d97706' },
  ENDED:  { bg: '#f1f5f9', color: '#64748b' },
  DRAFT:  { bg: '#eff6ff', color: '#3b82f6' },
};

function defaultForm() {
  return {
    name: '', description: '', channel: 'FACEBOOK', status: 'ACTIVE',
    budgetInr: '', targetLeads: '', startDate: '', endDate: '',
  };
}

export default function MarketerCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(defaultForm());
  const [msg, setMsg] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [saving, setSaving] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const r = await api.get('/marketer/campaigns');
      setCampaigns(r.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setMsg(null); setSaving(true);
    try {
      const payload = { ...formData };
      if (!payload.budgetInr) delete payload.budgetInr;
      if (!payload.targetLeads) delete payload.targetLeads;
      if (!payload.startDate) delete payload.startDate;
      if (!payload.endDate) delete payload.endDate;

      if (editId) {
        await api.put(`/marketer/campaigns/${editId}`, payload);
        setMsg({ type: 'ok', text: 'Campaign updated!' });
      } else {
        await api.post('/marketer/campaigns', payload);
        setMsg({ type: 'ok', text: 'Campaign created!' });
      }
      setShowModal(false);
      fetchCampaigns();
    } catch (e) {
      setMsg({ type: 'err', text: e.response?.data?.message || 'Failed to save campaign.' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    try {
      await api.delete(`/marketer/campaigns/${id}`);
      fetchCampaigns();
    } catch (e) { alert('Delete failed.'); }
  };

  const openNew = () => { setEditId(null); setFormData(defaultForm()); setMsg(null); setShowModal(true); };
  const openEdit = (c) => {
    setEditId(c.id);
    setFormData({
      name: c.name || '', description: c.description || '',
      channel: c.channel || 'FACEBOOK', status: c.status || 'ACTIVE',
      budgetInr: c.budgetInr || '', targetLeads: c.targetLeads || '',
      startDate: c.startDate || '', endDate: c.endDate || '',
    });
    setMsg(null); setShowModal(true);
  };

  const filtered = filterStatus === 'ALL' ? campaigns : campaigns.filter(c => c.status === filterStatus);

  // Summary stats
  const totalLeadsAcross = campaigns.reduce((s, c) => s + (c.leadsCount || 0), 0);
  const activeCampaigns  = campaigns.filter(c => c.status === 'ACTIVE').length;
  const totalBudget      = campaigns.reduce((s, c) => s + (c.budgetInr || 0), 0);

  return (
    <div className="mkc-page">

      {/* ── Header ── */}
      <div className="mkc-header">
        <div className="mkc-header__left">
          <div className="mkc-header__icon">📣</div>
          <div>
            <h1 className="mkc-header__title">Campaign Management</h1>
            <p className="mkc-header__sub">Create campaigns · Track performance · Generate leads</p>
          </div>
        </div>
        <button className="mkc-btn mkc-btn--primary" onClick={openNew}>+ New Campaign</button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="mkc-summary">
        <div className="mkc-sum-card mkc-sum-card--blue">
          <span className="mkc-sum-icon">📣</span>
          <div><span className="mkc-sum-val">{campaigns.length}</span><span className="mkc-sum-label">Total Campaigns</span></div>
        </div>
        <div className="mkc-sum-card mkc-sum-card--green">
          <span className="mkc-sum-icon">✅</span>
          <div><span className="mkc-sum-val">{activeCampaigns}</span><span className="mkc-sum-label">Active Now</span></div>
        </div>
        <div className="mkc-sum-card mkc-sum-card--purple">
          <span className="mkc-sum-icon">👥</span>
          <div><span className="mkc-sum-val">{totalLeadsAcross}</span><span className="mkc-sum-label">Leads Generated</span></div>
        </div>
        <div className="mkc-sum-card mkc-sum-card--orange">
          <span className="mkc-sum-icon">💰</span>
          <div><span className="mkc-sum-val">₹{totalBudget >= 1000 ? (totalBudget / 1000).toFixed(1) + 'K' : totalBudget}</span><span className="mkc-sum-label">Total Budget</span></div>
        </div>
      </div>

      {/* ── Filter ── */}
      <div className="mkc-filters">
        {['ALL', ...STATUSES].map(s => {
          const style = s !== 'ALL' && STATUS_STYLE[s];
          return (
            <button key={s}
              className={`mkc-filter-btn ${filterStatus === s ? 'active' : ''}`}
              onClick={() => setFilterStatus(s)}
              style={filterStatus === s && style ? { background: style.bg, color: style.color, borderColor: style.color } : {}}
            >
              {s} {s !== 'ALL' && <span>({campaigns.filter(c => c.status === s).length})</span>}
            </button>
          );
        })}
      </div>

      {/* ── Campaign Cards Grid ── */}
      {loading ? (
        <div className="mkc-grid">{[1,2,3].map(i => <div key={i} className="mkc-skeleton" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="mkc-empty">
          <span>📭</span>
          <p>No campaigns yet. Create your first campaign to start generating leads!</p>
          <button className="mkc-btn mkc-btn--primary" onClick={openNew}>Create Campaign</button>
        </div>
      ) : (
        <div className="mkc-grid">
          {filtered.map(c => {
            const style = STATUS_STYLE[c.status] || STATUS_STYLE.DRAFT;
            const color = CHANNEL_COLORS[c.channel] || '#64748b';
            const leadFillPct = c.targetLeads ? Math.min(100, Math.round((c.leadsCount / c.targetLeads) * 100)) : null;
            return (
              <div className="mkc-card" key={c.id} style={{ borderTop: `4px solid ${color}` }}>
                <div className="mkc-card__header">
                  <div className="mkc-card__channel" style={{ background: color + '20', color }}>
                    {CHANNEL_ICONS[c.channel] || '📣'} {c.channel}
                  </div>
                  <span className="mkc-card__status" style={{ background: style.bg, color: style.color }}>
                    {c.status}
                  </span>
                </div>

                <h3 className="mkc-card__name">{c.name}</h3>
                {c.description && <p className="mkc-card__desc">{c.description}</p>}

                <div className="mkc-card__stats">
                  <div className="mkc-stat">
                    <span className="mkc-stat__label">Leads</span>
                    <span className="mkc-stat__val">{c.leadsCount || 0}</span>
                  </div>
                  {c.targetLeads && (
                    <div className="mkc-stat">
                      <span className="mkc-stat__label">Target</span>
                      <span className="mkc-stat__val">{c.targetLeads}</span>
                    </div>
                  )}
                  {c.budgetInr && (
                    <div className="mkc-stat">
                      <span className="mkc-stat__label">Budget</span>
                      <span className="mkc-stat__val">₹{Number(c.budgetInr).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {c.budgetInr && c.leadsCount > 0 && (
                    <div className="mkc-stat">
                      <span className="mkc-stat__label">Cost/Lead</span>
                      <span className="mkc-stat__val">₹{Math.round(c.budgetInr / c.leadsCount)}</span>
                    </div>
                  )}
                </div>

                {leadFillPct !== null && (
                  <div className="mkc-progress-wrap">
                    <div className="mkc-progress-bar" style={{ width: `${leadFillPct}%`, background: color }} />
                    <span className="mkc-progress-pct">{leadFillPct}% of target</span>
                  </div>
                )}

                {(c.startDate || c.endDate) && (
                  <div className="mkc-dates">
                    {c.startDate && <span>📅 {c.startDate}</span>}
                    {c.endDate && <span>→ {c.endDate}</span>}
                  </div>
                )}

                <div className="mkc-card__actions">
                  <button className="mkc-btn mkc-btn--ghost mkc-btn--sm" onClick={() => openEdit(c)}>✏️ Edit</button>
                  <button className="mkc-btn mkc-btn--danger mkc-btn--sm" onClick={() => handleDelete(c.id)}>🗑️ Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div className="mkc-overlay" onClick={() => setShowModal(false)}>
          <div className="mkc-modal" onClick={e => e.stopPropagation()}>
            <div className="mkc-modal__header">
              <h2>{editId ? '✏️ Edit Campaign' : '📣 New Campaign'}</h2>
              <button className="mkc-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {msg && <div className={`mkc-msg ${msg.type === 'ok' ? 'mkc-msg--ok' : 'mkc-msg--err'}`}>{msg.text}</div>}

            <form onSubmit={handleSubmit} className="mkc-form">
              <div className="mkc-form-group mkc-form-group--full">
                <label>Campaign Name *</label>
                <input required value={formData.name} placeholder="e.g. Summer Java Batch — Instagram"
                  onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="mkc-form-group mkc-form-group--full">
                <label>Description</label>
                <textarea rows={2} value={formData.description} placeholder="Campaign goals, target audience, offer details..."
                  onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="mkc-form-row">
                <div className="mkc-form-group">
                  <label>Channel / Platform</label>
                  <div className="mkc-channel-grid">
                    {CHANNELS.map(ch => (
                      <button type="button" key={ch}
                        className={`mkc-channel-btn ${formData.channel === ch ? 'active' : ''}`}
                        style={formData.channel === ch ? { borderColor: CHANNEL_COLORS[ch], background: CHANNEL_COLORS[ch] + '15', color: CHANNEL_COLORS[ch] } : {}}
                        onClick={() => setFormData({...formData, channel: ch})}>
                        {CHANNEL_ICONS[ch]} {ch}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mkc-form-group">
                  <label>Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="mkc-form-row">
                <div className="mkc-form-group">
                  <label>Budget (INR)</label>
                  <input type="number" min="0" value={formData.budgetInr} placeholder="e.g. 5000"
                    onChange={e => setFormData({...formData, budgetInr: e.target.value})} />
                </div>
                <div className="mkc-form-group">
                  <label>Target Leads</label>
                  <input type="number" min="0" value={formData.targetLeads} placeholder="e.g. 50"
                    onChange={e => setFormData({...formData, targetLeads: e.target.value})} />
                </div>
              </div>

              <div className="mkc-form-row">
                <div className="mkc-form-group">
                  <label>Start Date</label>
                  <input type="date" value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div className="mkc-form-group">
                  <label>End Date</label>
                  <input type="date" value={formData.endDate}
                    onChange={e => setFormData({...formData, endDate: e.target.value})} />
                </div>
              </div>

              <div className="mkc-modal__actions">
                <button type="button" className="mkc-btn mkc-btn--ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="mkc-btn mkc-btn--primary" disabled={saving}>
                  {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
