import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axiosConfig";
import {
  FaUserGraduate,
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
  FaGlobe,
  FaUserSlash,
  FaCircle,
  FaIdCard,
  FaBookOpen,
  FaLayerGroup,
  FaHandPointer,
  FaProjectDiagram,
  FaFingerprint,
  FaTimes
} from "react-icons/fa";
import "./ManageStudents.css";

const PAGE_SIZE = 10;

const MODES = ["ONLINE", "OFFLINE", "HYBRID"];
const STATUSES = ["ACTIVE", "INACTIVE"];

function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [courseMappings, setCourseMappings] = useState([]);
  const [batchMappings, setBatchMappings] = useState([]);
  
  /* Filtering & Pagination */
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  
  /* Editing States */
  const [editingStudent, setEditingStudent] = useState(null);
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
      const [s, cm, bm] = await Promise.all([
        api.get("/admin/students"),
        api.get("/admin/student-course-mappings"),
        api.get("/admin/student-batch-mappings")
      ]);
      setStudents(s.data);
      setCourseMappings(cm.data);
      setBatchMappings(bm.data);
    } catch (err) {
      showToast("Failed to fetch data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── API Handlers ── */
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        name: editingStudent.name,
        email: editingStudent.email,
        phone: editingStudent.phone,
        status: editingStudent.status,
        studentId: editingStudent.studentId || editingStudent.portalId
      };
      
      await api.put(`/admin/students/${editingStudent.id}`, payload);
      showToast("Student profile updated successfully!");
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Update failed. Please check your data.";
      showToast(errorMsg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeMode = async (mappingId, newMode) => {
    setActionLoading(true);
    try {
      await api.patch(`/admin/student-course-mappings/${mappingId}/mode`, { courseMode: newMode });
      showToast(`Mode updated to ${newMode}`);
      setCourseMappings(prev => prev.map(m => 
        m.mappingId === mappingId ? { ...m, courseMode: newMode } : m
      ));
    } catch (err) {
      showToast("Failed to update mode", "error");
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Utility ── */
  const getEnrollments = (studentId) => courseMappings.filter(m => m.studentId === studentId);
  const getBatches = (studentId) => batchMappings.filter(m => m.studentId === studentId);

  /* ── Filtering Logic ── */
  const filteredStudents = students.filter(s => {
    const searchString = `${s.name} ${s.email} ${s.studentId || s.portalId}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const sStatus = (s.status?.name || s.status || "ACTIVE").toUpperCase();
    const matchesStatus = statusFilter === "ALL" || sStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE);
  const pagedList = filteredStudents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
          <h1 className="hub-title">Student Registry</h1>
          <p className="hub-subtitle">Manage student lifecycles, enrollment modes, and system access.</p>
        </div>
        <div className="hub-actions">
          <Link to="/admin/student-allotment" className="hub-link-btn">
            <FaProjectDiagram /> Allotment Portal
          </Link>
          <Link to="/admin/create-user" className="hub-primary-btn">
             <FaUserGraduate /> Provision Student
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="hub-stats">
        <div className="stat-card">
          <div className="stat-icon stat-icon--blue"><FaUserGraduate /></div>
          <div className="stat-content">
            <span className="stat-label">Total Students</span>
            <span className="stat-value">{students.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--green"><FaGlobe /></div>
          <div className="stat-content">
            <span className="stat-label">Active Modules</span>
            <span className="stat-value">{courseMappings.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--purple"><FaLayerGroup /></div>
          <div className="stat-content">
            <span className="stat-label">Batch Load</span>
            <span className="stat-value">{batchMappings.length}</span>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="hub-controls">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name, email or Portal ID..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="filter-group">
          <div className="filter-item">
            <FaFilter className="filter-icon" />
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <button className="hub-refresh-btn" onClick={fetchData} title="Refresh Data">
            <FaSyncAlt className={loading ? "spin" : ""} />
          </button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="hub-table-container">
        <table className="hub-table">
          <thead>
            <tr>
              <th>Member Identity</th>
              <th>Contact Info</th>
              <th>Course Enrollments</th>
              <th>Assigned Batches</th>
              <th>System Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan="6" style={{padding: '40px', textAlign: 'center'}}><FaSyncAlt className="spin" /> Loading Registry...</td></tr>
              ))
            ) : pagedList.length === 0 ? (
              <tr>
                <td colSpan="6" style={{padding: '80px', textAlign: 'center'}}>
                    <FaUserSlash style={{fontSize: '48px', color: '#cbd5e1', marginBottom: '16px'}} />
                    <p style={{color: '#64748b', fontWeight: 600}}>No students match your current criteria.</p>
                </td>
              </tr>
            ) : pagedList.map((stu) => {
              const enrollments = getEnrollments(stu.id);
              const batches = getBatches(stu.id);
              const statusStr = (stu.status?.name || stu.status || "ACTIVE").toUpperCase();

              return (
                <tr key={stu.id}>
                  <td>
                    <div className="stu-cell">
                      <div className="avatar-box">
                        {stu.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="stu-info">
                        <span className="stu-name">{stu.name}</span>
                        <span className="stu-id"><FaFingerprint size={10} /> {stu.studentId || stu.portalId || "TEMP-ID"}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-cell">
                      <div className="contact-item"><FaEnvelope /> {stu.email}</div>
                      <div className="contact-item"><FaPhoneAlt /> {stu.phone || "---"}</div>
                    </div>
                  </td>
                  <td>
                    <div className="enrollment-stack">
                      {enrollments.length === 0 ? (
                        <span style={{color: '#94a3b8', fontSize: '12px', fontWeight: 700}}>No Courses Linked</span>
                      ) : (
                        enrollments.map(enr => (
                          <div key={enr.mappingId} className="enrollment-item">
                            <div className="course-header">
                               <div className="course-icon-mini"><FaBookOpen /></div>
                               <span className="course-name">{enr.courseName}</span>
                            </div>
                            <select 
                              className={`mode-select mode-select--${enr.courseMode?.toLowerCase()}`}
                              value={enr.courseMode || "OFFLINE"}
                              onChange={(evt) => handleChangeMode(enr.mappingId, evt.target.value)}
                            >
                              {MODES.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </div>
                        ))
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="batch-chips">
                      {batches.length === 0 ? (
                        <span style={{color: '#94a3b8', fontSize: '12px', fontWeight: 700}}>Unassigned</span>
                      ) : (
                        batches.map(b => (
                          <span key={b.mappingId} className="batch-chip">
                             <FaLayerGroup size={10} style={{marginRight: '6px', opacity: 0.6}} />
                             {b.batchName}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td>
                     <span className={`status-pill status-pill--${statusStr.toLowerCase()}`}>
                       <FaCircle size={6} /> {statusStr}
                     </span>
                  </td>
                  <td>
                    <div className="hub-action-btns">
                      <button 
                        className="action-btn" 
                        title="Modify Profile"
                        onClick={() => {
                          setEditingStudent({...stu, status: statusStr});
                          setIsEditModalOpen(true);
                        }}
                      >
                        <FaUserEdit />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="hub-pagination">
          <button className="pg-num" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><FaArrowLeft /></button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
            <button key={num} className={`pg-num ${currentPage === num ? "active" : ""}`} onClick={() => setCurrentPage(num)}>{num}</button>
          ))}
          <button className="pg-num" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><FaArrowRight /></button>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && editingStudent && (
        <div className="adm-modal-overlay">
          <div className="adm-modal">
            <div className="modal-header">
              <h2 style={{margin: 0, display: 'flex', alignItems: 'center', gap: '15px'}}>
                <div className="avatar-box" style={{width: '40px', height: '40px', fontSize: '16px'}}>
                    <FaUserEdit />
                </div>
                Edit Student Profile
              </h2>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleUpdateProfile}>
              <div className="modal-body">
                <div className="modal-grid">
                  <div className="m-field">
                    <label><FaIdCard /> Portal ID / Student ID</label>
                    <input 
                      type="text" 
                      required 
                      value={editingStudent.studentId || editingStudent.portalId || ""}
                      onChange={(e) => setEditingStudent({...editingStudent, studentId: e.target.value, portalId: e.target.value})}
                    />
                  </div>
                  <div className="m-field">
                    <label><FaCircle /> Account Status</label>
                    <select 
                      value={editingStudent.status}
                      onChange={(e) => setEditingStudent({...editingStudent, status: e.target.value})}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="m-field m-field--full">
                    <label><FaUserGraduate /> Full Name</label>
                    <input 
                      type="text" 
                      required 
                      value={editingStudent.name}
                      onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                    />
                  </div>
                  <div className="m-field">
                    <label><FaEnvelope /> Email Address</label>
                    <input 
                      type="email" 
                      required 
                      value={editingStudent.email}
                      onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                    />
                  </div>
                  <div className="m-field">
                    <label><FaPhoneAlt /> Phone Number</label>
                    <input 
                      type="text" 
                      placeholder="+91 XXXXX XXXXX"
                      value={editingStudent.phone || ""}
                      onChange={(e) => setEditingStudent({...editingStudent, phone: e.target.value})}
                    />
                  </div>
                </div>
                
                <div style={{
                  marginTop: '30px',
                  background: '#fefce8', 
                  border: '1.5px dashed #facc15', 
                  padding: '20px', 
                  borderRadius: '16px', 
                  fontSize: '14px', 
                  color: '#854d0e', 
                  fontWeight: 600, 
                  display: 'flex', 
                  gap: '12px', 
                  alignItems: 'center',
                  lineHeight: '1.5'
                }}>
                   <FaFingerprint size={20} style={{minWidth: '20px'}} />
                   <span>
                     <strong>Security Protocol:</strong> Direct password modification is restricted here. 
                     Please use the <em>Master Reset</em> function if the student cannot access their portal.
                   </span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="hub-link-btn" style={{padding: '12px 24px'}} onClick={() => setIsEditModalOpen(false)}>Discard</button>
                <button type="submit" className="hub-primary-btn" style={{padding: '12px 36px'}} disabled={actionLoading}>
                   {actionLoading ? "Syncing..." : "Apply Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageStudents;
