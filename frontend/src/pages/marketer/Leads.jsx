import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import './Leads.css';

const STATUS_LIST = ['NEW', 'CONTACTED', 'INTERESTED', 'DEMO_BOOKED', 'ENROLLED', 'NOT_INTERESTED', 'LOST'];
const SOURCE_LIST = ['WEBSITE', 'PHONE', 'FACEBOOK', 'INSTAGRAM', 'GOOGLE', 'WHATSAPP', 'REFERRAL', 'WALK_IN', 'YOUTUBE', 'EMAIL'];
const STATUS_COLORS = {
  NEW: '#6366f1', CONTACTED: '#0ea5e9', INTERESTED: '#f59e0b',
  DEMO_BOOKED: '#8b5cf6', ENROLLED: '#10b981', LOST: '#ef4444', NOT_INTERESTED: '#94a3b8',
};

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(defaultForm());
  const [msg, setMsg] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [counselorFilter, setCounselorFilter] = useState('ALL');
  const [showAssign, setShowAssign] = useState(null);
  const [bulkSelected, setBulkSelected] = useState([]);
  const [bulkCounselor, setBulkCounselor] = useState('');

  function defaultForm() {
    return {
      name: '', email: '', phone: '', whatsappNumber: '', courseInterest: '',
      source: 'WEBSITE', status: 'NEW', priority: 'MEDIUM',
      nextFollowupDate: '', notes: '', assignedCounselorId: '', campaignId: '',
    };
  }

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [lRes, cRes, campRes] = await Promise.all([
        api.get('/marketer/leads'),
        api.get('/marketer/counselors'),
        api.get('/marketer/campaigns'),
      ]);
      setLeads(lRes.data || []);
      setCounselors(cRes.data || []);
      setCampaigns(campRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setMsg(null);
    try {
      const payload = { ...formData };
      if (!payload.assignedCounselorId) delete payload.assignedCounselorId;
      if (!payload.campaignId) delete payload.campaignId;
      if (!payload.whatsappNumber) delete payload.whatsappNumber;
      if (editId) {
        await api.put(`/marketer/leads/${editId}`, payload);
        setMsg({ type: 'ok', text: 'Lead updated!' });
      } else {
        await api.post('/marketer/leads', payload);
        setMsg({ type: 'ok', text: 'Lead created!' });
      }
      setShowModal(false);
      fetchAll();
    } catch (e) {
      setMsg({ type: 'err', text: e.response?.data?.message || 'Failed.' });
    }
  };

  const openNew = () => {
    setEditId(null); setFormData(defaultForm()); setMsg(null); setShowModal(true);
  };

  const openEdit = (l) => {
    setEditId(l.id);
    setFormData({
      name: l.name || '', email: l.email || '', phone: l.phone || '',
      whatsappNumber: l.whatsappNumber || '', courseInterest: l.courseInterest || '',
      source: l.source || 'WEBSITE', status: l.status || 'NEW',
      priority: l.priority || 'MEDIUM', nextFollowupDate: l.nextFollowupDate || '',
      notes: l.notes || '', assignedCounselorId: l.assignedCounselorId || '',
      campaignId: l.campaignId || '',
    });
    setMsg(null); setShowModal(true);
  };

  const handleAssign = async (leadId, counselorId) => {
    try {
      await api.put(`/marketer/leads/${leadId}/assign`, { counselorId });
      setShowAssign(null); fetchAll();
    } catch (e) { alert('Assignment failed.'); }
  };

  const handleBulkAssign = async () => {
    if (!bulkCounselor || bulkSelected.length === 0) return;
    try {
      await api.post('/marketer/leads/bulk-assign', {
        counselorId: bulkCounselor,
        leadIds: bulkSelected,
      });
      setBulkSelected([]); setBulkCounselor(''); fetchAll();
    } catch (e) { alert('Bulk assign failed.'); }
  };

  const toggleSelect = (id) => {
    setBulkSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const today = new Date().toISOString().split('T')[0];

  const filtered = leads.filter(l => {
    const matchStatus = filter === 'ALL' || l.status === filter;
    const matchCounselor = counselorFilter === 'ALL'
      ? true
      : counselorFilter === 'UNASSIGNED'
      ? !l.assignedCounselorId
      : String(l.assignedCounselorId) === counselorFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || l.name?.toLowerCase().includes(q) || l.phone?.includes(q)
      || l.courseInterest?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q);
    return matchStatus && matchCounselor && matchSearch;
  });

  const counts = STATUS_LIST.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.status === s).length; return acc;
  }, {});

  return (
    <div className="mklead-page">

      {/* ── Header ── */}
      <div className="mklead-header">
        <div className="mklead-header__left">
          <div className="mklead-header__icon">👥</div>
          <div>
            <h1 className="mklead-header__title">Lead Management CRM</h1>
            <p className="mklead-header__sub">Generate · Assign · Track · Convert</p>
          </div>
        </div>
        <div className="mklead-header__actions">
          <button className="mklead-btn mklead-btn--secondary" onClick={fetchAll}>↻ Refresh</button>
          <button className="mklead-btn mklead-btn--primary" onClick={openNew}>+ Add Lead</button>
        </div>
      </div>

      {/* ── Status Filter Tabs ── */}
      <div className="mklead-tabs">
        <button className={`mklead-tab ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>
          All <span className="mklead-tab-cnt">{leads.length}</span>
        </button>
        {STATUS_LIST.map(s => (
          <button key={s} className={`mklead-tab ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
            style={filter === s ? { borderColor: STATUS_COLORS[s], color: STATUS_COLORS[s] } : {}}>
            {s.replace('_', ' ')} <span className="mklead-tab-cnt">{counts[s] || 0}</span>
          </button>
        ))}
      </div>

      {/* ── Secondary Filters ── */}
      <div className="mklead-filters">
        <div className="mklead-search-wrap">
          <span>🔍</span>
          <input className="mklead-search" placeholder="Search name, phone, course, email..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="mklead-select" value={counselorFilter} onChange={e => setCounselorFilter(e.target.value)}>
          <option value="ALL">All Counselors</option>
          <option value="UNASSIGNED">Unassigned</option>
          {counselors.map(c => (
            <option key={c.id} value={String(c.id)}>{c.name} ({c.assignedCount})</option>
          ))}
        </select>
      </div>

      {/* ── Bulk Actions ── */}
      {bulkSelected.length > 0 && (
        <div className="mklead-bulk-bar">
          <span>{bulkSelected.length} leads selected</span>
          <select className="mklead-select mklead-select--sm" value={bulkCounselor}
            onChange={e => setBulkCounselor(e.target.value)}>
            <option value="">Select Counselor</option>
            {counselors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="mklead-btn mklead-btn--primary mklead-btn--sm" onClick={handleBulkAssign}>
            Bulk Assign
          </button>
          <button className="mklead-btn mklead-btn--ghost mklead-btn--sm" onClick={() => setBulkSelected([])}>
            Clear
          </button>
        </div>
      )}

      {msg && <div className={`mklead-msg ${msg.type === 'ok' ? 'mklead-msg--ok' : 'mklead-msg--err'}`}>{msg.text}</div>}

      {/* ── Leads Table ── */}
      {loading ? (
        <div className="mklead-skeleton-list">{[1,2,3,4,5].map(i => <div key={i} className="mklead-skeleton" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="mklead-empty">
          <span>📭</span>
          <p>No leads found. Try adjusting filters or add a new lead.</p>
        </div>
      ) : (
        <div className="mklead-table-wrap">
          <table className="mklead-table">
            <thead>
              <tr>
                <th><input type="checkbox" onChange={e => {
                  if (e.target.checked) setBulkSelected(filtered.map(l => l.id));
                  else setBulkSelected([]);
                }} /></th>
                <th>Name</th>
                <th>Phone</th>
                <th>Course Interest</th>
                <th>Source</th>
                <th>Status</th>
                <th>Counselor</th>
                <th>Follow-up</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => {
                const isOverdue = lead.nextFollowupDate && lead.nextFollowupDate < today;
                const isDueToday = lead.nextFollowupDate === today;
                return (
                  <tr key={lead.id} className={bulkSelected.includes(lead.id) ? 'mklead-tr--selected' : ''}>
                    <td>
                      <input type="checkbox" checked={bulkSelected.includes(lead.id)}
                        onChange={() => toggleSelect(lead.id)} />
                    </td>
                    <td>
                      <div className="mklead-name-cell">
                        <div className="mklead-avatar" style={{ background: lead.priority === 'HIGH' ? '#ef4444' : lead.priority === 'MEDIUM' ? '#f59e0b' : '#94a3b8' }}>
                          {lead.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="mklead-name">{lead.name}</div>
                          {lead.email && <div className="mklead-email">{lead.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <a href={`tel:${lead.phone}`} className="mklead-phone">📞 {lead.phone}</a>
                      {lead.whatsappNumber && lead.whatsappNumber !== lead.phone && (
                        <a href={`https://wa.me/91${lead.whatsappNumber.replace(/\D/g,'')}`} target="_blank"
                           rel="noreferrer" className="mklead-wa-link">💬 WA</a>
                      )}
                    </td>
                    <td className="mklead-course">{lead.courseInterest || '—'}</td>
                    <td><span className="mklead-source-tag">{lead.source || '—'}</span></td>
                    <td>
                      <span className="mklead-status-badge" style={{ background: STATUS_COLORS[lead.status] + '20', color: STATUS_COLORS[lead.status] }}>
                        {lead.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {lead.counselorName ? (
                        <span className="mklead-counselor">{lead.counselorName}</span>
                      ) : (
                        <button className="mklead-assign-btn" onClick={() => setShowAssign(lead.id)}>
                          + Assign
                        </button>
                      )}
                      {showAssign === lead.id && (
                        <div className="mklead-assign-popup">
                          <select className="mklead-select mklead-select--sm" defaultValue=""
                            onChange={e => e.target.value && handleAssign(lead.id, e.target.value)}>
                            <option value="">Pick counselor</option>
                            {counselors.map(c => (
                              <option key={c.id} value={c.id}>{c.name} ({c.assignedCount})</option>
                            ))}
                          </select>
                          <button className="mklead-btn mklead-btn--ghost mklead-btn--sm" onClick={() => setShowAssign(null)}>✕</button>
                        </div>
                      )}
                    </td>
                    <td>
                      {lead.nextFollowupDate ? (
                        <span className={`mklead-followup ${isOverdue ? 'overdue' : isDueToday ? 'today' : ''}`}>
                          {isOverdue ? '⚠️' : isDueToday ? '🔔' : '📅'} {lead.nextFollowupDate}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <button className="mklead-btn mklead-btn--ghost mklead-btn--sm" onClick={() => openEdit(lead)}>
                        ✏️ Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="mklead-overlay" onClick={() => setShowModal(false)}>
          <div className="mklead-modal" onClick={e => e.stopPropagation()}>
            <div className="mklead-modal__header">
              <h2>{editId ? '✏️ Edit Lead' : '➕ New Lead'}</h2>
              <button className="mklead-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {msg && <div className={`mklead-msg ${msg.type === 'ok' ? 'mklead-msg--ok' : 'mklead-msg--err'}`}>{msg.text}</div>}

            <form onSubmit={handleSubmit} className="mklead-form">
              <div className="mklead-form-row">
                <div className="mklead-form-group">
                  <label>Full Name *</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="mklead-form-group">
                  <label>Phone *</label>
                  <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              <div className="mklead-form-row">
                <div className="mklead-form-group">
                  <label>WhatsApp Number</label>
                  <input type="tel" value={formData.whatsappNumber} placeholder="If different from phone"
                    onChange={e => setFormData({...formData, whatsappNumber: e.target.value})} />
                </div>
                <div className="mklead-form-group">
                  <label>Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>

              <div className="mklead-form-row">
                <div className="mklead-form-group">
                  <label>Course Interested In</label>
                  <input value={formData.courseInterest} placeholder="e.g. Java Full Stack"
                    onChange={e => setFormData({...formData, courseInterest: e.target.value})} />
                </div>
                <div className="mklead-form-group">
                  <label>Lead Source</label>
                  <select value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}>
                    {SOURCE_LIST.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>

              <div className="mklead-form-row">
                <div className="mklead-form-group">
                  <label>Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                    <option value="HIGH">🔥 High</option>
                    <option value="MEDIUM">⭐ Medium</option>
                    <option value="LOW">❄️ Low</option>
                  </select>
                </div>
                <div className="mklead-form-group">
                  <label>Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    {STATUS_LIST.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>

              <div className="mklead-form-row">
                <div className="mklead-form-group">
                  <label>Assign to Counselor</label>
                  <select value={formData.assignedCounselorId}
                    onChange={e => setFormData({...formData, assignedCounselorId: e.target.value})}>
                    <option value="">— Unassigned —</option>
                    {counselors.map(c => <option key={c.id} value={c.id}>{c.name} ({c.assignedCount} leads)</option>)}
                  </select>
                </div>
                <div className="mklead-form-group">
                  <label>Campaign</label>
                  <select value={formData.campaignId} onChange={e => setFormData({...formData, campaignId: e.target.value})}>
                    <option value="">— No Campaign —</option>
                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="mklead-form-group mklead-form-group--full">
                <label>Next Follow-up Date</label>
                <input type="date" value={formData.nextFollowupDate}
                  onChange={e => setFormData({...formData, nextFollowupDate: e.target.value})} />
              </div>

              <div className="mklead-form-group mklead-form-group--full">
                <label>Notes</label>
                <textarea rows={3} value={formData.notes} placeholder="Lead context, requirements, referral details..."
                  onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>

              <div className="mklead-modal__actions">
                <button type="button" className="mklead-btn mklead-btn--ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="mklead-btn mklead-btn--primary">{editId ? 'Save Changes' : 'Create Lead'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
