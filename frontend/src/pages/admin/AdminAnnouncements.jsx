import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { FaBullhorn, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import './AdminAnnouncements.css';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPopup, setIsPopup] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [selectedRoles, setSelectedRoles] = useState(['ALL']);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearchText, setUserSearchText] = useState('');

  const rolesOptions = [
    { id: 'ALL', label: 'All Users (Everyone)' },
    { id: 'ROLE_STUDENT', label: 'Students' },
    { id: 'ROLE_TRAINER', label: 'Trainers' },
    { id: 'ROLE_COUNSELOR', label: 'Counselors' },
    { id: 'ROLE_MARKETER', label: 'Marketers' },
    { id: 'ROLE_ADMIN', label: 'Admins' },
    { id: 'ROLE_SUPERADMIN', label: 'Super Admins' }
  ];

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/announcements');
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/all-users');
      setUsersList(res.data || []);
    } catch (err) {
      console.error('Failed to fetch users list for targeting', err);
    }
  };

  useEffect(() => { 
    fetchAnnouncements(); 
    fetchUsers();
  }, []);

  const handleRoleToggle = (roleId) => {
    if (roleId === 'ALL') {
      setSelectedRoles(['ALL']);
    } else {
      let newRoles = selectedRoles.filter(r => r !== 'ALL');
      if (newRoles.includes(roleId)) {
        newRoles = newRoles.filter(r => r !== roleId);
      } else {
        newRoles.push(roleId);
      }
      if (newRoles.length === 0) newRoles = ['ALL'];
      setSelectedRoles(newRoles);
    }
  };

  const handleUserToggle = (userObj) => {
    const isSelected = selectedUsers.some(u => u.id === userObj.id);
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== userObj.id));
    } else {
      setSelectedUsers([...selectedUsers, userObj]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      // Build targeting array format: ["ROLE_STUDENT", "USER_123"]
      const targetingArray = [...selectedRoles];
      selectedUsers.forEach(u => targetingArray.push(`USER_${u.id}`));

      const payload = {
        title,
        content,
        isPopup,
        targetRoles: JSON.stringify(targetingArray)
      };
      if (expiresAt) {
        payload.expiresAt = expiresAt;
      }

      if (editId) {
        await api.put(`/admin/announcements/${editId}`, payload);
        setMsg({ type: 'ok', text: 'Announcement updated!' });
      } else {
        await api.post('/admin/announcements', payload);
        setMsg({ type: 'ok', text: 'Announcement posted!' });
      }
      setShowModal(false);
      fetchAnnouncements();
    } catch (err) {
      setMsg({ type: 'err', text: err.response?.data?.message || 'Action failed.' });
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/admin/announcements/${id}`);
      setAnnouncements(announcements.filter(a => a.id !== id));
    } catch (err) {
      alert('Delete failed');
    }
  };

  const openEdit = (a) => {
    setEditId(a.id);
    setTitle(a.title);
    setContent(a.content);
    setIsPopup(a.isPopup);
    setExpiresAt(a.expiresAt ? new Date(a.expiresAt).toISOString().slice(0,16) : '');
    
    try {
      const parsedRoles = JSON.parse(a.targetRoles || '["ALL"]');
      const roles = parsedRoles.filter(r => !r.startsWith('USER_'));
      const uIds = parsedRoles.filter(r => r.startsWith('USER_')).map(r => parseInt(r.split('_')[1]));
      
      setSelectedRoles(roles.length ? roles : ['ALL']);
      setSelectedUsers(usersList.filter(u => uIds.includes(u.id)));
    } catch (e) {
      setSelectedRoles(['ALL']);
      setSelectedUsers([]);
    }
    setUserSearchText('');
    setShowModal(true);
  };

  const openNew = () => {
    setEditId(null);
    setTitle('');
    setContent('');
    setIsPopup(false);
    setExpiresAt('');
    setSelectedRoles(['ALL']);
    setSelectedUsers([]);
    setUserSearchText('');
    setShowModal(true);
  };

  const filteredUsers = usersList.filter(u => {
    const n = u.name ? u.name.toLowerCase() : '';
    const e = u.email ? u.email.toLowerCase() : '';
    const q = userSearchText.toLowerCase();
    return n.includes(q) || e.includes(q);
  }).slice(0, 50); // limit to 50 for performance

  return (
    <div className="admin-page">
      <div className="page-header">
        <div className="header-left">
          <div className="icon-wrapper bg-blue"><FaBullhorn /></div>
          <div>
            <h1>Announcements</h1>
            <p className="page-subtitle">Publish targeted alerts for roles or individuals</p>
          </div>
        </div>
        <button className="primary-btn" onClick={openNew}><FaPlus /> Post Announcement</button>
      </div>

      {msg && <div className={`alert-msg ${msg.type === 'ok' ? 'alert-success' : 'alert-error'}`}>{msg.text}</div>}

      <div className="announcements-grid">
        {loading ? <div className="loading-state">Loading...</div> : 
         announcements.length === 0 ? <p className="text-muted">No announcements found.</p> :
         announcements.map(a => (
           <div className="announcement-card" key={a.id}>
             <div className="acard-header">
               <h3>{a.title}</h3>
               {a.isPopup && <span className="badge badge-red">Popup</span>}
             </div>
             <p className="acard-content">{a.content}</p>
             <div className="acard-meta">
               <span><strong>Targets:</strong> {(() => {
                  try {
                    const parsed = JSON.parse(a.targetRoles || '["ALL"]');
                    const rolesStr = parsed.filter(t => !t.startsWith('USER_')).map(r => r.replace('ROLE_', '')).join(', ');
                    const userCount = parsed.filter(t => t.startsWith('USER_')).length;
                    return rolesStr + (userCount > 0 ? ` (+${userCount} selected users)` : '');
                  } catch(e) { return a.targetRoles; }
               })()}</span>
               <span><strong>Expires:</strong> {a.expiresAt ? new Date(a.expiresAt).toLocaleDateString() : 'Never'}</span>
             </div>
             <div className="acard-actions">
               <button className="action-btn" onClick={() => openEdit(a)}><FaEdit /> Edit</button>
               <button className="action-btn text-red" onClick={() => handleDelete(a.id)}><FaTrash /> Delete</button>
             </div>
           </div>
         ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '700px'}}>
            <div className="modal-header">
              <h2>{editId ? 'Edit' : 'Post'} Target Announcement</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body" style={{maxHeight:'80vh', overflowY:'auto'}}>
              
              <div className="target-section-box">
                <h4>1. Message Details</h4>
                <div className="form-group" style={{marginTop:'10px'}}>
                  <label>Title*</label>
                  <input required value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Message Content*</label>
                  <textarea required rows="4" value={content} onChange={e => setContent(e.target.value)}></textarea>
                </div>
              </div>

              {msg && msg.type === 'err' && (
                <div style={{color:'white', background:'#ef4444', padding:'10px', borderRadius:'6px', marginBottom:'15px', fontSize:'14px'}}>
                  {msg.text}
                </div>
              )}

              <div className="target-section-box" style={{marginTop:'20px', padding:'15px', border:'1px solid #e2e8f0', borderRadius:'8px', background:'#f8fafc'}}>
                <h4 style={{marginBottom:'15px'}}>2. Target Audience</h4>
                
                <div className="form-group">
                  <label style={{marginBottom:'8px'}}>Select Roles:</label>
                  <div className="checkbox-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                    {rolesOptions.map(role => (
                      <label key={role.id} style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'14px', cursor:'pointer', fontWeight: '500'}}>
                        <input 
                          type="checkbox" 
                          checked={selectedRoles.includes(role.id)} 
                          onChange={() => handleRoleToggle(role.id)}
                          style={{width:'auto'}}
                        />
                        {role.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{marginTop:'15px'}}>
                  <label style={{marginBottom:'5px'}}>Select Specific Users (Optional):</label>
                  <p style={{fontSize:'12px', color:'#64748b', marginBottom:'8px'}}>Search by name or email to add specific individuals.</p>
                  
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    value={userSearchText}
                    onChange={(e) => setUserSearchText(e.target.value)}
                    style={{marginBottom:'10px'}}
                  />
                  
                  <div className="user-search-results" style={{maxHeight:'150px', overflowY:'auto', border:'1px solid #e2e8f0', borderRadius:'6px', background:'white'}}>
                    {filteredUsers.length === 0 ? <div style={{padding:'10px', fontSize:'13px', color:'#64748b'}}>No relevant users found.</div> : 
                      filteredUsers.map(u => {
                        const isSel = selectedUsers.some(su => su.id === u.id);
                        return (
                          <div 
                            key={u.id} 
                            onClick={() => handleUserToggle(u)}
                            style={{padding:'8px 12px', fontSize:'13px', cursor:'pointer', borderBottom:'1px solid #f1f5f9', background: isSel ? '#eff6ff' : 'white', display:'flex', justifyContent:'space-between', alignItems:'center'}}
                          >
                            <span>{u.name || 'Unknown'} <span style={{color:'#94a3b8'}}>({u.email}) - {(u.role?.roleName || u.role || '').toString().replace('ROLE_', '')}</span></span>
                            {isSel && <span style={{color:'#3b82f6', fontWeight:'bold'}}>✓ Added</span>}
                          </div>
                        )
                      })
                    }
                  </div>

                  {selectedUsers.length > 0 && (
                    <div style={{marginTop:'15px'}}>
                      <label style={{fontSize:'13px'}}>Explicitly Selected Users:</label>
                      <div style={{display:'flex', flexWrap:'wrap', gap:'8px', marginTop:'5px'}}>
                        {selectedUsers.map(su => (
                          <div key={su.id} style={{background:'#e2e8f0', padding:'4px 10px', borderRadius:'16px', fontSize:'12px', display:'flex', alignItems:'center', gap:'6px'}}>
                            {su.name} 
                            <span style={{cursor:'pointer', color:'#ef4444', fontWeight:'bold'}} onClick={() => handleUserToggle(su)}>&times;</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="target-section-box" style={{marginTop:'20px'}}>
                <h4>3. Post Settings</h4>
                <div className="form-group" style={{marginTop:'10px'}}>
                  <label>Expiry Date (Optional)</label>
                  <input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
                </div>
                <div className="form-group" style={{flexDirection:'row', alignItems:'center', gap:'10px', display:'flex'}}>
                  <input type="checkbox" id="isp" checked={isPopup} onChange={e => setIsPopup(e.target.checked)} style={{width:'auto', cursor:'pointer'}} />
                  <label htmlFor="isp" style={{marginBottom:0, cursor:'pointer'}}>Show as Dashboard Popup Banner directly to specified users</label>
                </div>
              </div>

              <div className="modal-actions" style={{marginTop:'25px'}}>
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">{editId ? 'Update & Save Targets' : 'Broadcast Announcement'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
