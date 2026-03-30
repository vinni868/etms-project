import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import './StudentJobs.css';

export default function StudentInternships() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [applying, setApplying] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => { loadInternships(); }, []);

  const loadInternships = async () => {
    try {
      setLoading(true);
      // Filter jobs where jobType === INTERNSHIP
      const res = await api.get('/student/jobs');
      const all = res.data || [];
      setInternships(all.filter(j => j.jobType === 'INTERNSHIP'));
    } catch (err) {
      console.error('Failed to load internships:', err);
      setInternships([]);
    } finally {
      setLoading(false);
    }
  };

  const applyToInternship = async (id) => {
    setApplying(id);
    setMsg(null);
    try {
      await api.post(`/student/jobs/${id}/apply`);
      setMsg({ type: 'ok', text: '✅ Application submitted successfully!' });
      loadInternships();
    } catch (err) {
      const errMsg = err?.response?.data?.message || 'Application failed. Please try again.';
      setMsg({ type: 'err', text: `❌ ${errMsg}` });
    } finally {
      setApplying(null);
    }
  };

  const getDeadlineStatus = (deadline) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: 'Expired', cls: 'badge-expired' };
    if (days <= 3) return { label: `${days}d left`, cls: 'badge-urgent' };
    return { label: `${days} days left`, cls: 'badge-good' };
  };

  const filtered = internships.filter(j =>
    j.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="sjobs-page">
      {/* Header */}
      <div className="sjobs-header">
        <div className="sjobs-header-left">
          <div className="sjobs-icon">🎓</div>
          <div>
            <h1 className="sjobs-title">Internship Board</h1>
            <p className="sjobs-sub">Kickstart your career with hands-on internship opportunities</p>
          </div>
        </div>
        <div className="sjobs-stats-pill">{internships.length} Internships Available</div>
      </div>

      {/* Search */}
      <div className="sjobs-filters">
        <div className="sjobs-search-wrap">
          <span className="sjobs-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search internship or company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="sjobs-search"
          />
        </div>
      </div>

      {msg && (
        <div className={`sjobs-msg ${msg.type === 'ok' ? 'sjobs-msg--ok' : 'sjobs-msg--err'}`}>
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="sjobs-loading">Loading internships...</div>
      ) : filtered.length === 0 ? (
        <div className="sjobs-empty">
          <div className="sjobs-empty-icon">🎓</div>
          <h3>No internships available</h3>
          <p>Check back later or explore our Job Board for full-time opportunities.</p>
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
                  {job.stipend && <span className="sjobs-detail">💰 Stipend: {job.stipend}</span>}
                  {job.salaryRange && !job.stipend && <span className="sjobs-detail">💰 {job.salaryRange}</span>}
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
                  <span className="sjobs-type-badge badge-parttime">Internship</span>
                  <button
                    className="sjobs-apply-btn"
                    onClick={() => applyToInternship(job.id)}
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
