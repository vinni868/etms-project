import { useState, useEffect, useRef } from "react";
import api from "../../api/axiosConfig";
import "./StudentProfile.css";

function StudentProfile() {
  const [isEditing,  setIsEditing]  = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userEmail  = storedUser?.email || "";

  const MALE_AVATAR   = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
  const FEMALE_AVATAR = "https://cdn-icons-png.flaticon.com/512/3135/3135789.png";

  const [student, setStudent] = useState({
    name: "", email: userEmail, phone: "", gender: "",
    qualification: "", year: "", skills: "", bio: "",
    profilePic: "", address: "", city: "", state: "", pincode: ""
  });

  /* Snapshot for cancel */
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    if (!userEmail) { setLoading(false); return; }
    api.get(`/student/profile/${userEmail}`)
      .then(res => { if (res.data) setStudent(res.data); })
      .catch(err => console.error("Error fetching profile:", err))
      .finally(() => setLoading(false));
  }, [userEmail]);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: "", text: "" }), 3500);
  };

  const progress = (() => {
    const fields = [student.name, student.phone, student.gender,
                    student.qualification, student.year, student.address];
    return Math.round(fields.filter(f => f?.toString().trim()).length / fields.length * 100);
  })();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      setStudent({ ...student, phone: numericValue });
    } else {
      setStudent({ ...student, [name]: value });
    }
  };

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("error", "Image must be under 2 MB."); return; }
    const reader = new FileReader();
    reader.onloadend = () => setStudent(s => ({ ...s, profilePic: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleEdit = () => {
    setSnapshot({ ...student });
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (snapshot) setStudent(snapshot);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/student/update-profile", student);
      setIsEditing(false);
      setSnapshot(null);
      showToast("success", "Profile updated successfully ✅");
    } catch (err) {
      showToast("error", "Update failed — please try again ❌");
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = student.profilePic ||
    (student.gender === "Female" ? FEMALE_AVATAR : MALE_AVATAR);

  if (loading) return (
    <div className="sp-loader">
      <div className="sp-spinner" />
      <p>Loading profile…</p>
    </div>
  );

  return (
    <div className="sp-page">

      {/* Toast */}
      {toast.text && (
        <div className={`sp-toast sp-toast--${toast.type}`}>{toast.text}</div>
      )}

      {/* Hero header */}
      <div className="sp-hero">
        <div className="sp-hero__orb sp-hero__orb--1" />
        <div className="sp-hero__orb sp-hero__orb--2" />
        <div className="sp-hero__inner">
          <div className="sp-hero__avatar-wrap">
            <div
              className={`sp-hero__avatar-frame ${isEditing ? "sp-hero__avatar-frame--edit" : ""}`}
              onClick={() => isEditing && fileInputRef.current.click()}
              title={isEditing ? "Click to change photo" : ""}
            >
              <img src={avatarSrc} alt={student.name} className="sp-hero__avatar-img" />
              {isEditing && (
                <div className="sp-hero__avatar-overlay">
                  <span>📷 Change</span>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} hidden />
          </div>

          <div className="sp-hero__info">
            <div className="sp-hero__role-chip">🎓 Student</div>
            <h1 className="sp-hero__name">{student.name || "Your Name"}</h1>
            <div className="sp-hero__ids">
              <p className="sp-hero__email">{student.email}</p>
              {(student.portalId || student.studentId) && (
                <p className="sp-hero__student-id">ID: {student.portalId || student.studentId}</p>
              )}
            </div>
            <div className="sp-hero__meta">
              {student.qualification && <span className="sp-chip sp-chip--blue">{student.qualification}</span>}
              {student.year && <span className="sp-chip sp-chip--purple">Year {student.year}</span>}
              {student.city && <span className="sp-chip sp-chip--green">📍 {student.city}</span>}
            </div>
          </div>

          {/* Profile strength */}
          <div className="sp-hero__strength">
            <div className="sp-strength__header">
              <span>Profile Strength</span>
              <span className="sp-strength__pct">{progress}%</span>
            </div>
            <div className="sp-strength__bar">
              <div
                className="sp-strength__fill"
                style={{ width: `${progress}%`,
                  background: progress >= 80 ? "linear-gradient(90deg,#16a34a,#4ade80)"
                            : progress >= 50 ? "linear-gradient(90deg,#2563eb,#60a5fa)"
                            : "linear-gradient(90deg,#d97706,#fbbf24)"
                }}
              />
            </div>
            <p className="sp-strength__hint">
              {progress < 50 ? "Add more details to complete your profile"
               : progress < 100 ? "Almost there — fill remaining fields"
               : "Your profile is complete 🎉"}
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="sp-body">

        {/* Action bar */}
        <div className="sp-action-bar">
          <div className="sp-action-bar__left">
            <h2 className="sp-action-bar__title">
              {isEditing ? "Editing Profile" : "Profile Details"}
            </h2>
            <p className="sp-action-bar__sub">
              {isEditing ? "Make your changes and save" : "View your personal and academic information"}
            </p>
          </div>
          <div className="sp-action-bar__right">
            {!isEditing ? (
              <button className="sp-btn sp-btn--edit" onClick={handleEdit}>
                ✏️ Edit Profile
              </button>
            ) : (
              <>
                <button className="sp-btn sp-btn--cancel" onClick={handleCancel} disabled={saving}>
                  Cancel
                </button>
                <button className="sp-btn sp-btn--save" onClick={handleSave} disabled={saving}>
                  {saving ? <><span className="sp-btn-spinner" /> Saving…</> : "💾 Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Cards grid */}
        <div className="sp-cards">

          {/* Basic Information */}
          <div className="sp-card sp-card--full">
            <div className="sp-card__header">
              <div className="sp-card__icon sp-card__icon--blue">👤</div>
              <h3 className="sp-card__title">Basic Information</h3>
            </div>
            <div className="sp-card__body">
              <div className="sp-grid sp-grid--3">
                <div className="sp-field">
                  <label className="sp-label">Full Name</label>
                  <input className="sp-input" name="name" type="text"
                    value={student.name} onChange={handleChange}
                    disabled={!isEditing} placeholder="Your full name" />
                </div>
                <div className="sp-field">
                  <label className="sp-label">Email Address</label>
                  <input className="sp-input sp-input--readonly" type="email"
                    value={student.email} disabled
                    title="Email cannot be changed" />
                </div>
                {(student.portalId || student.studentId) && (
                  <div className="sp-field">
                    <label className="sp-label">System / Portal ID</label>
                    <input className="sp-input sp-input--readonly" type="text"
                      value={student.portalId || student.studentId} disabled
                      title="ID is permanent" />
                  </div>
                )}
                <div className="sp-field">
                  <label className="sp-label">Phone Number</label>
                  <input className="sp-input" name="phone" type="text"
                    value={student.phone} onChange={handleChange}
                    disabled={!isEditing} placeholder="+91 00000 00000" />
                </div>
                <div className="sp-field">
                  <label className="sp-label">Gender</label>
                  <select className="sp-input sp-select" name="gender"
                    value={student.gender} onChange={handleChange} disabled={!isEditing}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Details */}
          <div className="sp-card">
            <div className="sp-card__header">
              <div className="sp-card__icon sp-card__icon--purple">🎓</div>
              <h3 className="sp-card__title">Academic Details</h3>
            </div>
            <div className="sp-card__body">
              <div className="sp-grid sp-grid--2">
                <div className="sp-field">
                  <label className="sp-label">Qualification</label>
                  <input className="sp-input" name="qualification" type="text"
                    value={student.qualification} onChange={handleChange}
                    disabled={!isEditing} placeholder="e.g. B.Tech, MCA" />
                </div>
                <div className="sp-field">
                  <label className="sp-label">Year / Semester</label>
                  <input className="sp-input" name="year" type="text"
                    value={student.year} onChange={handleChange}
                    disabled={!isEditing} placeholder="e.g. 3rd Year" />
                </div>
                <div className="sp-field sp-field--full">
                  <label className="sp-label">Skills</label>
                  <input className="sp-input" name="skills" type="text"
                    value={student.skills} onChange={handleChange}
                    disabled={!isEditing} placeholder="e.g. Java, React, MySQL" />
                  <p className="sp-hint">Separate skills with commas</p>
                </div>
                <div className="sp-field sp-field--full">
                  <label className="sp-label">Bio</label>
                  <textarea className="sp-textarea" name="bio"
                    value={student.bio} onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Tell us about yourself — your goals, interests and aspirations…" />
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="sp-card">
            <div className="sp-card__header">
              <div className="sp-card__icon sp-card__icon--green">📍</div>
              <h3 className="sp-card__title">Address & Location</h3>
            </div>
            <div className="sp-card__body">
              <div className="sp-grid sp-grid--2">
                <div className="sp-field sp-field--full">
                  <label className="sp-label">Street Address</label>
                  <input className="sp-input" name="address" type="text"
                    value={student.address} onChange={handleChange}
                    disabled={!isEditing} placeholder="House no., street, area" />
                </div>
                <div className="sp-field">
                  <label className="sp-label">City</label>
                  <input className="sp-input" name="city" type="text"
                    value={student.city} onChange={handleChange}
                    disabled={!isEditing} placeholder="City" />
                </div>
                <div className="sp-field">
                  <label className="sp-label">State</label>
                  <input className="sp-input" name="state" type="text"
                    value={student.state} onChange={handleChange}
                    disabled={!isEditing} placeholder="State" />
                </div>
                <div className="sp-field">
                  <label className="sp-label">Pincode</label>
                  <input className="sp-input" name="pincode" type="text"
                    value={student.pincode} onChange={handleChange}
                    disabled={!isEditing} placeholder="560001" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default StudentProfile;
