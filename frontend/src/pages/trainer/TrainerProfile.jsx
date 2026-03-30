import { useState, useEffect, useRef } from "react";
import api from "../../api/axiosConfig";
import "./TrainerProfile.css";

function TrainerProfile() {
  const [isEditing,  setIsEditing]  = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userEmail  = storedUser?.email || "";

  const MALE_AVATAR   = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
  const FEMALE_AVATAR = "https://cdn-icons-png.flaticon.com/512/3135/3135789.png";

  const [trainer, setTrainer] = useState({
    name: "", email: userEmail, phone: "", gender: "",
    specialization: "", experience: "", qualification: "", bio: "",
    profilePic: "", address: "", city: "", state: "", pincode: "",
    studentId: ""
  });

  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    if (!userEmail) { setLoading(false); return; }
    api.get(`/trainer/profile/${userEmail}`)
      .then(res => { if (res.data) setTrainer(res.data); })
      .catch(err => console.error("Error fetching trainer profile:", err))
      .finally(() => setLoading(false));
  }, [userEmail]);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: "", text: "" }), 3500);
  };

  const progress = (() => {
    const fields = [trainer.name, trainer.phone, trainer.gender,
                    trainer.specialization, trainer.experience, trainer.address];
    return Math.round(fields.filter(f => f?.toString().trim()).length / fields.length * 100);
  })();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      setTrainer({ ...trainer, phone: numericValue });
    } else {
      setTrainer({ ...trainer, [name]: value });
    }
  };

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("error", "Image must be under 2 MB."); return; }
    const reader = new FileReader();
    reader.onloadend = () => setTrainer(t => ({ ...t, profilePic: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleEdit = () => {
    setSnapshot({ ...trainer });
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (snapshot) setTrainer(snapshot);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/trainer/update-profile", trainer);
      setIsEditing(false);
      setSnapshot(null);
      showToast("success", "Profile updated successfully ✅");
    } catch (err) {
      showToast("error", "Update failed — please try again ❌");
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = trainer.profilePic ||
    (trainer.gender === "Female" ? FEMALE_AVATAR : MALE_AVATAR);

  if (loading) return (
    <div className="tp-loader">
      <div className="tp-spinner" />
      <p>Loading profile…</p>
    </div>
  );

  return (
    <div className="tp-page">

      {/* Toast */}
      {toast.text && (
        <div className={`tp-toast tp-toast--${toast.type}`}>{toast.text}</div>
      )}

      {/* Hero header */}
      <div className="tp-hero">
        <div className="tp-hero__orb tp-hero__orb--1" />
        <div className="tp-hero__orb tp-hero__orb--2" />
        <div className="tp-hero__inner">
          <div className="tp-hero__avatar-wrap">
            <div
              className={`tp-hero__avatar-frame ${isEditing ? "tp-hero__avatar-frame--edit" : ""}`}
              onClick={() => isEditing && fileInputRef.current.click()}
              title={isEditing ? "Click to change photo" : ""}
            >
              <img src={avatarSrc} alt={trainer.name} className="tp-hero__avatar-img" />
              {isEditing && (
                <div className="tp-hero__avatar-overlay">
                  <span>📷 Change</span>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} hidden />
          </div>

          <div className="tp-hero__info">
            <div className="tp-hero__role-chip">👤 Trainer</div>
            <h1 className="tp-hero__name">{trainer.name || "Your Name"}</h1>
            <div className="tp-hero__ids">
              <p className="tp-hero__email">{trainer.email}</p>
              {(trainer.portalId || trainer.studentId) && (
                <p className="tp-hero__student-id">ID: {trainer.portalId || trainer.studentId}</p>
              )}
            </div>
            <div className="tp-hero__meta">
              {trainer.specialization && <span className="tp-chip tp-chip--blue">{trainer.specialization}</span>}
              {trainer.experience && <span className="tp-chip tp-chip--amber">⏱ {trainer.experience} yrs exp</span>}
              {trainer.city && <span className="tp-chip tp-chip--green">📍 {trainer.city}</span>}
            </div>
          </div>

          {/* Profile strength */}
          <div className="tp-hero__strength">
            <div className="tp-strength__header">
              <span>Profile Strength</span>
              <span className="tp-strength__pct">{progress}%</span>
            </div>
            <div className="tp-strength__bar">
              <div
                className="tp-strength__fill"
                style={{ width: `${progress}%`,
                  background: progress >= 80 ? "linear-gradient(90deg,#16a34a,#4ade80)"
                            : progress >= 50 ? "linear-gradient(90deg,#2563eb,#60a5fa)"
                            : "linear-gradient(90deg,#d97706,#fbbf24)"
                }}
              />
            </div>
            <p className="tp-strength__hint">
              {progress < 50 ? "Add more details to complete your profile"
               : progress < 100 ? "Almost there — fill remaining fields"
               : "Your profile is complete 🎉"}
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="tp-body">

        {/* Action bar */}
        <div className="tp-action-bar">
          <div className="tp-action-bar__left">
            <h2 className="tp-action-bar__title">
              {isEditing ? "Editing Profile" : "Profile Details"}
            </h2>
            <p className="tp-action-bar__sub">
              {isEditing ? "Make your changes and save" : "View your personal and professional information"}
            </p>
          </div>
          <div className="tp-action-bar__right">
            {!isEditing ? (
              <button className="tp-btn tp-btn--edit" onClick={handleEdit}>
                ✏️ Edit Profile
              </button>
            ) : (
              <>
                <button className="tp-btn tp-btn--cancel" onClick={handleCancel} disabled={saving}>
                  Cancel
                </button>
                <button className="tp-btn tp-btn--save" onClick={handleSave} disabled={saving}>
                  {saving ? <><span className="tp-btn-spinner" /> Saving…</> : "💾 Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Cards */}
        <div className="tp-cards">

          {/* Basic Information */}
          <div className="tp-card tp-card--full">
            <div className="tp-card__header">
              <div className="tp-card__icon tp-card__icon--blue">👤</div>
              <h3 className="tp-card__title">Basic Information</h3>
            </div>
            <div className="tp-card__body">
              <div className="tp-grid tp-grid--3">
                <div className="tp-field">
                  <label className="tp-label">Full Name</label>
                  <input className="tp-input" name="name" type="text"
                    value={trainer.name} onChange={handleChange}
                    disabled={!isEditing} placeholder="Your full name" />
                </div>
                <div className="tp-field">
                  <label className="tp-label">Email Address</label>
                  <input className="tp-input tp-input--readonly" type="email"
                    value={trainer.email} disabled
                    title="Email cannot be changed" />
                </div>
                {(trainer.portalId || trainer.studentId) && (
                  <div className="tp-field">
                    <label className="tp-label">Staff / Trainer ID</label>
                    <input className="tp-input sp-input--readonly" type="text"
                      value={trainer.portalId || trainer.studentId} disabled
                      title="ID is permanent" />
                  </div>
                )}
                <div className="tp-field">
                  <label className="tp-label">Phone Number</label>
                  <input className="tp-input" name="phone" type="text"
                    value={trainer.phone} onChange={handleChange}
                    disabled={!isEditing} placeholder="+91 00000 00000" />
                </div>
                <div className="tp-field">
                  <label className="tp-label">Gender</label>
                  <select className="tp-input tp-select" name="gender"
                    value={trainer.gender} onChange={handleChange} disabled={!isEditing}>
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
          <div className="tp-card">
            <div className="tp-card__header">
              <div className="tp-card__icon tp-card__icon--amber">💼</div>
              <h3 className="tp-card__title">Professional Details</h3>
            </div>
            <div className="tp-card__body">
              <div className="tp-grid tp-grid--2">
                <div className="tp-field">
                  <label className="tp-label">Specialization</label>
                  <input className="tp-input" name="specialization" type="text"
                    value={trainer.specialization} onChange={handleChange}
                    disabled={!isEditing} placeholder="e.g. Java Full Stack" />
                </div>
                <div className="tp-field">
                  <label className="tp-label">Experience (Years)</label>
                  <input className="tp-input" name="experience" type="text"
                    value={trainer.experience} onChange={handleChange}
                    disabled={!isEditing} placeholder="e.g. 5" />
                </div>
                <div className="tp-field">
                  <label className="tp-label">Qualification</label>
                  <input className="tp-input" name="qualification" type="text"
                    value={trainer.qualification} onChange={handleChange}
                    disabled={!isEditing} placeholder="e.g. M.Tech, MCA" />
                </div>
                <div className="tp-field tp-field--full">
                  <label className="tp-label">Professional Bio</label>
                  <textarea className="tp-textarea" name="bio"
                    value={trainer.bio} onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Describe your expertise, teaching style and professional background…" />
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="tp-card">
            <div className="tp-card__header">
              <div className="tp-card__icon tp-card__icon--green">📍</div>
              <h3 className="tp-card__title">Address & Location</h3>
            </div>
            <div className="tp-card__body">
              <div className="tp-grid tp-grid--2">
                <div className="tp-field tp-field--full">
                  <label className="tp-label">Street Address</label>
                  <input className="tp-input" name="address" type="text"
                    value={trainer.address} onChange={handleChange}
                    disabled={!isEditing} placeholder="House no., street, area" />
                </div>
                <div className="tp-field">
                  <label className="tp-label">City</label>
                  <input className="tp-input" name="city" type="text"
                    value={trainer.city} onChange={handleChange}
                    disabled={!isEditing} placeholder="City" />
                </div>
                <div className="tp-field">
                  <label className="tp-label">State</label>
                  <input className="tp-input" name="state" type="text"
                    value={trainer.state} onChange={handleChange}
                    disabled={!isEditing} placeholder="State" />
                </div>
                <div className="tp-field">
                  <label className="tp-label">Pincode</label>
                  <input className="tp-input" name="pincode" type="text"
                    value={trainer.pincode} onChange={handleChange}
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

export default TrainerProfile;
