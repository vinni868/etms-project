import { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import "./SuperAdminProfile.css";
import { 
  FaUserShield, FaEnvelope, FaPhone, FaMapMarkerAlt, 
  FaInfoCircle, FaEdit, FaSave, FaTimes, FaCamera, FaMedal, FaCrown,
  FaExclamationTriangle, FaSync, FaIdCard, FaGlobe, FaCogs, FaCheckCircle
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

  const calculateStrength = (p) => {
    if (!p) return 0;
    let score = 0;
    if (p.bio) score += 20;
    if (p.phone) score += 20;
    if (p.profilePicture) score += 20;
    if (p.address) score += 20;
    if (p.emergencyContact) score += 20;
    return score;
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
      alert("Profile updated successfully ✅");
    } catch (err) {
      alert(`Update failed: ${err.message} ❌`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="sap-loader">
      <div className="sap-spinner"></div>
      <p>Loading Profile...</p>
    </div>
  );

  if (error || !profile) return (
    <div className="sap-loader sa-error-state">
      <FaExclamationTriangle size={50} color="#ef4444" />
      <h2>Error Loading Profile</h2>
      <p>{error || "Profile data is not available."}</p>
      <button className="sa-retry-btn" onClick={fetchProfile}>
        <FaSync /> Retry
      </button>
    </div>
  );

  const strength = calculateStrength(profile);

  return (
    <div className="sa-page">
      <div className="sa-wrapper">
        
        {/* ── TOP STATS ── */}
        <div className="sap-stats-rectangle">
          <div className="sap-stat-card">
            <div className="sap-stat-icon"><FaMedal /></div>
            <div className="sap-stat-info">
              <span className="sap-stat-val">{strength}%</span>
              <span className="sap-stat-lbl">Profile Progress</span>
            </div>
          </div>
          <div className="sap-stat-divider" />
          <div className="sap-stat-card">
            <div className="sap-stat-icon"><FaUserShield /></div>
            <div className="sap-stat-info">
              <span className="sap-stat-val">Full Access</span>
              <span className="sap-stat-lbl">Permission Level</span>
            </div>
          </div>
          <div className="sap-stat-divider" />
          <div className="sap-stat-card">
            <div className="sap-stat-icon">
              <FaCheckCircle color="#10b981" />
            </div>
            <div className="sap-stat-info">
              <span className="sap-stat-val">ACTIVE</span>
              <span className="sap-stat-lbl">Account Status</span>
            </div>
          </div>
          <div className="sap-stat-divider" />
          <div className="sap-stat-card">
            <div className="sap-stat-info">
              <span className="sap-stat-val" style={{fontSize: '0.9rem'}}>{profile.portalId || profile.studentId || "ROOT-001"}</span>
              <span className="sap-stat-lbl">Portal ID</span>
            </div>
          </div>
        </div>

        <div className="sap-content-panel">
          {/* Header Section */}
          <div className="sap-hub-header">
            <div className="sap-hh-left">
              <h2>Super Admin Profile</h2>
              <p>Manage your account information and settings</p>
            </div>
            <div className="sap-hh-right">
              {!isEditing ? (
                <button className="sap-btn-action edit" onClick={handleEdit}>
                  <FaEdit /> Edit Profile
                </button>
              ) : (
                <div className="sap-btn-group">
                  <button className="sap-btn-action cancel" onClick={handleCancel}><FaTimes /> Cancel</button>
                  <button className="sap-btn-action save" onClick={handleSave} disabled={saving}>
                    <FaSave /> {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Hero Banner Section */}
          <div className="sap-banner-complex">
             <div className="sap-banner-gradient"></div>
             <div className="sap-banner-mesh"></div>
             
             <div className="sap-identity-card">
                <div className="sap-ic-left">
                   <div className="sap-avatar-frame">
                      <img src={profile.profilePicture || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="SA" />
                   </div>
                   <div className="sap-ic-info">
                      <div className="sap-role-pill"><FaCrown /> Super Admin</div>
                      <h1 className="sap-name-display">{profile.name}</h1>
                      <p className="sap-email-display">{profile.email}</p>
                   </div>
                </div>
                <div className="sap-ic-right">
                   <div className="sap-strength-ring">
                      <svg viewBox="0 0 36 36" className="sap-circular-chart">
                        <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="circle" strokeDasharray={`${strength}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <div className="sap-strength-text">
                        <span className="sap-st-val">{strength}%</span>
                        <span className="sap-st-lbl">Progress</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="sap-form-grid">
            {/* Personal Information */}
            <div className="sap-form-card">
               <h3 className="sap-form-title"><FaUserShield /> Personal Information</h3>
               <div className="sap-form-row">
                  <div className="sap-group">
                     <label>Full Name</label>
                     <input 
                       value={profile.name || ""} 
                       readOnly={!isEditing} 
                       onChange={(e) => setProfile({...profile, name: e.target.value})}
                     />
                  </div>
                  <div className="sap-group">
                     <label>Email Address</label>
                     <input value={profile.email || ""} readOnly className="locked" />
                  </div>
               </div>
               <div className="sap-form-row">
                  <div className="sap-group">
                     <label>Phone Number</label>
                     <input 
                       value={profile.phone || ""} 
                       readOnly={!isEditing} 
                       onChange={(e) => setProfile({...profile, phone: e.target.value})}
                     />
                  </div>
                  <div className="sap-group">
                     <label>Gender</label>
                     <select value={profile.gender || ""} disabled={!isEditing} onChange={(e) => setProfile({...profile, gender: e.target.value})}>
                        <option value="">Select Gender</option>
                        <option value="MALE">MALE</option>
                        <option value="FEMALE">FEMALE</option>
                     </select>
                  </div>
               </div>
            </div>

            {/* About Me */}
            <div className="sap-form-card">
               <h3 className="sap-form-title"><FaInfoCircle /> About Me</h3>
               <textarea 
                 className="sap-textarea"
                 value={profile.bio || ""} 
                 readOnly={!isEditing} 
                 placeholder="Tell us about yourself..."
                 onChange={(e) => setProfile({...profile, bio: e.target.value})}
               />
            </div>

            {/* Location Details */}
            <div className="sap-form-card">
               <h3 className="sap-form-title"><FaGlobe /> Location Details</h3>
               <div className="sap-form-row">
                  <div className="sap-group">
                     <label>City</label>
                     <input value={profile.city || ""} readOnly={!isEditing} onChange={(e) => setProfile({...profile, city: e.target.value})} />
                  </div>
                  <div className="sap-group">
                     <label>Street Address</label>
                     <input value={profile.address || ""} readOnly={!isEditing} onChange={(e) => setProfile({...profile, address: e.target.value})} />
                  </div>
               </div>
               <div className="sap-form-row">
                  <div className="sap-group">
                     <label>State</label>
                     <input value={profile.state || ""} readOnly={!isEditing} onChange={(e) => setProfile({...profile, state: e.target.value})} />
                  </div>
                  <div className="sap-group">
                     <label>Pincode / Zip</label>
                     <input value={profile.pincode || ""} readOnly={!isEditing} onChange={(e) => setProfile({...profile, pincode: e.target.value})} />
                  </div>
               </div>
            </div>

            {/* Support Contact */}
            <div className="sap-form-card">
               <h3 className="sap-form-title"><FaPhone /> Emergency Contact</h3>
               <div className="sap-group">
                  <label>Emergency Contact Name/Relation</label>
                  <input 
                    value={profile.emergencyContact || ""} 
                    readOnly={!isEditing} 
                    onChange={(e) => setProfile({...profile, emergencyContact: e.target.value})} 
                  />
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminProfile;
