import { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import "../superadmin/CreateUser.css";
import {
  FaUserPlus, FaIdCard,
  FaLock, FaEnvelope, FaPhone, FaCheckCircle, FaTimesCircle,
  FaEye, FaEyeSlash
} from "react-icons/fa";

/* Role config (Admin can only create these) */
const ROLES = [
  {
    value: "STUDENT",
    label: "Student",
    desc: "Learning access",
    icon: "🎓",
    color: "blue",
  },
  {
    value: "TRAINER",
    label: "Trainer",
    desc: "Instructive access (Needs Super Admin Approval)",
    icon: "👨‍🏫",
    color: "green",
  },
  {
    value: "MARKETER",
    label: "Marketer",
    desc: "Expansion access (Needs Super Admin Approval)",
    icon: "📣",
    color: "orange",
  },
  {
    value: "COUNSELOR",
    label: "Counselor",
    desc: "Student well-being (Needs Super Admin Approval)",
    icon: "❤️",
    color: "pink",
  },
];

export default function CreateUser() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    roleName: "STUDENT",
    studentId: "",
    courseId: "",
    courseMode: "OFFLINE",
  });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [message, setMessage]     = useState({ type: "", text: "" });
  const [showPass, setShowPass]   = useState(false);
  const [touched, setTouched]     = useState({});

  useEffect(() => {
    fetchCourses();
    handleRoleSelect("STUDENT"); // Initial ID preview
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get("/admin/courses");
      setCourses(res.data || []);
    } catch (err) { console.error("Failed to fetch courses", err); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Strict numeric-only and 10-digit limit for phone
    if (name === "phone") {
      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      setFormData({ ...formData, phone: numericValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    setMessage({ type: "", text: "" });
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const handleRoleSelect = async (role, cId = "") => {
    const cidToUse = cId || formData.courseId;
    setFormData(prev => ({ ...prev, roleName: role, studentId: "" }));
    try {
      let url = `/superadmin/users/get-next-id?role=${role}`;
      if (role === "STUDENT" && cidToUse) {
        url += `&courseId=${cidToUse}`;
      }
      const res = await api.get(url);
      if (res.data?.nextId) {
        setFormData(prev => ({ ...prev, roleName: role, studentId: res.data.nextId }));
      }
    } catch (err) {
      console.error(`Failed to fetch next ${role} ID:`, err);
    }
  };

  const handleCourseChange = (e) => {
    const cid = e.target.value;
    setFormData(prev => ({ ...prev, courseId: cid }));
    if (formData.roleName === "STUDENT") {
      handleRoleSelect("STUDENT", cid);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (formData.roleName === "STUDENT" && !formData.courseId) {
      setMessage({ type: "error", text: "Please select an assigned course for the student." });
      setLoading(false);
      return;
    }
    setMessage({ type: "", text: "" });
    try {
      // Send both roleName and role to support cached backend jars/classes
      const payload = { ...formData, role: formData.roleName };
      const res = await api.post("/admin/users/create", payload);
      setMessage({
        type: "success",
        text: res.data.message || (formData.roleName === "STUDENT" 
          ? `Student account created successfully! It is now pending approval.`
          : `${ROLES.find(r => r.value === formData.roleName)?.label} account created! Note: This role requires Super Admin approval specifically.`),
      });
      setFormData({ name: "", email: "", password: "", phone: "", roleName: "STUDENT", studentId: "", courseId: "", courseMode: "OFFLINE" });
      setTouched({});
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to create user. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = ROLES.find((r) => r.value === formData.roleName);

  /* Simple field validation */
  const errors = {
    name:     touched.name     && !formData.name.trim()   ? "Name is required" : "",
    email:    touched.email    && !/\S+@\S+\.\S+/.test(formData.email) ? "Valid email required" : "",
    phone:    touched.phone    && !/^\d{10}$/.test(formData.phone) ? "Exactly 10 digits required" : "",
    password: touched.password && formData.password.length < 8 ? "Min 8 characters" : "",
  };

  return (
    <div className="cu-page">
      <div className="cu-wrapper">

        {/* ── LEFT PANEL ── */}
        <div className="cu-side">
          <div className="cu-side-brand">
            <span className="cu-side-et">Et</span><span className="cu-side-ms">MS</span>
          </div>
          <h2 className="cu-side-title">Provision New User</h2>
          <p className="cu-side-desc">
            Register students, trainers, or marketers to the EtMS platform. Note: Users created by Admins require Super Admin approval before activation.
          </p>

          {/* Role Preview */}
          <div className="cu-side-role-preview">
            <div className={`cu-srp-icon ${selectedRole?.color}`}>{selectedRole?.icon}</div>
            <div className="cu-srp-info">
              <span className="cu-srp-label">Selected Role</span>
              <span className="cu-srp-name">{selectedRole?.label}</span>
              <span className="cu-srp-desc">{selectedRole?.desc}</span>
            </div>
          </div>

          <div className="cu-side-stats">
            <div className="cu-ss-item">
              <span className="cu-ss-val">3</span>
              <span className="cu-ss-lbl">Role Types</span>
            </div>
            <div className="cu-ss-divider" />
            <div className="cu-ss-item">
              <span className="cu-ss-val">⏳</span>
              <span className="cu-ss-lbl">Pending Approval</span>
            </div>
          </div>
        </div>

        {/* ── FORM PANEL ── */}
        <div className="cu-form-panel">

          {/* Header */}
          <div className="cu-form-header">
            <div className="cu-form-header-icon">
              <FaUserPlus />
            </div>
            <div>
              <h1 className="cu-form-title">Create User</h1>
              <p className="cu-form-subtitle">Fill in the details below to provision a new account.</p>
            </div>
          </div>

          {/* Alert */}
          {message.text && (
            <div className={`cu-alert cu-alert--${message.type}`}>
              {message.type === "success"
                ? <FaCheckCircle className="cu-alert-icon" />
                : <FaTimesCircle className="cu-alert-icon" />
              }
              <span>{message.text}</span>
            </div>
          )}

          <form className="cu-form" onSubmit={handleSubmit} noValidate>

            {/* Role Selector */}
            <div className="cu-section-label">Select Role</div>
            <div className="cu-role-grid">
              {ROLES.map((role) => (
                <button
                  type="button"
                  key={role.value}
                  className={`cu-role-card ${formData.roleName === role.value ? "selected" : ""} ${role.color}`}
                  onClick={() => handleRoleSelect(role.value)}
                >
                  <span className="cu-rc-icon">{role.icon}</span>
                  <span className="cu-rc-label">{role.label}</span>
                  <span className="cu-rc-desc">{role.desc}</span>
                  {formData.roleName === role.value && (
                    <span className="cu-rc-check">✓</span>
                  )}
                </button>
              ))}
            </div>

            {/* Course Selector for Students - context for ID generation */}
            {formData.roleName === "STUDENT" && (
              <>
                <div className="cu-field" style={{marginBottom: '2rem', animation: 'fadeIn 0.4s ease'}}>
                  <label className="cu-label" style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', fontWeight: '600'}}>
                     Assigned Course (Required for ID Prefix)
                  </label>
                  <div className="cu-select-wrap">
                    <select 
                      name="courseId" 
                      value={formData.courseId} 
                      onChange={handleCourseChange}
                      className="cu-input"
                      style={{
                        width: '100%', 
                        padding: '0.8rem 1rem', 
                        borderRadius: '12px', 
                        border: '2px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        fontSize: '0.95rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">-- Select Course --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.courseName} ({c.shortcut || 'No Shortcut'})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Course Mode Selector */}
                <div className="cu-field" style={{marginBottom: '2rem', animation: 'fadeIn 0.4s ease'}}>
                  <label className="cu-label" style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', fontWeight: '600'}}>
                     Course Mode
                  </label>
                  <div className="cu-select-wrap">
                    <select 
                      name="courseMode" 
                      value={formData.courseMode} 
                      onChange={handleChange}
                      className="cu-input"
                      style={{
                        width: '100%', 
                        padding: '0.8rem 1rem', 
                        borderRadius: '12px', 
                        border: '2px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        fontSize: '0.95rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="OFFLINE">Offline</option>
                      <option value="ONLINE">Online</option>
                      <option value="HYBRID">Hybrid</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Full Name */}
            <div className="cu-section-label">Account Details</div>
            <div className="cu-field-row two">

              <div className={`cu-field ${errors.name ? "has-error" : touched.name && formData.name ? "has-success" : ""}`}>
                <label className="cu-label">
                  <FaIdCard className="cu-label-icon" /> Full Name
                </label>
                <div className="cu-input-wrap">
                  <input
                    name="name"
                    type="text"
                    placeholder="e.g. Vinayaka Reddy"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    autoComplete="off"
                  />
                  {touched.name && formData.name && <span className="cu-valid-ic">✓</span>}
                </div>
                {errors.name && <span className="cu-error-msg">{errors.name}</span>}
              </div>

              <div className={`cu-field ${errors.email ? "has-error" : touched.email && !errors.email && formData.email ? "has-success" : ""}`}>
                <label className="cu-label">
                  <FaEnvelope className="cu-label-icon" /> Email Address
                </label>
                <div className="cu-input-wrap">
                  <input
                    name="email"
                    type="email"
                    placeholder="user@institution.com"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    autoComplete="off"
                  />
                  {touched.email && !errors.email && formData.email && (
                    <span className="cu-valid-ic">✓</span>
                  )}
                </div>
                {errors.email && <span className="cu-error-msg">{errors.email}</span>}
              </div>

            </div>

            <div className="cu-field">
              <label className="cu-label">
                <FaIdCard className="cu-label-icon" /> {formData.roleName === "STUDENT" ? "Student ID" : "Portal / System ID"}
                <span className="cu-optional">Automatic if empty</span>
              </label>
              <div className="cu-input-wrap">
                <input
                  name="studentId"
                  type="text"
                  placeholder={formData.roleName === "STUDENT" ? "e.g. ETMS-ST-2024-0001" : "e.g. TRN-2024-0001"}
                  value={formData.studentId}
                  onChange={handleChange}
                  autoComplete="off"
                />
              </div>
              <p className="cu-field-note" style={{fontSize: '0.8rem', color: '#64748b', marginTop: '4px'}}>
                Leave empty to auto-generate based on configuration.
              </p>
            </div>

            <div className="cu-field-row two">

              <div className={`cu-field ${errors.password ? "has-error" : touched.password && !errors.password && formData.password ? "has-success" : ""}`}>
                <label className="cu-label">
                  <FaLock className="cu-label-icon" /> Password
                </label>
                <div className="cu-input-wrap">
                  <input
                    name="password"
                    type={showPass ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  />
                  <button
                    type="button"
                    className="cu-toggle-pass"
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
                  >
                    {showPass ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && <span className="cu-error-msg">{errors.password}</span>}
                {formData.password && (
                  <div className="cu-pass-strength">
                    <div className={`cu-ps-bar ${formData.password.length >= 12 ? "strong" : formData.password.length >= 8 ? "medium" : "weak"}`} />
                    <span className="cu-ps-label">
                      {formData.password.length >= 12 ? "Strong" : formData.password.length >= 8 ? "Medium" : "Weak"}
                    </span>
                  </div>
                )}
              </div>

              <div className="cu-field">
                <label className="cu-label">
                  <FaPhone className="cu-label-icon" /> Phone Number
                  <span className="cu-required" style={{color: '#ef4444', marginLeft: '4px'}}>* Mandatory</span>
                </label>
                <div className="cu-input-wrap">
                  <input
                    name="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    autoComplete="off"
                  />
                  {touched.phone && !errors.phone && formData.phone && <span className="cu-valid-ic">✓</span>}
                </div>
                {errors.phone && <span className="cu-error-msg">{errors.phone}</span>}
              </div>

            </div>

            {/* Submit */}
            <button
              type="submit"
              className={`cu-submit ${loading ? "loading" : ""}`}
              disabled={loading || (formData.phone && formData.phone.length < 10)}
            >
              {loading ? (
                <>
                  <span className="cu-spinner" />
                  Requesting Approval…
                </>
              ) : (
                <>
                  <FaUserPlus />
                  Create {selectedRole?.label}
                </>
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}