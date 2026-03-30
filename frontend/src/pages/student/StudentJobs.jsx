import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import './StudentJobs.css';

export default function StudentJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [applying, setApplying] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/jobs');
      setJobs(res.data || []);
    } catch (err) {
      console.error('Failed to load jobs:', err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const applyToJob = async (jobId) => {
    setApplying(jobId);
    setMsg(null);
    try {
      await api.post(`/student/jobs/${jobId}/apply`);
      setMsg({ type: 'ok', text: '✅ Application submitted successfully!' });
      loadJobs();
    } catch (err) {
      const errMsg = err?.response?.data?.message || 'Application failed. Please try again.';
      setMsg({ type: 'err', text: `❌ ${errMsg}` });
    } finally {
      setApplying(null);
    }
  };

  const types = ['ALL', 'FULL_TIME', 'PART_TIME'];
  const filtered = jobs.filter(j => {
    const matchSearch = j.title?.toLowerCase().includes(search.toLowerCase()) ||
                        j.company?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || j.jobType === filter;
    return matchSearch && matchFilter;
  });

  const getDeadlineStatus = (deadline) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: 'Expired', cls: 'badge-expired' };
    if (days <= 3) return { label: `${days}d left`, cls: 'badge-urgent' };
    return { label: `${days} days left`, cls: 'badge-good' };
  };

  return (
    <div className="sjobs-page">
      {/* Header */}
      <div className="sjobs-header">
        <div className="sjobs-header-left">
          <div className="sjobs-icon">💼</div>
          <div>
            <h1 className="sjobs-title">Job Board</h1>
            <p className="sjobs-sub">Explore active job opportunities matched to your profile</p>
          </div>
        </div>
        <div className="sjobs-stats-pill">{jobs.length} Active Listings</div>
      </div>

      {/* Filters */}
      <div className="sjobs-filters">
        <div className="sjobs-search-wrap">
          <span className="sjobs-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search job title or company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="sjobs-search"
          />
        </div>
        <div className="sjobs-type-filters">
          {types.map(t => (
            <button
              key={t}
              className={`sjobs-filter-btn ${filter === t ? 'active' : ''}`}
              onClick={() => setFilter(t)}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <div className={`sjobs-msg ${msg.type === 'ok' ? 'sjobs-msg--ok' : 'sjobs-msg--err'}`}>
          {msg.text}
        </div>
      )}

      {/* Job Cards */}
      {loading ? (
        <div className="sjobs-loading">Loading jobs...</div>
      ) : filtered.length === 0 ? (
        <div className="sjobs-empty">
          <div className="sjobs-empty-icon">🔎</div>
          <h3>No jobs found</h3>
          <p>Check back later or adjust your search filters.</p>
        </div>
      ) : (
        <div className="sjobs-grid">
          {filtered.map(job => {
            const dl = getDeadlineStatus(job.applyDeadline);
            return (
              <div className="sjobs-card" key={job.id}>
                <div className="sjobs-card-top">
                  <div className="sjobs-company-logo">{job.company?.charAt(0).toUpperCase()}</div>
                  <div className="sjobs-card-meta">
                    <h3 className="sjobs-card-title">{job.title}</h3>
                    <span className="sjobs-company">{job.company}</span>
                  </div>
                  {dl && <span className={`sjobs-deadline-badge ${dl.cls}`}>{dl.label}</span>}
                </div>

                <div className="sjobs-card-details">
                  {job.location && <span className="sjobs-detail">📍 {job.location}</span>}
                  {job.salaryRange && <span className="sjobs-detail">💰 {job.salaryRange}</span>}
                  {job.jobType && <span className="sjobs-detail">🕒 {job.jobType.replace('_', ' ')}</span>}
                </div>

                {job.skillsNeeded && (
                  <div className="sjobs-skills">
                    {job.skillsNeeded.split(',').slice(0, 4).map((s, i) => (
                      <span key={i} className="skill-chip">{s.trim()}</span>
                    ))}
                  </div>
                )}

                {job.description && (
                  <p className="sjobs-desc">{job.description.slice(0, 130)}...</p>
                )}

                <div className="sjobs-card-footer">
                  <span className={`sjobs-type-badge ${job.jobType === 'FULL_TIME' ? 'badge-fulltime' : 'badge-parttime'}`}>
                    {job.jobType?.replace('_', ' ') || 'Full Time'}
                  </span>
                  <button
                    className="sjobs-apply-btn"
                    onClick={() => applyToJob(job.id)}
                    disabled={applying === job.id || job.alreadyApplied}
                  >
                    {job.alreadyApplied ? '✓ Applied' : applying === job.id ? 'Applying...' : 'Apply Now →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
