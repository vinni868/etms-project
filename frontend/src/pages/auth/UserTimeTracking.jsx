import { useState, useEffect, useRef } from 'react';
import api from '../../api/axiosConfig';
import QrScannerModal from '../../components/QrScannerModal';
import useGeofenceWatcher from '../../hooks/useGeofenceWatcher';
import './UserTimeTracking.css';

/**
 * UserTimeTracking — QR Punch In / Punch Out page
 * Used by: Admin, Trainer, Marketer, Counselor, Student
 * Features:
 *   - QR camera scanner (primary method)
 *   - Direct punch buttons (fallback)
 *   - On-load geofence check (auto-checkout if outside and session open)
 *   - Background geofence watcher (auto-checkout while page is open)
 */
export default function UserTimeTracking() {
  const user   = JSON.parse(localStorage.getItem('user') || '{}');
  const userId  = user?.id;
  const isStudent = user?.role === 'STUDENT';

  const [timeLogs,      setTimeLogs]      = useState([]);
  const [stats,         setStats]         = useState({ avgHours: '0h', totalDays: 0 });
  const [todaySessions, setTodaySessions] = useState([]);
  const [isPunchedIn,   setIsPunchedIn]   = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [scannerOpen,   setScannerOpen]   = useState(false);
  const [toast,         setToast]         = useState(null);  // { type, msg }
  const [now,           setNow]           = useState(new Date());

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

      const today     = new Date().toDateString();
      const todayList = logs.filter(l => new Date(l.date).toDateString() === today);
      setTodaySessions(todayList);

      const active = todayList.find(l => l.loginTime && !l.logoutTime);
      const punchedIn = !!active;
      setIsPunchedIn(punchedIn);

      // ── On-load geofence check ───────────────────────────────────────────
      // If user already has an open session, check if they're still inside.
      // Handles the case where they forgot to check out and re-opened the app outside.
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

  /* ─── Direct punch (fallback) ───────────────────────────────────────── */
  const handleDirectPunch = async () => {
    setActionLoading(true);
    try {
      let coords = { latitude: null, longitude: null };
      
      // Attempt to get location for the punch
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((res, rej) => {
            navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 5000 });
          });
          coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        } catch (e) {
          console.warn("Location fetch failed for direct punch:", e);
        }
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
  const fmtTime = (d) => {
    if (!d) return '—';
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return '—';
      return dt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).toUpperCase();
    } catch (e) {
      return '—';
    }
  };
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const fmtDuration = (m) => {
    if (!m) return '—';
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
  };

  const todayMinutes = todaySessions.reduce((s, l) => s + (l.totalMinutes || 0), 0);
  const pastLogs     = timeLogs.filter(l => new Date(l.date).toDateString() !== new Date().toDateString());

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
          <div className="utt-punch-status-icon">{isPunchedIn ? '✅' : '🚀'}</div>
          <h2 className="utt-punch-title">
            {isPunchedIn ? "You're in! Work is being tracked." : 'Ready to start working?'}
          </h2>
          <p className="utt-punch-sub">
            {isPunchedIn
              ? 'Session is active. Scan the QR code or use Quick Punch Out to end your session. Auto-checkout is active.'
              : 'Choose your preferred method to punch in. Scan the QR code for verification, or use Quick Punch In for instant check-in.'}
          </p>

          {/* ── Punch Method Buttons ── */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '8px'
          }}>
            {/* PRIMARY: QR Scan */}
            <button
              className={`utt-punch-btn ${isPunchedIn ? 'utt-punch-btn--out' : 'utt-punch-btn--in'}`}
              onClick={() => setScannerOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', justifyContent: 'center' }}
            >
              <span style={{ fontSize: '1.2rem' }}>📷</span>
              {isPunchedIn ? 'Scan QR to Punch Out' : 'Scan QR to Punch In'}
            </button>

            {/* SECONDARY: Direct punch for ALL roles */}
            <button
              className="utt-direct-btn"
              onClick={handleDirectPunch}
              disabled={actionLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', justifyContent: 'center' }}
            >
              {actionLoading
                ? '⏳ Processing...'
                : isPunchedIn
                  ? '🚪 Quick Punch Out (No QR)'
                  : '⚡ Quick Punch In  (No QR)'}
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

      {/* ── History ── */}
      <div className="utt-card">
        <div className="utt-card-header">
          <h3>Punch History</h3>
          <span className="badge-outline">Latest First</span>
        </div>
        {loading ? (
          <p className="utt-empty">Loading punch data...</p>
        ) : pastLogs.length === 0 && todaySessions.length === 0 ? (
          <div className="utt-empty-state">
            <div className="empty-icon">📂</div>
            <h4>No punch records yet</h4>
            <p>Use the QR Scanner above to start recording your work hours.</p>
          </div>
        ) : pastLogs.length === 0 ? (
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
