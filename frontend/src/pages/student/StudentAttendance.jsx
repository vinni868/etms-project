import React, { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import {
  FaCalendarCheck, FaUserCheck, FaUserTimes, FaWalking,
  FaFilter, FaDownload, FaChevronLeft, FaChevronRight, 
  FaSearch, FaHistory, FaCalendarAlt,
  FaLayerGroup, FaCheckCircle
} from "react-icons/fa";
import { LuCalendarCheck2 } from "react-icons/lu";
import "./StudentAttendance.css";

const PAGE_SIZE = 10;

/* ── Date Helpers ── */
function parseDate(raw) {
  if (!raw) return null;
  if (raw instanceof Date) return isNaN(raw) ? null : raw;
  if (typeof raw === "object") {
    const y = raw.year || raw.Year;
    const m = raw.monthValue || raw.month || raw.Month;
    const d = raw.dayOfMonth || raw.day || raw.Day;
    if (y && m && d) return new Date(y, m - 1, d);
    return null;
  }
  const str = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, mo, d] = str.split("-").map(Number);
    return new Date(y, mo - 1, d);
  }
  const d = new Date(str);
  return isNaN(d) ? null : d;
}

function formatDisplayDate(raw) {
  const d = parseDate(raw);
  return d ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

function formatDayName(raw) {
  const d = parseDate(raw);
  return d ? d.toLocaleDateString("en-IN", { weekday: "long" }) : "—";
}

const FILTER_MODES = { ALL: "ALL", SINGLE: "SINGLE", RANGE: "RANGE" };

export default function StudentAttendance() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const studentId = user?.id;
  const token = localStorage.getItem("token");

  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterMode, setFilterMode] = useState(FILTER_MODES.ALL);
  const [singleDate, setSingleDate] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [summary, setSummary] = useState({
    totalClasses: 0, presentCount: 0, absentCount: 0, leaveCount: 0, attendancePercentage: 0,
  });

  useEffect(() => { if (studentId) fetchStudentBatches(); }, [studentId]);

  const fetchStudentBatches = async () => {
    try {
      const res = await api.get(`/student/my-batches`, {
        headers: { Authorization: `Bearer ${token}` }, withCredentials: true,
      });
      const data = res.data || [];
      setBatches(data);
      if (data.length > 0) setSelectedBatch(data[0].batchId || "");
    } catch (err) { console.error("Batch fetch error:", err); }
  };

  useEffect(() => {
    if (studentId && selectedBatch) {
      setFilterMode(FILTER_MODES.ALL);
      fetchAttendanceData({ batchId: selectedBatch });
    }
  }, [selectedBatch]);

  const fetchAttendanceData = async ({ batchId, mode, single, from, to } = {}) => {
    const bid = batchId ?? selectedBatch;
    const m = mode ?? filterMode;
    const sd = single ?? singleDate;
    const fd = from ?? fromDate;
    const td = to ?? toDate;

    if (!bid) return;
    setLoading(true);
    setCurrentPage(1);

    try {
      let url = `/student/attendance/details/${studentId}?batchId=${bid}`;
      if (m === FILTER_MODES.SINGLE && sd) url += `&from=${sd}&to=${sd}`;
      else if (m === FILTER_MODES.RANGE && fd && td) url += `&from=${fd}&to=${td}`;

      const res = await api.get(url, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true });
      const data = res.data || [];
      setRecords(data);
      computeSummary(data);
    } catch (err) {
      console.error("Attendance fetch error:", err);
      setRecords([]);
    } finally { setLoading(false); }
  };

  const computeSummary = (data) => {
    const total = data.length;
    const present = data.filter(r => r.status?.toUpperCase() === "PRESENT").length;
    const absent = data.filter(r => r.status?.toUpperCase() === "ABSENT").length;
    const leave = data.filter(r => r.status?.toUpperCase() === "LEAVE").length;
    const pct = total > 0 ? Math.round(((present + leave) / total) * 100) : 0;
    setSummary({ totalClasses: total, presentCount: present, absentCount: absent, leaveCount: leave, attendancePercentage: pct });
  };



  const filtered = records.filter(r => {
    const topic = (r.topic || "Regular Session").toLowerCase();
    const dateStr = formatDisplayDate(r.attendance_date).toLowerCase();
    const q = searchTerm.toLowerCase();
    return topic.includes(q) || dateStr.includes(q);
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const idxFirst = (currentPage - 1) * PAGE_SIZE;
  const currentRecords = filtered.slice(idxFirst, idxFirst + PAGE_SIZE);

  const pct = summary.attendancePercentage;
  const activeBatchObj = batches.find(b => b.batchId === selectedBatch);
  const batchName = activeBatchObj?.batchName || "Select Batch";

  return (
    <div className="sa-viewport">
      <div className="sa-main-container">
        
        {/* ── HEADER ── */}
        <header className="sa-top-header">
          <div className="sa-brand-group">
            <div className="sa-icon-box">
              <LuCalendarCheck2 />
            </div>
            <div className="sa-title-stack">
              <h1>Attendance Dashboard</h1>
              <div className="sa-header-meta">
                <div className="sa-batch-pill">
                  <FaLayerGroup /> {batchName}
                </div>
                {user?.studentId && (
                  <div className="sa-student-id-pill">
                    ID: {user.studentId}
                  </div>
                )}
              </div>
            </div>
          </div>

        </header>

        {/* ── METRICS ROW ── */}
        <div className="sa-metrics-row">
          <div className="sa-metrics-grid">
            <div className="sa-metric-card">
              <div className="sa-metric-ic sa-metric-ic--blue"><FaCalendarCheck /></div>
              <div className="sa-metric-data">
                <span className="sa-metric-val">{summary.totalClasses}</span>
                <span className="sa-metric-lbl">TOTAL CLASSES</span>
              </div>
            </div>
            <div className="sa-metric-card">
              <div className="sa-metric-ic sa-metric-ic--green"><FaUserCheck /></div>
              <div className="sa-metric-data">
                <span className="sa-metric-val">{summary.presentCount}</span>
                <span className="sa-metric-lbl">PRESENT</span>
              </div>
            </div>
            <div className="sa-metric-card">
              <div className="sa-metric-ic sa-metric-ic--red"><FaUserTimes /></div>
              <div className="sa-metric-data">
                <span className="sa-metric-val">{summary.absentCount}</span>
                <span className="sa-metric-lbl">ABSENT</span>
              </div>
            </div>
            <div className="sa-metric-card">
              <div className="sa-metric-ic sa-metric-ic--amber"><FaWalking /></div>
              <div className="sa-metric-data">
                <span className="sa-metric-val">{summary.leaveCount}</span>
                <span className="sa-metric-lbl">ON LEAVE</span>
              </div>
            </div>
          </div>

          <div className="sa-rate-wide-card">
            <div className="sa-rate-gauge">
              <svg width="64" height="64" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="12" 
                        strokeDasharray="263.9" strokeDashoffset={263.9 - (pct / 100) * 263.9} 
                        strokeLinecap="round" transform="rotate(-90 50 50)" />
                <text x="50" y="58" textAnchor="middle" fontSize="22" fontWeight="800" fill="#1e293b">{pct}%</text>
              </svg>
            </div>
            <div className="sa-rate-content">
              <div className="sa-rate-header">
                <span className="sa-rate-title">ATTENDANCE RATE</span>
                <span className="sa-rate-value">{pct}%</span>
              </div>
              <div className="sa-rate-progress-track">
                <div className="sa-rate-progress-fill" style={{ width: `${pct}%` }}></div>
              </div>
              <div className="sa-rate-status-msg">
                <FaCheckCircle /> {pct >= 75 ? "Good Standing" : "Needs Improvement"}
              </div>
            </div>
          </div>
        </div>

        {/* ── FILTER SECTION ── */}
        <section className="sa-filter-section">
          <div className="sa-filter-field sa-filter-field--batch">
            <label><FaFilter /> BATCH</label>
            <select value={selectedBatch} onChange={e => setSelectedBatch(Number(e.target.value))}>
              {batches.map(b => <option key={b.batchId} value={b.batchId}>{b.batchName}</option>)}
            </select>
          </div>
          <div className="sa-filter-field sa-filter-field--mode">
            <label><FaCalendarAlt /> FILTER MODE</label>
            <div className="sa-toggle-group">
              <button className={filterMode === 'ALL' ? 'active' : ''} onClick={() => setFilterMode('ALL')}>All</button>
              <button className={filterMode === 'SINGLE' ? 'active' : ''} onClick={() => setFilterMode('SINGLE')}>Single Date</button>
              <button className={filterMode === 'RANGE' ? 'active' : ''} onClick={() => setFilterMode('RANGE')}>Date Range</button>
            </div>
          </div>
          {filterMode === 'SINGLE' && (
            <div className="sa-extra-filter">
              <input type="date" value={singleDate} onChange={e => setSingleDate(e.target.value)} />
              <button className="sa-apply-btn" onClick={() => fetchAttendanceData()}>Apply</button>
            </div>
          )}
          {filterMode === 'RANGE' && (
            <div className="sa-extra-filter">
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              <span>to</span>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
              <button className="sa-apply-btn" onClick={() => fetchAttendanceData()}>Apply</button>
            </div>
          )}
        </section>

        {/* ── LOG TABLE ── */}
        <div className="sa-log-card">
          <div className="sa-log-head">
            <div className="sa-log-title">
              <FaHistory /> Session Log
              <span className="sa-log-sub">All records for {batchName}</span>
            </div>
            <div className="sa-log-search">
              <FaSearch />
              <input type="text" placeholder="Search by topic, date, or day..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div className="sa-table-scroller">
            <table className="sa-table-main responsive-card-table">
              <thead>
                <tr>
                  <th width="80">#</th>
                  <th>DATE</th>
                  <th>DAY</th>
                  <th>TOPIC / SESSION</th>
                  <th className="center">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="center">Connecting to server...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="5" className="center">No attendance data found.</td></tr>
                ) : (
                  currentRecords.map((r, i) => (
                    <tr key={i}>
                      <td className="sa-col-mute" data-label="ID">{(currentPage-1)*PAGE_SIZE + i + 1}</td>
                      <td className="sa-col-date" data-label="Date">
                        <FaCalendarAlt /> {formatDisplayDate(r.attendance_date)}
                      </td>
                      <td className="sa-col-mute" data-label="Day">{formatDayName(r.attendance_date)}</td>
                      <td className="sa-col-topic" data-label="Topic">{r.topic || "Regular Session"}</td>
                      <td className="center" data-label="Status">
                        <span className={`sa-status-tag sa-status-tag--${r.status?.toLowerCase()}`}>
                          {r.status === "PRESENT" && <FaCheckCircle className="sa-check-ic" />}
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="sa-log-foot">
            <span className="sa-foot-info">
              Showing {idxFirst+1}-{Math.min(idxFirst+PAGE_SIZE, filtered.length)} of {filtered.length} entries
            </span>
            <div className="sa-pagination-nav">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><FaChevronLeft /></button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><FaChevronRight /></button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
