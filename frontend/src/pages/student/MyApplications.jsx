import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import './StudentJobs.css'; // Reusing job board styling
import { FaGraduationCap, FaBriefcase, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaHourglassHalf } from 'react-icons/fa';

export default function MyApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadApps(); }, []);

  const loadApps = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/my-applications');
      setApps(res.data || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'SELECTED': return <span className="sjobs-status-badge selected"><FaCheckCircle/> Selected</span>;
      case 'REJECTED': return <span className="sjobs-status-badge rejected"><FaTimesCircle/> Rejected</span>;
      case 'SHORTLISTED': return <span className="sjobs-status-badge shortlisted"><FaCheckCircle/> Shortlisted</span>;
      default: return <span className="sjobs-status-badge applied"><FaHourglassHalf/> Applied</span>;
    }
  };

  return (
    <div className="sjobs-page">
      <div className="sjobs-header">
        <div className="sjobs-header-left">
          <div className="sjobs-icon"><FaBriefcase /></div>
          <div>
            <h1 className="sjobs-title">My Applications</h1>
            <p className="sjobs-sub">Track your active career applications and status</p>
          </div>
        </div>
        <div className="sjobs-stats-pill">{apps.length} Total Applications</div>
      </div>

      {loading ? (
        <div className="sjobs-loading">Loading application history...</div>
      ) : apps.length === 0 ? (
        <div className="sjobs-empty">
          <div className="sjobs-empty-icon"><FaGraduationCap /></div>
          <h3>No applications yet</h3>
          <p>Head to the Job Board or Internships board to start applying to roles.</p>
        </div>
      ) : (
        <div className="sjobs-grid">
          {apps.map(app => (
            <div className="sjobs-card" key={app.id}>
              <div className="sjobs-card-top" style={{alignItems: 'flex-start'}}>
                <div className="sjobs-company-logo">{app.company?.charAt(0).toUpperCase() || '🏢'}</div>
                <div className="sjobs-card-meta">
                  <h3 className="sjobs-card-title">{app.jobTitle}</h3>
                  <span className="sjobs-company">{app.company}</span>
                </div>
              </div>

              <div className="sjobs-card-details" style={{marginTop: '16px'}}>
                {app.location && <span className="sjobs-detail">📍 {app.location}</span>}
                {app.jobType && <span className="sjobs-detail">🕒 {app.jobType.replace('_', ' ')}</span>}
                <span className="sjobs-detail"><FaCalendarAlt/> Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
              </div>

              <div className="sjobs-card-footer" style={{marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px'}}>
                {getStatusDisplay(app.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
