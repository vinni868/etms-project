import { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import "./AdminProfile.css";
import { 
  FaUserShield, FaEnvelope, FaPhone, FaMapMarkerAlt, 
  FaInfoCircle, FaEdit, FaSave, FaTimes, FaCamera, FaSync, 
  FaGlobe, FaBriefcase, FaUserCircle, FaCheckCircle, FaExclamationTriangle
} from "react-icons/fa";

function AdminProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [tempProfile, setTempProfile] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.email) throw new Error("No user session found.");

      const res = await api.get(`/admin/profile/${user.email}`);
      setProfile(res.data);
      setTempProfile(res.data);
    } catch (err) {
      console.error("Profile Fetch Error:", err);
      setError(err.response?.data?.message || err.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/admin/update-profile", tempProfile);
      setProfile(tempProfile);
      setIsEditing(false);
      
      const user = JSON.parse(localStorage.getItem("user"));
      user.name = tempProfile.name;
      user.phone = tempProfile.phone;
      localStorage.setItem("user", JSON.stringify(user));
      
      alert("Profile updated successfully ✅");
    } catch (err) {
      alert(`Update failed: ${err.message} ❌`);
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempProfile({ ...tempProfile, profilePic: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return (
    <div className="ap-loader-wrap">
      <div className="ap-spinner"></div>
      <p style={{ fontWeight: 600, color: '#64748b' }}>Loading Profile Information...</p>
    </div>
  );

  if (error) return (
    <div className="ap-loader-wrap">
      <FaExclamationTriangle size={48} color="#ef4444" />
      <h2 style={{ color: '#0f172a', marginTop: '16px' }}>Error Loading Profile</h2>
      <p style={{ color: '#64748b' }}>{error}</p>
      <button className="ap-btn ap-btn--save" style={{ marginTop: '20px' }} onClick={fetchProfile}>
        <FaSync /> Retry
      </button>
    </div>
  );

  return (
    <div className="ap-container">
      {/* ── HEADER ── */}
      <div className="ap-hero">
        <div className="ap-hero-pattern"></div>
        <div className="ap-identity">
          <div className="ap-avatar-wrapper">
            <div className="ap-avatar-frame">
              <img src={tempProfile?.profilePic || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="Avatar" />
            </div>
            {isEditing && (
              <label className="ap-camera-btn">
                <FaCamera />
                <input type="file" hidden accept="image/*" onChange={handleFileChange} />
              </label>
            )}
          </div>
          <div className="ap-name-block">
            <div className="ap-role-badge"><FaUserShield /> Administrator</div>
            <h1>{profile?.name}</h1>
          </div>
        </div>
      </div>

      <div className="ap-grid">
        {/* ── SIDEBAR INFO ── */}
        <div className="ap-sidebar">
          <div className="ap-card">
            <h3 className="ap-card-title"><FaInfoCircle /> Account Details</h3>
            <div className="ap-stat-card">
              <div className="ap-stat-icon ap-stat-icon--blue"><FaUserCircle /></div>
              <div className="ap-stat-info">
                <span className="ap-stat-lbl">ID Number</span>
                <span className="ap-stat-val" style={{fontSize: '12px'}}>{profile?.studentId || "ADM-001"}</span>
              </div>
            </div>
            <div className="ap-stat-card">
              <div className="ap-stat-icon ap-stat-icon--blue"><FaCheckCircle /></div>
              <div className="ap-stat-info">
                <span className="ap-stat-lbl">Account Status</span>
                <span className="ap-stat-val">ACTIVE</span>
              </div>
            </div>
            <div className="ap-stat-card" style={{ marginBottom: 0 }}>
              <div className="ap-stat-icon ap-stat-icon--blue"><FaBriefcase /></div>
              <div className="ap-stat-info">
                <span className="ap-stat-lbl">Title</span>
                <span className="ap-stat-val">{profile?.adminTitle || "Senior Administrator"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── FORM ── */}
        <div className="ap-main">
          <div className="ap-card">
            <div className="ap-card-title" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FaEdit /> Profile Information
              </div>
              {!isEditing ? (
                <button className="ap-btn ap-btn--save" style={{ padding: '8px 20px', fontSize: '13px' }} onClick={() => setIsEditing(true)}>
                  <FaEdit /> Edit Information
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="ap-btn ap-btn--cancel" style={{ padding: '8px 20px', fontSize: '13px' }} onClick={() => { setIsEditing(false); setTempProfile(profile); }}>
                    <FaTimes /> Cancel
                  </button>
                  <button className="ap-btn ap-btn--save" style={{ padding: '8px 20px', fontSize: '13px' }} onClick={handleSave} disabled={saving}>
                    <FaSave /> {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>

            <div className="ap-form">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                <div className="ap-field">
                  <label>Full Name</label>
                  <div className="ap-input-group">
                    <FaUserCircle className="ap-input-icon" />
                    <input 
                      value={tempProfile?.name || ""} 
                      readOnly={!isEditing} 
                      onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="ap-field">
                  <label>Email Address</label>
                  <div className="ap-input-group">
                    <FaEnvelope className="ap-input-icon" />
                    <input value={tempProfile?.email || ""} readOnly className="locked" />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                <div className="ap-field">
                  <label>Phone Number</label>
                  <div className="ap-input-group">
                    <FaPhone className="ap-input-icon" />
                    <input 
                      value={tempProfile?.phone || ""} 
                      readOnly={!isEditing} 
                      onChange={(e) => setTempProfile({ ...tempProfile, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="ap-field">
                  <label>Gender</label>
                  <select 
                    value={tempProfile?.gender || ""} 
                    disabled={!isEditing} 
                    onChange={(e) => setTempProfile({ ...tempProfile, gender: e.target.value })}
                  >
                    <option value="">SELECT</option>
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              </div>

              <div className="ap-field">
                <label>About Me</label>
                <textarea 
                  value={tempProfile?.bio || ""} 
                  readOnly={!isEditing} 
                  placeholder="Tell us about yourself..."
                  onChange={(e) => setTempProfile({ ...tempProfile, bio: e.target.value })}
                />
              </div>

              <div style={{ borderTop: '1.5px solid #f1f5f9', marginTop: '12px', paddingTop: '24px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#334155', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaMapMarkerAlt color="#2563eb" /> Address & Location
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                  <div className="ap-field">
                    <label>City</label>
                    <input value={tempProfile?.city || ""} readOnly={!isEditing} onChange={(e) => setTempProfile({ ...tempProfile, city: e.target.value })} />
                  </div>
                  <div className="ap-field">
                    <label>Street Address</label>
                    <input value={tempProfile?.address || ""} readOnly={!isEditing} onChange={(e) => setTempProfile({ ...tempProfile, address: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginTop: '20px' }}>
                  <div className="ap-field">
                    <label>State</label>
                    <input value={tempProfile?.state || ""} readOnly={!isEditing} onChange={(e) => setTempProfile({ ...tempProfile, state: e.target.value })} />
                  </div>
                  <div className="ap-field">
                    <label>Pincode / Zip</label>
                    <input value={tempProfile?.pincode || ""} readOnly={!isEditing} onChange={(e) => setTempProfile({ ...tempProfile, pincode: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminProfile;
