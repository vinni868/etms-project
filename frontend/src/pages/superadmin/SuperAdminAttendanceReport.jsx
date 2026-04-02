import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import './SuperAdminAttendanceReport.css';

export default function SuperAdminAttendanceReport() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // State for the detail modal
  const [selectedReport, setSelectedReport] = useState(null);

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

  const formatTime = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }).toUpperCase()
      : "—";

  const fmtDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });

  const fmtDuration = (mins) => {
    if (!mins && mins !== 0) return '0h 0m';
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  // ── GROUPING LOGIC ──────────────────────────────────────
  // We want to group by (userId + date) to show one row per user per day.
  const getGroupedReports = () => {
    const groups = {};

    logs.forEach(log => {
      // Create a unique key for the user + day
      const dateKey = new Date(log.date).toISOString().split('T')[0];
      const groupKey = `${log.userId}-${dateKey}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: groupKey,
          userId: log.userId,
          userName: log.userName || 'Unknown User',
          portalId: log.portalId || 'N/A',
          role: log.role || 'USER',
          date: log.date,
          dateKey: dateKey,
          totalMinutes: 0,
          isActiveNow: false,
          sessions: [],
        };
      }

      const g = groups[groupKey];
      g.sessions.push(log);
      g.totalMinutes += (log.totalMinutes || 0);

      // If the log has no logout time and it's from today, they are currently in the institute
      if (!log.logoutTime && new Date(log.date).toDateString() === new Date().toDateString()) {
        g.isActiveNow = true;
      }
    });

    // Sort sessions inside each group (newest first)
    Object.values(groups).forEach(g => {
      g.sessions.sort((a, b) => new Date(b.loginTime) - new Date(a.loginTime));
    });

    // Convert to array and sort by date descending
    return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const allReports = getGroupedReports();

  // ── FILTERING ───────────────────────────────────────────
  const filteredReports = allReports.filter((report) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      report.userName.toLowerCase().includes(term) ||
      report.portalId.toLowerCase().includes(term) ||
      report.role.toLowerCase().includes(term);
    
    if (dateFilter) {
      return matchSearch && report.dateKey === dateFilter;
    }
    return matchSearch;
  });

  // ── STATS ───────────────────────────────────────────────
  const activeNowCount = allReports.filter(r => r.isActiveNow).length;
  const todayDateStr = new Date().toISOString().split('T')[0];
  const uniqueUsersToday = allReports.filter(r => r.dateKey === todayDateStr).length;

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
          <button className="sa-btn" onClick={fetchLogs}>
            ↻ Refresh
          </button>
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
                    onClick={() => setSelectedReport(report)}
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
                    <td style={{ fontWeight: 700, color: '#1e293b' }}>
                      {fmtDuration(report.totalMinutes)}
                    </td>
                    <td>
                      {report.isActiveNow ? (
                        <span className="sa-time-active">🟢 Active in Institute</span>
                      ) : (
                        <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>Checked Out</span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="sa-view-btn"
                        onClick={(e) => { e.stopPropagation(); setSelectedReport(report); }}
                      >
                        View Scans ({report.sessions.length})
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
      {selectedReport && (
        <div className="sa-att-modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="sa-att-modal" onClick={e => e.stopPropagation()}>
            
            <div className="sa-att-modal-header">
              <div>
                <h2>{selectedReport.userName}'s Scans</h2>
                <p>{fmtDate(selectedReport.date)} • {selectedReport.role}</p>
              </div>
              <button className="sa-modal-close" onClick={() => setSelectedReport(null)}>×</button>
            </div>

            <div className="sa-att-modal-body">
              <div className="sa-modal-summary">
                <div className="sa-sum-box">
                  <span>Total Time in Institute</span>
                  <strong>{fmtDuration(selectedReport.totalMinutes)}</strong>
                </div>
                <div className="sa-sum-box">
                  <span>Total Scans Today</span>
                  <strong>{selectedReport.sessions.length}</strong>
                </div>
              </div>

              <h4 className="sa-modal-subtitle">Detailed Session Timeline</h4>
              
              <div className="sa-timeline">
                {selectedReport.sessions.map((session, idx) => (
                  <div key={session.id} className="sa-timeline-item">
                    <div className="sa-tl-dot"></div>
                    <div className="sa-tl-content">
                      <div className="sa-tl-row">
                        <strong>Session {selectedReport.sessions.length - idx}</strong>
                        <span className="sa-tl-dur">{fmtDuration(session.totalMinutes)}</span>
                      </div>
                      <div className="sa-tl-grid">
                        <div className="sa-tl-time">
                          <span className="in-icon">📥</span>
                          <div>
                            <small>Punch In</small>
                            <div>{fmtTime(session.loginTime)}</div>
                            {/* Field is always rendered now to prove existence */}
                            <div style={{ fontSize: '0.75rem', marginTop: '4px', color: '#64748b' }}>
                                Method: {!session.punchMethod ? 'Unknown (Legacy Record)' : 
                                          session.punchMethod === 'QR_SCAN' ? '📷 QR' : '⚡ Quick'}
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
                        <div className="sa-tl-time">
                          <span className="out-icon">📤</span>
                          <div>
                            <small>Punch Out</small>
                            <div>
                              {session.logoutTime ? fmtTime(session.logoutTime) : (
                                <span className="sa-time-active">Active Now</span>
                              )}
                            </div>
                            
                            {/* Always show reason if checked out */}
                            {session.logoutTime && (
                                <div style={{ 
                                    fontSize: '0.75rem', marginTop: '4px',
                                    fontWeight: 600,
                                    color: (session.checkoutReason === 'System Closed' || session.checkoutReason === 'MIDNIGHT_AUTO_CLOSE' || session.checkoutReason === 'GEOFENCE_EXIT') ? '#ea580c' : '#10b981' 
                                }}>
                                    Reason: {!session.checkoutReason ? 'Manual / Unknown' : 
                                             session.checkoutReason === 'MIDNIGHT_AUTO_CLOSE' ? 'System Automatically Logout' :
                                             session.checkoutReason === 'GEOFENCE_EXIT' ? 'Auto: Left Area' :
                                             session.checkoutReason}
                                </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
