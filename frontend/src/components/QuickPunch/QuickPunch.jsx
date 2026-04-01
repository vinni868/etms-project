import React, { useState, useEffect } from 'react';
import { FaFingerprint, FaMapMarkerAlt, FaSignOutAlt, FaSignInAlt, FaClock } from 'react-icons/fa';
import api from '../../api/axiosConfig';
import './QuickPunch.css';
import useGeofenceWatcher from '../../hooks/useGeofenceWatcher';

const QuickPunch = ({ variant = 'card' }) => {
    const [status, setStatus] = useState(null); // 'IN', 'OUT'
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [lastLog, setLastLog] = useState(null);
    const [gpsError, setGpsError] = useState(null);

    // ... (rest of the logic remains the same)
    useGeofenceWatcher(
        status === 'IN',
        (data) => {
            setMessage(`Auto Checked-out: ${data.duration}`);
            fetchStatus();
        },
        (err) => {
            setGpsError(err === "PERMISSION_DENIED" ? "Please enable GPS to use Attendance features." : err);
        }
    );

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await api.get('/qr/time-logs');
            const isActive = res.data.stats.activeToday === 1;
            setStatus(isActive ? 'IN' : 'OUT');
            if (res.data.logs && res.data.logs.length > 0) {
                setLastLog(res.data.logs[0]);
            }
        } catch (err) {
            console.error("Failed to fetch punch status", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePunch = () => {
        if (!navigator.geolocation) {
            setError("GPS not supported.");
            return;
        }

        setActionLoading(true);
        setError(null);
        setGpsError(null);
        setMessage(null);

        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const endpoint = status === 'IN' ? '/qr/punch-out' : '/qr/punch-in';
                const userId = JSON.parse(localStorage.getItem('user'))?.id;

                const res = await api.post(endpoint, {
                    userId,
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                });

                setMessage(res.data.message);
                fetchStatus(); 
            } catch (err) {
                setError(err.response?.data?.message || "Location check failed. Move closer to institute.");
            } finally {
                setActionLoading(true);
                setTimeout(() => setActionLoading(false), 800);
            }
        }, (err) => {
            setGpsError("Location Permission Denied. Go to Browser Settings > Privacy > Location to enable.");
            setActionLoading(false);
        }, { enableHighAccuracy: true });
    };

    if (loading) return <div className="qp-skeleton">Checking status...</div>;

    const isH = variant === 'horizontal';

    return (
        <div className={`quick-punch-card ${status === 'IN' ? 'status-in' : 'status-out'} ${isH ? 'qp-horizontal' : ''}`}>
            <div className="qp-header">
                <div className="qp-icon-box">
                    <FaFingerprint size={24} />
                </div>
                <div className="qp-title-box">
                    <h3>Attendance</h3>
                    <p>{status === 'IN' ? 'You are currently Punched In' : 'Ready to start session'}</p>
                </div>
            </div>

            <div className="qp-body">
                <div className="qp-body-left">
                    {lastLog && (
                        <div className="qp-info-text">
                            <FaClock size={12} style={{marginRight: '6px'}} /> 
                            Last: {new Date(lastLog.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    )}
                </div>
                
                <div className="qp-body-right">
                    <button 
                        className={`qp-action-btn ${actionLoading ? 'loading' : ''}`} 
                        onClick={handlePunch}
                        disabled={actionLoading}
                    >
                        {actionLoading ? (
                            <div className="qp-spinner"></div>
                        ) : (
                            <>
                                {status === 'IN' ? <FaSignOutAlt style={{marginRight: '8px'}} /> : <FaSignInAlt style={{marginRight: '8px'}} />}
                                {status === 'IN' ? 'Punch Out' : 'Quick Punch In'}
                            </>
                        )}
                    </button>
                </div>

                {gpsError && (
                    <div className="qp-msg warning" style={{border: '1.5px solid #fed7aa', color: '#ea580c', background: '#fff7ed'}}>
                        <FaMapMarkerAlt style={{marginRight: '8px'}} /> {gpsError}
                    </div>
                )}

                {message && <div className="qp-msg success">{message}</div>}
                {error && <div className="qp-msg error"><FaMapMarkerAlt size={12} style={{marginRight: '6px'}} /> {error}</div>}
            </div>
            
            {!isH && (
                <div className="qp-footer">
                    <span className="qp-tag">GPS Geofencing Active</span>
                    <span className={`sa-hr-dot ${status === 'IN' ? 'green' : 'gold'}`}></span>
                </div>
            )}
        </div>
    );
};

export default QuickPunch;
