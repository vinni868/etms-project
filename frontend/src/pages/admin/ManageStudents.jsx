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
  FaEllipsisV,
  FaArrowLeft,
  FaArrowRight,
  FaUserEdit,
  FaGlobe,
  FaUserSlash,
  FaCircle
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
      // Clean payload: only send fields the backend expects for update
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
      console.error("Update Error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeMode = async (mappingId, newMode) => {
    setActionLoading(true);
    try {
      await api.patch(`/admin/student-course-mappings/${mappingId}/mode`, { courseMode: newMode });
      showToast(`Mode updated to ${newMode} successfully!`);
      // Update local state immediately for better UX
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
    const matchesSearch = 
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.studentId || s.portalId)?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "ALL" || s.status?.name === statusFilter || s.status === statusFilter;
    
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
          <h1 className="hub-title">Student Management Hub</h1>
          <p className="hub-subtitle">Centralized controller for student profiles, modes, and academic status.</p>
        </div>
        <div className="hub-actions">
          <Link to="/admin/student-allotment" className="hub-link-btn">
            🔗 Manage Allotments
          </Link>
          <Link to="/admin/create-user" className="hub-primary-btn">
             Provision Student
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
            <span className="stat-label">Mode Sync</span>
            <span className="stat-value">{courseMappings.length} Active</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--purple"><FaFilter /></div>
          <div className="stat-content">
            <span className="stat-label">Mapped Records</span>
            <span className="stat-value">{batchMappings.length} Batches</span>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="hub-controls">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name, email or ID..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="filter-group">
          <div className="filter-item">
            <FaFilter className="filter-icon" />
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
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
              <th>STUDENT</th>
              <th>CONTACT DETAILS</th>
              <th>ENROLLMENTS</th>
              <th>BATCH MAPPINGS</th>
              <th>SYSTEM STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td colSpan="6"><div className="skeleton-line" /></td>
                </tr>
              ))
            ) : pagedList.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-cell">
                  <div className="empty-state">
                    <FaUserSlash />
                    <p>No students found matching your filters.</p>
                  </div>
                </td>
              </tr>
            ) : pagedList.map((stu) => {
              const enrollments = getEnrollments(stu.id);
              const batches = getBatches(stu.id);
              const statusStr = (stu.status?.name || stu.status || "ACTIVE").toUpperCase();

              return (
                <tr key={stu.id}>
                  <td data-label="STUDENT">
                    <div className="stu-cell">
                      <div className="avatar-box">
                        {stu.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="stu-info">
                        <span className="stu-name">{stu.name}</span>
                        <span className="stu-id">{stu.studentId || stu.portalId || "N/A"}</span>
                      </div>
                    </div>
                  </td>
                  <td data-label="CONTACT">
                    <div className="contact-cell">
                      <div className="contact-item"><FaEnvelope /> {stu.email}</div>
                      <div className="contact-item"><FaPhoneAlt /> {stu.phone || "No Contact"}</div>
                    </div>
                  </td>
                  <td data-label="ENROLLMENTS">
                    <div className="enrollment-stack">
                      {enrollments.length === 0 ? (
                        <span className="no-data">Not Enrolled</span>
                      ) : (
                        enrollments.map(enr => (
                          <div key={enr.mappingId} className="enrollment-item">
                            <span className="course-name">{enr.courseName}</span>
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
                  <td data-label="BATCHES">
                    <div className="batch-chips">
                      {batches.length === 0 ? (
                        <span className="no-data">No Batches</span>
                      ) : (
                        batches.map(b => (
                          <span key={b.mappingId} className="batch-chip">
                            {b.batchName}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td data-label="STATUS">
                     <span className={`status-pill status-pill--${statusStr.toLowerCase()}`}>
                       <FaCircle /> {statusStr}
                     </span>
                  </td>
                  <td data-label="ACTIONS">
                    <div className="hub-action-btns">
                      <button 
                        className="action-btn action-btn--edit" 
                        title="Edit Student Profile"
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
          <button 
            className="pg-btn" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            <FaArrowLeft />
          </button>
          <div className="pg-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
              <button 
                key={num} 
                className={`pg-num ${currentPage === num ? "active" : ""}`}
                onClick={() => setCurrentPage(num)}
              >
                {num}
              </button>
            ))}
          </div>
          <button 
            className="pg-btn" 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            <FaArrowRight />
          </button>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && editingStudent && (
        <div className="adm-modal-overlay">
          <div className="adm-modal">
            <div className="modal-header">
              <h2><FaUserEdit /> Edit Student Profile</h2>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}><FaTimesCircle /></button>
            </div>
            <form onSubmit={handleUpdateProfile}>
              <div className="modal-body">
                <div className="modal-grid">
                  <div className="m-field">
                    <label>Student ID / Portal ID</label>
                    <input 
                      type="text" 
                      required 
                      value={editingStudent.studentId || editingStudent.portalId || ""}
                      onChange={(e) => setEditingStudent({...editingStudent, studentId: e.target.value, portalId: e.target.value})}
                    />
                  </div>
                  <div className="m-field">
                    <label>Account Status</label>
                    <select 
                      value={editingStudent.status}
                      onChange={(e) => setEditingStudent({...editingStudent, status: e.target.value})}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="m-field m-field--full">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      required 
                      value={editingStudent.name}
                      onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                    />
                  </div>
                  <div className="m-field">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      required 
                      value={editingStudent.email}
                      onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                    />
                  </div>
                  <div className="m-field">
                    <label>Phone Number</label>
                    <input 
                      type="text" 
                      value={editingStudent.phone || ""}
                      onChange={(e) => setEditingStudent({...editingStudent, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="m-warning">
                   ⚠️ Password reset is disabled in this module for security.
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

export default ManageStudents;
