import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaFingerprint, FaMapMarkerAlt, FaSignOutAlt, FaSignInAlt, FaClock, FaQrcode, FaExternalLinkAlt, FaSync } from 'react-icons/fa';
import api from '../../api/axiosConfig';
import QrScannerModal from '../QrScannerModal';
import './QuickPunch.css';
import useGeofenceWatcher from '../../hooks/useGeofenceWatcher';

// ── Settings cache helpers (5-minute TTL) ──────────────────────────────────
const SETTINGS_CACHE_KEY = 'qp_punch_settings';
const SETTINGS_TTL_MS    = 5 * 60 * 1000; // 5 minutes

function getCachedSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts > SETTINGS_TTL_MS) { localStorage.removeItem(SETTINGS_CACHE_KEY); return null; }
        return data;
    } catch { return null; }
}

function setCachedSettings(data) {
    try { localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

/**
 * QuickPunch — Dashboard attendance widget
 * Used by: Admin, Trainer, Student, Marketer, Counselor
 *
 * Two methods to do the SAME thing (punch IN or OUT):
 *   1. QR Scan   — opens camera scanner (with location verification)
 *   2. Quick GPS — direct API call with GPS coords (fallback: calls without GPS if denied)
 *
 * Speed optimisations:
 *   • GPS pre-warmed on mount via watchPosition — position ready instantly on button click
 *   • Office settings cached in localStorage (5-min TTL) — no extra round-trip per punch
 *   • Optimistic UI — state flips immediately; reverts if API fails
 *   • Status + settings fetched in parallel on mount
 */
const QuickPunch = ({ variant = 'card' }) => {
    const [isPunchedIn,   setIsPunchedIn]   = useState(false);
    const [loading,       setLoading]       = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message,       setMessage]       = useState(null);
    const [error,         setError]         = useState(null);
    const [lastLog,       setLastLog]       = useState(null);
    const [todayMinutes,  setTodayMinutes]  = useState(0);
    const [scannerOpen,   setScannerOpen]   = useState(false);

    // Pre-warmed GPS position — updated by watchPosition silently in background
    const lastPositionRef = useRef(null);
    const gpsWatchIdRef   = useRef(null);

    // Derive the time-tracking link based on user role
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = (user?.role || '').toLowerCase();
    const timeTrackingPath = `/${role}/time-tracking`;

    // Geofence auto-checkout watcher
    useGeofenceWatcher(
        isPunchedIn,
        (data) => {
            setMessage(`📍 Auto Checked-out: ${data.duration}`);
            fetchStatus();
        }
    );

    useEffect(() => {
        // Parallel fetch: status + prefetch settings cache at the same time
        Promise.all([fetchStatus(), prefetchSettings()]);

        // GPS pre-warming — keep the latest position in a ref silently
        if (navigator.geolocation) {
            gpsWatchIdRef.current = navigator.geolocation.watchPosition(
                (pos) => { lastPositionRef.current = pos; },
                () => {},
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
            );
        }

        // Background polling (every 30s) to keep multi-device portals in sync
        const poll = setInterval(fetchStatus, 30000);
        return () => {
            clearInterval(poll);
            if (gpsWatchIdRef.current != null) navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        };
    }, []);

    /* ── Pre-fetch and cache punch settings ── */
    const prefetchSettings = async () => {
        if (getCachedSettings()) return; // already fresh
        try {
            const res = await api.get('/qr/punch-settings');
            setCachedSettings(res.data);
        } catch {}
    };

    /* ── Fetch current punch status from backend ── */
    const fetchStatus = async () => {
        try {
            const res  = await api.get('/qr/time-logs');
            const logs = res.data.logs || [];

            const todayKey  = new Date().toLocaleDateString('en-CA');
            const todayLogs = logs.filter(l => (l.date || '').split('T')[0] === todayKey);
            const active    = todayLogs.find(l => l.loginTime && !l.logoutTime);
            setIsPunchedIn(!!active);

            const mins = todayLogs
                .filter(l => l.logoutTime && l.totalMinutes > 0)
                .reduce((s, l) => s + (l.totalMinutes || 0), 0);
            setTodayMinutes(mins);

            if (todayLogs.length > 0) {
                const sorted = [...todayLogs].sort((a, b) => (b.loginTime || '').localeCompare(a.loginTime || ''));
                setLastLog(sorted[0]);
            }
        } catch (err) {
            console.error("Failed to fetch punch status", err);
        } finally {
            setLoading(false);
        }
    };

    /* ── GPS: use pre-warmed position instantly, fall back to fresh request ── */
    const getSmartLocation = () => {
        // If we have a fresh pre-warmed position (< 30s old), use it immediately — zero wait
        if (lastPositionRef.current) {
            const age = Date.now() - lastPositionRef.current.timestamp;
            if (age < 30000) return Promise.resolve(lastPositionRef.current);
        }

        // Otherwise request fresh position with high→standard accuracy fallback
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (pos) => { lastPositionRef.current = pos; resolve(pos); },
                (err) => {
                    if (err.code === 3 || err.code === 2) {
                        navigator.geolocation.getCurrentPosition(
                            (pos) => { lastPositionRef.current = pos; resolve(pos); },
                            (err2) => reject(err2),
                            { enableHighAccuracy: false, timeout: 10000 }
                        );
                    } else {
                        reject(err);
                    }
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
        });
    };

    /* ── GPS + Direct punch with optimistic UI ── */
    const handleDirectPunch = async () => {
        setActionLoading(true);
        setError(null);
        setMessage(null);

        if (!navigator.geolocation) {
            setError("🛑 Geolocation is not supported by your browser.");
            setActionLoading(false);
            return;
        }

        let coords = { latitude: null, longitude: null };
        try {
            const pos = await getSmartLocation();
            coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        } catch (e) {
            let msg = "";
            if (e.code === 1) msg = "Location permission denied. Please allow location in your browser settings.";
            else if (e.code === 3) msg = "Location request timed out. Please step near a window or check your signal.";
            else msg = "Unable to acquire GPS location. Please check your signal.";
            setError(
                <span>
                    🛑 {msg}
                    <button onClick={handleDirectPunch} className="qp-retry-link">Try Again</button>
                </span>
            );
            setActionLoading(false);
            return;
        }

        // Optimistic UI — flip state immediately so user sees instant feedback
        const wasIn = isPunchedIn;
        setIsPunchedIn(!wasIn);

        try {
            const endpoint = wasIn ? '/qr/punch-out' : '/qr/punch-in';
            await api.post(endpoint, { ...coords, userId: user?.id });
            setMessage(wasIn ? '✅ Punched Out successfully!' : '✅ Punched In successfully!');
            fetchStatus(); // sync true state in background
        } catch (err) {
            // Revert optimistic update on failure
            setIsPunchedIn(wasIn);
            setError(err.response?.data?.message || 'Punch failed. Please try again.');
        } finally {
            setTimeout(() => {
                setActionLoading(false);
                setMessage(null);
                setError(null);
            }, 5000);
        }
    };

    /* ── After QR scan succeeds ── */
    const handleScanSuccess = async () => {
        setScannerOpen(false);
        setMessage(isPunchedIn ? '✅ QR Punch Out successful!' : '✅ QR Punch In successful!');
        await fetchStatus();
        setTimeout(() => setMessage(null), 3000);
    };

    // Java LocalDateTime → "2026-04-05T12:31:00" (no 'Z') — must NOT use new Date() which treats as UTC.
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

    const fmtDuration = (m) => {
        if (m === undefined || m === null) return '—';
        if (m === 0) return '< 1m';
        return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
    };

    if (loading) return <div className="qp-skeleton">Checking attendance status...</div>;

    const isH = variant === 'horizontal';

    return (
        <>
            {/* QR Scanner Modal */}
            <QrScannerModal
                isOpen={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onSuccess={handleScanSuccess}
            />

            <div className={`quick-punch-card ${isPunchedIn ? 'status-in' : 'status-out'} ${isH ? 'qp-horizontal' : ''}`}>

                {/* ── Header ── */}
                <div className="qp-header">
                    <div className="qp-icon-box">
                        <FaFingerprint size={22} />
                    </div>
                    <div className="qp-title-box">
                        <h3>Attendance {isPunchedIn ? '— Active Session' : ''}</h3>
                        <p>{isPunchedIn ? 'You are currently Punched In' : 'No active session — Punch In to start'}</p>
                    </div>
                    <Link to={timeTrackingPath} className="qp-details-link" title="View full time tracking">
                        <FaExternalLinkAlt size={13} />
                        <span>Full Log</span>
                    </Link>
                    <button className="qp-sync-btn" onClick={fetchStatus} title="Force Refresh Status">
                        <FaSync size={11} className={loading ? 'qp-spin' : ''} />
                    </button>
                </div>

                {/* ── Info Row ── */}
                <div className="qp-info-row">
                    {lastLog && (
                        <div className="qp-info-chip">
                            <FaClock size={11} />
                            Last: {fmtTime(lastLog.loginTime)}
                        </div>
                    )}
                    {todayMinutes > 0 && (
                        <div className="qp-info-chip qp-info-chip--blue">
                            ⏱ Today: {fmtDuration(todayMinutes)}
                        </div>
                    )}
                    <div className={`qp-info-chip ${isPunchedIn ? 'qp-info-chip--green' : 'qp-info-chip--grey'}`}>
                        <span className={`qp-dot ${isPunchedIn ? 'qp-dot--green' : 'qp-dot--red'}`} />
                        {isPunchedIn ? 'IN' : 'OUT'}
                    </div>
                </div>

                {/* ── Action Clarifier ── */}
                <div className="qp-action-label">
                    {isPunchedIn
                        ? '🔴 Click below to Punch OUT — choose either method:'
                        : '🟢 Click below to Punch IN — choose either method:'}
                </div>

                {/* ── Two equal methods ── */}
                <div className="qp-methods">

                    {/* Method 1: QR Scan */}
                    <button
                        className={`qp-method-btn qp-method-btn--qr ${isPunchedIn ? 'qp-method-btn--out' : 'qp-method-btn--in'}`}
                        onClick={() => setScannerOpen(true)}
                        disabled={actionLoading}
                        title="Scan QR code"
                    >
                        <FaQrcode size={18} />
                        <span>{isPunchedIn ? 'QR Punch Out' : 'QR Punch In'}</span>
                        <small>Scan code</small>
                    </button>

                    <div className="qp-or">OR</div>

                    {/* Method 2: Quick / GPS Punch */}
                    <button
                        className={`qp-method-btn qp-method-btn--quick ${isPunchedIn ? 'qp-method-btn--out' : 'qp-method-btn--in'}`}
                        onClick={handleDirectPunch}
                        disabled={actionLoading}
                        title="Quick punch without QR"
                    >
                        {actionLoading
                            ? <div className="qp-spinner" />
                            : isPunchedIn
                                ? <FaSignOutAlt size={18} />
                                : <FaSignInAlt size={18} />}
                        <span>
                            {actionLoading
                                ? 'Processing…'
                                : isPunchedIn ? 'Quick Punch Out' : 'Quick Punch In'}
                        </span>
                        <small>No QR needed</small>
                    </button>
                </div>

                {/* ── Feedback ── */}
                {message && <div className="qp-msg qp-msg--success">{message}</div>}
                {error   && <div className="qp-msg qp-msg--error"><FaMapMarkerAlt size={12} /> {error}</div>}

                {/* ── Footer ── */}
                <div className="qp-footer-row">
                    <span className="qp-tag">🛡️ Auto-checkout active</span>
                    <Link to={timeTrackingPath} className="qp-history-link">
                        View History →
                    </Link>
                </div>
            </div>
        </>
    );
};

export default QuickPunch;
