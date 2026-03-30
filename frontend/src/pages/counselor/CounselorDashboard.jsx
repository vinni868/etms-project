import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { FaUserMd, FaVideo, FaCheck, FaStickyNote, FaCalendarAlt } from 'react-icons/fa';
import './CounselorDashboard.css';

export default function CounselorDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, completed: 0 });
  const [showModal, setShowModal] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [msg, setMsg] = useState(null);
  
  const [formData, setFormData] = useState({
    status: '', meetingLink: '', notes: '', actionItems: '', nextSessionAt: ''
  });

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/counselor/sessions');
      setSessions(res.data.sessions || []);
      setStats({
        pending: res.data.pendingCount || 0,
        completed: res.data.completedCount || 0
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api.put(`/counselor/sessions/${activeSession.id}`, formData);
      setMsg({ type: 'ok', text: 'Session updated successfully!' });
      setShowModal(false);
      fetchSessions();
    } catch (err) {
      setMsg({ type: 'err', text: err.response?.data?.message || 'Update failed.' });
    }
  };

  const openModal = (s) => {
    setActiveSession(s);
    setFormData({
      status: s.status,
      meetingLink: s.meetingLink || '',
      notes: s.notes || '',
      actionItems: s.actionItems || '',
      nextSessionAt: s.nextSessionAt ? s.nextSessionAt.slice(0, 16) : ''
    });
    setShowModal(true);
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div className="header-left">
          <div className="icon-wrapper bg-blue"><FaUserMd /></div>
          <div>
            <h1>Counselor Dashboard</h1>
            <p className="page-subtitle">Manage student academic & mental health counseling sessions</p>
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon bg-blue"><FaCalendarAlt /></div>
          <div className="stat-details">
            <h3>{stats.pending}</h3><p>Upcoming Sessions</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-green"><FaCheck /></div>
          <div className="stat-details">
            <h3>{stats.completed}</h3><p>Completed Sessions</p>
          </div>
        </div>
      </div>

      {msg && <div className={`alert-msg ${msg.type === 'ok' ? 'alert-success' : 'alert-error'}`}>{msg.text}</div>}

      <div className="sessions-list">
        {loading ? <div className="loading-state">Loading schedule...</div> :
         sessions.length === 0 ? <p className="text-muted">No sessions assigned yet.</p> :
         sessions.map(s => (
           <div className={`session-card st-${s.status.toLowerCase()}`} key={s.id}>
             <div className="scard-header">
               <div>
                 <h3>{s.studentName}</h3>
                 <span className="text-muted">{s.studentEmail}</span>
               </div>
               <span className={`status-badge st-${s.status.toLowerCase()}`}>{s.status}</span>
             </div>
             
             <div className="scard-details">
               <p><strong>Type:</strong> {s.type}</p>
               <p><strong>Scheduled:</strong> {s.scheduledAt ? new Date(s.scheduledAt).toLocaleString() : 'Not Set'}</p>
               {s.meetingLink && <p><strong>Meet:</strong> <a href={s.meetingLink} target="_blank" rel="noreferrer">Join Link <FaVideo /></a></p>}
               {s.notes && <p><strong>Notes:</strong> {s.notes}</p>}
               {s.actionItems && <p><strong>Action Items:</strong> {s.actionItems}</p>}
             </div>
             
             <div className="scard-actions">
               <button className="secondary-btn" onClick={() => openModal(s)}><FaStickyNote /> Log Notes & Update</button>
             </div>
           </div>
         ))}
      </div>

      {showModal && activeSession && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>📝 Update Session: {activeSession.studentName}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpdate} className="modal-body">
              <div className="form-group">
                <label>Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="form-group">
                <label>Meeting Link</label>
                <input value={formData.meetingLink} onChange={e => setFormData({...formData, meetingLink: e.target.value})} placeholder="Zoom / GMeet link" />
              </div>
              <div className="form-group">
                <label>Counselor Notes (Private)</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Session observations..."></textarea>
              </div>
              <div className="form-group">
                <label>Action Items (Visible to Student)</label>
                <textarea value={formData.actionItems} onChange={e => setFormData({...formData, actionItems: e.target.value})} placeholder="Tasks for the student..."></textarea>
              </div>
              <div className="form-group">
                <label>Schedule Next Session (Optional)</label>
                <input type="datetime-local" value={formData.nextSessionAt} onChange={e => setFormData({...formData, nextSessionAt: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Save Updates</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
