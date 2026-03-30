import React, { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import {
  FaBook, FaDownload, FaClock, FaLink, FaCalendarAlt,
  FaExclamationCircle, FaGraduationCap, FaLayerGroup,
  FaCheckCircle, FaChevronRight, FaPlay, FaBan
} from "react-icons/fa";
import "./StudentCourses.css";

const API_BASE = "/student";

function StudentCourses() {
  const [courses, setCourses]     = useState([]);
  const [batches, setBatches]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [activeTab, setActiveTab] = useState("courses");

  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => { fetchStudentData(); }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);

      // ── Courses ──
      const coursesRes = await api.get(`${API_BASE}/my-courses`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setCourses(coursesRes.data);

      // ── Batches ──
      const batchesRes = await api.get(`${API_BASE}/my-batches`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      // ── For each batch, fetch today's class + next upcoming ──
      // Backend now uses class_date = TODAY (exact) for today's sessions
      // and class_date > TODAY LIMIT 1 for upcoming — no range logic.
      const batchWithClasses = await Promise.all(
        batchesRes.data.map(async (batch) => {
          try {
            const classesRes = await api.get(`${API_BASE}/batch-classes`, {
              params: { batchId: batch.batchId },
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true,
            });
            return { ...batch, classes: classesRes.data || [] };
          } catch {
            return { ...batch, classes: [] };
          }
        })
      );

      setBatches(batchWithClasses);
    } catch (err) {
      setError("Unable to load your courses or batches. Please check your connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Format date string → "14 Mar 2026 · Today" / "15 Mar 2026 · Tomorrow" etc.
  // GUARD: never show negative day labels (past dates should never arrive
  // from backend anymore, but this is a safety net).
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));

    // Safety guard: negative diff means a past date slipped through — show plain date
    let label = null;
    if (diff === 0)        label = "Today";
    else if (diff === 1)   label = "Tomorrow";
    else if (diff > 1 && diff <= 7) label = `In ${diff} days`;
    // diff < 0 → past date → no label (should not happen with fixed backend)

    const formatted = d.toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
    return label ? `${formatted} · ${label}` : formatted;
  };

  // ── Format "09:30:00" or "09:30" → "9:30 AM" ──
  const formatTime = (timeStr) => {
    if (!timeStr) return "—";
    const parts = timeStr.split(":");
    let h = parseInt(parts[0], 10);
    const minute = parts[1] || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minute} ${ampm}`;
  };

  const handleViewSyllabus = async (courseId) => {
    try {
      const response = await api.get(`/student/courses/download/${courseId}?mode=view`, {
        responseType: 'blob'
      });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (err) {
      console.error("Error viewing syllabus", err);
      setError("Failed to open syllabus. Please try again.");
    }
  };

  if (loading) return (
    <div className="sc-loading">
      <div className="sc-spinner">
        <div className="sc-spinner-ring"></div>
        <FaGraduationCap className="sc-spinner-icon" />
      </div>
      <p>Loading your learning journey…</p>
    </div>
  );

  return (
    <div className="sc-root">

      {/* ── HERO ── */}
      <div className="sc-hero">
        <div className="sc-hero-bg" aria-hidden="true">
          <span className="sc-orb sc-orb-1"></span>
          <span className="sc-orb sc-orb-2"></span>
        </div>
        <div className="sc-hero-content">
          <div className="sc-avatar">
            {(user?.name || "S").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="sc-hero-eyebrow">Student Dashboard</p>
            <h1 className="sc-hero-title">
              Welcome back, <span>{user?.name?.split(" ")[0] || "Student"}</span>
            </h1>
            <p className="sc-hero-sub">
              Track your enrolled courses and upcoming live sessions.
            </p>
          </div>
        </div>
        <div className="sc-hero-stats">
          <div className="sc-stat">
            <FaBook />
            <div>
              <strong>{courses.length}</strong>
              <span>Courses</span>
            </div>
          </div>
          <div className="sc-stat-divider"></div>
          <div className="sc-stat">
            <FaLayerGroup />
            <div>
              <strong>{batches.length}</strong>
              <span>Batches</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ERROR ── */}
      {error && (
        <div className="sc-error">
          <FaExclamationCircle />
          <span>{error}</span>
        </div>
      )}

      {/* ── TABS ── */}
      <div className="sc-tabs">
        <button
          className={`sc-tab ${activeTab === "courses" ? "active" : ""}`}
          onClick={() => setActiveTab("courses")}
        >
          <FaBook /> My Courses
          <span className="sc-tab-count">{courses.length}</span>
        </button>
        <button
          className={`sc-tab ${activeTab === "batches" ? "active" : ""}`}
          onClick={() => setActiveTab("batches")}
        >
          <FaCalendarAlt /> My Batches
          <span className="sc-tab-count">{batches.length}</span>
        </button>
      </div>

      {/* ── COURSES PANEL ── */}
      {activeTab === "courses" && (
        <div className="sc-panel">
          {courses.length > 0 ? (
            <div className="sc-grid">
              {courses.map((course, i) => (
                <div
                  key={course.id}
                  className="sc-course-card"
                  style={{ "--delay": `${i * 60}ms` }}
                >
                  <div className="sc-card-stripe"></div>
                  <div className="sc-card-body">
                    <div className="sc-card-top">
                      <span className="sc-duration-tag">
                        <FaClock style={{ fontSize: "0.65rem" }} />
                        {course.duration}
                      </span>
                      {course.batchStatus && (
                        <span className={`sc-status-pill ${course.batchStatus.toLowerCase()}`}>
                          {course.batchStatus.toLowerCase() === "ongoing"
                            ? <><FaCheckCircle /> Ongoing</>
                            : course.batchStatus}
                        </span>
                      )}
                    </div>
                    <h3 className="sc-card-title">{course.courseName}</h3>
                    <p className="sc-card-desc">{course.description}</p>
                  </div>
                  <div className="sc-card-footer">
                    {course.syllabusFileName ? (
                      <button
                        className="sc-btn sc-btn-outline"
                        onClick={() => handleViewSyllabus(course.id)}
                      >
                        <FaDownload /> Download Syllabus
                      </button>
                    ) : (
                      <span className="sc-no-syllabus">No syllabus available</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sc-empty">
              <div className="sc-empty-icon"><FaBook /></div>
              <h3>No Courses Enrolled</h3>
              <p>You haven't been assigned to any courses yet. Contact your admin.</p>
            </div>
          )}
        </div>
      )}

      {/* ── BATCHES PANEL ── */}
      {activeTab === "batches" && (
        <div className="sc-panel">
          {batches.length > 0 ? (
            <div className="sc-grid">
              {batches.map((batch, i) => (
                <div
                  key={batch.batchId}
                  className="sc-batch-card"
                  style={{ "--delay": `${i * 60}ms` }}
                >
                  <div className="sc-card-stripe batch-stripe"></div>
                  <div className="sc-card-body">

                    {/* Batch header */}
                    <div className="sc-batch-header">
                      <div className="sc-batch-icon"><FaLayerGroup /></div>
                      <div>
                        <h3 className="sc-card-title">{batch.batchName}</h3>
                        <span className="sc-batch-live-pill">● ONGOING</span>
                      </div>
                    </div>

                    {/* ── SCHEDULE ── */}
                    <div className="sc-schedule-section">
                      <p className="sc-schedule-heading">
                        <FaCalendarAlt />
                        {/* Show "Today & Upcoming" only if there's actually a today class */}
                        {batch.classes?.some(c => c.is_today)
                          ? "Today & Upcoming"
                          : "Upcoming Classes"}
                      </p>

                      {batch.classes && batch.classes.length > 0 ? (
                        <ul className="sc-schedule-list">
                          {batch.classes.map((cls) => (
                            <li
                              key={cls.id}
                              className={`sc-schedule-item ${cls.is_today ? "today" : ""}`}
                            >
                              <div className="sc-schedule-dot">
                                {cls.is_today
                                  ? <FaPlay style={{ fontSize: "0.5rem" }} />
                                  : <FaChevronRight style={{ fontSize: "0.5rem" }} />}
                              </div>
                              <div className="sc-schedule-info">
                                <span className="sc-schedule-date">
                                  {formatDate(cls.class_date)}
                                </span>
                                <span className="sc-schedule-time">
                                  <FaClock style={{ fontSize: "0.65rem" }} />
                                  {formatTime(cls.start_time)} – {formatTime(cls.end_time)}
                                </span>
                              </div>
                              {cls.is_today && (
                                <span className="sc-today-badge">Today</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="sc-no-classes">
                          <FaCalendarAlt />
                          <span>No upcoming classes scheduled</span>
                        </div>
                      )}
                    </div>

                  </div>

                  <div className="sc-card-footer">
                    {batch.meetingLink ? (
                      <button
                        className="sc-btn sc-btn-primary"
                        onClick={() => window.open(batch.meetingLink, "_blank")}
                      >
                        <FaLink /> Enter Live Classroom
                      </button>
                    ) : (
                      <button className="sc-btn sc-btn-disabled" disabled>
                        <FaBan /> No Meeting Link
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sc-empty">
              <div className="sc-empty-icon"><FaCalendarAlt /></div>
              <h3>No Batches Assigned</h3>
              <p>You are not part of any active batch yet.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default StudentCourses;
