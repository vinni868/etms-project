import { useState, useEffect, useRef } from "react";
import api from "../../api/axiosConfig";
import "./MarketerProfile.css";

function MarketerProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userEmail = storedUser?.email || "";

  const MALE_AVATAR = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
  const FEMALE_AVATAR = "https://cdn-icons-png.flaticon.com/512/3135/3135789.png";

  const [marketer, setMarketer] = useState({
    name: "", email: userEmail, phone: "", gender: "",
    department: "", targetRegion: "", monthlyTarget: "", bio: "",
    profilePic: "", skills: "",
    address: "", city: "", state: "", pincode: "", studentId: ""
  });

  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    if (!userEmail) { setLoading(false); return; }
    api.get(`/marketer/profile/${userEmail}`)
      .then(res => { if (res.data) setMarketer(res.data); })
      .catch(err => console.error("Error fetching marketer profile:", err))
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
      setMarketer({ ...marketer, phone: numericValue });
    } else {
      setMarketer({ ...marketer, [name]: value });
    }
  };

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("error", "Image must be under 2 MB."); return; }
    const reader = new FileReader();
    reader.onloadend = () => setMarketer(m => ({ ...m, profilePic: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleEdit = () => {
    setSnapshot({ ...marketer });
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (snapshot) setMarketer(snapshot);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/marketer/update-profile", marketer);
      setIsEditing(false);
      setSnapshot(null);
      showToast("success", "Profile updated successfully ✅");
    } catch (err) {
      showToast("error", "Update failed — please try again ❌");
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = marketer.profilePic ||
    (marketer.gender === "Female" ? FEMALE_AVATAR : MALE_AVATAR);

  if (loading) return (
    <div className="mp-loader">
      <div className="mp-spinner" />
      <p>Loading profile…</p>
    </div>
  );

  return (
    <div className="mp-page">
      {toast.text && (
        <div className={`mp-toast mp-toast--${toast.type}`}>{toast.text}</div>
      )}

      {/* Hero header */}
      <div className="mp-hero">
        <div className="mp-hero__orb mp-hero__orb--1" />
        <div className="mp-hero__orb mp-hero__orb--2" />
        <div className="mp-hero__inner">
          <div className="mp-hero__avatar-wrap">
            <div
              className={`mp-hero__avatar-frame ${isEditing ? "mp-hero__avatar-frame--edit" : ""}`}
              onClick={() => isEditing && fileInputRef.current.click()}
              title={isEditing ? "Click to change photo" : ""}
            >
              <img src={avatarSrc} alt={marketer.name} className="mp-hero__avatar-img" />
              {isEditing && (
                <div className="mp-hero__avatar-overlay">
                  <span>📷 Change</span>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} hidden />
          </div>

          <div className="mp-hero__info">
            <div className="mp-hero__role-chip">🚀 Marketer</div>
            <h1 className="mp-hero__name">{marketer.name || "Your Name"}</h1>
            <div className="mp-hero__ids">
              <p className="mp-hero__email">{marketer.email}</p>
              {marketer.studentId && (
                <p className="mp-hero__student-id">ID: {marketer.studentId}</p>
              )}
            </div>
            <div className="mp-hero__meta">
              {marketer.department && <span className="mp-chip mp-chip--amber">{marketer.department}</span>}
              {marketer.targetRegion && <span className="mp-chip mp-chip--orange">🌍 {marketer.targetRegion}</span>}
              {marketer.city && <span className="mp-chip mp-chip--green">📍 {marketer.city}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mp-body">
        {/* Action bar */}
        <div className="mp-action-bar">
          <div className="mp-action-bar__left">
            <h2 className="mp-action-bar__title">
              {isEditing ? "Editing Profile" : "Profile Details"}
            </h2>
            <p className="mp-action-bar__sub">
              {isEditing ? "Make your changes and save" : "View your professional and personal information"}
            </p>
          </div>
          <div className="mp-action-bar__right">
            {!isEditing ? (
              <button className="mp-btn mp-btn--edit" onClick={handleEdit}>
                ✏️ Edit Profile
              </button>
            ) : (
              <>
                <button className="mp-btn mp-btn--cancel" onClick={handleCancel} disabled={saving}>
                  Cancel
                </button>
                <button className="mp-btn mp-btn--save" onClick={handleSave} disabled={saving}>
                  {saving ? <><span className="mp-btn-spinner" /> Saving…</> : "💾 Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Cards */}
        <div className="mp-cards">

          {/* Basic Information */}
          <div className="mp-card mp-card--full">
            <div className="mp-card__header">
              <div className="mp-card__icon mp-card__icon--amber">👤</div>
              <h3 className="mp-card__title">Basic Information</h3>
            </div>
            <div className="mp-card__body">
              <div className="mp-grid mp-grid--3">
                <div className="mp-field">
                  <label className="mp-label">Full Name</label>
                  <input className="mp-input" name="name" type="text"
                    value={marketer.name} onChange={handleChange}
                    disabled={!isEditing} placeholder="Your full name" />
                </div>
                <div className="mp-field">
                  <label className="mp-label">Email Address</label>
                  <input className="mp-input mp-input--readonly" type="email"
                    value={marketer.email} disabled
                    title="Email cannot be changed" />
                </div>
                {marketer.studentId && (
                  <div className="mp-field">
                    <label className="mp-label">Marketer ID</label>
                    <input className="mp-input mp-input--readonly" type="text"
                      value={marketer.studentId} disabled
                      title="ID is permanent" />
                  </div>
                )}
                <div className="mp-field">
                  <label className="mp-label">Phone Number</label>
                  <input className="mp-input" name="phone" type="text"
                    value={marketer.phone} onChange={handleChange}
                    disabled={!isEditing} placeholder="+91 00000 00000" maxLength="10" />
                </div>
                <div className="mp-field">
                  <label className="mp-label">Gender</label>
                  <select className="mp-input mp-select" name="gender"
                    value={marketer.gender} onChange={handleChange} disabled={!isEditing}>
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
          <div className="mp-card">
            <div className="mp-card__header">
              <div className="mp-card__icon mp-card__icon--orange">💼</div>
              <h3 className="mp-card__title">Professional Details</h3>
            </div>
            <div className="mp-card__body">
              <div className="mp-grid mp-grid--2">
                <div className="mp-field">
                  <label className="mp-label">Department</label>
                  <input className="mp-input" name="department" type="text"
                    value={marketer.department} onChange={handleChange}
                    disabled={!isEditing} placeholder="e.g., Digital Marketing, Lead Generation" />
                </div>
                <div className="mp-field">
                  <label className="mp-label">Target Region</label>
                  <input className="mp-input" name="targetRegion" type="text"
                    value={marketer.targetRegion} onChange={handleChange}
                    disabled={!isEditing} placeholder="e.g., Bangalore, Pan-India, South" />
                </div>
                <div className="mp-field">
                  <label className="mp-label">Monthly Target</label>
                  <input className="mp-input" name="monthlyTarget" type="text"
                    value={marketer.monthlyTarget} onChange={handleChange}
                    disabled={!isEditing} placeholder="e.g., 50 leads/month or ₹5L revenue" />
                </div>
                <div className="mp-field cp-field--full">
                  <label className="mp-label">Professional Bio</label>
                  <textarea className="mp-textarea" name="bio"
                    value={marketer.bio} onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Describe your marketing expertise, achievements and approach…" />
                </div>
                <div className="mp-field mp-field--full">
                  <label className="mp-label">Key Skills</label>
                  <textarea className="mp-textarea" name="skills"
                    value={marketer.skills} onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="List your skills (e.g., SEO, PPC, Content Marketing, Social Media, Email Marketing)" />
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="mp-card">
            <div className="mp-card__header">
              <div className="mp-card__icon mp-card__icon--green">📍</div>
              <h3 className="mp-card__title">Address & Location</h3>
            </div>
            <div className="mp-card__body">
              <div className="mp-grid mp-grid--2">
                <div className="mp-field mp-field--full">
                  <label className="mp-label">Street Address</label>
                  <input className="mp-input" name="address" type="text"
                    value={marketer.address} onChange={handleChange}
                    disabled={!isEditing} placeholder="House no., street, area" />
                </div>
                <div className="mp-field">
                  <label className="mp-label">City</label>
                  <input className="mp-input" name="city" type="text"
                    value={marketer.city} onChange={handleChange}
                    disabled={!isEditing} placeholder="City" />
                </div>
                <div className="mp-field">
                  <label className="mp-label">State</label>
                  <input className="mp-input" name="state" type="text"
                    value={marketer.state} onChange={handleChange}
                    disabled={!isEditing} placeholder="State" />
                </div>
                <div className="mp-field">
                  <label className="mp-label">Pincode</label>
                  <input className="mp-input" name="pincode" type="text"
                    value={marketer.pincode} onChange={handleChange}
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

export default MarketerProfile;
