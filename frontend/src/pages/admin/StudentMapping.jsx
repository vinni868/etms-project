import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axiosConfig";
import {
  FaUserGraduate,
  FaBookOpen,
  FaLayerGroup,
  FaSearch,
  FaLink,
  FaCheckCircle,
  FaInfoCircle,
  FaEdit,
  FaTimes,
  FaPlus,
  FaAward
} from "react-icons/fa";
import AdminCertificateModal from "./AdminCertificateModal";
import "./StudentMapping.css";

const PAGE_SIZE = 6;

const AVATAR_COLORS = [
  { bg: "#eff6ff", color: "#2563eb" },
  { bg: "#f5f3ff", color: "#7c3aed" },
  { bg: "#ecfdf5", color: "#059669" },
  { bg: "#fff7ed", color: "#ea580c" },
  { bg: "#fdf2f8", color: "#db2777" },
  { bg: "#ecfeff", color: "#0891b2" },
];

/* Which form panel is active */
const PANEL_COURSE = "course";
const PANEL_BATCH  = "batch";

function StudentMapping() {
  const [students,       setStudents]       = useState([]);
  const [courses,        setCourses]        = useState([]);
  const [batches,        setBatches]        = useState([]);
  const [courseMappings, setCourseMappings] = useState([]);
  const [batchMappings,  setBatchMappings]  = useState([]);

  /* form state */
  const [activePanel,          setActivePanel]          = useState(PANEL_COURSE);
  const [selectedStudentCourse, setSelectedStudentCourse] = useState("");
  const [selectedCourse,       setSelectedCourse]       = useState("");
  const [selectedStudentBatch,  setSelectedStudentBatch]  = useState("");
  const [selectedBatch,        setSelectedBatch]        = useState("");

  /* edit mode — which mapping is being edited */
  const [editingCourseMapping, setEditingCourseMapping] = useState(null); // { studentId, courseName, mappingId }
  const [editingBatchMapping,  setEditingBatchMapping]  = useState(null); // { studentId, batchName,  mappingId }
  
  /* modal */
  const [certModalStudent, setCertModalStudent] = useState(null);

  /* list controls */
  const [searchTerm,  setSearchTerm]  = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  /* feedback */
  const [message, setMessage] = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const fetchData = async () => {
    try {
      const [s, c, b, cm, bm] = await Promise.all([
        api.get("/admin/students"),
        api.get("/admin/courses"),
        api.get("/admin/batches"),
        api.get("/admin/student-course-mappings"),
        api.get("/admin/student-batch-mappings"),
      ]);
      setStudents(s.data);
      setCourses(c.data);
      const activeBatches = b.data.filter(
        batch => batch.status === "ONGOING" || batch.status === "ACTIVE"
      );
      setBatches(activeBatches);
      setCourseMappings(cm.data);
      setBatchMappings(bm.data);
    } catch {
      setError("Failed to fetch data. Please refresh.");
    }
  };

  const showSuccess = (msg) => {
    setMessage(msg);
    setError("");
    setTimeout(() => setMessage(""), 3000);
  };

  /* ── Course enrollment / re-enrollment ── */
  const handleCourseSubmit = async () => {
    if (!selectedStudentCourse || !selectedCourse) {
      return setError("Select both a student and a course.");
    }
    try {
      setLoading(true);
      setError("");
      await api.post("/admin/enrolments", {
        studentId: selectedStudentCourse,
        courseId: selectedCourse
      });
      showSuccess(
        editingCourseMapping
          ? "Course mapping updated successfully!"
          : "Student enrolled in course successfully!"
      );
      fetchData();
      resetCourseForm();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data || "Enrollment failed");
    } finally {
      setLoading(false);
    }
  };

  /* ── Batch allotment / re-allotment ── */
  const handleBatchSubmit = async () => {
    if (!selectedStudentBatch || !selectedBatch) {
      return setError("Select both a student and a batch.");
    }
    try {
      setLoading(true);
      setError("");
      await api.post("/admin/enrolments", {
        studentId: selectedStudentBatch,
        batchId: selectedBatch
      });
      showSuccess("Batch assignment updated successfully!");
      fetchData();
      resetBatchForm();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBatchMapping = async (mappingId) => {
    if (!window.confirm("Remove this batch assignment?")) return;
    try {
      setLoading(true);
      await api.delete("/admin/student-batch-mappings", { params: { mappingId } });
      showSuccess("Assignment removed.");
      fetchData();
    } catch (err) {
      setError("Failed to remove assignment.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Quick Assign from Card ── */
  const handleQuickEnroll = (stu) => {
    setActivePanel(PANEL_COURSE);
    setSelectedStudentCourse(stu.studentId?.toString());
    setSelectedCourse("");
    setEditingCourseMapping(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleQuickAllot = (stu) => {
    setActivePanel(PANEL_BATCH);
    setSelectedStudentBatch(stu.studentId?.toString());
    setSelectedBatch("");
    setEditingBatchMapping(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── Edit handlers — pre-fill form & switch panel ── */
  const handleEditCourse = (item) => {
    setActivePanel(PANEL_COURSE);
    setEditingCourseMapping(item);
    // Pre-select the student
    const student = students.find(s => s.name === item.studentName || s.id === item.studentId);
    setSelectedStudentCourse(student?.id?.toString() || "");
    // Pre-select the course
    const course = courses.find(c => c.courseName === item.courseName);
    setSelectedCourse(course?.id?.toString() || "");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditBatch = (item) => {
    setActivePanel(PANEL_BATCH);
    setEditingBatchMapping(item);
    // Pre-select the student
    const student = students.find(s => s.name === item.studentName || s.id === item.studentId);
    setSelectedStudentBatch(student?.id?.toString() || "");
    // Pre-select the batch
    const batch = batches.find(b => b.batchName === item.batchName);
    setSelectedBatch(batch?.id?.toString() || "");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetCourseForm = () => {
    setSelectedStudentCourse("");
    setSelectedCourse("");
    setEditingCourseMapping(null);
    setError("");
  };

  const resetBatchForm = () => {
    setSelectedStudentBatch("");
    setSelectedBatch("");
    setEditingBatchMapping(null);
    setError("");
  };

  /* ── Derived / merged list ── */
  const mergedAssignments = students.map(stu => {
    const sCourses = courseMappings.filter(cm => cm.studentId === stu.id);
    const sBatches = batchMappings.filter(bm => bm.studentId === stu.id);
    
    return {
      studentId: stu.id,
      studentName: stu.name,
      studentEmail: stu.email,
      formattedId: stu.studentId || stu.portalId,
      status: stu.status?.name || stu.status,
      courses: sCourses,
      batches: sBatches
    };
  });

  const filteredList = mergedAssignments.filter(item => {
    const searchString = `${item.studentName} ${item.formattedId} ${item.courses.map(c => c.courseName).join(" ")} ${item.batches.map(b => b.batchName).join(" ")}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const totalPages   = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const pagedList    = filteredList.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  /* stats */
  const enrolledCount = courseMappings.length;
  const batchCount    = batchMappings.length;

  return (
    <div className="ms-page">

      {/* ══════════════ PAGE HEADER ══════════════ */}
      <div className="ms-page-header">
        <div className="ms-page-header__left">
          <div className="ms-page-header__icon">🔗</div>
          <div>
            <h1 className="ms-page-header__title">Course & Batch Allotment</h1>
            <p className="ms-page-header__sub">Map Students to their Academic Modules</p>
          </div>
        </div>
        <div className="ms-page-header__right">
          <div className="ms-page-header__stats">
            <div className="ms-stat-pill ms-stat-pill--blue">
              <span className="ms-stat-pill__num">{students.length}</span>
              <span className="ms-stat-pill__label">Students</span>
            </div>
            <div className="ms-stat-pill ms-stat-pill--green">
              <span className="ms-stat-pill__num">{enrolledCount}</span>
              <span className="ms-stat-pill__label">Enrolled</span>
            </div>
            <div className="ms-stat-pill ms-stat-pill--purple">
              <span className="ms-stat-pill__num">{batchCount}</span>
              <span className="ms-stat-pill__label">Batches</span>
            </div>
          </div>
        </div>
      </div>

      <div className="ms-layout">

        {/* ════ LEFT — FORM PANEL ════ */}
        <div className="ms-form-panel">

          {/* Panel switcher tabs */}
          <div className="ms-panel-tabs">
            <button
              className={`ms-panel-tab ${activePanel === PANEL_COURSE ? "ms-panel-tab--active" : ""}`}
              onClick={() => { setActivePanel(PANEL_COURSE); resetCourseForm(); resetBatchForm(); }}
            >
              <FaBookOpen /> Course Enrollment
            </button>
            <button
              className={`ms-panel-tab ${activePanel === PANEL_BATCH ? "ms-panel-tab--active" : ""}`}
              onClick={() => { setActivePanel(PANEL_BATCH); resetCourseForm(); resetBatchForm(); }}
            >
              <FaLayerGroup /> Batch Allotment
            </button>
          </div>

          {/* Alerts */}
          {message && (
            <div className="ms-alert ms-alert--success">
              <FaCheckCircle /><span>{message}</span>
            </div>
          )}
          {error && (
            <div className="ms-alert ms-alert--error">
              <FaInfoCircle /><span>{error}</span>
            </div>
          )}

          {/* ── COURSE PANEL ── */}
          {activePanel === PANEL_COURSE && (
            <div className="ms-section">
              <div className="ms-section__head">
                <div className="ms-section__icon">📘</div>
                <div>
                  <h3 className="ms-section__title">
                    {editingCourseMapping ? "Update Course Enrollment" : "Enroll in Course"}
                  </h3>
                  <p className="ms-section__sub">
                    {editingCourseMapping
                      ? `Editing enrollment for ${editingCourseMapping.studentName}`
                      : "Link a student to a course"}
                  </p>
                </div>
                {editingCourseMapping && (
                  <button className="ms-cancel-edit" onClick={resetCourseForm}>
                    <FaTimes />
                  </button>
                )}
              </div>

              <div className="ms-field">
                <label className="ms-label"><FaUserGraduate className="ms-label__icon" />Select Student</label>
                <div className="ms-select-wrap">
                  <select
                    className="ms-select"
                    value={selectedStudentCourse}
                    onChange={e => { setSelectedStudentCourse(e.target.value); setError(""); }}
                  >
                    <option value="">— Choose Student —</option>
                    {students
                      .filter(s => 
                        (s.status?.name || s.status) === "ACTIVE" && 
                        (s.approvalStatus?.name || s.approvalStatus) === "APPROVED"
                      )
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.studentId || s.email})</option>
                    ))}
                  </select>
                  <span className="ms-select-arrow">▾</span>
                </div>
              </div>

              <div className="ms-field">
                <label className="ms-label"><FaBookOpen className="ms-label__icon" />Select Course</label>
                <div className="ms-select-wrap">
                  <select
                    className="ms-select"
                    value={selectedCourse}
                    onChange={e => { setSelectedCourse(e.target.value); setError(""); }}
                  >
                    <option value="">— Choose Course —</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.courseName}</option>
                    ))}
                  </select>
                  <span className="ms-select-arrow">▾</span>
                </div>
              </div>

              <div className="ms-form-actions">
                <button className="ms-btn-primary" onClick={handleCourseSubmit} disabled={loading}>
                  {loading
                    ? <><span className="ms-spinner" /> Saving…</>
                    : <><FaLink /> {editingCourseMapping ? "Update Enrollment" : "Link Course"}</>}
                </button>
                {editingCourseMapping && (
                  <button className="ms-btn-cancel" onClick={resetCourseForm}>✕ Cancel</button>
                )}
              </div>
            </div>
          )}

          {/* ── BATCH PANEL ── */}
          {activePanel === PANEL_BATCH && (
            <div className="ms-section">
              <div className="ms-section__head">
                <div className="ms-section__icon">🗂️</div>
                <div>
                  <h3 className="ms-section__title">
                    {editingBatchMapping ? "Update Batch Assignment" : "Assign to Batch"}
                  </h3>
                  <p className="ms-section__sub">
                    {editingBatchMapping
                      ? `Editing batch for ${editingBatchMapping.studentName}`
                      : "Allot a student to an active batch"}
                  </p>
                </div>
                {editingBatchMapping && (
                  <button className="ms-cancel-edit" onClick={resetBatchForm}>
                    <FaTimes />
                  </button>
                )}
              </div>

              <div className="ms-field">
                <label className="ms-label"><FaUserGraduate className="ms-label__icon" />Select Student</label>
                <div className="ms-select-wrap">
                  <select
                    className="ms-select"
                    value={selectedStudentBatch}
                    onChange={e => { 
                      const sId = e.target.value;
                      setSelectedStudentBatch(sId); 
                      setError("");
                      // Auto-select current batch if exists
                      if (sId) {
                        const current = batchMappings.find(m => String(m.studentId) === String(sId));
                        if (current) setSelectedBatch(current.batchId?.toString() || "");
                        else setSelectedBatch("");
                      }
                    }}
                  >
                    <option value="">— Choose Student —</option>
                    {students
                      .filter(s => 
                        (s.status?.name || s.status) === "ACTIVE" && 
                        (s.approvalStatus?.name || s.approvalStatus) === "APPROVED"
                      )
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.studentId || s.email})</option>
                    ))}
                  </select>
                  <span className="ms-select-arrow">▾</span>
                </div>
              </div>

              <div className="ms-field">
                <label className="ms-label"><FaLayerGroup className="ms-label__icon" />Select Active Batch</label>
                <div className="ms-select-wrap">
                  <select
                    className="ms-select"
                    value={selectedBatch}
                    onChange={e => { setSelectedBatch(e.target.value); setError(""); }}
                  >
                    <option value="">— Select Batch —</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.batchName}</option>
                    ))}
                  </select>
                  <span className="ms-select-arrow">▾</span>
                </div>
              </div>

              <div className="ms-form-actions">
                <button
                  className="ms-btn-primary ms-btn-primary--navy"
                  onClick={handleBatchSubmit}
                  disabled={!selectedBatch || loading}
                >
                  {loading
                    ? <><span className="ms-spinner" /> Saving…</>
                    : <><FaLayerGroup /> {editingBatchMapping ? "Update Batch" : "Assign Batch"}</>}
                </button>
                {editingBatchMapping && (
                  <button className="ms-btn-cancel" onClick={resetBatchForm}>✕ Cancel</button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ════ RIGHT — LIST PANEL ════ */}
        <div className="ms-list-panel">

          {/* List header */}
          <div className="ms-list-header">
            <div className="ms-list-header__left">
              <h3 className="ms-list-title">Current Allotments</h3>
              <span className="ms-list-count">
                {filteredList.length} record{filteredList.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="ms-search">
              <FaSearch className="ms-search__icon" />
              <input
                className="ms-search__input"
                type="text"
                placeholder="Search student, course, batch…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="ms-search__clear" onClick={() => setSearchTerm("")}>✕</button>
              )}
            </div>
          </div>

          {/* ── PAGINATION — above cards ── */}
          {totalPages > 1 && (
            <div className="ms-pagination">
              <button
                className="ms-page-btn ms-page-btn--nav"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >‹ Prev</button>

              <div className="ms-page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
                  if (
                    p === 1 || p === totalPages ||
                    (p >= currentPage - 1 && p <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={p}
                        className={`ms-page-btn ${currentPage === p ? "ms-page-btn--active" : ""}`}
                        onClick={() => setCurrentPage(p)}
                      >{p}</button>
                    );
                  }
                  if (p === 2 && currentPage > 3)
                    return <span key="e1" className="ms-page-ellipsis">…</span>;
                  if (p === totalPages - 1 && currentPage < totalPages - 2)
                    return <span key="e2" className="ms-page-ellipsis">…</span>;
                  return null;
                })}
              </div>

              <button
                className="ms-page-btn ms-page-btn--nav"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >Next ›</button>

              <span className="ms-page-info">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredList.length)}
                <span className="ms-page-info__sep">·</span>
                {filteredList.length} total
              </span>
            </div>
          )}

          {/* Assignment cards */}
          <div className="ms-scroll-area">
            {pagedList.length === 0 ? (
              <div className="ms-empty">
                <div className="ms-empty__icon">📭</div>
                <p className="ms-empty__text">
                  {searchTerm
                    ? `No results for "${searchTerm}"`
                    : "No assignments found."}
                </p>
              </div>
            ) : (
              pagedList.map((item, idx) => {
                const scheme = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                const activeStatus = item.batches.some(b => b.batchStatus === "ACTIVE" || b.batchStatus === "ONGOING");

                return (
                  <div
                    key={item.studentId}
                    className="ms-card"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="ms-card__stripe" />

                    <div className="ms-card__body">
                      {/* Top: identity + global status */}
                      <div className="ms-card__top">
                        <div
                          className="ms-avatar"
                          style={{ background: scheme.bg, color: scheme.color }}
                        >
                          {item.studentName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="ms-card__identity">
                          <h4 className="ms-card__name">{item.studentName}</h4>
                          <span className="ms-card__email">{item.formattedId || item.studentEmail}</span>
                        </div>
                        
                        <div style={{display: 'flex', gap: '8px'}}>
                          <button 
                            className="ms-status-badge ms-status-badge--completed" 
                            style={{cursor: 'pointer', background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '4px'}}
                            onClick={() => setCertModalStudent(item)}
                          >
                            <FaAward /> Issue Cert
                          </button>
                          <span className={`ms-status-badge ms-status-badge--${item.status === 'ACTIVE' ? "active" : "completed"}`}>
                            {item.status === 'ACTIVE' ? "● Active" : "✓ Inactive"}
                          </span>
                        </div>
                      </div>

                      <div className="ms-card__details">
                        {/* Courses Section */}
                        <div className="ms-card__section">
                          <h5 className="ms-card__section-title">
                            <FaBookOpen /> Enrolled Courses
                            <button className="ms-quick-add" onClick={() => handleQuickEnroll(item)} title="Enroll in new course">
                              <FaPlus />
                            </button>
                          </h5>
                          {item.courses.length === 0 ? (
                            <span className="ms-no-data">No courses linked</span>
                          ) : (
                            <div className="ms-chip-list">
                              {item.courses.map(c => (
                                <div key={c.mappingId} className="ms-detail-chip">
                                  <span className="ms-detail-chip__val">{c.courseName}</span>
                                  <button onClick={() => handleEditCourse(c)} className="ms-chip-edit"><FaEdit /></button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Batches Section */}
                        <div className="ms-card__section">
                          <h5 className="ms-card__section-title">
                            <FaLayerGroup /> Assigned Batches
                            <button className="ms-quick-add" onClick={() => handleQuickAllot(item)} title="Assign to new batch">
                              <FaPlus />
                            </button>
                          </h5>
                          {item.batches.length === 0 ? (
                            <span className="ms-no-data">No batches assigned</span>
                          ) : (
                            <div className="ms-chip-list">
                              {item.batches.map(b => (
                                <div key={b.mappingId} className={`ms-detail-chip ${b.batchStatus === "INACTIVE" ? "ms-detail-chip--inactive" : ""}`}>
                                  <div className="ms-detail-chip__content">
                                    <span className="ms-detail-chip__val">{b.batchName}</span>
                                    <span className={`ms-batch-status ms-batch-status--${b.batchStatus?.toLowerCase()}`}>
                                      {b.batchStatus}
                                    </span>
                                  </div>
                                  <div className="ms-chip-actions">
                                    <button onClick={() => handleEditBatch(b)} className="ms-chip-edit" title="Edit Batch"><FaEdit /></button>
                                    <button onClick={() => handleRemoveBatchMapping(b.mappingId)} className="ms-chip-del" title="Remove Batch"><FaTimes /></button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>

      {certModalStudent && (
        <AdminCertificateModal 
          student={certModalStudent} 
          courses={courses} 
          onClose={() => setCertModalStudent(null)} 
        />
      )}
    </div>
  );
}

export default StudentMapping;
