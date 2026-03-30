import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import QrScannerModal from '../../components/QrScannerModal';
import useGeofenceWatcher from '../../hooks/useGeofenceWatcher';
import './StudentTimeTracking.css';

/**
 * Student Time Tracking Page — Enhanced
 * Both QR Scan AND Quick Punch In (No QR) are available for students.
 * Route: /student/time-tracking
 */
export default function StudentTimeTracking() {
  const user    = JSON.parse(localStorage.getItem('user') || '{}');
  const userId  = user?.id;
  const token   = localStorage.getItem('token');

  const [timeLogs,      setTimeLogs]      = useState([]);
  const [stats,         setStats]         = useState({ avgHours: '0h', totalDays: 0 });
  const [todaySessions, setTodaySessions] = useState([]);
  const [isPunchedIn,   setIsPunchedIn]   = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [scannerOpen,   setScannerOpen]   = useState(false);
  const [toast,         setToast]         = useState(null);
  const [now,           setNow]           = useState(new Date());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { loadData(); }, []);

  /* ─── Load time logs ─── */
  const loadData = async () => {
    try {
      setLoading(true);
      const res  = await api.get('/qr/time-logs', {
        headers: { Authorization: `Bearer ${token}` }, withCredentials: true
      });
      const logs  = res.data.logs  || [];
      const stats = res.data.stats || {};
      setTimeLogs(logs);
      setStats(stats);

      const today     = new Date().toDateString();
      const todayList = logs.filter(l => new Date(l.date).toDateString() === today);
      setTodaySessions(todayList);

      const active    = todayList.find(l => l.loginTime && !l.logoutTime);
      setIsPunchedIn(!!active);
    } catch (err) {
      console.error('Failed to load time logs:', err);
      showToast('error', 'Failed to load punch data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Auto-checkout geofence ─── */
  const handleAutoCheckout = (data) => {
    showToast('warning', `📍 Auto checked-out — you left the institute. Duration: ${data.duration}`);
    loadData();
  };
  useGeofenceWatcher(isPunchedIn, handleAutoCheckout);

  /* ─── Quick Direct Punch (No QR) ─── */
  const handleDirectPunch = async () => {
    setActionLoading(true);
    try {
      if (isPunchedIn) {
        await api.post('/qr/punch-out', { userId }, {
          headers: { Authorization: `Bearer ${token}` }, withCredentials: true
        });
        showToast('success', '✅ Punched Out successfully!');
      } else {
        await api.post('/qr/punch-in', { userId }, {
          headers: { Authorization: `Bearer ${token}` }, withCredentials: true
        });
        showToast('success', '✅ Punched In successfully!');
      }
      await loadData();
    } catch (err) {
      showToast('error', err?.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  /* ─── Toast helper ─── */
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  /* ─── Formatters ─── */
  const fmtTime = (d) =>
    d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const fmtDuration = (m) => {
    if (!m) return '—';
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
  };

  const todayMinutes = todaySessions.reduce((s, l) => s + (l.totalMinutes || 0), 0);
  const pastLogs     = timeLogs.filter(l => new Date(l.date).toDateString() !== new Date().toDateString());

  const clockStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const dateStr  = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const toastColors = {
    success: { bg: '#dcfce7', color: '#16a34a', border: '#bbf7d0' },
    error:   { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
    warning: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  };

  return (
    <div className="stt-page">

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
          animation: 'stt-toast-in 0.3s cubic-bezier(0.22,0.68,0,1.2)',
          maxWidth: '380px',
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

      {/* ── Page Header ── */}
      <div className="stt-page-header">
        <div className="stt-header-left">
          <div className="stt-header-icon">⏱️</div>
          <div>
            <h1 className="stt-page-title">My Work Hours</h1>
            <p className="stt-page-sub">Track your daily attendance and work sessions</p>
          </div>
        </div>
        <div className="stt-live-clock">
          <span className="stt-clock-time">{clockStr}</span>
          <span className="stt-clock-date">{dateStr}</span>
        </div>
      </div>

      {/* ── Status Row ── */}
      <div className="stt-stats-row">
        <div className={`stt-status-pill ${isPunchedIn ? 'stt-status-in' : 'stt-status-out'}`}>
          <span className={`stt-dot ${isPunchedIn ? 'dot-green' : 'dot-red'}`} />
          {isPunchedIn ? 'Currently Punched IN' : 'Currently Punched OUT'}
        </div>
        <div className="stt-stat-mini">
          <span className="stt-stat-label">Today's Time</span>
          <span className="stt-stat-val stt-val-blue">
            {isPunchedIn ? <span className="stt-pulse">Tracking…</span> : fmtDuration(todayMinutes) || '—'}
          </span>
        </div>
        <div className="stt-stat-mini">
          <span className="stt-stat-label">Today's Sessions</span>
          <span className="stt-stat-val">{todaySessions.length}</span>
        </div>
        <div className="stt-stat-mini">
          <span className="stt-stat-label">Days Logged</span>
          <span className="stt-stat-val">{stats.totalDays || 0}</span>
        </div>
        <div className="stt-stat-mini">
          <span className="stt-stat-label">Avg. Daily Hours</span>
          <span className="stt-stat-val">{stats.avgHours || '—'}</span>
        </div>
      </div>

      {/* ── Main Punch Card ── */}
      <div className={`stt-punch-card ${isPunchedIn ? 'stt-punch-card--in' : 'stt-punch-card--out'}`}>
        <div className="stt-punch-card__circles">
          <div className="stt-circle stt-circle--1" />
          <div className="stt-circle stt-circle--2" />
        </div>
        <div className="stt-punch-card__content">
          <div className="stt-punch-icon">{isPunchedIn ? '✅' : '🚀'}</div>
          <h2 className="stt-punch-title">
            {isPunchedIn ? "You're in! Time is being tracked." : 'Ready to mark attendance?'}
          </h2>
          <p className="stt-punch-sub">
            {isPunchedIn
              ? 'Use either method below to end your session. Auto-checkout is active — you\'ll be logged out when you leave the premises.'
              : 'Choose your preferred punch-in method. Both options record your attendance.'}
          </p>

          {/* ── Two Method Buttons ── */}
          <div className="stt-method-row">
            {/* Method 1: QR Scan */}
            <button
              className={`stt-method-card stt-method-card--primary ${isPunchedIn ? 'stt-method-card--out' : ''}`}
              onClick={() => setScannerOpen(true)}
            >
              <div className="stt-method-icon">📷</div>
              <div className="stt-method-body">
                <div className="stt-method-title">
                  {isPunchedIn ? 'Scan QR to Punch Out' : 'Scan QR to Punch In'}
                </div>
                <div className="stt-method-desc">Camera scan — recommended</div>
              </div>
              <div className="stt-method-arrow">→</div>
            </button>

            {/* Divider */}
            <div className="stt-method-divider">
              <span>or</span>
            </div>

            {/* Method 2: Quick Punch (No QR) */}
            <button
              className="stt-method-card stt-method-card--secondary"
              onClick={handleDirectPunch}
              disabled={actionLoading}
            >
              <div className="stt-method-icon">⚡</div>
              <div className="stt-method-body">
                <div className="stt-method-title">
                  {actionLoading
                    ? '⏳ Processing...'
                    : isPunchedIn
                      ? 'Quick Punch Out (No QR)'
                      : 'Quick Punch In (No QR)'}
                </div>
                <div className="stt-method-desc">Instant check-in, no camera needed</div>
              </div>
              <div className="stt-method-arrow">→</div>
            </button>
          </div>

          <p className="stt-geofence-note">
            🛡️ Auto-checkout active — location-based exit detection is running.
          </p>
        </div>
      </div>

      {/* ── Today's Sessions ── */}
      {todaySessions.length > 0 && (
        <div className="stt-card">
          <div className="stt-card-header">
            <h3>Today's Sessions</h3>
            <span className="stt-badge">{todaySessions.length} session{todaySessions.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="stt-table-wrap">
            <table className="stt-table">
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
                        ? <span className="stt-badge-active"><span className="dot-green" /> Active</span>
                        : <span className="stt-badge-done">Done</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── History ── */}
      <div className="stt-card">
        <div className="stt-card-header">
          <h3>Punch History</h3>
          <span className="stt-badge-outline">Latest First</span>
        </div>
        {loading ? (
          <p className="stt-empty">Loading punch data...</p>
        ) : pastLogs.length === 0 && todaySessions.length === 0 ? (
          <div className="stt-empty-state">
            <div className="stt-empty-icon">📂</div>
            <h4>No punch records yet</h4>
            <p>Use one of the punch methods above to start recording your attendance.</p>
          </div>
        ) : pastLogs.length === 0 ? (
          <div className="stt-empty-state">
            <div className="stt-empty-icon">📅</div>
            <h4>Only today's records available</h4>
            <p>Your previous sessions will appear here as you build history.</p>
          </div>
        ) : (
          <div className="stt-table-wrap">
            <table className="stt-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>First In</th>
                  <th>Last Out</th>
                  <th>Total Hours</th>
                  <th>Sessions</th>
                </tr>
              </thead>
              <tbody>
                {pastLogs.map((log) => (
                  <tr key={log.id}>
                    <td><strong>{fmtDate(log.date)}</strong></td>
                    <td className="time-in">{fmtTime(log.loginTime)}</td>
                    <td className="time-out">{fmtTime(log.logoutTime)}</td>
                    <td className="duration">{fmtDuration(log.totalMinutes)}</td>
                    <td>{log.sessionCount || 1} session{(log.sessionCount || 1) !== 1 ? 's' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
