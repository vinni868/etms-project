import { useEffect, useState, useRef } from "react";
import api, { handleDownload } from "../../api/axiosConfig";

import "./CreateCourse.css";

const API_BASE = "/admin";
const PAGE_SIZE = 4;

function CreateCourse() {
  const [courseName, setCourseName] = useState("");
  const [duration, setDuration]     = useState("");
  const [description, setDescription] = useState("");
  const [courseCode, setCourseCode]   = useState("");
  const [category, setCategory]       = useState("");
  const [file, setFile]               = useState(null);
  const [shortcut, setShortcut]       = useState("");
  const fileInputRef                = useRef(null);

  const [courses,         setCourses]         = useState([]);
  const [inactiveCourses, setInactiveCourses] = useState([]);
  const [viewMode,        setViewMode]        = useState("ACTIVE");
  const [searchTerm,      setSearchTerm]      = useState("");
  const [editingId,       setEditingId]       = useState(null);
  const [message,         setMessage]         = useState("");
  const [error,           setError]           = useState("");
  const [loading,         setLoading]         = useState(false);

  /* pagination */
  const [currentPage, setCurrentPage] = useState(1);

  const token = localStorage.getItem("token");

  useEffect(() => { fetchCourses(); }, []);

  /* reset page when view or search changes */
  useEffect(() => { setCurrentPage(1); }, [viewMode, searchTerm]);

  /* ── API calls (unchanged) ── */
  const fetchCourses = async () => {
    try {
      const [activeRes, inactiveRes] = await Promise.all([
        api.get(`${API_BASE}/courses`,          { headers: { Authorization: `Bearer ${token}` } }),
        api.get(`${API_BASE}/courses/inactive`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setCourses(activeRes.data);
      setInactiveCourses(inactiveRes.data);
    } catch { setError("Failed to load courses."); }
  };

  const resetForm = () => {
    setCourseName(""); setDuration(""); setDescription(""); 
    setCourseCode(""); setCategory("");
    setShortcut(""); setFile(null); setEditingId(null); setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    if (!courseName || !duration || (description?.length || 0) < 10)
      return setError("Please fill all fields correctly (Description min 10 chars).");
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("courseName",   courseName);
      formData.append("duration",     duration);
      formData.append("description",  description);
      formData.append("courseCode",   courseCode);
      formData.append("category",     category);
      formData.append("shortcut",     shortcut);
      if (file) formData.append("file", file);
      const config = { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } };
      if (editingId) {
        await api.put(`${API_BASE}/courses/${editingId}`, formData, config);
        setMessage("Course updated successfully!");
      } else {
        await api.post(`${API_BASE}/course`, formData, config);
        setMessage("Course created successfully!");
      }
      resetForm(); fetchCourses();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Operation failed.");
    } finally { setLoading(false); }
  };

  const handleEdit = (course) => {
    setEditingId(course.id);
    setCourseName(course.courseName || "");
    setDuration(course.duration || "");
    setDescription(course.description || "");
    setCourseCode(course.courseCode || "");
    setCategory(course.category || "");
    setShortcut(course.shortcut || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Mark this course as inactive?")) return;
    try {
      await api.delete(`${API_BASE}/courses/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Course marked as Inactive."); fetchCourses();
    } catch { setError("Failed to delete course."); }
  };

  const handleReactivate = async (id) => {
    try {
      await api.put(`${API_BASE}/courses/reactivate/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Course reactivated successfully."); fetchCourses();
    } catch { setError("Failed to reactivate course."); }
  };

  /* ── derived list with pagination ── */
  const displayedCourses  = viewMode === "ACTIVE" ? courses : inactiveCourses;
  const filteredCourses   = displayedCourses.filter(c =>
    c.courseName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages  = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE));
  const pagedCourses = filteredCourses.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  /* duration icon helper */
  const durIcon = (d) => {
    if (!d || typeof d !== "string") return "🏆";
    if (d.includes("Month") && parseInt(d) <= 1) return "🗓️";
    if (d.includes("Month")) return "📆";
    return "🏆";
  };

  return (
    <div className="cc-page">

      {/* ════════ PAGE HEADER ════════ */}
      <div className="cc-page-header">
        <div className="cc-page-header__left">
          <div className="cc-page-header__icon">📚</div>
          <div>
            <h1 className="cc-page-header__title">Course Management</h1>
            <p className="cc-page-header__sub">Create, edit and manage your course catalogue</p>
          </div>
        </div>
        <div className="cc-page-header__stats">
          <div className="cc-stat-pill cc-stat-pill--blue">
            <span className="cc-stat-pill__num">{courses.length}</span>
            <span className="cc-stat-pill__label">Active</span>
          </div>
          <div className="cc-stat-pill cc-stat-pill--amber">
            <span className="cc-stat-pill__num">{inactiveCourses.length}</span>
            <span className="cc-stat-pill__label">Inactive</span>
          </div>
        </div>
      </div>

      <div className="cc-layout">

        {/* ════════ LEFT — FORM ════════ */}
        <div className="cc-form-panel">
          <div className="cc-form-panel__head">
            <div className="cc-form-panel__head-icon">
              {editingId ? "✏️" : "➕"}
            </div>
            <div>
              <h2 className="cc-form-panel__title">
                {editingId ? "Edit Course" : "New Course"}
              </h2>
              <p className="cc-form-panel__sub">
                {editingId ? "Update the course details below" : "Fill in the details to create a course"}
              </p>
            </div>
          </div>

          {/* alerts */}
          {message && (
            <div className="cc-alert cc-alert--success">
              <span className="cc-alert__icon">✅</span>
              <span>{message}</span>
            </div>
          )}
          {error && (
            <div className="cc-alert cc-alert--error">
              <span className="cc-alert__icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="cc-form">
            {/* Course Name */}
            <div className="cc-field">
              <label className="cc-label">
                <span className="cc-label__icon">📝</span>
                Course Name
              </label>
              <input
                className="cc-input"
                type="text"
                value={courseName}
                onChange={e => setCourseName(e.target.value)}
                placeholder="e.g. Full Stack Java Development"
              />
            </div>

            {/* Duration */}
            <div className="cc-field">
              <label className="cc-label">
                <span className="cc-label__icon">⏱️</span>
                Duration
              </label>
              <div className="cc-select-wrap">
                <select
                  className="cc-select"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                >
                  <option value="">— Select Duration —</option>
                  <option>1 Month</option>
                  <option>3 Months</option>
                  <option>6 Months</option>
                  <option>1 Year</option>
                </select>
                <span className="cc-select-arrow">▾</span>
              </div>

              {/* Duration visual pills */}
              <div className="cc-duration-pills">
                {["1 Month","3 Months","6 Months","1 Year"].map(d => (
                  <button
                    key={d} type="button"
                    className={`cc-dur-pill ${duration === d ? "cc-dur-pill--active" : ""}`}
                    onClick={() => setDuration(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Course Code */}
            <div className="cc-field">
              <label className="cc-label">
                <span className="cc-label__icon">🔢</span>
                Course Code
              </label>
              <input
                className="cc-input"
                type="text"
                value={courseCode}
                onChange={e => setCourseCode(e.target.value)}
                placeholder="e.g. CS101"
              />
            </div>

            {/* Category */}
            <div className="cc-field">
              <label className="cc-label">
                <span className="cc-label__icon">📁</span>
                Category
              </label>
              <input
                className="cc-input"
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="e.g. Programming, Design"
              />
            </div>

            {/* Shortcut */}
            <div className="cc-field">
              <label className="cc-label">
                <span className="cc-label__icon">🆔</span>
                Course Shortcut (for ID Gen)
              </label>
              <input
                className="cc-input"
                type="text"
                value={shortcut}
                onChange={e => setShortcut(e.target.value)}
                placeholder="e.g. FSJ, FSP"
                maxLength="5"
              />
              <span className="cc-hint">Used in Student IDs (e.g., 202410<strong>FSJ</strong>00001)</span>
            </div>

            {/* Description */}
            <div className="cc-field">
              <label className="cc-label">
                <span className="cc-label__icon">📄</span>
                Description
                <span className="cc-label__count">{(description || "").length}/500</span>
              </label>
              <textarea
                className="cc-textarea"
                rows="5"
                maxLength="500"
                value={description || ""}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the course content, outcomes and prerequisites..."
              />
              <div className="cc-char-bar">
                <div
                  className="cc-char-bar__fill"
                  style={{ width: `${((description || "").length / 500) * 100}%`,
                    background: (description || "").length < 10 ? "#ef4444"
                               : (description || "").length > 450 ? "#f59e0b" : "#16a34a"
                  }}
                />
              </div>
              {(description || "").length < 10 && (description || "").length > 0 && (
                <span className="cc-hint cc-hint--warn">Minimum 10 characters required</span>
              )}
            </div>

            {/* File Upload */}
            <div className="cc-field">
              <label className="cc-label">
                <span className="cc-label__icon">📎</span>
                Syllabus File
              </label>
              <label className="cc-file-drop">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.doc,.docx"
                  onChange={e => setFile(e.target.files[0])}
                  className="cc-file-input"
                />
                <div className="cc-file-drop__inner">
                  <div className="cc-file-drop__icon">{file ? "📋" : "⬆️"}</div>
                  <div className="cc-file-drop__text">
                    {file ? file.name : "Click to upload PDF, DOC or DOCX"}
                  </div>
                  <div className="cc-file-drop__hint">
                    {editingId ? "Leave empty to keep existing file" : "Max 10MB • PDF, DOC, DOCX"}
                  </div>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="cc-form-actions">
              <button
                className={`cc-btn-primary ${loading ? "cc-btn-primary--loading" : ""}`}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <><span className="cc-spinner" /> Saving…</>
                ) : editingId ? (
                  <><span>💾</span> Update Course</>
                ) : (
                  <><span>🚀</span> Create Course</>
                )}
              </button>
              {editingId && (
                <button className="cc-btn-cancel" onClick={resetForm}>
                  ✕ Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ════════ RIGHT — LIST ════════ */}
        <div className="cc-list-panel">

          {/* List header */}
          <div className="cc-list-header">
            <div className="cc-list-header__left">
              <h3 className="cc-list-title">
                {viewMode === "ACTIVE" ? "Active Courses" : "Inactive Courses"}
              </h3>
              <span className="cc-list-count">{filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="cc-list-header__right">
              {/* Toggle */}
              <div className="cc-toggle">
                <button
                  className={`cc-toggle__btn ${viewMode === "ACTIVE" ? "cc-toggle__btn--active" : ""}`}
                  onClick={() => setViewMode("ACTIVE")}
                >
                  ✅ Active
                </button>
                <button
                  className={`cc-toggle__btn ${viewMode === "INACTIVE" ? "cc-toggle__btn--inactive-on" : ""}`}
                  onClick={() => setViewMode("INACTIVE")}
                >
                  🗃️ Inactive
                </button>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="cc-search">
            <span className="cc-search__icon">🔍</span>
            <input
              className="cc-search__input"
              type="text"
              placeholder="Search courses by name…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="cc-search__clear" onClick={() => setSearchTerm("")}>✕</button>
            )}
          </div>

          {/* Course cards */}
          <div className="cc-scroll-area">
            {pagedCourses.length === 0 ? (
              <div className="cc-empty">
                <div className="cc-empty__icon">📭</div>
                <div className="cc-empty__text">
                  {searchTerm ? `No courses match "${searchTerm}"` : "No courses found"}
                </div>
              </div>
            ) : (
              pagedCourses.map((course, idx) => (
                <div
                  key={course.id}
                  className={`cc-course-card ${editingId === course.id ? "cc-course-card--editing" : ""}`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {/* Status ribbon */}
                  <div className={`cc-course-card__ribbon ${viewMode === "INACTIVE" ? "cc-course-card__ribbon--inactive" : ""}`} />

                  <div className="cc-course-card__top">
                    <div className="cc-course-card__icon-wrap">
                      <span className="cc-course-card__icon">📘</span>
                    </div>
                    <div className="cc-course-card__meta">
                      <h4 className="cc-course-card__name">{course.courseName}</h4>
                      <div className="cc-course-card__chips">
                        <span className="cc-chip cc-chip--dur">
                          {durIcon(course.duration)} {course.duration}
                        </span>
                        <span className={`cc-chip ${viewMode === "ACTIVE" ? "cc-chip--active" : "cc-chip--inactive"}`}>
                          {viewMode === "ACTIVE" ? "● Active" : "○ Inactive"}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="cc-course-card__actions">
                      {viewMode === "ACTIVE" && (
                        <>
                          <button
                            className="cc-icon-btn cc-icon-btn--edit"
                            title="Edit course"
                            onClick={() => handleEdit(course)}
                          >✏️</button>
                          <button
                            className="cc-icon-btn cc-icon-btn--delete"
                            title="Deactivate course"
                            onClick={() => handleDelete(course.id)}
                          >🗑️</button>
                        </>
                      )}
                      {viewMode === "INACTIVE" && (
                        <button
                          className="cc-icon-btn cc-icon-btn--reactivate"
                          title="Reactivate course"
                          onClick={() => handleReactivate(course.id)}
                        >🔄</button>
                      )}
                    </div>
                  </div>

                  <p className="cc-course-card__desc">{course.description}</p>

                  {/* Syllabus row */}
                  {course.syllabusFileName && (
                    <div className="cc-syllabus-row">
                      <div className="cc-syllabus-row__info">
                        <span className="cc-syllabus-row__file-icon">📎</span>
                        <div>
                          <span className="cc-syllabus-row__label">Syllabus</span>
                          <span className="cc-syllabus-row__name">{course.syllabusFileName}</span>
                        </div>
                      </div>
                      <button
                        className="cc-download-btn"
                        onClick={() =>
                          handleDownload(
                            `${API_BASE}/courses/${course.id}/syllabus?mode=download`,
                            course.syllabusFileName
                          )
                        }
                      >
                        ⬇ Download
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* ════ PAGINATION ════ */}
          {totalPages > 1 && (
            <div className="cc-pagination">
              <button
                className="cc-page-btn cc-page-btn--nav"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >‹ Prev</button>

              <div className="cc-page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
                  /* Show first, last, current ±1 and ellipsis */
                  if (
                    p === 1 || p === totalPages ||
                    (p >= currentPage - 1 && p <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={p}
                        className={`cc-page-btn ${currentPage === p ? "cc-page-btn--active" : ""}`}
                        onClick={() => setCurrentPage(p)}
                      >{p}</button>
                    );
                  }
                  if (p === 2 && currentPage > 3) return <span key="e1" className="cc-page-ellipsis">…</span>;
                  if (p === totalPages - 1 && currentPage < totalPages - 2) return <span key="e2" className="cc-page-ellipsis">…</span>;
                  return null;
                })}
              </div>

              <button
                className="cc-page-btn cc-page-btn--nav"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >Next ›</button>

              <span className="cc-page-info">
                Page {currentPage} of {totalPages}
                <span className="cc-page-info__sep">·</span>
                {filteredCourses.length} total
              </span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default CreateCourse;
