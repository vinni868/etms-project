import { useState, useEffect, useRef } from 'react';
import api, { handleDownload, handleViewFile } from '../../api/axiosConfig';
import { FaCalendarTimes, FaPlus, FaTimes, FaTrash, FaDownload, FaFileAlt, FaChevronDown } from 'react-icons/fa';

// Custom MultiSelect Dropdown Component
function MultiSelectDropdown({ label, options, selected, onToggle, placeholder = "Select options" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="form-group" style={{ position: 'relative' }} ref={dropdownRef}>
      <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '6px', display: 'block' }}>{label}</label>
      <div 
        className="multi-select-trigger" 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '12px 14px',
          border: isOpen ? '2px solid #3b82f6' : '1px solid #cbd5e1',
          borderRadius: '10px',
          background: '#fff',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '45px',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'none'
        }}
      >
        <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9rem', color: selected.length > 0 ? '#1e293b' : '#94a3b8' }}>
          {selected.length === 0 ? placeholder : 
            selected.length === options.length ? 'All Selected' : `${selected.length} items selected`}
        </div>
        <FaChevronDown style={{ fontSize: '0.75rem', color: '#64748b', transition: 'transform 0.3s', transform: isOpen ? 'rotate(180deg)' : '' }} />
      </div>

      {isOpen && (
        <div className="multi-select-options" style={{
          position: 'absolute',
          top: 'calc(100% + 5px)',
          left: 0,
          right: 0,
          zIndex: 1000,
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          maxHeight: '220px',
          overflowY: 'auto',
          padding: '6px'
        }}>
          {options.length === 0 ? <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No data available</div> :
            options.map(opt => {
              const isSelected = selected.includes(opt.id);
              return (
              <label key={opt.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '10px 12px', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                background: isSelected ? '#eff6ff' : 'transparent',
                transition: 'background 0.2s',
                fontSize: '0.85rem',
                marginBottom: '2px',
                color: isSelected ? '#2563eb' : '#334155',
                fontWeight: isSelected ? '500' : '400'
              }}
              onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = 'transparent')}
              >
                <input 
                  type="checkbox" 
                  checked={isSelected} 
                  onChange={() => onToggle(opt.id)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#2563eb' }}
                />
                <span>{opt.label}</span>
              </label>
              );
            })
          }
        </div>
      )}
    </div>
  );
}

