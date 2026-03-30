import { useState } from 'react';
import api from '../../api/axiosConfig';
import './PostJob.css';
import { FaBriefcase, FaBuilding, FaMapMarkerAlt, FaGlobe, FaMoneyBillWave, FaCalendarAlt, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

export default function PostJob() {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    requirements: '',
    skillsNeeded: '',
    salaryRange: '',
    jobType: 'FULL_TIME',
    stipend: '',
    applyDeadline: ''
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      await api.post('/admin/jobs', formData);
      setMsg({ type: 'success', text: 'Career opportunity posted successfully!' });
      setFormData({
        title: '', company: '', location: '', description: '',
        requirements: '', skillsNeeded: '', salaryRange: '',
        jobType: 'FULL_TIME', stipend: '', applyDeadline: ''
      });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to post opportunity.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pj-page">
      <div className="pj-header">
        <div className="pj-header-title">
          <FaGlobe size={28} />
          <div>
            <h1>Post Career Opportunity</h1>
            <p>Publish a job or internship to the global student network.</p>
          </div>
        </div>
      </div>

      <div className="pj-card">
        {msg && (
          <div className={`pj-msg ${msg.type}`}>
            {msg.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />} {msg.text}
          </div>
        )}
        <form onSubmit={handleSubmit} className="pj-form">
          
          <div className="pj-section">
            <h3 className="pj-sec-title">Core Information</h3>
            <div className="pj-grid">
              <div className="pj-group">
                <label><FaBriefcase /> Position Title</label>
                <input required type="text" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} placeholder="e.g. Software Engineer Junior" />
              </div>
              <div className="pj-group">
                <label><FaBuilding /> Company Name</label>
                <input required type="text" value={formData.company} onChange={e=>setFormData({...formData, company: e.target.value})} placeholder="e.g. TechCorp Inc." />
              </div>
              <div className="pj-group">
                <label><FaMapMarkerAlt /> Location</label>
                <input type="text" value={formData.location} onChange={e=>setFormData({...formData, location: e.target.value})} placeholder="Remote, or City, State" />
              </div>
              <div className="pj-group">
                <label>Job Type</label>
                <select value={formData.jobType} onChange={e=>setFormData({...formData, jobType: e.target.value})}>
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="INTERNSHIP">Internship</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pj-section">
            <h3 className="pj-sec-title">Compensation & Timing</h3>
            <div className="pj-grid">
              {formData.jobType === 'INTERNSHIP' ? (
                <div className="pj-group">
                  <label><FaMoneyBillWave /> Stipend (if any)</label>
                  <input type="text" value={formData.stipend} onChange={e=>setFormData({...formData, stipend: e.target.value})} placeholder="e.g. 10k/month or Unpaid" />
                </div>
              ) : (
                <div className="pj-group">
                  <label><FaMoneyBillWave /> Salary Range</label>
                  <input type="text" value={formData.salaryRange} onChange={e=>setFormData({...formData, salaryRange: e.target.value})} placeholder="e.g. 4LPA - 8LPA" />
                </div>
              )}
              <div className="pj-group">
                <label><FaCalendarAlt /> Apply Deadline</label>
                <input required type="date" value={formData.applyDeadline} onChange={e=>setFormData({...formData, applyDeadline: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="pj-section">
            <h3 className="pj-sec-title">Description & Requirements</h3>
            <div className="pj-group full">
              <label>Skills Needed (comma separated)</label>
              <input type="text" value={formData.skillsNeeded} onChange={e=>setFormData({...formData, skillsNeeded: e.target.value})} placeholder="React, Java, Spring Boot, MySQL" />
            </div>
            <div className="pj-group full">
              <label>Job Description</label>
              <textarea required rows="4" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} placeholder="Describe the role responsibilities..."></textarea>
            </div>
            <div className="pj-group full">
              <label>Requirements</label>
              <textarea rows="3" value={formData.requirements} onChange={e=>setFormData({...formData, requirements: e.target.value})} placeholder="Education, years of experience, etc..."></textarea>
            </div>
          </div>

          <div className="pj-actions">
            <button type="submit" disabled={loading} className="pj-btn-submit">
              {loading ? 'Publishing...' : 'Publish Opportunity'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
