import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaFingerprint, FaMapMarkerAlt, FaSignOutAlt, FaSignInAlt, FaClock, FaQrcode, FaExternalLinkAlt, FaSync } from 'react-icons/fa';
import api from '../../api/axiosConfig';
import QrScannerModal from '../QrScannerModal';
import './QuickPunch.css';
import useGeofenceWatcher from '../../hooks/useGeofenceWatcher';

/**
 * QuickPunch — Dashboard attendance widget
 * Used by: Admin, Trainer, Student, Marketer, Counselor
 *
 * Two methods to do the SAME thing (punch IN or OUT):
 *   1. QR Scan   — opens camera scanner (with location verification)
 *   2. Quick GPS — direct API call with GPS coords (fallback: calls without GPS if denied)
 *
 * State is synced with backend on every action — navigating to /time-tracking
 * will always reflect the latest punch state.
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
        fetchStatus(); 
        
        // Background polling (every 30s) to keep multi-device portals in sync
        const poll = setInterval(fetchStatus, 30000);
        return () => clearInterval(poll);
    }, []);

    /* ── Fetch current punch status from backend ── */
    const fetchStatus = async () => {
        try {
            // Using a more reliable path that matches axiosConfig baseURL
            const res  = await api.get('/qr/time-logs');
            const logs = res.data.logs || [];

            // Reliable punch detection: find any log with loginTime but no logoutTime
            const today     = new Date().toDateString();
            const todayLogs = logs.filter(l => new Date(l.date).toDateString() === today);
            const active    = todayLogs.find(l => l.loginTime && !l.logoutTime);
            setIsPunchedIn(!!active);

            // Total minutes today
            const mins = todayLogs.reduce((s, l) => s + (l.totalMinutes || 0), 0);
            setTodayMinutes(mins);

            // Latest log (for "last punch" display)
            if (todayLogs.length > 0) {
                const sorted = [...todayLogs].sort((a, b) => new Date(b.loginTime) - new Date(a.loginTime));
                setLastLog(sorted[0]);
            }
        } catch (err) {
            console.error("Failed to fetch punch status", err);
        } finally {
            setLoading(false);
        }
    };

    /* ── Smart GPS Acquisition with Fallback ── */
    const getSmartLocation = () => {
        return new Promise((resolve, reject) => {
            const options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };
            
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve(pos),
                (err) => {
                    // If high accuracy fails or times out, try standard accuracy as fallback
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

    /* ── GPS + Direct punch (works with or without GPS) ── */
    const handleDirectPunch = async () => {
        setActionLoading(true);
        setError(null);
        setMessage(null);

        let coords = { latitude: null, longitude: null };

        if (!navigator.geolocation) {
            setError("🛑 Geolocation is not supported by your browser.");
            setActionLoading(false);
            return;
        }

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

        try {
            const endpoint = isPunchedIn ? '/qr/punch-out' : '/qr/punch-in';
            const payload  = { ...coords, userId: user?.id };
            const res      = await api.post(endpoint, payload);
            setMessage(isPunchedIn ? '✅ Punched Out successfully!' : '✅ Punched In successfully!');
            await fetchStatus();
        } catch (err) {
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

    const fmtTime = (d) => {
        if (!d) return '—';
        try {
            return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
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
