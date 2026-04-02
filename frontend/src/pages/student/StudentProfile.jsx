import { useState, useEffect } from "react";
import { FaUser, FaGraduationCap, FaFileUpload, FaCheckCircle, FaExternalLinkAlt, FaLock, FaWhatsapp, FaHome, FaUsers } from "react-icons/fa";
import api from "../../api/axiosConfig";
import "./StudentProfile.css";

function StudentProfile() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({
    aadhar: false, resume: false, marks10: false, marks12: false, grad: false, profile: false
  });
  const [toast, setToast] = useState({ type: "", text: "" });

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userEmail = storedUser?.email || "";

  const [student, setStudent] = useState({
    name: "", email: userEmail, phone: "", gender: "",
    qualification: "", yearOfPassing: "", aggregatePercentage: "",
    marks10th: "", marks12th: "", 
    parentName: "", parentPhone: "",
    skills: "", bio: "", profilePic: "", 
    aadharCardUrl: "", resumeUrl: "", marks10thUrl: "", marks12thUrl: "", graduationDocUrl: "",
    address: "", city: "", state: "", pincode: "", studentId: ""
  });

  useEffect(() => {
    if (!userEmail) { setLoading(false); return; }
    fetchProfile();
  }, [userEmail]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/student/profile/${userEmail}`);
      if (res.data) setStudent(res.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
      showToast("error", "Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: "", text: "" }), 3500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Phone validation for both student and parent
    if (name === "phone" || name === "parentPhone") {
      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      setStudent({ ...student, [name]: numericValue });
    } else {
      setStudent({ ...student, [name]: value });
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "File must be under 5 MB.");
      return;
    }

    setUploading(prev => ({ ...prev, [type]: true }));
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    formData.append("email", userEmail);

    try {
      const res = await api.post("/student/upload-document", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      const { url } = res.data;
      const fieldMap = {
        aadhar: "aadharCardUrl",
        resume: "resumeUrl",
        marks10: "marks10thUrl",
        marks12: "marks12thUrl",
        grad: "graduationDocUrl",
        profile: "profilePic"
      };

      setStudent(prev => ({ ...prev, [fieldMap[type]]: url }));
      showToast("success", `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully! ☁️`);
    } catch (err) {
      console.error("Upload error:", err);
      showToast("error", "Upload failed. Check Cloudinary settings.");
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/student/update-profile", student);
      showToast("success", "Profile Hub updated! ✅");
    } catch (err) {
      showToast("error", "Update failed — please try again ❌");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="sp-loader">
      <div className="sp-spinner" />
      <p>Building your profile hub…</p>
    </div>
  );

  return (
    <div className="sp-page">
      {toast.text && <div className={`sp-toast sp-toast--${toast.type}`}>{toast.text}</div>}

      <div className="sp-container">
        {/* Header Summary */}
        <div className="sp-header-card">
          <div className="sp-profile-summary">
            <div className="sp-avatar-section">
              <div className="sp-avatar-main">
                {uploading.profile ? (
                   <div className="sp-avatar-loading"><div className="sp-inner-spinner" /></div>
                ) : (
                   <img src={student.profilePic || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="Profile" />
                )}
                <label className="sp-avatar-edit">
                  <input type="file" onChange={(e) => handleFileUpload(e, "profile")} hidden />
                  📷
                </label>
              </div>
            </div>
            <div className="sp-user-meta">
              <h2 className="premium-text-gradient">{student.name || "Student Name"}</h2>
              <div className="sp-id-badge"><span className="id-tag">ID</span> {student.studentId || "---"}</div>
              <p className="sp-email-tag">{student.email} <FaCheckCircle size={12} color="#10b981" /></p>
            </div>
          </div>

          <div className="sp-stepper">
            <div className={`sp-step ${step === 1 ? "active" : "completed"}`} onClick={() => setStep(1)}>
              <span className="step-num">{step > 1 ? <FaCheckCircle /> : "1"}</span>
              <span className="step-label">Personal & Academic</span>
            </div>
            <div className="step-line" />
            <div className={`sp-step ${step === 2 ? "active" : ""}`} onClick={() => setStep(2)}>
              <span className="step-num">2</span>
              <span className="step-label">Document Vault</span>
            </div>
          </div>
        </div>

        {/* Step 1: Identity & Academic Hub */}
        {step === 1 && (
          <div className="sp-form-layout anim-slide-up">
            
            {/* 1.1 Personal & Family */}
            <div className="sp-card section-card">
              <div className="card-header">
                <div className="header-icon-box blue-bg"><FaUsers /></div>
                <h3>Personal & Family Details</h3>
              </div>
              <div className="card-body">
                <div className="sp-grid">
                  <div className="sp-input-group">
                    <label>Full Name</label>
                    <input type="text" name="name" value={student.name} onChange={handleChange} placeholder="Enter full name" />
                  </div>
                  <div className="sp-input-group readonly">
                    <label>Official Email <FaLock size={10} /></label>
                    <input type="text" value={student.email} readOnly />
                  </div>
                  <div className="sp-input-group">
                    <label><FaWhatsapp /> WhatsApp Number</label>
                    <input type="text" name="phone" value={student.phone} onChange={handleChange} placeholder="10-digit number" />
                  </div>
                  <div className="sp-input-group">
                    <label>Parent / Guardian Name</label>
                    <input type="text" name="parentName" value={student.parentName} onChange={handleChange} placeholder="Enter parent name" />
                  </div>
                  <div className="sp-input-group">
                    <label>Parent Contact Number</label>
                    <input type="text" name="parentPhone" value={student.parentPhone} onChange={handleChange} placeholder="10-digit parent number" />
                  </div>
                </div>
              </div>
            </div>

            {/* 1.2 Residential Address */}
            <div className="sp-card section-card">
              <div className="card-header">
                <div className="header-icon-box amber-bg"><FaHome /></div>
                <h3>Residential Address</h3>
              </div>
              <div className="card-body">
                <div className="sp-grid">
                  <div className="sp-input-group full-width">
                    <label>Street Address / Area</label>
                    <input type="text" name="address" value={student.address} onChange={handleChange} placeholder="House no, Building, Street..." />
                  </div>
                  <div className="sp-input-group">
                    <label>City</label>
                    <input type="text" name="city" value={student.city} onChange={handleChange} placeholder="e.g. Bangalore" />
                  </div>
                  <div className="sp-input-group">
                    <label>State</label>
                    <input type="text" name="state" value={student.state} onChange={handleChange} placeholder="e.g. Karnataka" />
                  </div>
                  <div className="sp-input-group">
                    <label>Pincode</label>
                    <input type="text" name="pincode" value={student.pincode} onChange={handleChange} placeholder="6-digit code" />
                  </div>
                </div>
              </div>
            </div>

            {/* 1.3 Academic Journey */}
            <div className="sp-card section-card">
              <div className="card-header">
                <div className="header-icon-box green-bg"><FaGraduationCap /></div>
                <h3>Academic Journey</h3>
              </div>
              <div className="card-body">
                <div className="sp-grid">
                  <div className="sp-input-group">
                    <label>Highest Qualification</label>
                    <input type="text" name="qualification" value={student.qualification} onChange={handleChange} placeholder="e.g. BE, B.Tech, MCA" />
                  </div>
                  <div className="sp-input-group">
                    <label>Graduation Year & %</label>
                    <div className="sp-inline-inputs">
                      <input type="text" name="yearOfPassing" value={student.yearOfPassing} onChange={handleChange} placeholder="Year" />
                      <input type="text" name="aggregatePercentage" value={student.aggregatePercentage} onChange={handleChange} placeholder="Perc%" />
                    </div>
                  </div>
                  <div className="sp-input-group">
                    <label>12th / PUC Marks (%)</label>
                    <input type="text" name="marks12th" value={student.marks12th} onChange={handleChange} placeholder="e.g. 88%" />
                  </div>
                  <div className="sp-input-group">
                    <label>10th / SSLC Marks (%)</label>
                    <input type="text" name="marks10th" value={student.marks10th} onChange={handleChange} placeholder="e.g. 92%" />
                  </div>
                </div>
              </div>
            </div>

            <div className="sp-footer-actions">
              <button className="btn-next" onClick={() => setStep(2)}>Next: Documentation <span className="btn-icon">→</span></button>
            </div>
          </div>
        )}

        {/* Step 2: Documents */}
        {step === 2 && (
          <div className="sp-card anim-slide-up">
            <div className="card-header">
              <div className="header-icon-box purple-bg"><FaFileUpload /></div>
              <h3>Cloudinary Document Vault</h3>
            </div>
            <div className="card-body">
              <div className="doc-grid">
                <DocItem label="Aadhar Card" url={student.aadharCardUrl} loading={uploading.aadhar} onUpload={(e) => handleFileUpload(e, "aadhar")} />
                <DocItem label="Professional Resume" url={student.resumeUrl} loading={uploading.resume} onUpload={(e) => handleFileUpload(e, "resume")} />
                <DocItem label="10th Marks Card" url={student.marks10thUrl} loading={uploading.marks10} onUpload={(e) => handleFileUpload(e, "marks10")} />
                <DocItem label="12th Marks Card" url={student.marks12thUrl} loading={uploading.marks12} onUpload={(e) => handleFileUpload(e, "marks12")} />
                <DocItem label="Graduation Cert." url={student.graduationDocUrl} loading={uploading.grad} onUpload={(e) => handleFileUpload(e, "grad")} />
              </div>
              <div className="sp-footer-actions">
                <button className="btn-back" onClick={() => setStep(1)}>← Previous</button>
                <button className="btn-save" onClick={handleSave} disabled={saving}>
                  {saving ? <div className="sp-btn-spinner" /> : "💾 Update & Sync Profile Hub"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DocItem({ label, url, loading, onUpload }) {
  return (
    <div className={`doc-item ${url ? "has-file" : ""}`}>
      <div className="doc-info">
        <span className="doc-label">{label}</span>
        {url && <span className="doc-status"><FaCheckCircle /> Saved</span>}
      </div>
      <div className="doc-action-zone">
        {loading ? (
          <div className="doc-spinner" />
        ) : url ? (
          <div className="doc-actions-row">
            <a href={url} target="_blank" rel="noreferrer" className="btn-view-doc"><FaExternalLinkAlt /> View</a>
            <label className="btn-replace-doc">
              <input type="file" onChange={onUpload} hidden />
              Replace
            </label>
          </div>
        ) : (
          <label className="btn-upload-doc">
            <input type="file" onChange={onUpload} hidden />
            <FaFileUpload /> Upload to Cloud
          </label>
        )}
      </div>
    </div>
  );
}

export default StudentProfile;
