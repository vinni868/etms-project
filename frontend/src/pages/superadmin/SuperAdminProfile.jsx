import { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import "./SuperAdminProfile.css";
import { 
  FaUserShield, FaEnvelope, FaPhone, FaMapMarkerAlt, 
  FaEdit, FaSave, FaTimes, FaGlobe, FaShieldAlt, 
  FaFingerprint, FaClock, FaIdBadge, FaCrown
} from "react-icons/fa";

function SuperAdminProfile() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snapshot, setSnapshot] = useState(null); 
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    const user = JSON.parse(localStorage.getItem("user"));
    const userEmail = user?.email;
    
    if (!userEmail) {
      setError("No user session found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      const res = await api.get(`/superadmin/profile/${userEmail}`);
      setProfile(res.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err.response?.data?.message || "Unable to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setSnapshot({ ...profile });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setProfile(snapshot);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/superadmin/update-profile", profile);
      setIsEditing(false);
      setSnapshot(null);
      // alert("Profile updated successfully ✅");
    } catch (err) {
      alert(`Update failed: ${err.message} ❌`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="sa-loader-container">
      <div className="sa-spin"></div>
      <p>Initializing Executive Profile...</p>
    </div>
  );

  if (error || !profile) return (
    <div className="sa-error-state">
      <div className="sa-error-box">
        <FaShieldAlt size={50} color="#ef4444" />
        <h2>Access Denied</h2>
        <p>{error || "Profile data is not available."}</p>
        <button className="sa-retry-btn" onClick={fetchProfile}>Attempt Reconnection</button>
      </div>
    </div>
  );

  return (
    <div className="sa-profile-page">
      <div className="sa-profile-container">
        
        {/* ── HEADER PANEL ── */}
        <div className="sa-executive-header">
          <div className="header-text-block">
            <div className="header-pill"><FaCrown /> EXECUTIVE COMMAND CENTER</div>
            <h1>Super Admin Profile</h1>
            <p>Manage your central administrative identity and security preferences.</p>
          </div>
          <div className="header-action-block">
            {!isEditing ? (
              <button className="sa-action-btn edit-mode" onClick={handleEdit}>
                <FaEdit /> Modify Configuration
              </button>
            ) : (
              <div className="sa-action-group">
                <button className="sa-action-btn cancel-btn" onClick={handleCancel}><FaTimes /> Cancel</button>
                <button className="sa-action-btn save-btn" onClick={handleSave} disabled={saving}>
                  {saving ? <span className="sa-spin-small"></span> : <FaSave />} {saving ? "Applying..." : "Apply Changes"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="sa-content-layout">
          {/* LEFT COLUMN: IDENTITY CARD */}
          <div className="sa-identity-column">
            <div className="sa-identity-matrix">
              <div className="matrix-bg"></div>
              <div className="avatar-wrapper">
                <div className="hex-avatar">
                   <img src={profile.profilePicture || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="SA" />
                </div>
              </div>
              <div className="identity-text">
                <h2>{profile.name}</h2>
                <span className="matrix-role">{profile.adminTitle || "System Architect"}</span>
                <div className="matrix-email"><FaEnvelope /> {profile.email}</div>
              </div>
              
              <div className="matrix-stats">
                <div className="matrix-stat-item">
                  <span className="stat-value">ROOT</span>
                  <span className="stat-label">Access Level</span>
                </div>
                <div className="matrix-stat-item">
                  <span className="stat-value text-green">ACTIVE</span>
                  <span className="stat-label">System Status</span>
                </div>
              </div>
            </div>

            <div className="sa-side-card">
              <h3><FaShieldAlt /> System Security</h3>
              <p className="side-card-desc">Your account has ultra-level clearance. Keep mechanisms secure.</p>
              
              <div className="security-item">
                <div className="sec-icon"><FaFingerprint /></div>
                <div className="sec-details">
                  <h4>MFA Status</h4>
                  <span>Authentication Enforced</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CONFIGURATION MANAGER */}
          <div className="sa-config-column">
            
            <div className="sa-config-group">
              <div className="config-group-header">
                <h3><FaIdBadge /> Executive Identity</h3>
                <span>Core identification metrics</span>
              </div>
              <div className="config-grid">
                <div className="config-field">
                  <label>Full Legal Name</label>
                  <input 
                    type="text" 
                    value={profile.name || ""} 
                    readOnly={!isEditing} 
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className={!isEditing ? "locked" : "editable"}
                  />
                </div>
                <div className="config-field">
                  <label>Administrative Title</label>
                  <input 
                    type="text" 
                    value={profile.adminTitle || ""} 
                    readOnly={!isEditing} 
                    placeholder="e.g. Chief Operations Officer"
                    onChange={(e) => setProfile({...profile, adminTitle: e.target.value})}
                    className={!isEditing ? "locked" : "editable"}
                  />
                </div>
                <div className="config-field full-width">
                  <label>Professional Biography (System Log Profile)</label>
                  <textarea 
                    value={profile.bio || ""} 
                    readOnly={!isEditing}
                    placeholder="Describe your role and expertise..."
                    onChange={(e) => setProfile({...profile, bio: e.target.value})}
                    className={`bio-text ${!isEditing ? "locked" : "editable"}`}
                  />
                </div>
              </div>
            </div>

            <div className="sa-config-group">
              <div className="config-group-header">
                <h3><FaCrown /> Security & Communications</h3>
                <span>Critical contact arrays</span>
              </div>
              <div className="config-grid">
                <div className="config-field">
                  <label>Primary System Email</label>
                  <input type="text" value={profile.email || ""} disabled className="system-locked" />
                </div>
                <div className="config-field">
                  <label>Recovery Email (Critical)</label>
                  <input 
                    type="email" 
                    value={profile.recoveryEmail || ""} 
                    readOnly={!isEditing} 
                    placeholder="backup@domain.com"
                    onChange={(e) => setProfile({...profile, recoveryEmail: e.target.value})}
                    className={!isEditing ? "locked" : "editable"}
                  />
                </div>
                <div className="config-field">
                  <label><FaPhone className="input-icon"/> Phone Contact</label>
                  <input 
                    type="text" 
                    value={profile.phone || ""} 
                    readOnly={!isEditing} 
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    className={!isEditing ? "locked" : "editable"}
                  />
                </div>
              </div>
            </div>

            <div className="sa-config-group">
              <div className="config-group-header">
                <h3><FaGlobe /> Environment & Location</h3>
                <span>Regional settings for logging</span>
              </div>
              <div className="config-grid">
                <div className="config-field">
                  <label><FaClock className="input-icon"/> Operational Timezone</label>
                  <select 
                    value={profile.timezone || ""} 
                    disabled={!isEditing} 
                    onChange={(e) => setProfile({...profile, timezone: e.target.value})}
                    className={!isEditing ? "locked" : "editable"}
                  >
                    <option value="">Select Timezone</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                    <option value="UTC">Universal Time Coordinated (UTC)</option>
                  </select>
                </div>
                <div className="config-field">
                  <label><FaMapMarkerAlt className="input-icon"/> Base City</label>
                  <input 
                    type="text" 
                    value={profile.city || ""} 
                    readOnly={!isEditing} 
                    onChange={(e) => setProfile({...profile, city: e.target.value})}
                    className={!isEditing ? "locked" : "editable"}
                  />
                </div>
                <div className="config-field">
                  <label>State / Region</label>
                  <input 
                    type="text" 
                    value={profile.state || ""} 
                    readOnly={!isEditing} 
                    onChange={(e) => setProfile({...profile, state: e.target.value})}
                    className={!isEditing ? "locked" : "editable"}
                  />
                </div>
                <div className="config-field">
                  <label>Regional Pincode</label>
                  <input 
                    type="text" 
                    value={profile.pincode || ""} 
                    readOnly={!isEditing} 
                    onChange={(e) => setProfile({...profile, pincode: e.target.value})}
                    className={!isEditing ? "locked" : "editable"}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminProfile;
