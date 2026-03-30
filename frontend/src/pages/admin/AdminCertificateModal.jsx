import React, { useState, useEffect } from 'react';
import { FaTimes, FaCloudUploadAlt, FaAward, FaTrash, FaFilePdf } from 'react-icons/fa';
import api from '../../api/axiosConfig';
import './AdminCertificateModal.css';

const AdminCertificateModal = ({ student, courses, onClose }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedCourse, setSelectedCourse] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [visibleDate, setVisibleDate] = useState('');
  const [visibleTime, setVisibleTime] = useState('');
  
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (student) {
      fetchCertificates();
      
      const tempOptions = [];
      if (student.courses) student.courses.forEach(c => tempOptions.push(c.courseName));
      if (courses) {
        courses.forEach(c => {
          if (!tempOptions.includes(c.courseName)) tempOptions.push(c.courseName);
        });
      }
      
      if (tempOptions.length === 1) {
        setSelectedCourse(tempOptions[0]);
      } else {
        setSelectedCourse('');
      }
      
      const now = new Date();
      setVisibleDate(now.toISOString().split('T')[0]);
      setVisibleTime(now.toTimeString().slice(0, 5));
    }
  }, [student, courses]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/certificates/${student.studentId}`);
      setCertificates(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedCourse || !file || !issueDate || !visibleDate || !visibleTime) {
      setError('Please fill all fields and select a valid PDF.');
      return;
    }
    
    // ISO format for backend: YYYY-MM-DDTHH:mm:ss
    const visibleFromStr = `${visibleDate}T${visibleTime}:00`;
    
    const formData = new FormData();
    formData.append('studentId', student.studentId);
    formData.append('courseName', selectedCourse);
    formData.append('issueDate', issueDate);
    formData.append('visibleFrom', visibleFromStr);
    formData.append('file', file);
    
    try {
      setUploading(true);
      setError('');
      await api.post('/admin/certificates/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFile(null);
      document.getElementById('certFileInput').value = '';
      fetchCertificates();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (certId) => {
    if (!window.confirm('Are you sure you want to revoke and delete this certificate?')) return;
    try {
      await api.delete(`/admin/certificates/${certId}`);
      fetchCertificates();
    } catch (err) {
      setError('Failed to delete certificate');
    }
  };

  // Combine global courses and student enrolled courses to create a unique list without duplicates
  const courseOptions = [];
  if (student && student.courses) {
    student.courses.forEach(c => courseOptions.push(c.courseName));
  }
  if (courses) {
    courses.forEach(c => {
      if (!courseOptions.includes(c.courseName)) {
        courseOptions.push(c.courseName);
      }
    });
  }

  if (!student) return null;

  return (
    <div className="cert-modal-overlay" onClick={onClose}>
      <div className="cert-modal" onClick={e => e.stopPropagation()}>
        <div className="cert-modal__header">
          <div className="cert-modal__title">
            <div className="cert-modal-icon"><FaAward /></div>
            <div>
              <h3>Issue Certificate</h3>
              <p>{student.studentName} ({student.formattedId})</p>
            </div>
          </div>
          <button className="cert-modal__close" onClick={onClose}><FaTimes/></button>
        </div>

        <div className="cert-modal__body">
          {error && <div className="cert-alert cert-alert--error">{error}</div>}
          
          {courseOptions.length === 0 ? (
            <div className="cert-alert cert-alert--error">
              <strong>Action Blocked:</strong> This student is not mapped to any course yet. Please enroll them in a course before issuing a certificate.
            </div>
          ) : (
            <form className="cert-upload-form" onSubmit={handleUpload}>
              <div className="cert-form-row">
                <div className="cert-form-group">
                  <label>Course Name</label>
                  {courseOptions.length === 1 ? (
                    <div className="cert-read-only-field">
                      <strong>{courseOptions[0]}</strong> <span className="cert-badge-auto">Auto-selected</span>
                    </div>
                  ) : (
                    <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
                      <option value="">-- Select Course --</option>
                      {courseOptions.map((cName, idx) => (
                        <option key={idx} value={cName}>{cName}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="cert-form-group">
                  <label>Issue Date</label>
                  <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                </div>
              </div>
              
              <div className="cert-form-row">
                <div className="cert-form-group">
                  <label>Visible to Student From (Date)</label>
                  <input type="date" value={visibleDate} onChange={(e) => setVisibleDate(e.target.value)} />
                </div>
                <div className="cert-form-group">
                  <label>Time</label>
                  <input type="time" value={visibleTime} onChange={(e) => setVisibleTime(e.target.value)} />
                </div>
              </div>
              
              <div className="cert-form-group">
                <label>Certificate Document (PDF)</label>
                <div className="cert-file-drop">
                  <input 
                    id="certFileInput"
                    type="file" 
                    accept="application/pdf" 
                    onChange={(e) => setFile(e.target.files[0])} 
                  />
                </div>
              </div>
              
              <button type="submit" className="cert-btn-primary" disabled={uploading}>
                {uploading ? 'Uploading...' : <><FaCloudUploadAlt /> Upload & Issue Certificate</>}
              </button>
            </form>
          )}

          <div className="cert-divider"></div>

          <div className="cert-list-section">
            <h4 className="cert-list-title">Issued Certificates</h4>
            {loading ? <div className="cert-loading">Loading certificates...</div> : (
              certificates.length === 0 ? (
                <div className="cert-empty">
                  <FaFilePdf className="cert-empty-icon" />
                  <p>No certificates issued to this student yet.</p>
                </div>
              ) : (
                <div className="cert-list">
                  {certificates.map(cert => (
                    <div key={cert.id} className="cert-item">
                      <div className="cert-item__avatar">
                        <FaFilePdf />
                      </div>
                      <div className="cert-item__info">
                        <strong>{cert.courseName}</strong>
                        <span>Issued: {cert.issueDate}</span>
                      </div>
                      <div className="cert-item__actions">
                        <button className="cert-btn-icon btn-del" onClick={() => handleDelete(cert.id)} title="Revoke Certificate">
                          <FaTrash/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCertificateModal;
