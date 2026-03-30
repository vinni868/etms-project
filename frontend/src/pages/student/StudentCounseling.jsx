import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { FaUserMd, FaPlus } from 'react-icons/fa';

export default function StudentCounseling() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ type: 'ROUTINE', requestedDate: '', notes: '' });
  const [msg, setMsg] = useState(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/counseling');
      setSessions(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api.post('/student/counseling/book', formData);
      setMsg({ type: 'ok', text: 'Counseling session requested successfully!' });
      setShowModal(false);
      fetchSessions();
    } catch (err) {
      setMsg({ type: 'err', text: err.response?.data?.message || 'Booking failed.' });
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div className="header-left">
          <div className="icon-wrapper bg-blue"><FaUserMd /></div>
          <div>
            <h1>Counseling & Advising</h1>
            <p className="page-subtitle">Book sessions for academic guidance or mental health support</p>
          </div>
        </div>
        <button className="primary-btn" onClick={() => setShowModal(true)}><FaPlus /> Book Session</button>
      </div>

      {msg && <div className={`alert-msg ${msg.type === 'ok' ? 'alert-success' : 'alert-error'}`}>{msg.text}</div>}

      <div className="table-container">
        {loading ? <div className="loading-state">Loading your sessions...</div> : 
         <table className="data-table">
          <thead>
            <tr>
              <th>Counselor</th>
              <th>Type</th>
              <th>Scheduled Time</th>
              <th>Meeting Link</th>
              <th>Status</th>
              <th>Action Items</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? <tr><td colSpan="6" className="text-center">No sessions found.</td></tr> :
             sessions.map(s => (
               <tr key={s.id}>
                 <td><strong>{s.counselorName || 'Assigned Soon'}</strong></td>
                 <td>{s.type}</td>
                 <td>{s.scheduledAt ? new Date(s.scheduledAt).toLocaleString() : 'Pending Confirmation'}</td>
                 <td>{s.meetingLink ? <a href={s.meetingLink} target="_blank" rel="noreferrer">Join Meet</a> : '-'}</td>
                 <td><span className={`status-badge st-${s.status.toLowerCase()}`}>{s.status}</span></td>
                 <td style={{maxWidth: '200px'}}>{s.actionItems || '-'}</td>
               </tr>
             ))
            }
          </tbody>
         </table>
        }
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>📅 Request Counseling</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleBook} className="modal-body">
              <div className="form-group">
                <label>Session Type</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="ROUTINE">Routine Academic Review</option>
                  <option value="CAREER">Career & Placement Advice</option>
                  <option value="PERFORMANCE">Performance Improvement</option>
                  <option value="MENTAL_HEALTH">Mental Health & Well-being</option>
                </select>
              </div>
              <div className="form-group">
                <label>Requested Date & Time</label>
                <input required type="datetime-local" value={formData.requestedDate} onChange={e => setFormData({...formData, requestedDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Topic / Why do you need this session?</label>
                <textarea required rows="3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Briefly describe what you want to discuss..."></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Request Book</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
