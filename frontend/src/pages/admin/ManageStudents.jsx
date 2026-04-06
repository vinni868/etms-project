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
  FaTimes,
  FaIdBadge,
  FaExclamationCircle,
  FaCalendarCheck,
  FaUser,
  FaMapMarkerAlt,
  FaInfoCircle,
  FaGraduationCap
} from "react-icons/fa";
import { createPortal } from "react-dom";
import "./ManageStudents.css";

const PAGE_SIZE = 10;

const MODES = ["ONLINE", "OFFLINE", "HYBRID"];
const STATUSES = ["ACTIVE", "INACTIVE"];

/* ── Avatar colours for modal ── */
const AVATAR_COLORS = [
  { bg: "#eff6ff", color: "#2563eb" },
  { bg: "#f5f3ff", color: "#7c3aed" },
  { bg: "#ecfdf5", color: "#059669" },
  { bg: "#fff7ed", color: "#ea580c" },
  { bg: "#fdf2f8", color: "#db2777" },
  { bg: "#f0fdf4", color: "#16a34a" },
];

/* ══════════════════════════════════════════════════
   STUDENT PROFILE MODAL
   Shows detailed profile completion bar + data
   ══════════════════════════════════════════════════ */
function StudentProfileModal({ student, onClose }) {
  const [enrichedProfile, setEnrichedProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student?.email) { setLoading(false); return; }
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/student/profile/${student.email}`);
        if (res.data && Object.keys(res.data).length > 0) setEnrichedProfile(res.data);
      } catch { /* extended profile not yet created */ }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, [student]);

  const completionFields = enrichedProfile
    ? [
        enrichedProfile.name, enrichedProfile.phone, enrichedProfile.gender,
        enrichedProfile.qualification, enrichedProfile.yearOfPassing || enrichedProfile.year, 
        enrichedProfile.address, enrichedProfile.city, enrichedProfile.pincode,
        enrichedProfile.aadharCardUrl, enrichedProfile.resumeUrl
      ]
    : [];
  
  const completion = completionFields.length
    ? Math.round(completionFields.filter(f => f?.toString().trim()).length / completionFields.length * 100)
    : 0;

  const displayName = enrichedProfile?.name || student.name;
  const avatarLetter = displayName?.charAt(0).toUpperCase() || "S";
  const avatarColors = AVATAR_COLORS[student.id % AVATAR_COLORS.length];

  return createPortal(
    <div className="spm-overlay" onClick={(e) => e.target.classList.contains('spm-overlay') && onClose()}>
      <div className="spm-modal">
        <div className="spm-modal__header">
          <div className="spm-modal__header-left">
            <div className="spm-modal__header-icon"><FaUserGraduate /></div>
            <div>
              <h2 className="spm-modal__header-title">Student Profile</h2>
              <p className="spm-modal__header-sub">Registration & background insights</p>
            </div>
          </div>
          <button className="spm-close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="spm-body">
          <div className="spm-identity">
            <div className="spm-identity__avatar-wrap">
              {enrichedProfile?.profilePic ? (
                <img src={enrichedProfile.profilePic} alt={displayName} className="spm-identity__avatar-img" />
              ) : (
                <div className="spm-identity__avatar-letter" style={{ background: avatarColors.bg, color: avatarColors.color }}>
                  {avatarLetter}
                </div>
              )}
              <span className="spm-identity__status-dot" />
            </div>

            <div className="spm-identity__info">
              <h3 className="spm-identity__name">{displayName}</h3>
              <p className="spm-identity__qual">{enrichedProfile?.qualification || "Registered Student"}</p>
              <div className="spm-identity__badges">
                <span className="spm-badge spm-badge--id"><FaIdBadge /> {student.studentId || student.portalId}</span>
                <span className="spm-badge spm-badge--active"><FaCheckCircle /> Registered</span>
              </div>
            </div>

            <div className="spm-strength">
              <div className="spm-strength__label">
                <span>Profile Strength</span>
                <span className="spm-strength__pct">{completion}%</span>
              </div>
              <div className="spm-strength__bar">
                <div className="spm-strength__fill" style={{ width: `${completion}%` }} />
              </div>
            </div>
          </div>

          <div className="spm-grid">
            <div className="spm-section">
              <h4 className="spm-section__title"><FaEnvelope className="spm-section__ico" /> Contact</h4>
              <div className="spm-fields">
                <div className="spm-field">
                  <span className="spm-field__lbl">Email</span>
                  <span className="spm-field__val">{student.email}</span>
                </div>
                <div className="spm-field">
                  <span className="spm-field__lbl">Phone</span>
                  <span className="spm-field__val">{student.phone || <em style={{color:'#94a3b8'}}>Not Set</em>}</span>
                </div>
              </div>
            </div>

            <div className="spm-section">
              <h4 className="spm-section__title"><FaUser className="spm-section__ico" /> Personal</h4>
              <div className="spm-fields">
                <div className="spm-field">
                  <span className="spm-field__lbl">Gender</span>
                  <span className="spm-field__val">{enrichedProfile?.gender || "—"}</span>
                </div>
                <div className="spm-field">
                  <span className="spm-field__lbl">YOP</span>
                  <span className="spm-field__val">{enrichedProfile?.yearOfPassing || enrichedProfile?.year || "—"}</span>
                </div>
              </div>
            </div>

            <div className="spm-section">
              <h4 className="spm-section__title"><FaGraduationCap className="spm-section__ico" /> Academic</h4>
              <div className="spm-fields">
                <div className="spm-field">
                  <span className="spm-field__lbl">Agg. %</span>
                  <span className="spm-field__val">{enrichedProfile?.aggregatePercentage || "—"}</span>
                </div>
                <div className="spm-field spm-field--full">
                  <span className="spm-field__lbl" style={{marginBottom:'4px'}}>Skills</span>
                  <div className="spm-skills-wrap">
                    {enrichedProfile?.skills ? enrichedProfile.skills.split(',').map(s => <span key={s} className="spm-skill-tag">{s.trim()}</span>) : <span className="spm-field__val--empty">—</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="spm-section">
              <h4 className="spm-section__title"><FaMapMarkerAlt className="spm-section__ico" /> Location</h4>
              <div className="spm-fields">
                <div className="spm-field">
                  <span className="spm-field__lbl">City</span>
                  <span className="spm-field__val">{enrichedProfile?.city || "—"}</span>
                </div>
                <div className="spm-field">
                  <span className="spm-field__lbl">Pincode</span>
                  <span className="spm-field__val">{enrichedProfile?.pincode || "—"}</span>
                </div>
              </div>
            </div>

            {!loading && enrichedProfile?.bio && (
              <div className="spm-section spm-section--full">
                <h4 className="spm-section__title"><FaInfoCircle className="spm-section__ico" /> About Student</h4>
                <p className="spm-bio">{enrichedProfile.bio}</p>
              </div>
            )}
          </div>

          {!loading && !enrichedProfile && (
            <div className="spm-notice">
              <span className="spm-notice__ico">ℹ️</span>
              <p>This student has not yet completed their detailed profile information. Basic registration details are shown.</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

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
  const [profileStudent, setProfileStudent] = useState(null);
  
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
        <table className="hub-table responsive-card-table">
          <thead>
            <tr>
              <th>Member Identity</th>
              <th>Contact Info</th>
              <th>Member Since</th>
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
                  <td data-label="Member Identity">
                    <div className="stu-cell">
                      <div className="avatar-box">
                        {stu.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="stu-info">
                        <button className="stu-name-link" onClick={() => setProfileStudent(stu)}>
                          {stu.name}
                        </button>
                        <span className="stu-id"><FaFingerprint size={10} /> {stu.studentId || stu.portalId || "TEMP-ID"}</span>
                      </div>
                    </div>
                  </td>
                  <td data-label="Contact Info">
                    <div className="contact-cell">
                      <div className="contact-item"><FaEnvelope /> {stu.email}</div>
                      <div className="contact-item"><FaPhoneAlt /> {stu.phone || "---"}</div>
                    </div>
                  </td>
                  <td data-label="Member Since">
                    <div className="contact-cell">
                       <span style={{fontSize:'13px', fontWeight:700, color:'#1e293b'}}>
                         {stu.createdAt ? new Date(stu.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric'}) : "---"}
                       </span>
                       <span style={{fontSize:'11px', color:'#64748b', fontWeight:600}}>
                         <FaCalendarCheck size={10} /> Account Created
                       </span>
                    </div>
                  </td>
                  <td data-label="Course Enrollments">
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
                  <td data-label="Assigned Batches">
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
                  <td data-label="System Status">
                     <span className={`status-pill status-pill--${statusStr.toLowerCase()}`}>
                       <FaCircle size={6} /> {statusStr}
                     </span>
                  </td>
                  <td data-label="Actions">
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
                      placeholder="Enter 10-digit number"
                      maxLength="10"
                      value={editingStudent.phone || ""}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, "");
                        setEditingStudent({...editingStudent, phone: digitsOnly});
                      }}
                    />
                    {editingStudent.phone && editingStudent.phone.length < 10 && (
                      <div className="val-error-msg">
                        <FaExclamationCircle /> Min 10 digits required
                      </div>
                    )}
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
                <button type="submit" className="hub-primary-btn" style={{padding: '12px 36px'}} 
                  disabled={actionLoading || (editingStudent.phone && editingStudent.phone.length < 10)}>
                   {actionLoading ? "Syncing..." : "Apply Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT PROFILE POPUP */}
      {profileStudent && (
        <StudentProfileModal 
          student={profileStudent} 
          onClose={() => setProfileStudent(null)} 
        />
      )}
    </div>
  );
}

export default ManageStudents;
