import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import './ManageJobs.css';
import { FaTrash, FaUsers, FaEye, FaTimesCircle, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

export default function ManageJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  // Applications Modal State
  const [viewingJob, setViewingJob] = useState(null);
  const [apps, setApps] = useState([]);
  const [appLoading, setAppLoading] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/jobs');
      setJobs(res.data);
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Failed to fetch jobs' });
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (id) => {
    if (!window.confirm("Delete this listing permanently?")) return;
    try {
      await api.delete(`/admin/jobs/${id}`);
      setMsg({ type: 'success', text: 'Job deleted successfully' });
      fetchJobs();
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to delete job' });
    }
  };

  const openApplications = async (job) => {
    setViewingJob(job);
    setAppLoading(true);
    try {
      const res = await api.get(`/admin/jobs/${job.id}/applications`);
      setApps(res.data);
    } catch (err) {
      alert("Failed to load applications");
    } finally {
      setAppLoading(false);
    }
  };

  const updateAppStatus = async (appId, newStatus) => {
    try {
      await api.put(`/admin/applications/${appId}/status`, { status: newStatus });
      setApps(apps.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    } catch (err) {
      alert("Failed to update status");
    }
  };

  return (
    <div className="mj-page">
      <div className="mj-header">
        <h1>Listing Manager</h1>
        <p>Manage active job & internship listings and view applicants.</p>
      </div>

      {msg && (
        <div className={`mj-msg ${msg.type}`}>
          {msg.text}
        </div>
      )}

      <div className="mj-card">
        {loading ? (
          <div className="mj-loading">Loading career data...</div>
        ) : jobs.length === 0 ? (
          <div className="mj-empty">No jobs posted yet. Use "Post Job" to create one.</div>
        ) : (
          <div className="mj-table-container">
            <table className="mj-table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Company</th>
                  <th>Job Type</th>
                  <th>Deadline</th>
                  <th>Applicants</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(j => (
                  <tr key={j.id}>
                    <td className="mj-title-td">
                      <strong>{j.title}</strong>
                      <div className="mj-loc">{j.location}</div>
                    </td>
                    <td>{j.company}</td>
                    <td><span className={`mj-type-badge ${j.jobType}`}>{j.jobType?.replace('_', ' ')}</span></td>
                    <td>{j.applyDeadline}</td>
                    <td>
                      <button className="mj-btn-applicants" onClick={() => openApplications(j)}>
                        <FaUsers /> {j.applicationCount || 0}
                      </button>
                    </td>
                    <td><span className={`mj-status ${j.status === 'ACTIVE' ? 'on' : 'off'}`}>● {j.status}</span></td>
                    <td>
                      <div className="mj-actions">
                        <button className="mj-btn-delete" onClick={() => deleteJob(j.id)}><FaTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Applications Modal */}
      {viewingJob && (
        <div className="mj-modal-overlay">
          <div className="mj-modal">
            <div className="mj-modal-header">
              <h2>Applicants for: {viewingJob.title}</h2>
              <button className="mj-close-btn" onClick={() => setViewingJob(null)}><FaTimesCircle /></button>
            </div>
            
            <div className="mj-modal-body">
              {appLoading ? (
                <p>Loading applicants...</p>
              ) : apps.length === 0 ? (
                <p>No students have applied to this listing yet.</p>
              ) : (
                <div className="mj-app-list">
                  {apps.map(a => (
                    <div className="mj-app-card" key={a.id}>
                      <div className="mj-app-left">
                        <div className="mj-app-name">{a.studentName}</div>
                        <div className="mj-app-email">{a.studentEmail} • {a.studentPhone}</div>
                        <div className="mj-app-date">Applied: {new Date(a.appliedAt).toLocaleDateString()}</div>
                      </div>
                      <div className="mj-app-right">
                        <div className="mj-app-status-badge">{a.status}</div>
                        <div className="mj-app-controls">
                          <button onClick={() => updateAppStatus(a.id, 'SHORTLISTED')} className="mj-btn-shortlist">Shortlist</button>
                          <button onClick={() => updateAppStatus(a.id, 'SELECTED')} className="mj-btn-select">Select</button>
                          <button onClick={() => updateAppStatus(a.id, 'REJECTED')} className="mj-btn-reject">Reject</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
