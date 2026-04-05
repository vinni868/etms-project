import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import './SuperAdminAttendanceReport.css';

export default function SuperAdminAttendanceReport() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Modal state — stores { userId, dateKey } for fresh fetch
  const [modalTarget, setModalTarget] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/qr/all-logs');
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to load attendance logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Time Formatting ──────────────────────────────────────────────────────
  // Java LocalDateTime returns "2026-04-05T12:31:00" — NO timezone suffix.
  // new Date("2026-04-05T12:31:00") interprets it as UTC → wrong by +5:30 in IST.
  // Fix: parse time directly from the string without using Date object for time.
  const fmtTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      // Extract HH:MM from "2026-04-05T12:31:00" or "2026-04-05T12:31:00.123"
      const timePart = dateStr.includes('T') ? dateStr.split('T')[1] : dateStr;
      const [hourStr, minStr] = timePart.split(':');
      const h = parseInt(hourStr, 10);
      const m = parseInt(minStr, 10);
      if (isNaN(h) || isNaN(m)) return '—';
      const period = h >= 12 ? 'PM' : 'AM';
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
    } catch { return '—'; }
  };

  const fmtDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      // Parse date string directly to avoid timezone shifting
      const [year, month, day] = (dateStr.includes('T') ? dateStr.split('T')[0] : dateStr).split('-').map(Number);
      const d = new Date(year, month - 1, day); // local date construction
      return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  };

  const fmtDuration = (mins) => {
    if (mins == null) return '—';
    if (mins <= 0) return '< 1m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  // ── GROUPING LOGIC ──────────────────────────────────────────────────────
  // Group by (userId + date) → one row per user per day in the table.
  const getGroupedReports = () => {
    const groups = {};

    logs.forEach(log => {
      const dateKey = log.date ? log.date.split('T')[0] : '';
      // Use userId from DTO (now included) for reliable grouping
      const uid = log.userId != null ? log.userId : log.portalId;
      const groupKey = `${uid}-${dateKey}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: groupKey,
          userId: log.userId,           // numeric id for API calls
          userName: log.userName || 'Unknown User',
          portalId: log.portalId || 'N/A',
          role: log.role || 'USER',
          date: log.date,
          dateKey: dateKey,
          totalMinutes: 0,
          isActiveNow: false,
          sessionCount: 0,
          firstDistanceIn: null,
        };
      }

      const g = groups[groupKey];
      g.sessionCount += 1;
      // Sum only completed sessions (sessions with logoutTime)
      if (log.logoutTime && log.totalMinutes != null && log.totalMinutes > 0) {
        g.totalMinutes += log.totalMinutes;
      }
      if (g.firstDistanceIn == null && log.distanceIn != null) {
        g.firstDistanceIn = log.distanceIn;
      }

      // Active if there's any open session today
      const today = new Date().toISOString().split('T')[0];
      if (!log.logoutTime && dateKey === today) {
        g.isActiveNow = true;
      }
    });

    return Object.values(groups).sort((a, b) => {
      if (b.dateKey !== a.dateKey) return b.dateKey.localeCompare(a.dateKey);
      return a.userName.localeCompare(b.userName);
    });
  };

  const allReports = getGroupedReports();

  // ── FILTERING ───────────────────────────────────────────────────────────
  const filteredReports = allReports.filter((report) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      report.userName.toLowerCase().includes(term) ||
      report.portalId.toLowerCase().includes(term) ||
      report.role.toLowerCase().includes(term);
    
    if (dateFilter) return matchSearch && report.dateKey === dateFilter;
    return matchSearch;
  });

  // ── STATS ───────────────────────────────────────────────────────────────
  const activeNowCount = allReports.filter(r => r.isActiveNow).length;
  const todayDateStr = new Date().toISOString().split('T')[0];
  const uniqueUsersToday = allReports.filter(r => r.dateKey === todayDateStr).length;

  // ── OPEN MODAL — fetch fresh session detail ─────────────────────────────
  const openModal = async (report) => {
    setModalTarget(report);
    setModalData(null);
    setModalLoading(true);
    try {
      const res = await api.get(`/qr/user-sessions/${report.userId}?date=${report.dateKey}`);
      setModalData(res.data);
    } catch (err) {
      console.error('Failed to load session detail:', err);
      setModalData(null);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalTarget(null);
    setModalData(null);
  };

  return (
    <div className="sa-attendance-page">
      <div className="sa-att-header">
        <h1>Global Attendance Tracker</h1>
        <p>Monitor daily hours and punch-ins for all staff and students across the institute.</p>
      </div>

      <div className="sa-att-stats">
        <div className="sa-att-stat-box">
          <div className="icon" style={{ background: '#dcfce7', color: '#16a34a' }}>🟢</div>
          <div className="info">
            <h4>Present Right Now</h4>
            <p>{activeNowCount}</p>
          </div>
        </div>
        <div className="sa-att-stat-box">
          <div className="icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}>📊</div>
          <div className="info">
            <h4>Total Staff/Students (Today)</h4>
            <p>{uniqueUsersToday}</p>
          </div>
        </div>
        <div className="sa-att-stat-box">
          <div className="icon" style={{ background: '#fef9c3', color: '#ca8a04' }}>👥</div>
          <div className="info">
            <h4>Total Daily Records</h4>
            <p>{allReports.length}</p>
          </div>
        </div>
      </div>

      <div className="sa-att-card">
        <div className="sa-att-controls">
          <input
            type="text"
            placeholder="Search by Name, ID, or Role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          <button className="sa-btn" onClick={fetchLogs}>↻ Refresh</button>
        </div>

        {loading ? (
          <div className="sa-att-empty">Loading records...</div>
        ) : filteredReports.length === 0 ? (
          <div className="sa-att-empty">No records found matching your filters.</div>
        ) : (
          <div className="sa-att-table-wrap">
            <table className="sa-att-table">
              <thead>
                <tr>
                  <th>User / ID</th>
                  <th>Role</th>
                  <th>Date</th>
                  <th>Sessions</th>
                  <th>Total Hours Today</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr 
                    key={report.id} 
                    className="sa-clickable-row"
                    onClick={() => openModal(report)}
                  >
                    <td>
                      <div><strong>{report.userName}</strong></div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{report.portalId}</div>
                    </td>
                    <td>
                      <span className={`sa-badge-role ${report.role.toLowerCase()}`}>
                        {report.role}
                      </span>
                    </td>
                    <td>{fmtDate(report.date)}</td>
                    <td style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>
                      {report.sessionCount}
                    </td>
                    <td style={{ fontWeight: 700, color: '#1e293b' }}>
                      {fmtDuration(report.totalMinutes)}
                    </td>
                    <td>
                      {report.isActiveNow ? (
                        <span className="sa-time-active">🟢 Active Now</span>
                      ) : (
                        <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>Checked Out</span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="sa-view-btn"
                        onClick={(e) => { e.stopPropagation(); openModal(report); }}
                      >
                        View Sessions ({report.sessionCount})
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── DETAIL MODAL ── */}
      {modalTarget && (
        <div className="sa-att-modal-overlay" onClick={closeModal}>
          <div className="sa-att-modal" onClick={e => e.stopPropagation()}>
            
            <div className="sa-att-modal-header">
              <div>
                <h2>{modalTarget.userName}'s Sessions</h2>
                <p>{fmtDate(modalTarget.dateKey)} • {modalTarget.role}</p>
              </div>
              <button className="sa-modal-close" onClick={closeModal}>×</button>
            </div>

            <div className="sa-att-modal-body">
              {modalLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Loading session details...
                </div>
              ) : !modalData ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
                  Failed to load session details. Please try again.
                </div>
              ) : (
                <>
                  <div className="sa-modal-summary">
                    <div className="sa-sum-box">
                      <span>Total Time in Institute</span>
                      <strong>{fmtDuration(modalData.totalMinutes)}</strong>
                    </div>
                    <div className="sa-sum-box">
                      <span>Total Sessions Today</span>
                      <strong>{modalData.sessionCount}</strong>
                    </div>
                    <div className="sa-sum-box">
                      <span>Current Status</span>
                      <strong style={{ color: modalData.isActiveNow ? '#16a34a' : '#64748b' }}>
                        {modalData.isActiveNow ? '🟢 Active Now' : '✓ Checked Out'}
                      </strong>
                    </div>
                  </div>

                  <h4 className="sa-modal-subtitle">Detailed Session Timeline</h4>
                  
                  <div className="sa-timeline">
                    {(modalData.sessions || []).map((session) => (
                      <div key={session.id} className="sa-timeline-item">
                        <div className="sa-tl-dot"></div>
                        <div className="sa-tl-content">
                          <div className="sa-tl-row">
                            <strong>Session {session.sessionNumber}</strong>
                            <span className="sa-tl-dur">
                              {session.isOpen
                                ? <span style={{ color: '#16a34a', fontWeight: 700 }}>🟢 Active</span>
                                : fmtDuration(session.totalMinutes)}
                            </span>
                          </div>
                          <div className="sa-tl-grid">
                            {/* Punch In */}
                            <div className="sa-tl-time">
                              <span className="in-icon">📥</span>
                              <div>
                                <small>Punch In</small>
                                <div style={{ fontWeight: 700 }}>{fmtTime(session.loginTime)}</div>
                                <div style={{ fontSize: '0.75rem', marginTop: '4px', color: '#64748b' }}>
                                  Method: {
                                    !session.punchMethod ? 'Unknown' :
                                    session.punchMethod === 'QR_SCAN' ? '📷 QR Scan' :
                                    session.punchMethod === 'QUICK_PUNCH' ? '⚡ Quick Punch' :
                                    session.punchMethod
                                  }
                                </div>
                                {session.distanceIn != null && (
                                  <div style={{ 
                                    fontSize: '0.75rem', 
                                    color: session.distanceIn > 180 ? '#ea580c' : '#64748b'
                                  }}>
                                    Distance: {Math.round(session.distanceIn)}m
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* Punch Out */}
                            <div className="sa-tl-time">
                              <span className="out-icon">📤</span>
                              <div>
                                <small>Punch Out</small>
                                <div style={{ fontWeight: 700 }}>
                                  {session.logoutTime
                                    ? fmtTime(session.logoutTime)
                                    : <span style={{ color: '#16a34a' }}>Active Now</span>}
                                </div>
                                {session.logoutTime && (
                                  <>
                                    <div style={{ 
                                      fontSize: '0.75rem', marginTop: '4px',
                                      fontWeight: 700,
                                      color: (
                                        session.checkoutReason === 'MIDNIGHT_AUTO_CLOSE' ||
                                        session.checkoutReason === 'GEOFENCE_EXIT'
                                      ) ? '#ea580c' : '#10b981'
                                    }}>
                                      {!session.checkoutReason ? 'Manual Punch Out' :
                                       session.checkoutReason === 'MIDNIGHT_AUTO_CLOSE'
                                         ? '⚠ System Auto-Logout (Midnight)'
                                         : session.checkoutReason === 'GEOFENCE_EXIT'
                                         ? `⚠ Auto-Logout: Left institute boundary (~${Math.round(session.distanceOut || 0)}m)`
                                         : session.checkoutReason === 'MANUAL'
                                         ? '✓ Manual Punch Out'
                                         : session.checkoutReason}
                                    </div>
                                    {session.distanceOut != null && session.distanceOut > 0 && (
                                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                        Exit Distance: {Math.round(session.distanceOut)}m
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
