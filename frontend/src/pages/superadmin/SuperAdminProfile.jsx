import { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import "./SuperAdminProfile.css";
import "./SuperAdminCommon.css";
import { 
  FaUserShield, FaEnvelope, FaPhone, FaMapMarkerAlt, 
  FaInfoCircle, FaEdit, FaSave, FaTimes, FaCamera, FaMedal, FaCrown,
  FaExclamationTriangle, FaSync, FaIdCard, FaGlobe, FaCogs
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
      setError(err.response?.data?.message || "Unable to connect to security server.");
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
      alert("System Identity Protocol Updated ✅");
    } catch (err) {
      alert(`Update failed: ${err.message} ❌`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="sap-loader">
      <div className="sap-spinner"></div>
      <p>Synchronizing Authority Credentials...</p>
    </div>
  );

  if (error || !profile) return (
    <div className="sap-loader sa-error-state">
      <FaExclamationTriangle size={50} color="#ef4444" />
      <h2>Connection Interrupt</h2>
      <p>{error || "Profile data is currently inaccessible."}</p>
      <button className="sa-retry-btn" onClick={fetchProfile}>
        <FaSync /> Retry Sync
      </button>
    </div>
  );

  const strength = calculateStrength(profile);

  return (
    <div className="sa-page">
      <div className="sa-wrapper um-wrapper-extra um-wrapper-single">
        
        {/* ── CORE CONTENT PANEL ── */}
        <div className="sap-content-panel">
          
          {/* New Top Analytics Rectangle */}
          <div className="sap-stats-rectangle">
            <div className="sap-stat-card">
              <div className="sap-stat-icon"><FaMedal /></div>
              <div className="sap-stat-info">
                <span className="sap-stat-val">{strength}%</span>
                <span className="sap-stat-lbl">Integrity Sync</span>
              </div>
            </div>
            <div className="sap-stat-divider" />
            <div className="sap-stat-card">
              <div className="sap-stat-icon"><FaUserShield /></div>
              <div className="sap-stat-info">
                <span className="sap-stat-val">LEVEL 10</span>
                <span className="sap-stat-lbl">Clearance</span>
              </div>
            </div>
            <div className="sap-stat-divider" />
            <div className="sap-stat-card">
              <div className="sap-stat-icon">
                <span className="sa-dot-active"></span>
              </div>
              <div className="sap-stat-info">
                <span className="sap-stat-val">ACTIVE</span>
                <span className="sap-stat-lbl">Node Status</span>
              </div>
            </div>
            <div className="sap-stat-divider" />
            <div className="sap-stat-card">
              <div className="sap-stat-info">
                <span className="sap-stat-val" style={{fontSize: '0.9rem'}}>{profile.portalId || profile.studentId || "ROOT-001"}</span>
                <span className="sap-stat-lbl">System Identity</span>
              </div>
            </div>
          </div>          {/* 1. Action Hub - NOW FIRST AS REQUESTED */}
          <div className="sap-hub-section" style={{marginTop: '0', padding: '0 2rem'}}>
             <div className="sap-hub-header">
                <div className="sap-hh-left">
                   <h2>Operations Dashboard</h2>
                   <p>System Authority Management & Identity Protocol</p>
                </div>
                <div className="sap-hh-right">
                    {!isEditing ? (
                      <button className="sap-btn-action edit" onClick={handleEdit}>
                        <FaEdit /> MODIFY CORE
                      </button>
                    ) : (
                      <div className="sap-btn-group">
                        <button className="sap-btn-action cancel" onClick={handleCancel}><FaTimes /> ABORT</button>
                        <button className="sap-btn-action save" onClick={handleSave} disabled={saving}>
                          <FaSave /> {saving ? "SYNCING..." : "COMMIT"}
                        </button>
                      </div>
                    )}
                </div>
             </div>
          </div>

          {/* Hero Banner Section */}
          <div className="sap-banner-complex" style={{margin: '1rem 2rem 5rem 2rem'}}>
             <div className="sap-banner-gradient"></div>
             <div className="sap-banner-mesh"></div>
             
             {/* Overlapping Floating Identity Card */}
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
                        <span className="sap-st-lbl">INTEGRITY</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="sap-asym-grid">
                
                {/* 1. Primary Directives (Wide) */}
                <div className="sap-asym-card sap-asym-card--primary">
                   <div className="sap-card-tag"><FaUserShield /> CORE PROTOCOL</div>
                   <div className="sap-field-row">
                      <div className="sap-f-group">
                         <label>Full Identity</label>
                         <input 
                           value={profile.name || ""} 
                           readOnly={!isEditing} 
                           onChange={(e) => setProfile({...profile, name: e.target.value})}
                         />
                      </div>
                      <div className="sap-f-group">
                         <label>Secure Identifier</label>
                         <input value={profile.email || ""} readOnly className="locked" />
                      </div>
                   </div>
                   <div className="sap-field-row">
                      <div className="sap-f-group">
                         <label>Comm Frequency</label>
                         <input 
                           value={profile.phone || ""} 
                           readOnly={!isEditing} 
                           onChange={(e) => setProfile({...profile, phone: e.target.value})}
                         />
                      </div>
                      <div className="sap-f-group">
                         <label>Gender Heuristic</label>
                         <select value={profile.gender || ""} disabled={!isEditing} onChange={(e) => setProfile({...profile, gender: e.target.value})}>
                            <option value="">NOT SET</option>
                            <option value="MALE">MALE</option>
                            <option value="FEMALE">FEMALE</option>
                         </select>
                      </div>
                   </div>
                </div>

                {/* 2. Operational Bio (Tall) */}
                <div className="sap-asym-card sap-asym-card--bio">
                   <div className="sap-card-tag"><FaInfoCircle /> AUTHORITY BIO</div>
                   <textarea 
                     value={profile.bio || ""} 
                     readOnly={!isEditing} 
                     placeholder="State your institutional mission..."
                     onChange={(e) => setProfile({...profile, bio: e.target.value})}
                   />
                </div>

                {/* 3. Deployment Matrix */}
                <div className="sap-asym-card sap-asym-card--location">
                   <div className="sap-card-tag"><FaGlobe /> DEPLOYMENT MATRIX</div>
                   <div className="sap-field-stack">
                      <div className="sap-f-group">
                         <label>Institutional Hub (City)</label>
                         <input value={profile.city || ""} readOnly={!isEditing} onChange={(e) => setProfile({...profile, city: e.target.value})} />
                      </div>
                      <div className="sap-f-group">
                         <label>Sector / Street</label>
                         <input value={profile.address || ""} readOnly={!isEditing} onChange={(e) => setProfile({...profile, address: e.target.value})} />
                      </div>
                      <div className="sap-f-group-dual">
                         <div className="sap-fg-mini">
                            <label>Region</label>
                            <input value={profile.state || ""} readOnly={!isEditing} onChange={(e) => setProfile({...profile, state: e.target.value})} />
                         </div>
                         <div className="sap-fg-mini">
                            <label>Zip</label>
                            <input value={profile.pincode || ""} readOnly={!isEditing} onChange={(e) => setProfile({...profile, pincode: e.target.value})} />
                         </div>
                      </div>
                   </div>
                </div>

                {/* 4. Resilience Node */}
                <div className="sap-asym-card sap-asym-card--resilience">
                   <div className="sap-card-tag"><FaPhone /> RESILIENCE NODE</div>
                   <div className="sap-f-group">
                      <label>Emergency Proxy Contact</label>
                      <input 
                        value={profile.emergencyContact || ""} 
                        readOnly={!isEditing} 
                        onChange={(e) => setProfile({...profile, emergencyContact: e.target.value})} 
                      />
                   </div>
                </div>

                {/* 5. Avatar Update - MOVED DOWN AS REQUESTED */}
                <div className="sap-asym-card sap-asym-card--avatar sap-asym-card--primary">
                   <div className="sap-card-tag"><FaCamera /> SECURITY ASSET MANAGEMENT</div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                      <div className="sap-avatar-preview">
                        <img src={profile.profilePicture || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="Preview" />
                      </div>
                      <div className="sap-avatar-controls">
                        <p style={{ fontSize: '0.85rem', color: 'var(--sa-text-muted)', marginBottom: '1rem' }}>
                          Upload a high-resolution identification asset. Compressed nodes will be rejected.
                        </p>
                        <button className="sap-btn-action edit" style={{ background: 'var(--sa-blue-mid)' }}>
                           <FaCamera /> UPDATE IDENTITY IMAGE
                        </button>
                      </div>
                   </div>
                </div>

                {/* Decorative Tech Card */}
                <div className="sap-asym-card sap-asym-card--visual">
                   <FaCogs size={50} className="sap-rot-icon" />
                   <div className="sap-viz-text">
                      <span>SYNC STATUS: 100%</span>
                      <span>LATENCY: 0.12ms</span>
                   </div>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminProfile;
