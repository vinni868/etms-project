import React, { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import {
  FaLayerGroup, FaUsers, FaEnvelope, FaPhoneAlt, FaInbox,
  FaChevronLeft, FaChevronRight, FaClock, FaArrowLeft, FaSearch,
  FaGraduationCap, FaUserCircle, FaVideo, FaCopy, FaCheck, FaExternalLinkAlt
} from "react-icons/fa";
import "./TrainerCourses.css";

function TrainerCourses() {
  const user = JSON.parse(localStorage.getItem("user"));
  const trainerId = user?.id;

  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  const studentsPerPage = 8;

  useEffect(() => {
    if (trainerId) loadInitialData();
  }, [trainerId]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/teacher/active-batches/${trainerId}`);
      setBatches(res.data);
    } catch (err) {
      console.error("Failed to load batches", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchClick = async (batch) => {
    setSelectedBatch(batch);
    setCurrentPage(1);
    setStudents([]);
    setSearchTerm("");
    setLoading(true);
    try {
      const res = await api.get(`/teacher/batches/${batch.batchId}/students`);
      setStudents(res.data);
    } catch (err) {
      console.error("Failed to load students", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedBatch(null);
    setStudents([]);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleCopyLink = (id, link) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudentsPage = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const formatDate = (dateStr) => {
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeStr) => {
    const [hour, minute] = timeStr.split(":");
    let h = parseInt(hour, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minute} ${ampm}`;
  };

  const batchColors = [
    { accent: "#4f8ef7", light: "rgba(79,142,247,0.12)" },
    { accent: "#34d399", light: "rgba(52,211,153,0.12)" },
    { accent: "#f472b6", light: "rgba(244,114,182,0.12)" },
    { accent: "#fbbf24", light: "rgba(251,191,36,0.12)" },
    { accent: "#a78bfa", light: "rgba(167,139,250,0.12)" },
    { accent: "#38bdf8", light: "rgba(56,189,248,0.12)" },
  ];

  return (
    <div className="tc-root">

      {/* ── Header ── */}
      <header className="tc-header">
        <div className="tc-header-inner">
          <div className="tc-header-left">
            {selectedBatch && (
              <button className="tc-back-btn" onClick={handleBack}>
                <FaArrowLeft />
                <span>Back</span>
              </button>
            )}
            <div className="tc-title-block">
              <div className="tc-title-icon">
                <FaGraduationCap />
              </div>
              <div>
                <h1 className="tc-title">
                  {selectedBatch ? selectedBatch.batchName : "My Batches"}
                </h1>
                <p className="tc-subtitle">
                  {selectedBatch
                    ? `${students.length} enrolled student${students.length !== 1 ? "s" : ""}`
                    : `${batches.length} active batch${batches.length !== 1 ? "es" : ""}`}
                </p>
              </div>
            </div>
          </div>

          {/* Stats pill */}
          <div className="tc-stats-row">
            <div className="tc-stat">
              <FaLayerGroup className="tc-stat-icon batches" />
              <div>
                <span className="tc-stat-val">{batches.length}</span>
                <span className="tc-stat-lbl">Batches</span>
              </div>
            </div>
            <div className="tc-stat-divider" />
            <div className="tc-stat">
              <FaUsers className="tc-stat-icon students" />
              <div>
                <span className="tc-stat-val">{students.length}</span>
                <span className="tc-stat-lbl">Students</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="tc-main">

        {loading ? (
          <div className="tc-loading">
            <div className="tc-spinner" />
            <p>Loading...</p>
          </div>

        ) : !selectedBatch ? (

          /* ════ BATCH CARDS ════ */
          <div className="tc-batch-grid">
            {batches.length > 0 ? batches.map((batch, idx) => {
              const color = batchColors[idx % batchColors.length];
              const meetingLink = batch.meetingLink || batch.meeting_link || null;

              return (
                <div
                  key={batch.batchId}
                  className="tc-batch-card"
                  style={{ "--card-accent": color.accent, "--card-light": color.light }}
                >
                  <div className="tc-card-top-bar" />

                  <div className="tc-card-body">
                    <div className="tc-card-icon-wrap">
                      <FaLayerGroup />
                    </div>
                    <h2 className="tc-card-title">{batch.batchName}</h2>

                    {/* Schedule rows */}
                    {batch.classes?.length > 0 && (
                      <ul className="tc-class-list">
                        {batch.classes.slice(0, 3).map(cls => (
                          <li key={cls.id} className="tc-class-item">
                            <FaClock className="tc-cls-icon" />
                            <span>
                              <strong>{formatDate(cls.class_date)}</strong>{" "}
                              {formatTime(cls.start_time)} – {formatTime(cls.end_time)}
                            </span>
                            <span
                              className="tc-status-badge"
                              data-status={cls.status?.toLowerCase()}
                            >
                              {cls.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* ── Meeting Link ── */}
                    {meetingLink ? (
                      <div className="tc-meeting-row">
                        <div className="tc-meeting-label">
                          <FaVideo className="tc-meeting-icon" />
                          <span>Meeting Link</span>
                        </div>
                        <div className="tc-meeting-url-row">
                          <span className="tc-meeting-url-text">{meetingLink}</span>
                          <div className="tc-meeting-btns">
                            <button
                              className={`tc-icon-btn copy ${copiedId === batch.batchId ? "copied" : ""}`}
                              onClick={() => handleCopyLink(batch.batchId, meetingLink)}
                              title="Copy link"
                            >
                              {copiedId === batch.batchId ? <FaCheck /> : <FaCopy />}
                            </button>
                            <a
                              href={meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="tc-icon-btn join"
                              title="Join meeting"
                            >
                              <FaExternalLinkAlt />
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="tc-no-meeting">
                        <FaVideo className="tc-no-meeting-icon" />
                        <span>No meeting link assigned</span>
                      </div>
                    )}
                  </div>

                  <div className="tc-card-footer">
                    <button
                      className="tc-enter-btn"
                      onClick={() => handleBatchClick(batch)}
                    >
                      <FaUsers />
                      View Students
                      <FaChevronRight className="tc-btn-arrow" />
                    </button>
                  </div>
                </div>
              );
            }) : (
              <div className="tc-empty">
                <FaInbox className="tc-empty-icon" />
                <h3>No Active Batches</h3>
                <p>You have no ongoing batches at the moment.</p>
              </div>
            )}
          </div>

        ) : (

          /* ════ STUDENTS VIEW ════ */
          <div className="tc-students-panel">

            {/* ── Meeting Banner ── */}
            {(selectedBatch.meetingLink || selectedBatch.meeting_link) ? (
              <div className="tc-meeting-banner">
                <div className="tc-banner-pulse" />
                <div className="tc-banner-left">
                  <div className="tc-banner-icon-wrap">
                    <FaVideo />
                  </div>
                  <div className="tc-banner-text">
                    <p className="tc-banner-title">Batch Meeting Link</p>
                    <p className="tc-banner-url">
                      {selectedBatch.meetingLink || selectedBatch.meeting_link}
                    </p>
                  </div>
                </div>
                <div className="tc-banner-actions">
                  <button
                    className={`tc-banner-copy-btn ${copiedId === "banner" ? "copied" : ""}`}
                    onClick={() => handleCopyLink("banner", selectedBatch.meetingLink || selectedBatch.meeting_link)}
                  >
                    {copiedId === "banner" ? <><FaCheck /><span>Copied!</span></> : <><FaCopy /><span>Copy Link</span></>}
                  </button>
                  <a
                    href={selectedBatch.meetingLink || selectedBatch.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tc-banner-join-btn"
                  >
                    <FaVideo />
                    <span>Join Meeting</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="tc-no-meeting-banner">
                <FaVideo />
                <span>No meeting link has been assigned to this batch.</span>
              </div>
            )}

            {/* Toolbar */}
            <div className="tc-toolbar">
              <div className="tc-search">
                <FaSearch className="tc-search-icon" />
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <span className="tc-count-chip">
                <FaUsers /> {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""}
              </span>
              {totalPages > 1 && (
                <div className="tc-pagination">
                  <span className="tc-page-info">{currentPage} / {totalPages}</span>
                  <button className="tc-page-btn" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                    <FaChevronLeft />
                  </button>
                  <button className="tc-page-btn" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                    <FaChevronRight />
                  </button>
                </div>
              )}
            </div>

            {/* Student Cards */}
            {filteredStudents.length > 0 ? (
              <div className="tc-student-grid">
                {currentStudentsPage.map((student, idx) => (
                  <div
                    key={student.id}
                    className="tc-student-card"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="tc-student-avatar">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="tc-student-info">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                        <h4 className="tc-student-name" style={{ margin: 0 }}>{student.name}</h4>
                        <span style={{ 
                          fontSize: '0.65rem', 
                          padding: '0.25rem 0.6rem', 
                          borderRadius: '1rem', 
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.025em',
                          backgroundColor: (student.courseMode || student.coursemode || student.COURSEMODE) === 'ONLINE' ? '#ecfdf5' : ((student.courseMode || student.coursemode || student.COURSEMODE) === 'HYBRID' ? '#f5f3ff' : '#eff6ff'),
                          color: (student.courseMode || student.coursemode || student.COURSEMODE) === 'ONLINE' ? '#059669' : ((student.courseMode || student.coursemode || student.COURSEMODE) === 'HYBRID' ? '#7c3aed' : '#2563eb'),
                          border: `1px solid ${(student.courseMode || student.coursemode || student.COURSEMODE) === 'ONLINE' ? '#a7f3d0' : ((student.courseMode || student.coursemode || student.COURSEMODE) === 'HYBRID' ? '#ddd6fe' : '#bfdbfe')}`
                        }}>
                          {student.courseMode || student.coursemode || student.COURSEMODE || "OFFLINE"}
                        </span>
                      </div>
                      <a href={`mailto:${student.email}`} className="tc-student-email">
                        <FaEnvelope />
                        <span>{student.email}</span>
                      </a>
                      <div className="tc-student-phone">
                        <FaPhoneAlt />
                        <span>{student.phone || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="tc-empty">
                <FaUserCircle className="tc-empty-icon" />
                <h3>No Students Found</h3>
                <p>Try adjusting your search.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default TrainerCourses;