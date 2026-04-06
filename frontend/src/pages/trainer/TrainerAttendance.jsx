import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/axiosConfig";
import {
  FaSave, FaSearch, FaBookReader, FaChartLine,
  FaFilter, FaUsers, FaCalendarAlt,
  FaHistory, FaEdit, FaArrowRight, FaEnvelope,
  FaChevronLeft, FaChevronRight, FaCheckCircle,
  FaTimesCircle, FaBed, FaLayerGroup, FaClock,
  FaExclamationTriangle, FaCheck
} from "react-icons/fa";
import "./TrainerAttendance.css";

function TrainerAttendance() {
  const user        = JSON.parse(localStorage.getItem("user"));
  const trainerId   = user?.id || 3;
  const trainerName = user?.name || "Trainer";
  const today       = new Date().toISOString().split("T")[0];

  const [batches,            setBatches]            = useState([]);
  const [selectedBatch,      setSelectedBatch]      = useState("");
  const [students,           setStudents]           = useState([]);
  const [searchTerm,         setSearchTerm]         = useState("");
  const [topicTaught,        setTopicTaught]        = useState("");
  const [date,               setDate]               = useState(today);
  const [fromDate,           setFromDate]           = useState(today);
  const [toDate,             setToDate]             = useState(today);
  const [viewMode,           setViewMode]           = useState("MARK");
  const [attendanceHistory,  setAttendanceHistory]  = useState([]);
  const [loading,            setLoading]            = useState(false);
  const [saving,             setSaving]             = useState(false);
  const [isEditMode,         setIsEditMode]         = useState(false);
  const [currentPage,        setCurrentPage]        = useState(1);
  const [toast,              setToast]              = useState(null);
  
  const recordsPerPage = 10;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (trainerId) fetchActiveBatches();
  }, [trainerId]);

  useEffect(() => {
    if (viewMode === "MARK" && selectedBatch && date) fetchBatchStudents();
    setCurrentPage(1);
  }, [selectedBatch, date, viewMode]);

  const fetchActiveBatches = async () => {
    try {
      const res = await api.get(`/teacher/active-batches/${trainerId}`);
      setBatches(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Failed to fetch active batches", err); }
  };

  const fetchBatchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/teacher/attendance/check?batchId=${selectedBatch}&date=${date}`);
      if (res.data) {
        const studentsData = res.data.map(item => ({
          id: item.studentId, 
          name: item.studentName || "Student",
          email: item.studentEmail || "N/A",
          studentId: item.formattedId || item.studentId,
          status: (item.status === 'UNMARKED' || item.status === 'ONLINE') ? 'PRESENT' : item.status, 
          attendanceId: item.id || null,
          approvedOnline: item.approvedOnline === 1 || item.approvedOnline === true,
          isAutoLeave: item.status === 'LEAVE' && !(item.approvedOnline === 1 || item.approvedOnline === true),
          lateMinutes: item.lateMinutes || 0,
          courseMode: item.courseMode || item.coursemode || item.COURSEMODE || "OFFLINE",
          topic: item.topic || ""
        }));

        // CRITICAL FIX: Deduplicate students by ID
        const uniqueStudents = [];
        const seenIds = new Set();
        studentsData.forEach(s => {
          if (!seenIds.has(s.id)) {
            seenIds.add(s.id);
            uniqueStudents.push(s);
          }
        });

        setStudents(uniqueStudents);
        
        const hasSavedRecords = uniqueStudents.some(s => s.attendanceId && !s.isAutoLeave);
        setIsEditMode(hasSavedRecords);
        setTopicTaught(uniqueStudents.find(s => s.topic)?.topic || "");
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchAttendanceHistory = async () => {
    if (!selectedBatch) return showToast("Please select a batch first.", "error");
    if (fromDate > today || toDate > today) return showToast("Future dates are not allowed.", "error");
    setLoading(true);
    try {
      const res = await api.get(`/teacher/attendance/history/${selectedBatch}?from=${fromDate}&to=${toDate}`);
      setAttendanceHistory(Array.isArray(res.data) ? res.data.map(record => ({
        ...record, email: record.studentEmail || record.email || "N/A"
      })) : []);
      setViewMode("HISTORY");
      setCurrentPage(1);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (date > today) return showToast("Cannot mark future attendance.", "error");
    if (!selectedBatch) return showToast("Please select a batch.", "error");
    if (!topicTaught.trim()) return showToast("Please enter the topic taught.", "error");
    
    setSaving(true);
    const payload = students.map(s => ({
      id: s.attendanceId, 
      studentId: s.id, 
      batchId: selectedBatch,
      attendanceDate: date, 
      status: s.status, 
      lateMinutes: s.status === 'LATE' ? (s.lateMinutes || 0) : null,
      topic: topicTaught
    }));

    try {
      await api.post("/teacher/attendance/bulk", payload);
      showToast(isEditMode ? "Records Updated Successfully" : "Attendance Recorded Successfully");
      fetchBatchStudents();
    } catch (err) { 
      showToast("Save failed. Please try again.", "error"); 
    } finally {
      setSaving(false);
    }
  };

  const filteredData = useMemo(() => {
    const list = viewMode === "MARK" ? students : attendanceHistory;
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(item => 
      (item.name || item.studentName || "").toLowerCase().includes(term) ||
      (item.studentId || "").toString().includes(term)
    );
  }, [students, attendanceHistory, searchTerm, viewMode]);

  const indexOfLastRecord  = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords     = filteredData.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages         = Math.ceil(filteredData.length / recordsPerPage);

  /* Stats calculation for Mark view */
  const presentCount = students.filter(s => s.status === "PRESENT").length;
  const absentCount  = students.filter(s => s.status === "ABSENT").length;
  const leaveCount   = students.filter(s => s.status === "LEAVE").length;
  const lateCount    = students.filter(s => s.status === "LATE").length;
  const attendancePct = students.length > 0
    ? Math.round((presentCount / students.length) * 100) : 0;

  const AVATAR_COLORS = [
    { bg: "#eff6ff", color: "#2563eb" },
    { bg: "#f5f3ff", color: "#7c3aed" },
    { bg: "#ecfdf5", color: "#059669" },
    { bg: "#fff7ed", color: "#ea580c" },
    { bg: "#fdf2f8", color: "#db2777" },
  ];

  const selectedBatchObj = batches.find(b => String(b.batchId) === String(selectedBatch));
  const minDate = selectedBatchObj?.startDate || "";

  return (
    <div className="ta-container">
      {toast && (
        <div className={`ta-toast ta-toast--${toast.type}`}>
          {toast.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
          {toast.msg}
        </div>
      )}

      {/* Hero Header */}
      <header className="ta-hero">
        <div className="ta-hero__content">
          <div className="ta-hero__title-row">
            <div className="ta-hero__icon"><FaCalendarAlt /></div>
            <div>
              <h1>Attendance Tracking</h1>
              <p>Professional session management dashboard for trainers.</p>
            </div>
          </div>
          
          <div className="ta-hero__trainer">
            <div className="ta-trainer-avatar">{trainerName.charAt(0)}</div>
            <div className="ta-trainer-info">
              <span className="ta-trainer-name">{trainerName}</span>
              <span className="ta-trainer-role">Class Instructor</span>
            </div>
          </div>
        </div>

        <div className="ta-hero__actions">
          <button
            className={`ta-btn-primary ${isEditMode ? 'ta-btn-primary--edit' : ''}`}
            onClick={handleSave}
            disabled={viewMode === "HISTORY" || !selectedBatch || saving}
          >
            {saving ? <div className="ta-loading-spinner" /> : <FaCheck />}
            <span>{isEditMode ? "Update Attendance" : "Submit Attendance"}</span>
          </button>
        </div>
      </header>

      {/* Top Filter Bar: Horizontal Controls */}
      <div className="ta-control-bar">
        <div className="ta-control-group">
          <div className="ta-field">
            <label><FaLayerGroup /> Select Batch</label>
            <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
              <option value="">— Select Batch —</option>
              {batches.map(b => (
                <option key={b.batchId} value={b.batchId}>{b.batchName}</option>
              ))}
            </select>
          </div>

          <div className="ta-field">
            <label><FaClock /> Session Date</label>
            <input
              type="date"
              value={date}
              min={minDate}
              max={today}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <div className="ta-field ta-field--topic">
            <label><FaBookReader /> Lesson Topic</label>
            <input
              type="text"
              placeholder="What is being taught today?..."
              value={topicTaught}
              onChange={e => setTopicTaught(e.target.value)}
              disabled={viewMode === "HISTORY"}
            />
          </div>
        </div>

        {/* Action Bar for History */}
        <div className="ta-history-filter">
          <div className="ta-field">
            <label>From</label>
            <input type="date" value={fromDate} max={today} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div className="ta-field">
            <label>To</label>
            <input type="date" value={toDate} max={today} onChange={e => setToDate(e.target.value)} />
          </div>
          <button className="ta-btn-secondary" onClick={fetchAttendanceHistory}>
            <FaHistory /> Report
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="ta-stats-bar">
        <div className="ta-stat-mini ta-stat-mini--present">
          <span className="ta-stat-dot" />
          <span className="ta-stat-label">Present:</span>
          <span className="ta-stat-val">{presentCount}</span>
        </div>
        <div className="ta-stat-mini ta-stat-mini--absent">
          <span className="ta-stat-dot" />
          <span className="ta-stat-label">Absent:</span>
          <span className="ta-stat-val">{absentCount}</span>
        </div>
        <div className="ta-stat-mini ta-stat-mini--leave">
          <span className="ta-stat-dot" />
          <span className="ta-stat-label">Leave:</span>
          <span className="ta-stat-val">{leaveCount}</span>
        </div>
        <div className="ta-stat-mini ta-stat-mini--late">
          <span className="ta-stat-dot" />
          <span className="ta-stat-label">Late:</span>
          <span className="ta-stat-val">{lateCount}</span>
        </div>
        
        <div className="ta-stat-progress">
          <div className="ta-stat-progress-info">
            <span>Engagement Rate</span>
            <span>{attendancePct}%</span>
          </div>
          <div className="ta-stat-progress-track">
            <div className="ta-stat-progress-fill" style={{ width: `${attendancePct}%` }} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="ta-main-content">
          <div className="ta-card ta-card--roster">
            <div className="ta-roster-header">
              <div className="ta-tabs">
                <button className={`ta-tab ${viewMode === 'MARK' ? 'active' : ''}`} onClick={() => setViewMode('MARK')}>
                  Attendance Marking
                </button>
                <button className={`ta-tab ${viewMode === 'HISTORY' ? 'active' : ''}`} onClick={() => setViewMode('HISTORY')}>
                  Registry History
                </button>
              </div>
              
              <div className="ta-roster-search">
                <FaSearch />
                <input placeholder="Find student by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>

            {viewMode === "MARK" && students.length > 0 && (
              <div className="ta-bulk-bar">
                <p>Quick Actions:</p>
                <div className="ta-bulk-btns">
                  <button onClick={() => setStudents(p => p.map(s => s.isAutoLeave ? s : ({ ...s, status: "PRESENT" })))}>
                    Mark All Present
                  </button>
                  <button onClick={() => setStudents(p => p.map(s => s.isAutoLeave ? s : ({ ...s, status: "ABSENT" })))}>
                    Mark All Absent
                  </button>
                </div>
              </div>
            )}

            <div className="ta-table-container">
              <table className="ta-table responsive-card-table">
                <thead>
                  {viewMode === "MARK" ? (
                    <tr>
                      <th width="80">#</th>
                      <th width="120">Student ID</th>
                      <th>Student Details</th>
                      <th width="350">Attendance Status</th>
                    </tr>
                  ) : (
                    <tr>
                      <th>Date</th>
                      <th>Student ID</th>
                      <th>Student Name</th>
                      <th>Session Topic</th>
                      <th width="120">Status</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5">
                        <div className="ta-table-loader">
                          <div className="ta-spinner" />
                          <p>Fetching session data...</p>
                        </div>
                      </td>
                    </tr>
                  ) : currentRecords.length > 0 ? (
                    currentRecords.map((item, idx) => {
                      const scheme = AVATAR_COLORS[(indexOfFirstRecord + idx) % AVATAR_COLORS.length];
                      return (
                        <tr key={item.id || idx}>
                          {viewMode === "MARK" ? (
                            <>
                              <td className="ta-td-num" data-label="#">{indexOfFirstRecord + idx + 1}</td>
                              <td className="ta-td-id" data-label="ID"><code>{item.studentId}</code></td>
                              <td className="ta-td-student" data-label="Student Details">
                                <div className="ta-student-box">
                                  <div className="ta-mini-avatar" style={{ background: scheme.bg, color: scheme.color }}>
                                    {(item.name || "").charAt(0).toUpperCase()}
                                  </div>
                                  <div className="ta-student-details">
                                    <span className="ta-student-name">
                                      {item.name} 
                                      <span className={`hb-mode-badge hb-mode-badge--${(item.courseMode || "OFFLINE").toLowerCase()}`} 
                                        style={{ marginLeft: '8px', fontSize: '9px', verticalAlign: 'middle' }}>
                                        {item.courseMode || "OFFLINE"}
                                      </span>
                                      {item.approvedOnline && <span className="ta-online-pill" title="Student has approved permission to attend remotely today">Temp Online</span>}
                                    </span>
                                    <span className="ta-student-email">{item.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="ta-td-status" data-label="Attendance Status">
                                {item.isAutoLeave ? (
                                  <span className="ta-leave-text" title="Student absence is officially recorded and approved via Leave Management"><FaBed /> On Approved Leave</span>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div className="ta-status-toggle">
                                      <button 
                                        className={`ta-status-btn ta-status-btn--present ${item.status === 'PRESENT' ? 'active' : ''}`}
                                        onClick={() => setStudents(prev => prev.map(s => s.id === item.id ? { ...s, status: "PRESENT", lateMinutes: 0 } : s))}
                                      >Present</button>
                                      <button 
                                        className={`ta-status-btn ta-status-btn--absent ${item.status === 'ABSENT' ? 'active' : ''}`}
                                        onClick={() => setStudents(prev => prev.map(s => s.id === item.id ? { ...s, status: "ABSENT", lateMinutes: 0 } : s))}
                                      >Absent</button>
                                      <button 
                                        className={`ta-status-btn ta-status-btn--late ${item.status === 'LATE' ? 'active' : ''}`}
                                        onClick={() => setStudents(prev => prev.map(s => s.id === item.id ? { ...s, status: "LATE" } : s))}
                                      >Late</button>
                                    </div>
                                    
                                    {item.status === 'LATE' && (
                                      <div className="ta-late-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 4px' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>Mins:</span>
                                        <input 
                                          type="number" 
                                          min="1" 
                                          max="600"
                                          value={item.lateMinutes || ''} 
                                          onChange={(e) => {
                                            const val = parseInt(e.target.value) || 0;
                                            setStudents(prev => prev.map(s => s.id === item.id ? { ...s, lateMinutes: val } : s));
                                          }}
                                          placeholder="0"
                                          style={{ width: '60px', height: '28px', padding: '0 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                            </>
                          ) : (
                            <>
                              <td data-label="Date"><span className="ta-history-date">{item.attendanceDate}</span></td>
                              <td data-label="Student ID"><code>{item.formattedId || item.studentId}</code></td>
                              <td data-label="Student Name">
                                <div className="ta-student-box">
                                  <div className="ta-mini-avatar" style={{ background: scheme.bg, color: scheme.color }}>
                                    {(item.studentName || "").charAt(0).toUpperCase()}
                                  </div>
                                  <span className="ta-student-name">{item.studentName}</span>
                                </div>
                              </td>
                              <td data-label="Session Topic" className="ta-history-topic">{item.topic || "No topic recorded"}</td>
                              <td data-label="Status">
                                <span className={`ta-status-pill ta-status-pill--${(item.status || "").toLowerCase()}`}>
                                  {item.status}
                                  {item.status === 'LATE' && item.lateMinutes > 0 && ` (${item.lateMinutes}m)`}
                                </span>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5">
                        <div className="ta-table-empty">
                          <FaUsers />
                          <p>No students found for this session setup.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="ta-pagination">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><FaChevronLeft /></button>
                <span>Page {currentPage} of {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><FaChevronRight /></button>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}

export default TrainerAttendance;
