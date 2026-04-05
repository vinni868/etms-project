import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import QrScannerModal from '../../components/QrScannerModal';
import useGeofenceWatcher from '../../hooks/useGeofenceWatcher';
import './UserTimeTracking.css';

/* ─── Session Detail Modal ───────────────────────────────────────────── */
/* Moved outside to prevent re-declaration/flickering on clock ticks */
const SessionDetailModal = ({ report, onClose, fmtDate, fmtTime, fmtDuration }) => {
  if (!report) return null;
  return (
    <div className="utt-modal-overlay" onClick={onClose}>
      <div className="utt-modal" onClick={e => e.stopPropagation()}>
        <div className="utt-modal-header">
          <div>
            <h2>📅 {fmtDate(report.date)}</h2>
            <p className="utt-modal-header-sub">
              Detailed Punch Sessions — {report.sessions.length} scan{report.sessions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className="utt-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="utt-modal-summary">
          <div className="utt-sum-box">
            <span>Total Time</span>
            <strong>{fmtDuration(report.totalMinutes)}</strong>
          </div>
          <div className="utt-sum-box">
            <span>Total Scans</span>
            <strong>{report.sessions.length}</strong>
          </div>
        </div>

        <h4 className="utt-modal-subtitle">Session Timeline</h4>

        <div className="utt-timeline">
          {report.sessions.map((session, idx) => (
            <div key={session.id || idx} className="utt-tl-item">
              <div className="utt-tl-dot" />
              <div className="utt-tl-content">
                <div className="utt-tl-row">
                  <strong>Session {report.sessions.length - idx}</strong>
                  <span className="utt-tl-dur">{fmtDuration(session.totalMinutes)}</span>
                </div>
                <div className="utt-tl-grid">
                  {/* Punch In */}
                  <div className="utt-tl-time">
                    <span className="utt-in-icon">📥</span>
                    <div>
                      <small>Punch In</small>
                      <div className="punch-status-in-val">{fmtTime(session.loginTime)}</div>
                      <div className="punch-status-method">
                        Method: {!session.punchMethod ? 'Unknown' :
                                  session.punchMethod === 'QR_SCAN' ? '📷 QR Scan' : '⚡ Quick Punch'}
                      </div>
                      {session.distanceIn != null && (
                        <div className={`punch-status-distance ${session.distanceIn > 180 ? 'far' : ''}`}>
                          Distance: {Math.round(session.distanceIn)}m
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Punch Out */}
                  <div className="utt-tl-time">
                    <span className="utt-out-icon">📤</span>
                    <div>
                      <small>Punch Out</small>
                      <div className="punch-status-out-val" style={{ color: session.logoutTime ? '#dc2626' : '#10b981' }}>
                        {session.logoutTime ? fmtTime(session.logoutTime) : (
                          <span className="punch-active-label">🟢 Active</span>
                        )}
                      </div>
                      {session.logoutTime && (
                        <div className={`punch-status-reason ${ (session.checkoutReason === 'MIDNIGHT_AUTO_CLOSE' || session.checkoutReason === 'GEOFENCE_EXIT') ? 'auto' : 'ok'}`}>
                          {!session.checkoutReason ? 'Manual logout' :
                           session.checkoutReason === 'MIDNIGHT_AUTO_CLOSE' ? '🕛 Auto: Midnight Close' :
                           session.checkoutReason === 'GEOFENCE_EXIT' ? `📍 Auto: Left premises (~${Math.round(session.distanceOut || 0)}m)` :
                           session.checkoutReason === 'REOPEN_OUTSIDE_RADIUS' ? '📍 Auto: Re-opened outside' :
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
  );
};

/**
 * UserTimeTracking — QR Punch In / Punch Out page
 * Used by: Admin, Trainer, Marketer, Counselor, Student
 * Features:
 *   - QR camera scanner (primary method)
 *   - Direct punch buttons (fallback)
 *   - On-load geofence check (auto-checkout if outside and session open)
 *   - Background geofence watcher (auto-checkout while page is open)
 *   - Clickable date rows to view detailed session breakdown modal
 */
export default function UserTimeTracking() {
  const user   = JSON.parse(localStorage.getItem('user') || '{}');
  const userId  = user?.id;

  const [timeLogs,      setTimeLogs]      = useState([]);
  const [stats,         setStats]         = useState({ avgHours: '0h', totalDays: 0 });
  const [todaySessions, setTodaySessions] = useState([]);
  const [isPunchedIn,   setIsPunchedIn]   = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [scannerOpen,   setScannerOpen]   = useState(false);
  const [toast,         setToast]         = useState(null);  // { type, msg }
  const [now,           setNow]           = useState(new Date());

  // Detail modal for clicking a date row
  const [selectedDayReport, setSelectedDayReport] = useState(null);

  // Grouped day-level data (for history table)
  const [groupedHistory, setGroupedHistory] = useState([]);

  // Live clock tick
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { loadData(); }, []);

  /* ─── Load time logs ─────────────────────────────────────────────────── */
  const loadData = async () => {
    try {
      setLoading(true);
      const res   = await api.get('/qr/time-logs');
      const logs  = res.data.logs  || [];
      const stats = res.data.stats || {};
      setTimeLogs(logs);
      setStats(stats);

      // Use date string key directly — avoids UTC shift (log.date is "YYYY-MM-DD")
      const todayKey = new Date().toLocaleDateString('en-CA'); // "YYYY-MM-DD" local
      const todayList = logs.filter(l => (l.date || '').split('T')[0] === todayKey);
      setTodaySessions(todayList);

      const active = todayList.find(l => l.loginTime && !l.logoutTime);
      const punchedIn = !!active;
      setIsPunchedIn(punchedIn);

      // ── Group past logs by date ──────────────────────────────────────────
      const pastLogs = logs.filter(l => (l.date || '').split('T')[0] !== todayKey);
      const groups = {};
      pastLogs.forEach(log => {
        const dateKey = (log.date || '').split('T')[0]; // stable YYYY-MM-DD
        if (!groups[dateKey]) {
          groups[dateKey] = {
            dateKey,
            date: log.date,
            totalMinutes: 0,
            sessions: [],
          };
        }
        groups[dateKey].sessions.push(log);
        if (log.logoutTime && log.totalMinutes > 0) {
          groups[dateKey].totalMinutes += (log.totalMinutes || 0);
        }
      });
      // Sort sessions within each group oldest first (ascending loginTime)
      Object.values(groups).forEach(g => {
        g.sessions.sort((a, b) => (a.loginTime || '').localeCompare(b.loginTime || ''));
      });
      // Sort groups newest date first
      const sorted = Object.values(groups).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
      setGroupedHistory(sorted);

      // ── On-load geofence check ───────────────────────────────────────────
      if (punchedIn && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const settingsRes = await api.get('/qr/punch-settings');
              const { latitude, longitude, radiusMeters } = settingsRes.data;
              if (latitude && longitude && parseFloat(latitude) !== 0) {
                const dist = haversine(
                  pos.coords.latitude, pos.coords.longitude,
                  parseFloat(latitude), parseFloat(longitude)
                );
                if (dist > parseFloat(radiusMeters || 200)) {
                  const checkoutRes = await api.post('/qr/auto-checkout', { reason: 'REOPEN_OUTSIDE_RADIUS' });
                  if (checkoutRes.data?.status === 'CHECKED_OUT') {
                    showToast('info', `⚠️ Auto checked-out — you were outside the institute (${checkoutRes.data.duration})`);
                    await loadData();
                  }
                }
              }
            } catch { /* settings not configured, skip */ }
          },
          () => {}, // location denied — skip silently
          { enableHighAccuracy: true, timeout: 8000 }
        );
      }
    } catch (err) {
      console.error('Failed to load time logs:', err);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Auto-checkout callback from geofence watcher ──────────────────── */
  const handleAutoCheckout = (data) => {
    showToast('warning', `📍 Auto checked-out — left institute. Duration: ${data.duration}`);
    loadData();
  };

  /* ─── Geofence watcher (runs while page is open) ────────────────────── */
  useGeofenceWatcher(isPunchedIn, handleAutoCheckout);

  /* ─── Smart GPS Acquisition with Fallback ───────────────────────────── */
  const getSmartLocation = () => {
    return new Promise((resolve, reject) => {
      const options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        (err) => {
          if (err.code === 3 || err.code === 2) {
            console.warn("High accuracy GPS failed, trying fallback...");
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve(pos),
              (err2) => reject(err2),
              { enableHighAccuracy: false, timeout: 10000 }
            );
          } else {
            reject(err);
          }
        },
        options
      );
    });
  };

  /* ─── Direct punch (fallback) ───────────────────────────────────────── */
  const handleDirectPunch = async () => {
    setActionLoading(true);
    try {
      let coords = { latitude: null, longitude: null };
      if (!navigator.geolocation) {
        showToast('error', "🛑 Geolocation is not supported by your browser.");
        setActionLoading(false);
        return;
      }

      try {
        const pos = await getSmartLocation();
        coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      } catch (e) {
        console.warn("Location fetch failed for direct punch:", e);
        let msg = "";
        if (e.code === 1) msg = "Location permission denied. Please allow location in your settings.";
        else if (e.code === 3) msg = "Location request timed out. Please step near a window.";
        else msg = "Unable to acquire GPS location. Please check your signal.";
        
        showToast('error', (
            <span>
                🛑 {msg} 
                <button onClick={handleDirectPunch} style={{ 
                    background: 'none', border: 'none', color: '#dc2626', 
                    textDecoration: 'underline', cursor: 'pointer', marginLeft: '8px',
                    fontWeight: 'bold'
                }}>Try Again</button>
            </span>
        ));
        setActionLoading(false);
        return;
      }

      const payload = { ...coords, userId };
      if (isPunchedIn) {
        await api.post('/qr/punch-out', payload);
        showToast('success', '✅ Punched Out successfully!');
      } else {
        await api.post('/qr/punch-in', payload);
        showToast('success', '✅ Punched In successfully!');
      }
      await loadData();
    } catch (err) {
      showToast('error', err?.response?.data?.message || 'Location access required or action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  /* ─── Toast helper ───────────────────────────────────────────────────── */
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  /* ─── Formatters ─────────────────────────────────────────────────────── */
  // Java LocalDateTime → "2026-04-05T12:31:00" (no timezone suffix)
  // new Date(str) would interpret it as UTC → off by +5:30 in IST.
  // Fix: extract hour/minute directly from the string.
  const fmtTime = (d) => {
    if (!d) return '—';
    try {
      const timePart = d.includes('T') ? d.split('T')[1] : d;
      const [hStr, mStr] = timePart.split(':');
      const h = parseInt(hStr, 10), m = parseInt(mStr, 10);
      if (isNaN(h) || isNaN(m)) return '—';
      const period = h >= 12 ? 'PM' : 'AM';
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
    } catch { return '—'; }
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    try {
      const dateStr = d.includes('T') ? d.split('T')[0] : d;
      const [y, mo, day] = dateStr.split('-').map(Number);
      const dt = new Date(y, mo - 1, day); // local date — no timezone shift
      return dt.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return d; }
  };

  const fmtDuration = (m) => {
    if (m === undefined || m === null) return '—';
    if (m <= 0) return '< 1m';
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
  };

  const todayMinutes = todaySessions.reduce((s, l) => s + (l.totalMinutes || 0), 0);
  const clockStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const dateStr  = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const toastColors = {
    success: { bg: '#dcfce7', color: '#16a34a', border: '#bbf7d0' },
    error:   { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
    warning: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
    info:    { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  };

  return (
    <div className="utt-page">

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.25rem', right: '1.5rem', zIndex: 99999,
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          padding: '0.75rem 1.25rem', borderRadius: '12px',
          fontSize: '0.875rem', fontWeight: 700,
          boxShadow: '0 8px 30px rgba(15,23,42,0.15)',
          backgroundColor: toastColors[toast.type]?.bg,
          color: toastColors[toast.type]?.color,
          border: `1.5px solid ${toastColors[toast.type]?.border}`,
          animation: 'utt-toast-in 0.3s cubic-bezier(0.22,0.68,0,1.2)',
          maxWidth: '420px',
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── QR Scanner Modal ── */}
      <QrScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onSuccess={() => { setScannerOpen(false); loadData(); }}
      />

      {/* ── Session Detail Modal ── */}
      {selectedDayReport && (
        <SessionDetailModal 
          report={selectedDayReport} 
          onClose={() => setSelectedDayReport(null)} 
          fmtDate={fmtDate} 
          fmtTime={fmtTime} 
          fmtDuration={fmtDuration}
        />
      )}

      {/* ── Page Header ── */}
      <div className="utt-page-header">
        <div className="utt-header-left">
          <div className="utt-header-icon">⏱️</div>
          <div>
            <h1 className="utt-page-title">My Work Hours</h1>
            <p className="utt-page-sub">Track your daily attendance and work sessions</p>
          </div>
        </div>
        <div className="utt-live-clock">
          <span className="utt-clock-time">{clockStr}</span>
          <span className="utt-clock-date">{dateStr}</span>
        </div>
      </div>

      {/* ── Status Row ── */}
      <div className="utt-stats-row">
        <div className={`utt-status-pill ${isPunchedIn ? 'utt-status-in' : 'utt-status-out'}`}>
          <span className={`utt-status-dot ${isPunchedIn ? 'dot-green' : 'dot-red'}`} />
          {isPunchedIn ? 'Currently Punched IN' : 'Currently Punched OUT'}
        </div>
        <div className="utt-stat-mini">
          <span className="utt-stat-label">Today's Time</span>
          <span className="utt-stat-val utt-val-blue">
            {isPunchedIn ? <span className="pulse-text">Tracking…</span> : fmtDuration(todayMinutes) || '—'}
          </span>
        </div>
        <div className="utt-stat-mini">
          <span className="utt-stat-label">Today's Sessions</span>
          <span className="utt-stat-val">{todaySessions.length}</span>
        </div>
        <div className="utt-stat-mini">
          <span className="utt-stat-label">Days Logged</span>
          <span className="utt-stat-val">{stats.totalDays || 0}</span>
        </div>
        <div className="utt-stat-mini">
          <span className="utt-stat-label">Avg. Daily Hours</span>
          <span className="utt-stat-val">{stats.avgHours || '—'}</span>
        </div>
      </div>

      {/* ── Main Punch Card ── */}
      <div className={`utt-punch-card ${isPunchedIn ? 'utt-punch-card--in' : 'utt-punch-card--out'}`}>
        <div className="utt-punch-card__bg-circles">
          <div className="utt-circle utt-circle--1" />
          <div className="utt-circle utt-circle--2" />
        </div>
        <div className="utt-punch-card__content">

          {/* Action Label — single clear goal */}
          <div className="utt-action-label">
            <span className="utt-action-label__icon">{isPunchedIn ? '🟢' : '🔴'}</span>
            <span className="utt-action-label__text">
              {isPunchedIn ? 'Active Session — Click below to PUNCH OUT' : 'No Active Session — Click below to PUNCH IN'}
            </span>
          </div>

          <h2 className="utt-punch-title">
            {isPunchedIn ? "You're clocked in. Choose how to Punch Out:" : "Choose your method to Punch In:"}
          </h2>
          <p className="utt-punch-sub">
            Both options do the <strong>same thing</strong> —{' '}
            {isPunchedIn ? 'end your current session.' : 'start a new session.'}{' '}
            QR scan adds location verification; Quick Punch works instantly without a camera.
          </p>

          {/* Two equal method cards */}
          <div className="utt-method-grid">

            {/* Method 1: QR Scan */}
            <button
              className={`utt-method-card ${isPunchedIn ? 'utt-method-card--out' : 'utt-method-card--in'}`}
              onClick={() => setScannerOpen(true)}
            >
              <span className="utt-method-icon">📷</span>
              <span className="utt-method-title">
                {isPunchedIn ? 'QR Punch Out' : 'QR Punch In'}
              </span>
              <span className="utt-method-desc">Scan QR code at the station</span>
              <span className="utt-method-badge">Recommended</span>
            </button>

            {/* Method 2: Quick Punch — divider */}
            <div className="utt-method-or">OR</div>

            {/* Method 2: Quick Punch */}
            <button
              className={`utt-method-card utt-method-card--quick ${isPunchedIn ? 'utt-method-card--out' : 'utt-method-card--in'}`}
              onClick={handleDirectPunch}
              disabled={actionLoading}
            >
              <span className="utt-method-icon">{actionLoading ? '⏳' : isPunchedIn ? '🚪' : '⚡'}</span>
              <span className="utt-method-title">
                {actionLoading ? 'Processing…' : isPunchedIn ? 'Quick Punch Out' : 'Quick Punch In'}
              </span>
              <span className="utt-method-desc">No QR needed — instant punch</span>
              <span className="utt-method-badge utt-method-badge--grey">No Camera</span>
            </button>

          </div>

          <p className="utt-geofence-notice">
            🛡️ Auto-checkout active — you'll be automatically logged out when you leave the institute premises.
          </p>
        </div>
      </div>

      {/* ── Today's Sessions ── */}
      {todaySessions.length > 0 && (
        <div className="utt-card">
          <div className="utt-card-header">
            <h3>Today's Sessions</h3>
            <span className="utt-badge">{todaySessions.length} session{todaySessions.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="utt-table-wrap">
            <table className="utt-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todaySessions.map((s, i) => (
                  <tr key={s.id}>
                    <td>{i + 1}</td>
                    <td className="time-in">{fmtTime(s.loginTime)}</td>
                    <td className="time-out">{fmtTime(s.logoutTime)}</td>
                    <td className="duration">{fmtDuration(s.totalMinutes)}</td>
                    <td>
                      {!s.logoutTime
                        ? <span className="utt-badge-active"><span className="dot-green" /> Active</span>
                        : <span className="utt-badge-done">Done</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── History — Clickable Date Rows ── */}
      <div className="utt-card">
        <div className="utt-card-header">
          <h3>Punch History</h3>
          <span className="badge-outline">
            💡 Click any date row to see detailed sessions
          </span>
        </div>
        {loading ? (
          <p className="utt-empty">Loading punch data...</p>
        ) : groupedHistory.length === 0 && todaySessions.length === 0 ? (
          <div className="utt-empty-state">
            <div className="empty-icon">📂</div>
            <h4>No punch records yet</h4>
            <p>Use the QR Scanner above to start recording your work hours.</p>
          </div>
        ) : groupedHistory.length === 0 ? (
          <div className="utt-empty-state">
            <div className="empty-icon">📅</div>
            <h4>Only today's records available</h4>
            <p>Your previous sessions will appear here as you build your history.</p>
          </div>
        ) : (
          <div className="utt-table-wrap">
            <table className="utt-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>First In</th>
                  <th>Last Out</th>
                  <th>Total Hours</th>
                  <th>Sessions</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {groupedHistory.map((group) => {
                  const firstIn  = group.sessions.reduce((min, s) =>
                    !min || new Date(s.loginTime) < new Date(min) ? s.loginTime : min, null);
                  const lastOut = group.sessions.reduce((max, s) =>
                    s.logoutTime && (!max || new Date(s.logoutTime) > new Date(max)) ? s.logoutTime : max, null);

                  return (
                    <tr
                      key={group.dateKey}
                      className="utt-clickable-row"
                      onClick={() => setSelectedDayReport(group)}
                      title="Click to see session details"
                    >
                      <td><strong>{fmtDate(group.date)}</strong></td>
                      <td className="time-in">{fmtTime(firstIn)}</td>
                      <td className="time-out">{lastOut ? fmtTime(lastOut) : '—'}</td>
                      <td className="duration">{fmtDuration(group.totalMinutes)}</td>
                      <td>{group.sessions.length} session{group.sessions.length !== 1 ? 's' : ''}</td>
                      <td>
                        <span className="utt-view-btn">
                          🔍 View Scans
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Haversine (local copy for on-load check) ───────────────────────────── */
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
