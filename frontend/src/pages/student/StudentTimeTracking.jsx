import api from '../../api/axiosConfig';
import QrScannerModal from '../../components/QrScannerModal';
import useGeofenceWatcher from '../../hooks/useGeofenceWatcher';
import AttendanceRules from '../../components/AttendanceRules/AttendanceRules';
import { 
  FaClock, 
  FaHistory, 
  FaCheckCircle, 
  FaFingerprint, 
  FaQrcode, 
  FaBolt, 
  FaExclamationTriangle,
  FaShieldAlt,
  FaCalendarAlt,
  FaHourglassHalf,
  FaRunning,
  FaLock
} from "react-icons/fa";
import './StudentTimeTracking.css';

/**
 * Student Time Tracking Page — Premium Evolution
 * High-definition glassmorphic UI + Strict Account Status Enforcement
 */
export default function StudentTimeTracking() {
  const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
  const userId  = userFromStorage?.id;
  const token   = localStorage.getItem('token');

  const [timeLogs,      setTimeLogs]      = useState([]);
  const [stats,         setStats]         = useState({ avgHours: '0h', totalDays: 0 });
  const [todaySessions, setTodaySessions] = useState([]);
  const [isPunchedIn,   setIsPunchedIn]   = useState(false);
  const [accStatus,     setAccStatus]     = useState(userFromStorage?.status || 'ACTIVE');
  
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [scannerOpen,   setScannerOpen]   = useState(false);
  const [toast,         setToast]         = useState(null);
  const [now,           setNow]           = useState(new Date());
  const [gpsError,      setGpsError]      = useState(null);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/qr/time-logs');
      const logs = res.data.logs || [];
      const st = res.data.stats || {};
      const actualStatus = res.data.userStatus || 'ACTIVE';
      
      setTimeLogs(logs);
      setStats(st);
      setAccStatus(actualStatus);

      const today = new Date().toDateString();
      const todayList = logs.filter(l => new Date(l.date).toDateString() === today);
      setTodaySessions(todayList);

      const active = todayList.find(l => l.loginTime && !l.logoutTime);
      setIsPunchedIn(!!active);
    } catch (err) {
      showToast('error', 'Critical: Could not sync with Attendance Server.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoCheckout = (data) => {
    showToast('warning', `System: Auto Checked-Out (Left Geofence). Duration: ${data.duration}`);
    loadData();
  };
  
  const handleGpsError = (err) => {
    setGpsError(err === "PERMISSION_DENIED" 
      ? "GPS access restricted. Enable location services in browser settings to punch in/out." 
      : `GPS Integrity Error: ${err}`
    );
  };

  useGeofenceWatcher(isPunchedIn, handleAutoCheckout, handleGpsError);

  const handleDirectPunch = async () => {
    if (accStatus !== 'ACTIVE') {
      showToast('error', 'System Lock: Inactive accounts cannot perform punch actions.');
      return;
    }

    if (!navigator.geolocation) {
      showToast('error', 'GPS Logic Error: Geolocation is not supported by your browser.');
      return;
    }

    setActionLoading(true);
    
    // Get location first
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const body = { 
            userId,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          };

          if (isPunchedIn) {
            await api.post('/qr/punch-out', body);
            showToast('success', 'Session Synced! Punched out successfully.');
          } else {
            await api.post('/qr/punch-in', body);
            showToast('success', 'Tracker Active! Attendance record started.');
          }
          await loadData();
        } catch (err) {
          showToast('error', err?.response?.data?.message || 'Server Exception. Try again later.');
        } finally {
          setActionLoading(false);
        }
      },
      (err) => {
        setActionLoading(false);
        showToast('error', 'GPS access required for attendance tracking. Please enable location services.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  /* Formatters */
  const fmtTime = (d) =>
    d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() : '—';
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const fmtDuration = (m) => {
    if (!m) return '—';
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
  };

  const todayMinutes = todaySessions.reduce((s, l) => s + (l.totalMinutes || 0), 0);
  const pastLogs     = timeLogs.filter(l => new Date(l.date).toDateString() !== new Date().toDateString());

  const clockStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase();
  const dateStr  = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Access Control
  const isRestricted = accStatus !== 'ACTIVE';

  return (
    <div className="stt-page">

      {/* --- PREMIUM TOAST --- */}
      {toast && (
        <div className={`stt-adm-toast stt-adm-toast--${toast.type}`}>
           {toast.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
           <span>{toast.msg}</span>
        </div>
      )}

      <QrScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onSuccess={() => { setScannerOpen(false); loadData(); }}
      />

      {/* --- HEADER --- */}
      <div className="stt-page-header">
        <div className="stt-header-left">
          <div className="stt-header-icon"><FaClock /></div>
          <div>
            <h1 className="stt-page-title">Personal Attendance Hub</h1>
            <p className="stt-page-sub">Monitor your working footprint and location-aware sessions</p>
          </div>
        </div>
        <div className="stt-live-clock">
          <span className="stt-clock-time">{clockStr}</span>
          <span className="stt-clock-date">{dateStr}</span>
        </div>
      </div>

      <AttendanceRules />

      {/* --- GPS ALERTS --- */}
      {gpsError && (
        <div className="stt-gps-alert">
          <FaShieldAlt className="glow-icon" />
          <div className="gps-content">
             <strong>Security Check:</strong> {gpsError}
          </div>
        </div>
      )}

      {/* --- STATS CLUSTER --- */}
      <div className="stt-stats-row">
        <div className={`stt-status-pill ${isPunchedIn ? 'stt-status-in' : 'stt-status-out'}`}>
          <span className={`stt-dot ${isPunchedIn ? 'dot-green' : 'dot-red'}`} />
          {isPunchedIn ? 'Tracking Session [ACTIVE]' : 'System Idle [READY]'}
        </div>
        
        <div className="stt-stat-mini">
          <span className="stt-stat-label">TODAY'S LOG</span>
          <span className="stt-stat-val stt-val-blue">
            {isPunchedIn ? <span className="stt-live-pulse"><FaRunning /> Running</span> : fmtDuration(todayMinutes)}
          </span>
        </div>
        <div className="stt-stat-mini">
          <span className="stt-stat-label">SESSION RECAP</span>
          <span className="stt-stat-val">{todaySessions.length} <FaFingerprint style={{fontSize: '14px', opacity: 0.5}} /></span>
        </div>
        <div className="stt-stat-mini">
          <span className="stt-stat-label">LIFETIME DAYS</span>
          <span className="stt-stat-val">{stats.totalDays || 0} <FaCalendarAlt style={{fontSize: '14px', opacity: 0.5}} /></span>
        </div>
        <div className="stt-stat-mini">
          <span className="stt-stat-label">AVG WORK-RATE</span>
          <span className="stt-stat-val">{stats.avgHours || '0.0h'} <FaHourglassHalf style={{fontSize: '14px', opacity: 0.5}} /></span>
        </div>
      </div>

      {/* --- CORE PUNCH SYSTEM --- */}
      {isRestricted ? (
        <div className="stt-restricted-hub">
           <div className="restricted-icon"><FaLock /></div>
           <h2 className="restricted-title">Access Restricted</h2>
           <p className="restricted-sub">
             The Attendance System has been locked for your account as your current status is <strong>{accStatus}</strong>.
             Please contact the Student Registry or Admin Hub to reactivate your portal privileges.
           </p>
        </div>
      ) : (
        <div className={`stt-punch-card ${isPunchedIn ? 'stt-punch-card--in' : 'stt-punch-card--out'}`}>
          <div className="stt-punch-card__content">
            <div className="stt-punch-icon">{isPunchedIn ? '🌩️' : '🔭'}</div>
            <h2 className="stt-punch-title">
              {isPunchedIn ? "Operational Period in Progress" : 'Institute Entrance Detected'}
            </h2>
            <p className="stt-punch-sub">
              {isPunchedIn
                ? 'Your location is being monitored for platform compliance. You will be automatically checked-out if you leave the radial boundary.'
                : 'Welcome to the institute. Please synchronize your session using one of the high-fidelity methods below.'}
            </p>

            <div className="stt-method-row">
              <button
                className={`stt-method-card stt-method-card--primary ${isPunchedIn ? 'btn-danger' : ''}`}
                onClick={() => setScannerOpen(true)}
              >
                <div className="stt-method-icon"><FaQrcode /></div>
                <div className="stt-method-body">
                  <div className="stt-method-title">
                    {isPunchedIn ? 'Finalize via QR' : 'Initialize via QR'}
                  </div>
                  <div className="stt-method-desc">Visual Cryptography Scan</div>
                </div>
              </button>

              <button
                className="stt-method-card stt-method-card--secondary"
                onClick={handleDirectPunch}
                disabled={actionLoading}
              >
                <div className="stt-method-icon"><FaBolt /></div>
                <div className="stt-method-body">
                  <div className="stt-method-title">
                    {actionLoading ? 'Syncing...' : isPunchedIn ? 'Manual Logout' : 'Instant Login'}
                  </div>
                  <div className="stt-method-desc">Direct Digital Sync</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TODAY'S TRACKS --- */}
      {todaySessions.length > 0 && (
        <div className="stt-card">
          <div className="stt-card-header" style={{marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3>Current Day Footprints</h3>
            <span className="stt-badge-modern">{todaySessions.length} TRACKS</span>
          </div>
          <div className="stt-table-wrap">
            <table className="stt-table">
              <thead>
                <tr>
                  <th>Index</th>
                  <th>Entry Vector</th>
                  <th>Exit Vector</th>
                  <th>Retention</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todaySessions.map((s, i) => (
                  <tr key={s.id}>
                    <td>{String(i + 1).padStart(2, '0')}</td>
                    <td className="time-in">{fmtTime(s.loginTime)}</td>
                    <td className="time-out">{fmtTime(s.logoutTime)}</td>
                    <td className="duration">{fmtDuration(s.totalMinutes)}</td>
                    <td>
                      {!s.logoutTime
                        ? <span className="stt-pulse-chip">TRACKING</span>
                        : <span className="stt-done-chip">LOCKED</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- ARCHIVE --- */}
      <div className="stt-card">
        <div className="stt-card-header" style={{marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h3><FaHistory /> Session Archive</h3>
          <span className="stt-badge-outline">Historical Data Only</span>
        </div>
        {loading ? (
          <div style={{padding: '40px', textAlign: 'center', opacity: 0.5}}>Initializing Archive Engine...</div>
        ) : pastLogs.length === 0 ? (
          <div className="stt-empty-state">
             <h4 style={{margin: 0, opacity: 0.6}}>Empty Archive</h4>
             <p style={{marginTop: '10px'}}>Historical records will append here as sessions are finalized.</p>
          </div>
        ) : (
          <div className="stt-table-wrap">
            <table className="stt-table">
              <thead>
                <tr>
                   <th>Date</th>
                   <th>Inhabited</th>
                   <th>Abandoned</th>
                   <th>Net Total</th>
                   <th>Mechanism</th>
                   <th>Security Reason</th>
                </tr>
              </thead>
              <tbody>
                {pastLogs.map((log) => (
                  <tr key={log.id}>
                    <td><strong>{fmtDate(log.date)}</strong></td>
                    <td className="time-in">{fmtTime(log.loginTime)}</td>
                    <td className="time-out">{fmtTime(log.logoutTime)}</td>
                    <td className="duration">{fmtDuration(log.totalMinutes)}</td>
                    <td style={{fontSize: '12px', fontWeight: 800, color: '#64748b'}}>
                      {log.punchMethod || 'DIGITAL'}
                    </td>
                    <td>
                      <span className={`stt-status-text ${log.checkoutReason?.toLowerCase()}`}>
                        {log.checkoutReason || 'MANUAL'}
                      </span>
                    </td>
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
