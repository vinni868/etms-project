import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { FaUserPlus, FaPhoneAlt, FaEnvelope, FaCalendarAlt, FaCheck, FaTimes } from 'react-icons/fa';
import './Leads.css';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', courseInterest: '', source: 'WEBSITE', 
    status: 'NEW', priority: 'MEDIUM', nextFollowupDate: '', notes: ''
  });
  const [msg, setMsg] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.get('/marketer/leads'); // Hits standard marketer endpoint
      setLeads(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      if (editId) {
        await api.put(`/marketer/leads/${editId}`, formData);
        setMsg({ type: 'ok', text: 'Lead updated successfully!' });
      } else {
        await api.post('/marketer/leads', formData);
        setMsg({ type: 'ok', text: 'New lead added successfully!' });
      }
      setShowModal(false);
      fetchLeads();
    } catch (err) {
      setMsg({ type: 'err', text: err.response?.data?.message || 'Failed to save lead.' });
    }
  };

  const openNew = () => {
    setEditId(null);
    setFormData({ 
      name: '', email: '', phone: '', courseInterest: '', source: 'WEBSITE', 
      status: 'NEW', priority: 'MEDIUM', nextFollowupDate: '', notes: '' 
    });
    setShowModal(true);
  };

  const openEdit = (l) => {
    setEditId(l.id);
    setFormData({
      name: l.name, email: l.email || '', phone: l.phone, courseInterest: l.courseInterest || '',
      source: l.source || 'WEBSITE', status: l.status || 'NEW', priority: l.priority || 'MEDIUM',
      nextFollowupDate: l.nextFollowupDate || '', notes: l.notes || ''
    });
    setShowModal(true);
  };

  const statusOptions = ['NEW', 'CONTACTED', 'INTERESTED', 'NOT_INTERESTED', 'CONVERTED', 'LOST'];
  const tabs = ['ALL', 'NEW', 'CONTACTED', 'INTERESTED', 'CONVERTED'];

  const filteredLeads = activeTab === 'ALL' ? leads : leads.filter(l => l.status === activeTab);

  return (
    <div className="admin-page">
      <div className="page-header">
        <div className="header-left">
          <div className="icon-wrapper bg-blue"><FaUserPlus /></div>
          <div>
            <h1>Lead Management CRM</h1>
            <p className="page-subtitle">Track, follow up, and convert potential students</p>
          </div>
        </div>
        <button className="primary-btn" onClick={openNew}>Add New Lead</button>
      </div>

      <div className="leads-tabs">
        {tabs.map(t => (
          <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t} {t !== 'ALL' && `(${leads.filter(l => l.status === t).length})`}
          </button>
        ))}
      </div>

      {msg && <div className={`alert-msg ${msg.type === 'ok' ? 'alert-success' : 'alert-error'}`}>{msg.text}</div>}

      <div className="leads-kanban">
        {loading ? <div className="loading-state">Loading leads pipeline...</div> : 
         filteredLeads.length === 0 ? <p className="text-muted">No leads found in this stage.</p> :
         filteredLeads.map(l => (
           <div className={`lead-card priority-${l.priority.toLowerCase()}`} key={l.id} onClick={() => openEdit(l)}>
             <div className="lcard-header">
               <h3>{l.name}</h3>
               <span className={`status-badge st-${l.status.toLowerCase()}`}>{l.status}</span>
             </div>
             <div className="lcard-body">
               <div className="lcard-info"><FaPhoneAlt /> {l.phone}</div>
               {l.email && <div className="lcard-info"><FaEnvelope /> {l.email}</div>}
               {l.courseInterest && <div className="lcard-interest">Course: {l.courseInterest}</div>}
             </div>
             <div className="lcard-footer">
               <span className="lcard-source">{l.source}</span>
               {l.nextFollowupDate && (
                 <span className={`lcard-date ${new Date(l.nextFollowupDate) < new Date() ? 'overdue' : ''}`}>
                   <FaCalendarAlt /> Follow up: {l.nextFollowupDate}
                 </span>
               )}
             </div>
           </div>
         ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '650px'}}>
            <div className="modal-header">
              <h2>{editId ? '📝 Edit Lead Details' : '➕ Add New Lead'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body form-grid">
              
              <div className="form-group half">
                <label>Full Name*</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group half">
                <label>Phone Number*</label>
                <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              
              <div className="form-group half">
                <label>Email Address</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="form-group half">
                <label>Course Interested In</label>
                <input value={formData.courseInterest} onChange={e => setFormData({...formData, courseInterest: e.target.value})} placeholder="e.g. Java Full Stack" />
              </div>

              <div className="form-group half">
                <label>Lead Source</label>
                <select value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}>
                  <option value="WEBSITE">Website</option>
                  <option value="PHONE">Phone Inquiry</option>
                  <option value="SOCIAL_MEDIA">Social Media</option>
                  <option value="REFERRAL">Referral</option>
                  <option value="WALK_IN">Walk In</option>
                </select>
              </div>
              <div className="form-group half">
                <label>Priority Rating</label>
                <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                  <option value="HIGH">🔥 High</option>
                  <option value="MEDIUM">⭐ Medium</option>
                  <option value="LOW">❄️ Low</option>
                </select>
              </div>

              <div className="form-group half">
                <label>Current Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  {statusOptions.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group half">
                <label>Next Follow-Up Date</label>
                <input type="date" value={formData.nextFollowupDate} onChange={e => setFormData({...formData, nextFollowupDate: e.target.value})} />
              </div>

              <div className="form-group full">
                <label>Communication Notes</label>
                <textarea rows="3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Log call notes, student requirements, etc."></textarea>
              </div>

              <div className="modal-actions full">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">{editId ? 'Save Changes' : 'Create Lead'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}