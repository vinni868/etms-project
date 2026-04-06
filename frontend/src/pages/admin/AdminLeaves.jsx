import { useState, useEffect } from 'react';
import api, { handleDownload, handleViewFile } from '../../api/axiosConfig';
import { FaCalendarTimes, FaCheck, FaTimes, FaDownload, FaInfoCircle, FaFileAlt, FaPlus, FaTrash } from 'react-icons/fa';

export default function AdminLeaves() {
  const [activeTab, setActiveTab] = useState('MANAGE'); // 'MANAGE' or 'MY_REQUESTS'

  // --- Manage Leaves State ---
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, conditional: 0 });
  const [filter, setFilter] = useState('ALL');

  // --- My Requests State ---
  const [myLeaves, setMyLeaves] = useState([]);
  const [loadingMy, setLoadingMy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [msg, setMsg] = useState(null);
  const [formData, setFormData] = useState({
    requestType: 'LEAVE',
    leaveCategory: '',
    fromDate: '',
    toDate: '',
    reason: '',
    file: null
  });

  const userRole = JSON.parse(localStorage.getItem('user') || '{}').role;
  const isAdmin = userRole === 'ADMIN';

  // --- Fetch Methods ---
  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const url = filter === 'ALL' ? '/admin/leave' : `/admin/leave?status=${filter}`;
      const res = await api.get(url);
      setLeaves(res.data.requests || []);
      setCounts({
        pending: res.data.pendingCount || 0,
        approved: res.data.approvedCount || 0,
        rejected: res.data.rejectedCount || 0,
        conditional: res.data.conditionalCount || 0
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyLeaves = async () => {
    try {
      setLoadingMy(true);
      const res = await api.get('/leave/my-requests');
      setMyLeaves(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMy(false);
    }
  };

  useEffect(() => { 
    if (activeTab === 'MANAGE') {
      fetchLeaves(); 
    } else {
      fetchMyLeaves();
    }
  }, [filter, activeTab]);

  // --- Manage Action ---
  const handleAction = async (id, action) => {
    const note = window.prompt(`Enter note for ${action} (optional):`);
    if (note === null) return;
    try {
      await api.put(`/admin/leave/${id}/${action}`, { note });
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  // --- My Request Actions ---
  const handleMySubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (formData.requestType === 'LEAVE' && !formData.leaveCategory) {
      return setMsg({ type: 'err', text: 'Please select a leave category.' });
    }
    if (formData.leaveCategory === 'MEDICAL' && !formData.file) {
      return setMsg({ type: 'err', text: 'Medical proof is mandatory when choosing Medical leave.' });
    }

    const fd = new FormData();
    fd.append('requestType', formData.requestType);
    if(formData.leaveCategory) fd.append('leaveCategory', formData.leaveCategory);
    fd.append('fromDate', formData.fromDate);
    fd.append('toDate', formData.toDate);
    fd.append('reason', formData.reason);
    if (formData.file) fd.append('file', formData.file);

    try {
      await api.post('/leave/request', fd);
      setMsg({ type: 'ok', text: 'Request submitted successfully!' });
      setShowModal(false);
      resetForm();
      fetchMyLeaves();
    } catch (err) {
      setMsg({ type: 'err', text: err.response?.data?.message || 'Failed to submit request.' });
    }
  };

  const resetForm = () => {
    setFormData({ requestType: 'LEAVE', leaveCategory: '', fromDate: '', toDate: '', reason: '', file: null });
  };

  const handleMyDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this empty request? This can only be done within 5 hours of creation and if it is still Pending.")) return;
    try {
      await api.delete(`/leave/request/${id}`);
      setMsg({ type: 'ok', text: 'Request deleted successfully.' });
      fetchMyLeaves();
    } catch (err) {
      setMsg({ type: 'err', text: err.response?.data?.message || 'Failed to delete request.' });
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="header-left">
            <div className="icon-wrapper bg-red"><FaCalendarTimes /></div>
            <div>
              <h1>{activeTab === 'MANAGE' ? (isAdmin ? 'Student Leave Management' : 'Total Staff & Student Leaves') : 'My Leave Requests'}</h1>
              <p className="page-subtitle">
                {activeTab === 'MANAGE' 
                  ? (isAdmin ? 'Review and approve student leave requests' : 'Centralized management of all staff and student applications')
                  : 'Apply for leave or WFH and track your status'}
              </p>
            </div>
          </div>
          {activeTab === 'MY_REQUESTS' && (
            <button className="primary-btn" onClick={() => setShowModal(true)}><FaPlus /> New Request</button>
          )}
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '30px', marginTop: '20px', borderBottom: '2px solid #e2e8f0' }}>
          <div 
            onClick={() => setActiveTab('MANAGE')} 
            style={{ padding: '10px 5px', cursor: 'pointer', borderBottom: activeTab === 'MANAGE' ? '3px solid #2563eb' : '3px solid transparent', fontWeight: activeTab === 'MANAGE' ? 600 : 500, color: activeTab === 'MANAGE' ? '#2563eb' : '#64748b', transition: 'all 0.2s', marginBottom: '-2px' }}
          >
            Manage Leaves
          </div>
          <div 
            onClick={() => setActiveTab('MY_REQUESTS')} 
            style={{ padding: '10px 5px', cursor: 'pointer', borderBottom: activeTab === 'MY_REQUESTS' ? '3px solid #2563eb' : '3px solid transparent', fontWeight: activeTab === 'MY_REQUESTS' ? 600 : 500, color: activeTab === 'MY_REQUESTS' ? '#2563eb' : '#64748b', transition: 'all 0.2s', marginBottom: '-2px' }}
          >
            My Leaves
          </div>
        </div>
      </div>

      {msg && <div className={`alert-msg ${msg.type === 'ok' ? 'alert-success' : 'alert-error'}`}>{msg.text}</div>}

      {/* ── MANAGE VIEW ────────────────────────────────────── */}
      {activeTab === 'MANAGE' && (
        <>
          <div className="stats-row">
            <div className="stat-card" onClick={() => setFilter('PENDING')} style={{cursor:'pointer', border: filter==='PENDING'?'2px solid #3b82f6':''}}>
              <div className="stat-details"><h3>{counts.pending}</h3><p>Pending</p></div>
            </div>
            <div className="stat-card" onClick={() => setFilter('APPROVED')} style={{cursor:'pointer', border: filter==='APPROVED'?'2px solid #3b82f6':''}}>
              <div className="stat-details"><h3>{counts.approved}</h3><p>Approved</p></div>
            </div>
            <div className="stat-card" onClick={() => setFilter('CONDITIONAL')} style={{cursor:'pointer', border: filter==='CONDITIONAL'?'2px solid #f59e0b':''}}>
              <div className="stat-details"><h3>{counts.conditional}</h3><p>Conditional</p></div>
            </div>
            <div className="stat-card" onClick={() => setFilter('ALL')} style={{cursor:'pointer', border: filter==='ALL'?'2px solid #3b82f6':''}}>
              <div className="stat-details"><h3>{counts.pending+counts.approved+counts.rejected+counts.conditional}</h3><p>Total</p></div>
            </div>
          </div>

          <div className="table-container">
            {loading ? <div className="loading-state">Loading...</div> : 
             <table className="data-table responsive-card-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Type / Category</th>
                  <th>Date Range</th>
                  <th>Reason & Details</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 ? <tr><td colSpan="6" className="text-center">No leave requests found.</td></tr> :
                 leaves.map(l => (
                   <tr key={l.id}>
                     <td data-label="Applicant">
                       <strong>{l.userName}</strong><br/>
                       <small className="text-muted">{l.userEmail}</small><br/>
                       <small style={{color:'#6b7280', fontSize:'0.75rem'}}>{l.userRole}</small>
                       {l.hasDocument && (
                         <div style={{marginTop:'5px'}}>
                           <button 
                             onClick={() => handleViewFile(`/leave/document/${l.id}`)} 
                             style={{border:'none', background:'none', padding:0, cursor:'pointer', color:'#2563eb', fontSize:'0.75rem', display:'flex', alignItems:'center', gap:'4px'}}
                           >
                             <FaFileAlt size={10} /> View Proof
                           </button>
                         </div>
                       )}
                     </td>
                     <td data-label="Type / Category">
                        <div style={{ fontWeight: "600", color: l.requestType === "ONLINE" ? "#2563eb" : l.requestType === "WFH" ? "#059669" : "#d97706" }}>
                          {l.requestType === "ONLINE" ? "Online Permission" : l.requestType === "WFH" ? "Work From Home" : "Leave Request"}
                        </div>
                        {l.leaveCategory && <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'capitalize' }}>({l.leaveCategory.toLowerCase()})</div>}
                     </td>
                     <td data-label="Date Range">
                        {l.fromDate} {l.fromDate !== l.toDate ? `to ${l.toDate}` : ""}
                        <div style={{fontSize: '0.75rem', color: '#64748b'}}>{Math.ceil((new Date(l.toDate) - new Date(l.fromDate)) / (1000 * 60 * 60 * 24)) + 1} days</div>
                     </td>
                     <td data-label="Reason & Details" style={{maxWidth: '300px'}}>
                        <div style={{fontSize: '0.85rem', fontWeight: 500}}>{l.reason}</div>
                        {l.courses && <div style={{fontSize: '0.75rem', color: '#64748b', marginTop: '4px'}}><strong>Course:</strong> {l.courses}</div>}
                        {l.batches && <div style={{fontSize: '0.75rem', color: '#64748b'}}><strong>Batch:</strong> {l.batches}</div>}
                     </td>
                     <td data-label="Status"><span className={`status-badge st-${l.status.toLowerCase()}`}>{l.status}</span></td>
                     <td data-label="Actions">
                       {l.status === 'PENDING' ? (
                         <div style={{display:'flex', gap:'8px', flexWrap: 'wrap'}}>
                           <button className="primary-btn" style={{padding:'6px 10px', fontSize:'11px'}} onClick={() => handleAction(l.id, 'approve')}>Approve</button>
                           <button className="primary-btn" style={{padding:'6px 10px', fontSize:'11px', background:'#f59e0b'}} onClick={() => handleAction(l.id, 'conditional')}>Conditional</button>
                           <button className="secondary-btn" style={{padding:'6px 10px', fontSize:'11px', border: '1px solid #fee2e2', color:'#dc2626'}} onClick={() => handleAction(l.id, 'reject')}>Reject</button>
                         </div>
                       ) : (
                         <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                            <span className="text-muted" style={{fontSize: '0.8rem'}}>{l.approvalNote || 'Processed'}</span>
                          </div>
                       )}
                     </td>
                   </tr>
                 ))
                }
              </tbody>
             </table>
            }
          </div>
        </>
      )}

      {/* ── MY REQUESTS VIEW ───────────────────────────────── */}
      {activeTab === 'MY_REQUESTS' && (
        <div className="table-container">
          {loadingMy ? <div className="loading-state">Loading...</div> : 
           <table className="data-table responsive-card-table">
            <thead>
              <tr>
                 <th>Type / Category</th>
                 <th>Date Range</th>
                 <th>Details</th>
                 <th>Status</th>
                 <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {myLeaves.length === 0 ? <tr><td colSpan="5" className="text-center">No leave history found. Click "+ New Request" to apply.</td></tr> :
               myLeaves.map(l => {
                 const days = Math.ceil((new Date(l.toDate) - new Date(l.fromDate)) / (1000 * 60 * 60 * 24)) + 1;
                 return (
                  <tr key={l.id}>
                    <td data-label="Type / Category">
                      <div style={{ fontWeight: "600", color: l.requestType === "ONLINE" ? "#2563eb" : l.requestType === "WFH" ? "#059669" : "#d97706" }}>
                        {l.requestType === "ONLINE" ? "Online Permission" : l.requestType === "WFH" ? "Work From Home" : "Leave Request"}
                      </div>
                      {l.leaveCategory && <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>Category: {l.leaveCategory.toLowerCase()}</div>}
                    </td>
                    <td data-label="Date Range">
                      {l.fromDate} {l.fromDate !== l.toDate ? `to ${l.toDate}` : ""}
                      <div style={{fontSize: '0.75rem', color: '#64748b'}}>{days} days</div>
                    </td>
                    <td data-label="Details">
                      <div style={{maxWidth: '300px'}}>
                        <div style={{fontSize: '0.85rem', fontWeight: 500, color: '#1e293b'}}>{l.reason}</div>
                        {l.hasDocument && (
                          <button 
                            onClick={() => handleViewFile(`/leave/document/${l.id}`)} 
                            style={{border:'none', background:'none', padding:0, cursor:'pointer', color:'#2563eb', fontSize:'0.75rem', display:'flex', alignItems:'center', gap:'4px', marginTop:'6px'}}
                          >
                            <FaFileAlt size={10} /> View Proof
                          </button>
                        )}
                      </div>
                    </td>
                    <td data-label="Status">
                      <span className={`status-badge st-${l.status.toLowerCase()}`}>{l.status}</span>
                      {l.approvalNote && <div style={{fontSize:'11px', color:'#64748b', marginTop:'4px'}}>Note: {l.approvalNote}</div>}
                    </td>
                    <td data-label="Action">
                      {l.status === 'PENDING' && (new Date() - new Date(l.createdAt)) < (5 * 60 * 60 * 1000) && (
                        <button className="icon-btn text-error" title="Delete request" onClick={() => handleMyDelete(l.id)}>
                          <FaTrash />
                        </button>
                      )}
                    </td>
                  </tr>
               )})}
            </tbody>
           </table>
          }
        </div>
      )}

      {/* ── NEW REQUEST MODAL ──────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ maxWidth: '600px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>📅 Admin Leave Request</h2>
              <button className="close-btn" onClick={() => {setShowModal(false); resetForm();}}>&times;</button>
            </div>
            
            <form onSubmit={handleMySubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div className="form-group">
                  <label style={{fontSize:'0.9rem', fontWeight:'600', color: '#334155'}}>Select Request Type*</label>
                  <div style={{display:'flex', gap:'15px', marginTop:'10px'}}>
                    <label style={{display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', padding:'16px', border: formData.requestType==='LEAVE'?'2px solid #ea580c':'1px solid #e2e8f0', borderRadius:'12px', flex:1, background: formData.requestType==='LEAVE'?'#fffaf5':'#fff', transition: 'all 0.2s'}}>
                      <input type="radio" checked={formData.requestType==='LEAVE'} onChange={()=>setFormData({...formData, requestType:'LEAVE'})} style={{ width: '18px', height: '18px', accentColor: '#ea580c' }} /> 
                      <div>
                        <div style={{fontWeight:'700', color: formData.requestType==='LEAVE'?'#9a3412':'#334155'}}>Leave Request</div>
                        <div style={{fontSize:'0.75rem', color: formData.requestType==='LEAVE'?'#c2410c':'#64748b'}}>Requires SuperAdmin approval</div>
                      </div>
                    </label>
                    <label style={{display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', padding:'16px', border: formData.requestType==='WFH'?'2px solid #059669':'1px solid #e2e8f0', borderRadius:'12px', flex:1, background: formData.requestType==='WFH'?'#f0fdf4':'#fff', transition: 'all 0.2s'}}>
                      <input type="radio" checked={formData.requestType==='WFH'} onChange={()=>setFormData({...formData, requestType:'WFH', leaveCategory: ''})} style={{ width: '18px', height: '18px', accentColor: '#059669' }} /> 
                      <div>
                        <div style={{fontWeight:'700', color: formData.requestType==='WFH'?'#047857':'#334155'}}>Work From Home</div>
                        <div style={{fontSize:'0.75rem', color: formData.requestType==='WFH'?'#059669':'#64748b'}}>Logging a remote work day</div>
                      </div>
                    </label>
                  </div>
                </div>

                {formData.requestType === 'LEAVE' && (
                  <div className="form-group">
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '6px', display: 'block' }}>Leave Category*</label>
                    <select 
                      className="aa-finput" 
                      required 
                      value={formData.leaveCategory} 
                      onChange={e => setFormData({...formData, leaveCategory: e.target.value})}
                      style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #cbd5e1', background: '#fff', fontSize: '0.9rem', outline: 'none'}}
                    >
                      <option value="">-- Select Category --</option>
                      <option value="MEDICAL">Medical (Requires Proof)</option>
                      <option value="PERSONAL">Personal</option>
                      <option value="MARRIAGE">Marriage</option>
                      <option value="DEATH">Emergency / Death</option>
                      <option value="OTHERS">Others</option>
                    </select>
                  </div>
                )}

                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '6px', display: 'block' }}>From Date*</label>
                    <input type="date" className="aa-finput" required min={new Date().toISOString().split('T')[0]} value={formData.fromDate} onChange={e => setFormData({...formData, fromDate: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'10px', border:'1px solid #cbd5e1', outline: 'none'}} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '6px', display: 'block' }}>To Date*</label>
                    <input type="date" className="aa-finput" required min={formData.fromDate || new Date().toISOString().split('T')[0]} value={formData.toDate} onChange={e => setFormData({...formData, toDate: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'10px', border:'1px solid #cbd5e1', outline: 'none'}} />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '6px', display: 'block' }}>Reason*</label>
                  <textarea required rows="3" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="Provide a detailed reason for your request" style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #cbd5e1', resize: 'vertical', outline: 'none', fontSize: '0.9rem'}}></textarea>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '6px', display: 'block' }}>
                    Upload Proof {formData.leaveCategory === 'MEDICAL' ? <span style={{color: '#dc2626'}}>* (Required for Medical)</span> : "(Optional)"}
                  </label>
                  <div style={{border:'2px dashed #cbd5e1', padding:'25px', borderRadius:'12px', textAlign:'center', background:'#f8fafc', cursor: 'pointer'}}>
                    <input type="file" onChange={e => setFormData({...formData, file: e.target.files[0]})} style={{fontSize:'0.85rem', width: '100%', cursor: 'pointer' }} required={formData.leaveCategory === 'MEDICAL'} />
                  </div>
                </div>
              </div>

              <div className="modal-actions" style={{ flexShrink: 0, padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display:'flex', justifyContent:'flex-end', gap:'12px' }}>
                <button type="button" className="secondary-btn" style={{padding:'10px 20px', borderRadius: '8px'}} onClick={() => {setShowModal(false); resetForm();}}>Cancel</button>
                <button type="submit" className="primary-btn" style={{padding:'10px 24px', borderRadius: '8px', background: '#2563eb', fontWeight: '600'}}>Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
