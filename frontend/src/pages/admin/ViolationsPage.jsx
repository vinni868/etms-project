import { useState, useEffect, useCallback } from 'react';
import { FaExclamationTriangle, FaChevronLeft, FaChevronRight, FaSync, FaUserGraduate, FaUsers } from 'react-icons/fa';
import api from '../../api/axiosConfig';
import './ViolationsPage.css';

/* ── Violation type config ────────────────────────────────────── */
const VIOLATION_LABELS = {
    FORGOT_PUNCH_OUT:       { label: 'Forgot Punch-Out',    color: 'orange' },
    GEOFENCE_EXIT:          { label: 'Left Without Punch',  color: 'red'    },
    MIDNIGHT_AUTO_CLOSE:    { label: 'Auto Closed',         color: 'purple' },
    TRAINER_MARKED_ABSENT:  { label: 'Marked Absent',       color: 'blue'   },
};

function fmtDate(d) {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(m, 10) - 1]} ${parseInt(day, 10)}, ${y}`;
}

function fmtWeekRange(start, end) {
    if (!start || !end) return '';
    return `${fmtDate(start)} – ${fmtDate(end)}`;
}

/* ── Single violation card ───────────────────────────────────── */
function ViolationCard({ v }) {
    const cfg = VIOLATION_LABELS[v.violationType] || { label: v.violationType, color: 'grey' };
    return (
        <div className={`vp-card vp-card--${cfg.color}`}>
            <div className="vp-card-top">
                <div className="vp-card-identity">
                    <span className="vp-name">{v.userName || '—'}</span>
                    {v.portalId && <span className="vp-portal-id">{v.portalId}</span>}
                    <span className={`vp-role-tag vp-role-tag--${(v.role || '').toLowerCase()}`}>
                        {v.role || '—'}
                    </span>
                </div>
                <div className="vp-card-right">
                    <span className={`vp-badge vp-badge--${cfg.color}`}>{cfg.label}</span>
                    <span className="vp-date">{fmtDate(v.violationDate)}</span>
                </div>
            </div>
            {v.description && (
                <p className="vp-desc">{v.description}</p>
            )}
        </div>
    );
}

/* ── Main Page ───────────────────────────────────────────────── */
export default function ViolationsPage() {
    const [offset, setOffset]         = useState(0);   // 0 = this week, 1 = last week, …
    const [tab, setTab]               = useState('students'); // 'students' | 'staff'
    const [data, setData]             = useState(null);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState(null);

    const fetchViolations = useCallback(async (off) => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/violations/weekly?offset=${off}`);
            setData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load violations.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchViolations(offset);
    }, [offset, fetchViolations]);

    const goNext     = () => { if (offset > 0) setOffset(o => o - 1); };
    const goPrev     = () => setOffset(o => o + 1);
    const isThisWeek = offset === 0;

    const studentList = data?.studentViolations || [];
    const staffList   = data?.staffViolations   || [];
    const activeList  = tab === 'students' ? studentList : staffList;

    return (
        <div className="vp-container">

            {/* ── Page Header ── */}
            <div className="vp-header">
                <div className="vp-header-left">
                    <div className="vp-header-icon"><FaExclamationTriangle size={20} /></div>
                    <div>
                        <h1 className="vp-title">Attendance Violations</h1>
                        <p className="vp-subtitle">
                            {data ? fmtWeekRange(data.weekStart, data.weekEnd) : 'Loading…'}
                        </p>
                    </div>
                </div>
                <div className="vp-header-right">
                    <button className="vp-refresh-btn" onClick={() => fetchViolations(offset)} title="Refresh">
                        <FaSync size={13} className={loading ? 'vp-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* ── Week Navigation ── */}
            <div className="vp-week-nav">
                <button className="vp-nav-btn" onClick={goPrev}>
                    <FaChevronLeft size={12} /> Previous Week
                </button>
                <div className="vp-week-label">
                    {isThisWeek
                        ? <span className="vp-week-badge vp-week-badge--current">Current Week</span>
                        : <span className="vp-week-badge">Week -{offset}</span>}
                    {data && <span className="vp-total-badge">{data.totalCount} violations</span>}
                </div>
                <button
                    className="vp-nav-btn"
                    onClick={goNext}
                    disabled={isThisWeek}
                    style={{ opacity: isThisWeek ? 0.4 : 1, cursor: isThisWeek ? 'not-allowed' : 'pointer' }}
                >
                    Current Week <FaChevronRight size={12} />
                </button>
            </div>

            {/* ── Tabs ── */}
            <div className="vp-tabs">
                <button
                    className={`vp-tab ${tab === 'students' ? 'vp-tab--active' : ''}`}
                    onClick={() => setTab('students')}
                >
                    <FaUserGraduate size={13} />
                    Student Violations
                    <span className="vp-tab-count">{studentList.length}</span>
                </button>
                <button
                    className={`vp-tab ${tab === 'staff' ? 'vp-tab--active' : ''}`}
                    onClick={() => setTab('staff')}
                >
                    <FaUsers size={13} />
                    Staff Violations
                    <span className="vp-tab-count">{staffList.length}</span>
                </button>
            </div>

            {/* ── Content ── */}
            <div className="vp-content">
                {loading && (
                    <div className="vp-skeleton-list">
                        {[1,2,3].map(i => <div key={i} className="vp-skeleton-card" />)}
                    </div>
                )}

                {!loading && error && (
                    <div className="vp-error">
                        <FaExclamationTriangle /> {error}
                        <button onClick={() => fetchViolations(offset)} className="vp-retry-btn">Retry</button>
                    </div>
                )}

                {!loading && !error && activeList.length === 0 && (
                    <div className="vp-empty">
                        <span className="vp-empty-icon">✅</span>
                        <p>No {tab === 'students' ? 'student' : 'staff'} violations for this week.</p>
                    </div>
                )}

                {!loading && !error && activeList.length > 0 && (
                    <div className="vp-list">
                        {activeList.map(v => (
                            <ViolationCard key={v.id} v={v} />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Legend ── */}
            <div className="vp-legend">
                {Object.entries(VIOLATION_LABELS).map(([key, cfg]) => (
                    <span key={key} className={`vp-legend-item vp-badge--${cfg.color}`}>
                        {cfg.label}
                    </span>
                ))}
            </div>
        </div>
    );
}