export default function StudentLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [msg, setMsg] = useState(null);

  const [formData, setFormData] = useState({
    requestType: 'LEAVE',
    leaveCategory: '',
    selectedCourses: [],
    selectedBatches: [],
    fromDate: '', 
    toDate: '', 
    reason: '',
    file: null
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leavesRes, coursesRes, batchesRes] = await Promise.all([
        api.get('/leave/my-requests'),
        api.get('/student/my-courses'),
        api.get('/student/my-batches')
      ]);
      setLeaves(leavesRes.data || []);
      setCourses(coursesRes.data || []);
      setBatches(batchesRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCourseToggle = (courseId) => {
    setFormData(prev => {
      const isSelected = prev.selectedCourses.includes(courseId);
      return {
        ...prev,
        selectedCourses: isSelected 
          ? prev.selectedCourses.filter(id => id !== courseId)
          : [...prev.selectedCourses, courseId]
      };
    });
  };

  const handleBatchToggle = (batchId) => {
    setFormData(prev => {
      const isSelected = prev.selectedBatches.includes(batchId);
      return {
        ...prev,
        selectedBatches: isSelected 
          ? prev.selectedBatches.filter(id => id !== batchId)
          : [...prev.selectedBatches, batchId]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    // Validation
    if (formData.selectedCourses.length === 0 || formData.selectedBatches.length === 0) {
      return setMsg({ type: 'err', text: 'Please select at least one course and batch.' });
    }
    if (formData.requestType === 'LEAVE' && !formData.leaveCategory) {
      return setMsg({ type: 'err', text: 'Please select a leave category.' });
    }
    if (formData.leaveCategory === 'MEDICAL' && !formData.file) {
      return setMsg({ type: 'err', text: 'Medical proof is mandatory when choosing Medical leave.' });
    }

    const selCourses = courses.filter(c => formData.selectedCourses.includes(c.id));
    const courseNames = selCourses.map(c => c.courseName).join(", ");
    const courseModes = selCourses.map(c => c.courseMode || 'OFFLINE').join(", ");
    const selBatches = batches.filter(b => formData.selectedBatches.includes(b.batchId));
    const batchNames = selBatches.map(b => b.batchName).join(", ");
    const batchIdsStr = JSON.stringify(selBatches.map(b => String(b.batchId)));

    const fd = new FormData();
    fd.append('requestType', formData.requestType);
    fd.append('leaveCategory', formData.leaveCategory);
    fd.append('courses', courseNames);
    fd.append('batches', batchIdsStr);
    fd.append('courseMode', courseModes);
    fd.append('fromDate', formData.fromDate);
    fd.append('toDate', formData.toDate);
    fd.append('reason', formData.reason);
    if (formData.file) fd.append('file', formData.file);

    try {
      await api.post('/leave/request', fd);
      setMsg({ type: 'ok', text: 'Request submitted successfully!' });
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      setMsg({ type: 'err', text: err.response?.data?.message || 'Failed to submit request.' });
    }
  };

  const resetForm = () => {
    setFormData({ 
      requestType: 'LEAVE', 
      leaveCategory: '',
      selectedCourses: [], 
      selectedBatches: [], 
      fromDate: '', 
      toDate: '', 
      reason: '', 
      file: null 
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this leave request? This can only be done within 5 hours of creation.")) return;
    try {
      await api.delete(`/leave/request/${id}`);
      setMsg({ type: 'ok', text: 'Request deleted successfully.' });
      fetchData();
    } catch (err) {
      setMsg({ type: 'err', text: err.response?.data?.message || 'Failed to delete request.' });
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div className="header-left">
          <div className="icon-wrapper bg-red"><FaCalendarTimes /></div>
          <div>
            <h1>My Requests</h1>
            <p className="page-subtitle">Apply for leave/online permission and track status</p>
          </div>
        </div>
        <button className="primary-btn" onClick={() => setShowModal(true)}><FaPlus /> New Request</button>
      </div>

      {msg && <div className={`alert-msg ${msg.type === 'ok' ? 'alert-success' : 'alert-error'}`}>{msg.text}</div>}

      <div className="table-container">
        {loading ? <div className="loading-state">Loading...</div> : 
         <table className="data-table">
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
            {leaves.length === 0 ? <tr><td colSpan="5" className="text-center">No requests found.</td></tr> :
             leaves.map(l => {
               const days = Math.ceil((new Date(l.toDate) - new Date(l.fromDate)) / (1000 * 60 * 60 * 24)) + 1;
               return (
                <tr key={l.id}>
                  <td>
                    <div style={{ fontWeight: "600", color: l.requestType === "ONLINE" ? "#2563eb" : "#d97706" }}>
                      {l.requestType === "ONLINE" ? "Online Permission" : "Leave Request"}
                    </div>
                    {l.leaveCategory && <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>Category: {l.leaveCategory.toLowerCase()}</div>}
                  </td>
                  <td>
                    {l.fromDate} {l.fromDate !== l.toDate ? `to ${l.toDate}` : ""}
                    <div style={{fontSize: '0.75rem', color: '#64748b'}}>{days} days</div>
                  </td>
                  <td>
                    <div style={{maxWidth: '300px'}}>
                      <div style={{fontSize: '0.85rem', fontWeight: 500, color: '#1e293b'}}>{l.reason}</div>
                      <div style={{fontSize: '0.75rem', color: '#64748b', marginTop: '2px'}}><strong>Course:</strong> {l.courses}</div>
                      <div style={{fontSize: '0.75rem', color: '#64748b'}}><strong>Batch:</strong> {l.batches}</div>
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
                  <td>
                    <span className={`status-badge st-${l.status.toLowerCase()}`}>{l.status}</span>
                    {l.approvalNote && <div style={{fontSize:'11px', color:'#64748b', marginTop:'4px'}}>Note: {l.approvalNote}</div>}
                  </td>
                  <td>
                    {l.status === 'PENDING' && (new Date() - new Date(l.createdAt)) < (5 * 60 * 60 * 1000) && (
                      <button className="icon-btn text-error" title="Delete request" onClick={() => handleDelete(l.id)}>
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

      {showModal && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{
            maxWidth: '900px', 
            width: '95%', 
            maxHeight: '94vh', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>📅 Request Leave / Online Permission</h2>
              <button className="close-btn" onClick={() => {setShowModal(false); resetForm();}}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              flex: 1, 
              overflow: 'hidden' 
            }}>
              <div className="modal-body" style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: '24px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '24px' 
              }}>
                <div className="form-group">
                  <label style={{fontSize:'0.9rem', fontWeight:'600', color: '#334155'}}>Select Type of Request*</label>
                  <div style={{display:'flex', gap:'20px', marginTop:'10px'}}>
                    <label style={{display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', padding:'16px', border: formData.requestType==='LEAVE'?'2px solid #ea580c':'1px solid #e2e8f0', borderRadius:'12px', flex:1, background: formData.requestType==='LEAVE'?'#fffaf5':'#fff', transition: 'all 0.2s', boxShadow: formData.requestType==='LEAVE'?'0 4px 6px -1px rgba(234, 88, 12, 0.1)':'none'}}>
                      <input type="radio" name="reqType" checked={formData.requestType==='LEAVE'} onChange={()=>setFormData({...formData, requestType:'LEAVE'})} style={{ width: '18px', height: '18px', accentColor: '#ea580c' }} /> 
                      <div>
                        <div style={{fontWeight:'700', color: formData.requestType==='LEAVE'?'#9a3412':'#334155'}}>Leave Request</div>
                        <div style={{fontSize:'0.75rem', color: formData.requestType==='LEAVE'?'#c2410c':'#64748b'}}>Requesting a complete day off</div>
                      </div>
                    </label>
                    <label style={{display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', padding:'16px', border: formData.requestType==='ONLINE'?'2px solid #2563eb':'1px solid #e2e8f0', borderRadius:'12px', flex:1, background: formData.requestType==='ONLINE'?'#f0f7ff':'#fff', transition: 'all 0.2s', boxShadow: formData.requestType==='ONLINE'?'0 4px 6px -1px rgba(37, 99, 235, 0.1)':'none'}}>
                      <input type="radio" name="reqType" checked={formData.requestType==='ONLINE'} onChange={()=>setFormData({...formData, requestType:'ONLINE', leaveCategory: ''})} style={{ width: '18px', height: '18px', accentColor: '#2563eb' }} /> 
                      <div>
                        <div style={{fontWeight:'700', color: formData.requestType==='ONLINE'?'#1e40af':'#334155'}}>Online Permission</div>
                        <div style={{fontSize:'0.75rem', color: formData.requestType==='ONLINE'?'#2563eb':'#64748b'}}>Attend class from home</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:'20px'}}>
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
                        <option value="DEATH">Death / Emergency</option>
                        <option value="OTHERS">Others</option>
                      </select>
                    </div>
                  )}

                  <MultiSelectDropdown 
                    label="Select Course(s)*"
                    placeholder="Choose courses..."
                    options={courses.map(c => ({ id: c.id, label: c.courseName }))}
                    selected={formData.selectedCourses}
                    onToggle={handleCourseToggle}
                  />

                  <MultiSelectDropdown 
                    label="Select Batch(es)*"
                    placeholder="Choose batches..."
                    options={batches.map(b => ({ id: b.batchId, label: `${b.batchName} (${b.batchId})` }))}
                    selected={formData.selectedBatches}
                    onToggle={handleBatchToggle}
                  />
                </div>

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
                  <textarea required rows="3" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="Provide a detailed reason for your request" style={{width:'100%', padding:'14px', borderRadius:'12px', border:'1px solid #cbd5e1', resize: 'vertical', outline: 'none', fontSize: '0.9rem'}}></textarea>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '6px', display: 'block' }}>
                    Upload Proof {formData.leaveCategory === 'MEDICAL' ? <span style={{color: '#dc2626'}}>* (Required for Medical)</span> : "(Optional)"}
                  </label>
                  <div style={{border:'2px dashed #cbd5e1', padding:'25px', borderRadius:'12px', textAlign:'center', background:'#f8fafc', transition: 'border-color 0.2s', cursor: 'pointer'}}>
                    <input type="file" onChange={e => setFormData({...formData, file: e.target.files[0]})} style={{fontSize:'0.85rem', width: '100%', cursor: 'pointer' }} required={formData.leaveCategory === 'MEDICAL'} />
                    <p style={{fontSize:'0.75rem', color:'#64748b', marginTop:'10px'}}>Supported: PDF, JPG, PNG (Max 5MB)</p>
                  </div>
                </div>
              </div>

              <div className="modal-actions" style={{ 
                flexShrink: 0, 
                padding: '16px 24px', 
                borderTop: '1px solid #e2e8f0', 
                background: '#f8fafc',
                display:'flex', 
                justifyContent:'flex-end', 
                gap:'12px' 
              }}>
                <button type="button" className="secondary-btn" style={{padding:'12px 28px', borderRadius: '10px'}} onClick={() => {setShowModal(false); resetForm();}}>Cancel</button>
                <button type="submit" className="primary-btn" style={{padding:'12px 36px', borderRadius: '10px', background: '#2563eb', fontWeight: '600'}}>Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
