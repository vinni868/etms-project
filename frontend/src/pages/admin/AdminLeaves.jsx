import { useState, useEffect } from 'react';
import api, { handleDownload, handleViewFile } from '../../api/axiosConfig';
import { FaCalendarTimes, FaCheck, FaTimes, FaDownload, FaInfoCircle, FaFileAlt } from 'react-icons/fa';

export default function AdminLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, conditional: 0 });
  const [filter, setFilter] = useState('ALL');

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

  useEffect(() => { fetchLeaves(); }, [filter]);

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

  const userRole = JSON.parse(localStorage.getItem('user') || '{}').role;
  const isAdmin = userRole === 'ADMIN';

  return (
    <div className="admin-page">
      <div className="page-header">
        <div className="header-left">
          <div className="icon-wrapper bg-red"><FaCalendarTimes /></div>
          <div>
            <h1>{isAdmin ? 'Student Leave Management' : 'Total Staff & Student Leaves'}</h1>
            <p className="page-subtitle">
              {isAdmin 
                ? 'Review and approve student leave or online permission requests' 
                : 'Centralized management of all staff and student applications'}
            </p>
          </div>
        </div>
      </div>

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
         <table className="data-table">
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
                 <td>
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
                 <td>
                    <div style={{ fontWeight: "600", color: l.requestType === "ONLINE" ? "#2563eb" : l.requestType === "WFH" ? "#059669" : "#d97706" }}>
                      {l.requestType === "ONLINE" ? "Online Permission" : "Leave Request"}
                    </div>
                    {l.leaveCategory && <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'capitalize' }}>({l.leaveCategory.toLowerCase()})</div>}
                 </td>
                 <td>
                    {l.fromDate} {l.fromDate !== l.toDate ? `to ${l.toDate}` : ""}
                    <div style={{fontSize: '0.75rem', color: '#64748b'}}>{Math.ceil((new Date(l.toDate) - new Date(l.fromDate)) / (1000 * 60 * 60 * 24)) + 1} days</div>
                 </td>
                 <td style={{maxWidth: '300px'}}>
                    <div style={{fontSize: '0.85rem', fontWeight: 500}}>{l.reason}</div>
                    <div style={{fontSize: '0.75rem', color: '#64748b', marginTop: '4px'}}><strong>Course:</strong> {l.courses}</div>
                    <div style={{fontSize: '0.75rem', color: '#64748b'}}><strong>Batch:</strong> {l.batches}</div>
                 </td>
                 <td><span className={`status-badge st-${l.status.toLowerCase()}`}>{l.status}</span></td>
                 <td>
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
    </div>
  );
}
