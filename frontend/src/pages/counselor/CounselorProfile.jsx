import { useState, useEffect, useRef } from "react";
import api from "../../api/axiosConfig";
import "./CounselorProfile.css";

function CounselorProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userEmail = storedUser?.email || "";

  const MALE_AVATAR = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
  const FEMALE_AVATAR = "https://cdn-icons-png.flaticon.com/512/3135/3135789.png";

  const [counselor, setCounselor] = useState({
    name: "", email: userEmail, phone: "", gender: "",
    specialization: "", yearsOfExperience: "", bio: "",
    profilePic: "", certifications: "", availability: "",
    address: "", city: "", state: "", pincode: "", studentId: ""
  });

  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    if (!userEmail) { setLoading(false); return; }
    api.get(`/counselor/profile/${userEmail}`)
      .then(res => { if (res.data) setCounselor(res.data); })
      .catch(err => console.error("Error fetching counselor profile:", err))
      .finally(() => setLoading(false));
  }, [userEmail]);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: "", text: "" }), 3500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      setCounselor({ ...counselor, phone: numericValue });
    } else {
      setCounselor({ ...counselor, [name]: value });
    }
  };

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("error", "Image must be under 2 MB."); return; }
    const reader = new FileReader();
    reader.onloadend = () => setCounselor(c => ({ ...c, profilePic: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleEdit = () => {
    setSnapshot({ ...counselor });
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (snapshot) setCounselor(snapshot);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/counselor/update-profile", counselor);
      setIsEditing(false);
      setSnapshot(null);
      showToast("success", "Profile updated successfully ✅");
    } catch (err) {
      showToast("error", "Update failed — please try again ❌");
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = counselor.profilePic ||
    (counselor.gender === "Female" ? FEMALE_AVATAR : MALE_AVATAR);

  if (loading) return (
    <div className="cp-loader">
      <div className="cp-spinner" />
      <p>Loading profile…</p>
    </div>
  );

  return (
    <div className="cp-page">
      {toast.text && (
        <div className={`cp-toast cp-toast--${toast.type}`}>{toast.text}</div>
      )}

      {/* Hero header */}
      <div className="cp-hero">
        <div className="cp-hero__orb cp-hero__orb--1" />
        <div className="cp-hero__orb cp-hero__orb--2" />
        <div className="cp-hero__inner">
          <div className="cp-hero__avatar-wrap">
            <div
              className={`cp-hero__avatar-frame ${isEditing ? "cp-hero__avatar-frame--edit" : ""}`}
              onClick={() => isEditing && fileInputRef.current.click()}
              title={isEditing ? "Click to change photo" : ""}
            >
              <img src={avatarSrc} alt={counselor.name} className="cp-hero__avatar-img" />
              {isEditing && (
                <div className="cp-hero__avatar-overlay">
                  <span>📷 Change</span>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} hidden />
          </div>

          <div className="cp-hero__info">
            <div className="cp-hero__role-chip">💚 Counselor</div>
            <h1 className="cp-hero__name">{counselor.name || "Your Name"}</h1>
            <div className="cp-hero__ids">
              <p className="cp-hero__email">{counselor.email}</p>
              {counselor.studentId && (
                <p className="cp-hero__student-id">ID: {counselor.studentId}</p>
              )}
            </div>
            <div className="cp-hero__meta">
              {counselor.specialization && <span className="cp-chip cp-chip--teal">{counselor.specialization}</span>}
              {counselor.yearsOfExperience && <span className="cp-chip cp-chip--cyan">📚 {counselor.yearsOfExperience} yrs exp</span>}
              {counselor.city && <span className="cp-chip cp-chip--green">📍 {counselor.city}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="cp-body">
        {/* Action bar */}
        <div className="cp-action-bar">
          <div className="cp-action-bar__left">
            <h2 className="cp-action-bar__title">
              {isEditing ? "Editing Profile" : "Profile Details"}
            </h2>
            <p className="cp-action-bar__sub">
              {isEditing ? "Make your changes and save" : "View your professional and personal information"}
            </p>
          </div>
          <div className="cp-action-bar__right">
            {!isEditing ? (
              <button className="cp-btn cp-btn--edit" onClick={handleEdit}>
                ✏️ Edit Profile
              </button>
            ) : (
              <>
                <button className="cp-btn cp-btn--cancel" onClick={handleCancel} disabled={saving}>
                  Cancel
                </button>
                <button className="cp-btn cp-btn--save" onClick={handleSave} disabled={saving}>
                  {saving ? <><span className="cp-btn-spinner" /> Saving…</> : "💾 Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Cards */}
        <div className="cp-cards">

          {/* Basic Information */}
          <div className="cp-card cp-card--full">
            <div className="cp-card__header">
              <div className="cp-card__icon cp-card__icon--teal">👤</div>
              <h3 className="cp-card__title">Basic Information</h3>
            </div>
            <div className="cp-card__body">
              <div className="cp-grid cp-grid--3">
                <div className="cp-field">
                  <label className="cp-label">Full Name</label>
                  <input className="cp-input" name="name" type="text"
                    value={counselor.name} onChange={handleChange}
                    disabled={!isEditing} placeholder="Your full name" />
                </div>
                <div className="cp-field">
                  <label className="cp-label">Email Address</label>
                  <input className="cp-input cp-input--readonly" type="email"
                    value={counselor.email} disabled
                    title="Email cannot be changed" />
                </div>
                {counselor.studentId && (
                  <div className="cp-field">
                    <label className="cp-label">Counselor ID</label>
                    <input className="cp-input cp-input--readonly" type="text"
                      value={counselor.studentId} disabled
                      title="ID is permanent" />
                  </div>
                )}
                <div className="cp-field">
                  <label className="cp-label">Phone Number</label>
                  <input className="cp-input" name="phone" type="text"
                    value={counselor.phone} onChange={handleChange}
                    disabled={!isEditing} placeholder="+91 00000 00000" maxLength="10" />
                </div>
                <div className="cp-field">
                  <label className="cp-label">Gender</label>
                  <select className="cp-input cp-select" name="gender"
                    value={counselor.gender} onChange={handleChange} disabled={!isEditing}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="cp-card">
            <div className="cp-card__header">
              <div className="cp-card__icon cp-card__icon--cyan">💼</div>
              <h3 className="cp-card__title">Professional Details</h3>
            </div>
            <div className="cp-card__body">
              <div className="cp-grid cp-grid--2">
                <div className="cp-field">
                  <label className="cp-label">Specialization</label>
                  <input className="cp-input" name="specialization" type="text"
                    value={counselor.specialization} onChange={handleChange}
                    disabled={!isEditing} placeholder="e.g., Career Counseling, Mental Health" />
                </div>
                <div className="cp-field">
                  <label className="cp-label">Years of Experience</label>
                  <input className="cp-input" name="yearsOfExperience" type="text"
                    value={counselor.yearsOfExperience} onChange={handleChange}
                    disabled={!isEditing} placeholder="e.g., 5" />
                </div>
                <div className="cp-field cp-field--full">
                  <label className="cp-label">Professional Bio</label>
                  <textarea className="cp-textarea" name="bio"
                    value={counselor.bio} onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Describe your expertise, counseling approach and experience…" />
                </div>
                <div className="cp-field cp-field--full">
                  <label className="cp-label">Certifications</label>
                  <textarea className="cp-textarea" name="certifications"
                    value={counselor.certifications} onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="List your certifications (e.g., NLP, CBT, Career Counseling, etc.)" />
                </div>
                <div className="cp-field cp-field--full">
                  <label className="cp-label">Availability</label>
                  <textarea className="cp-textarea" name="availability"
                    value={counselor.availability} onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Your availability (e.g., Mon-Fri 2-6 PM, Sat 10 AM-2 PM)" />
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="cp-card">
            <div className="cp-card__header">
              <div className="cp-card__icon cp-card__icon--green">📍</div>
              <h3 className="cp-card__title">Address & Location</h3>
            </div>
            <div className="cp-card__body">
              <div className="cp-grid cp-grid--2">
                <div className="cp-field cp-field--full">
                  <label className="cp-label">Street Address</label>
                  <input className="cp-input" name="address" type="text"
                    value={counselor.address} onChange={handleChange}
                    disabled={!isEditing} placeholder="House no., street, area" />
                </div>
                <div className="cp-field">
                  <label className="cp-label">City</label>
                  <input className="cp-input" name="city" type="text"
                    value={counselor.city} onChange={handleChange}
                    disabled={!isEditing} placeholder="City" />
                </div>
                <div className="cp-field">
                  <label className="cp-label">State</label>
                  <input className="cp-input" name="state" type="text"
                    value={counselor.state} onChange={handleChange}
                    disabled={!isEditing} placeholder="State" />
                </div>
                <div className="cp-field">
                  <label className="cp-label">Pincode</label>
                  <input className="cp-input" name="pincode" type="text"
                    value={counselor.pincode} onChange={handleChange}
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

export default CounselorProfile;
