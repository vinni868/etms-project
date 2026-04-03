import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axiosConfig";
import {
  FaChalkboardTeacher,
  FaEnvelope,
  FaPhoneAlt,
  FaEdit,
  FaSearch,
  FaFilter,
  FaSyncAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowLeft,
  FaArrowRight,
  FaUserEdit,
  FaCircle,
  FaPlus,
  FaUsers,
  FaFingerprint,
  FaCalendarCheck,
  FaLayerGroup,
  FaIdCard
} from "react-icons/fa";
import "./ManageTrainers.css";

const PAGE_SIZE = 10;

function ManageTrainers() {
  const [trainers, setTrainers] = useState([]);
  const [batches, setBatches] = useState([]);
  
  /* Filtering & Pagination */
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  
  /* Editing States */
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  /* UI Feedback */
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, bRes] = await Promise.all([
        api.get("/admin/all-trainers"),
        api.get("/admin/batches")
      ]);
      setTrainers(tRes.data);
      setBatches(bRes.data);
    } catch (err) {
      showToast("Failed to fetch trainer data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        name: editingTrainer.name,
        email: editingTrainer.email,
        phone: editingTrainer.phone,
        password: editingTrainer.password || "", // Backend handles empty password
        portalId: editingTrainer.portalId || editingTrainer.studentId || ""
      };
      
      await api.put(`/admin/update-trainer/${editingTrainer.id}`, payload);
      showToast("Trainer profile updated successfully!");
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data || "Update failed.";
      showToast(errorMsg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const getTrainerBatches = (trainerId) => {
    return batches.filter(b => b.trainerId === trainerId || (b.trainer && b.trainer.id === trainerId));
  };

  /* ── Filtering Logic ── */
  const filteredTrainers = trainers.filter(t => {
    const matchesSearch = 
      t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.portalId || t.studentId)?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check for both object enum and string status
    const tStatus = typeof t.status === 'object' ? t.status.name : t.status;
    const matchesStatus = statusFilter === "ALL" || tStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTrainers.length / PAGE_SIZE);
  const pagedList = filteredTrainers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  /* Stats calculation */
  const stats = {
    total: trainers.length,
    active: trainers.filter(t => (t.status?.name || t.status) === "ACTIVE").length,
    pending: trainers.filter(t => (t.status?.name || t.status) === "PENDING").length
  };

  return (
    <div className="adm-hub">
      {/* Toast Notification */}
      {toast && (
        <div className={`adm-toast adm-toast--${toast.type}`}>
          {toast.type === "success" ? <FaCheckCircle /> : <FaTimesCircle />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="adm-hub__header">
        <div className="hub-info">
          <h1 className="hub-title">Trainer Management Hub</h1>
          <p className="hub-subtitle">Oversee trainer profiles, batch assignments, and approval statuses.</p>
        </div>
        <div className="hub-actions">
           {/* Assign to Batch functionality removed as requested */}
        </div>
      </div>

      {/* Stats Section */}
      <div className="hub-stats">
        <div className="stat-card">
          <div className="stat-icon stat-icon--indigo"><FaChalkboardTeacher /></div>
          <div className="stat-content">
            <span className="stat-label">Total Trainers</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--green"><FaCheckCircle /></div>
          <div className="stat-content">
            <span className="stat-label">Active Trainers</span>
            <span className="stat-value">{stats.active}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--amber"><FaUsers /></div>
          <div className="stat-content">
            <span className="stat-label">Awaiting Approval</span>
            <span className="stat-value">{stats.pending}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="hub-controls">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name, email, or portal ID..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="filter-group">
          <div className="filter-item">
            <FaFilter />
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <button className="hub-refresh-btn" onClick={fetchData} title="Refresh Data">
            <FaSyncAlt className={loading ? "spin" : ""} />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="hub-table-container">
        {loading ? (
          <div style={{ padding: '40px' }}>
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton-line" style={{ marginBottom: '12px' }}></div>)}
          </div>
        ) : (
          <table className="hub-table">
            <thead>
              <tr>
                <th>Member Identity</th>
                <th>Contact Info</th>
                <th>Member Since</th>
                <th>Assigned Batches</th>
                <th>System Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedList.length > 0 ? pagedList.map((trainer) => (
                <tr key={trainer.id}>
                  <td data-label="Member Identity">
                    <div className="tra-cell">
                      <div className="avatar-box">
                        {trainer.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="tra-info">
                        <span className="tra-name">{trainer.name}</span>
                        <span className="tra-id"><FaFingerprint size={10} /> {trainer.portalId || trainer.studentId || trainer.id}</span>
                      </div>
                    </div>
                  </td>
                  <td data-label="Contact Info">
                    <div className="contact-cell">
                      <div className="contact-item"><FaEnvelope /> {trainer.email}</div>
                      <div className="contact-item"><FaPhoneAlt /> {trainer.phone}</div>
                    </div>
                  </td>
                  <td data-label="Member Since">
                    <div className="contact-cell">
                       <span style={{fontSize:'13px', fontWeight:700, color:'#1e293b'}}>
                         {trainer.createdAt ? new Date(trainer.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric'}) : "---"}
                       </span>
                       <span style={{fontSize:'11px', color:'#64748b', fontWeight:600}}>
                         <FaCalendarCheck size={10} /> Account Created
                       </span>
                    </div>
                  </td>
                  <td data-label="Assigned Batches">
                    <div className="batch-stack">
                      {getTrainerBatches(trainer.id).length > 0 ? (
                        getTrainerBatches(trainer.id).map(b => (
                          <span key={b.id} className="batch-pill">
                             <FaLayerGroup size={10} style={{marginRight: '6px', opacity: 0.6}} />
                             {b.batchName}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>No Batches Assigned</span>
                      )}
                    </div>
                  </td>
                  <td data-label="System Status">
                     <span className={`status-pill status-pill--${(typeof trainer.status === 'object' ? trainer.status.name : trainer.status || "PENDING").toLowerCase()}`}>
                        <FaCircle size={6} /> {typeof trainer.status === 'object' ? trainer.status.name : trainer.status || "PENDING"}
                     </span>
                  </td>
                  <td data-label="Actions">
                    <button 
                      className="action-btn action-btn--edit" 
                      onClick={() => { setEditingTrainer(trainer); setIsEditModalOpen(true); }}
                      title="Edit Trainer Profile"
                    >
                      <FaUserEdit />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                    <FaUsers size={40} style={{ opacity: 0.2, marginBottom: '16px' }} />
                    <p>No trainers found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="hub-pagination">
          <button className="pg-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>
            <FaArrowLeft />
          </button>
          <div className="pg-numbers">
            {[...Array(totalPages)].map((_, i) => (
              <button 
                key={i} 
                className={`pg-num ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button className="pg-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>
            <FaArrowRight />
          </button>
        </div>
      )}

      {/* Edit Trainer Modal */}
      {isEditModalOpen && editingTrainer && (
        <div className="adm-modal-overlay">
          <div className="adm-modal">
            <div className="modal-header">
              <h2><FaUserEdit /> Edit Trainer Profile</h2>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateProfile}>
              <div className="modal-body">
                <div className="m-field">
                  <label><FaIdCard /> Portal / Trainer ID</label>
                  <input 
                    type="text" 
                    value={editingTrainer.portalId || editingTrainer.studentId || ""} 
                    onChange={(e) => setEditingTrainer({...editingTrainer, portalId: e.target.value, studentId: e.target.value})}
                    required
                  />
                </div>
                <div className="m-field">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    value={editingTrainer.name} 
                    onChange={(e) => setEditingTrainer({...editingTrainer, name: e.target.value})}
                    required
                  />
                </div>
                <div className="m-field">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    value={editingTrainer.email} 
                    onChange={(e) => setEditingTrainer({...editingTrainer, email: e.target.value})}
                    required
                  />
                </div>
                <div className="m-field">
                  <label>Phone Number</label>
                  <input 
                    type="text" 
                    value={editingTrainer.phone} 
                    onChange={(e) => setEditingTrainer({...editingTrainer, phone: e.target.value})}
                    required
                  />
                </div>
                <div style={{
                  marginTop: '10px',
                  background: '#fefce8', 
                  border: '1.5px dashed #facc15', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  fontSize: '13px', 
                  color: '#854d0e', 
                  fontWeight: 600, 
                  display: 'flex', 
                  gap: '12px', 
                  alignItems: 'center',
                  lineHeight: '1.5'
                }}>
                   <FaFingerprint size={18} style={{minWidth: '18px'}} />
                   <span>
                     <strong>Security Protocol:</strong> Direct password modification is restricted for security. Trainers manage their own passwords.
                   </span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="m-btn m-btn--cancel" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="m-btn m-btn--save" disabled={actionLoading}>
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageTrainers;
