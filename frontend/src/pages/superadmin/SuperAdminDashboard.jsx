import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import "./SuperAdminDashboard.css";
import "./SuperAdminCommon.css";

/* ── Circular Ring ───────────────────────────────── */
function RingProgress({ percent = 0, color = "#2347c5", size = 52, stroke = 5 }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="sa-ring">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="#e8ecf4" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 1.2s ease-out" }} />
    </svg>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [punchSettings, setPunchSettings] = useState({
    latitude: 0, longitude: 0, radiusMeters: 200, lateThreshold: "10:00"
  });
  const [savetip, setSavetip] = useState("");

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get("/superadmin/dashboard");
      setDashboard(res.data);
      fetchPunchSettings();
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
      else setError("Connection lost. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPunchSettings = async () => {
    try {
      const res = await api.get("/qr/punch-settings");
      setPunchSettings(res.data);
    } catch (err) {
      console.error("Failed to fetch punch settings", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const navItems = [
    { key: "dashboard", label: "Dashboard",       icon: "⊞",  path: "/superadmin/dashboard" },
    { key: "users",     label: "User Management", icon: "👥", path: "/superadmin/create-admin" },
    { key: "finance",   label: "Finance",          icon: "₹",  path: "/superadmin/finance" },
    { key: "meetings",  label: "Meetings",         icon: "📅", path: "/superadmin/meetings" },
    { key: "messages",  label: "Messages",         icon: "📩", path: "/superadmin/messages", badge: true },
    { key: "analytics", label: "Analytics",        icon: "📊", path: "/superadmin/analytics" },
  ];

  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      setPunchSettings(prev => ({
        ...prev,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      }));
      setSavetip("Detected! Remember to Save Changes.");
    }, (err) => {
      alert("Error detecting location: " + err.message);
    });
  };

  const handleSaveSettings = async () => {
    try {
      await api.post("/qr/punch-settings", punchSettings);
      setSavetip("Settings saved successfully! ✅");
      setTimeout(() => setSavetip(""), 3000);
    } catch (err) {
      alert("Failed to save settings: " + (err.response?.data?.message || err.message));
    }
  };

  /* ── LOADING ── */
  if (loading) return (
    <div className="sa-loading">
      <div className="sa-load-brand">
        <span className="slb-et">Et</span><span className="slb-ms">MS</span>
      </div>
      <div className="sa-load-track"><div className="sa-load-fill" /></div>
      <p>Syncing Command Center…</p>
    </div>
  );

  /* ── ERROR ── */
  if (error) return (
    <div className="sa-error-screen">
      <span>⚠️</span><p>{error}</p>
      <button className="sa-btn" onClick={fetchDashboard}>Retry</button>
    </div>
  );

  const totalUsers = (dashboard.totalStudents || 0) + (dashboard.totalTrainers || 0) + (dashboard.totalAdmins || 0);

  const statCards = [
    {
      icon: "₹",  label: "Revenue (MTD)",
      value: `₹${dashboard.totalRevenue?.toLocaleString() || "0"}`,
      trend: "+12.5%", up: true, ring: 72,
      ringColor: "#2347c5", iconBg: "#eef2fd", iconColor: "#2347c5", accent: true,
    },
    {
      icon: "📈", label: "Net Profit",
      value: `₹${dashboard.netProfit?.toLocaleString() || "0"}`,
      trend: "+8.2%", up: true, ring: 65,
      ringColor: "#16a34a", iconBg: "#dcfce7", iconColor: "#16a34a",
    },
    {
      icon: "👥", label: "Registry Growth",
      value: totalUsers.toLocaleString(),
      trend: `+${dashboard.activeStudents || 0} active students`, up: true, ring: Math.min(100, (dashboard.activeStudents || 0) / (dashboard.totalStudents || 1) * 100),
      ringColor: "#f97316", iconBg: "#fff7ed", iconColor: "#f97316",
    },
    {
      icon: "✅", label: "Placement Rate",
      value: `${dashboard.placementRate || "0"}%`,
      trend: "Above target", up: true, ring: dashboard.placementRate || 0,
      ringColor: "#7c3aed", iconBg: "#f5f3ff", iconColor: "#7c3aed",
    },
  ];

  return (
    <div className={`sa-shell ${collapsed ? "sa-collapsed" : ""}`}>


      {/* ══════════ MAIN AREA ══════════ */}
      <div className="sa-main">

        {/* TOP BAR */}
        <header className="sa-topbar">
          <div className="sa-topbar-left">
            <div className="sa-topbar-icon-box">⊞</div>
            <div>
              <h1 className="sa-page-title">Command Center</h1>
              <p className="sa-page-sub">
                Welcome back, <strong>{user?.name || "Commander"}</strong>
                {(user?.portalId || user?.studentId) && (
                  <span className="sa-topbar-id"> [ID: {user.portalId || user.studentId}]</span>
                )}
                 — All systems nominal
              </p>
            </div>
          </div>
          <div className="sa-topbar-right">
            <div className="sa-date-pill">
              <span>📅</span>
              {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </div>
            <button className="sa-notif-btn" onClick={() => navigate("/superadmin/messages")}>
              📩
              {(dashboard.unreadMessages || 0) > 0 && (
                <span className="sa-notif-dot">{dashboard.unreadMessages}</span>
              )}
            </button>
            <div className="sa-topbar-av">{user?.name?.charAt(0) || "A"}</div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="sa-content">

          {/* HERO */}
          <div className="sa-hero">
            <div className="sa-hero-left">
              <p className="sa-hero-eyebrow">🚀 Super Admin Dashboard</p>
              <h2 className="sa-hero-heading">
                Good {getTimeOfDay()}, {user?.name?.split(" ")[0] || "Commander"}
              </h2>
              <p className="sa-hero-desc">Here's what's happening across your platform today.</p>
              <div className="sa-hero-chips">
                <span className="sa-chip blue">🟢 {dashboard.totalStudents || 0} Students</span>
                <span className="sa-chip gold">⚡ {dashboard.activeBatches || 0} Active Batches</span>
                <span className="sa-chip green">📚 {dashboard.totalCourses || 0} Courses</span>
                {dashboard.pendingApprovals > 0 && (
                  <span 
                    className="sa-chip red" 
                    onClick={() => navigate("/superadmin/users?status=PENDING")} 
                    style={{cursor: 'pointer'}}
                  >
                    🔔 {dashboard.pendingApprovals} Pending Approvals
                  </span>
                )}
              </div>
            </div>
            <div className="sa-hero-right">
              <div className="sa-hero-revenue-box">
                <span className="sa-hrb-label">Revenue (MTD)</span>
                <span className="sa-hrb-value">₹{dashboard.totalRevenue?.toLocaleString() || "0"}</span>
                <span className="sa-hrb-trend up">▲ 12.5% vs last month</span>
              </div>
            </div>
            <div className="sa-hero-blob sa-hero-blob-1" />
            <div className="sa-hero-blob sa-hero-blob-2" />
          </div>

          {/* STAT CARDS */}
          <div className="sa-stats">
            {statCards.map((s, i) => (
              <div
                key={i}
                className={`sa-stat ${s.accent ? "sa-stat-hl" : ""}`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="sa-stat-top">
                  <div className="sa-stat-icon" style={{ background: s.iconBg, color: s.iconColor }}>
                    {s.icon}
                  </div>
                  <RingProgress percent={s.ring} color={s.ringColor} />
                </div>
                <div className="sa-stat-value" style={{ color: s.iconColor }}>{s.value}</div>
                <div className="sa-stat-label">{s.label}</div>
                <div className={`sa-stat-trend ${s.up ? "up" : "down"}`}>
                  {s.up ? "▲" : "▼"} {s.trend}
                </div>
              </div>
            ))}
          </div>

          {/* GRID */}
          <div className="sa-grid">

            {/* AI Insights */}
            <div className="sa-card sa-ai-card">
              <div className="sa-card-hd">
                <div className="sa-card-ic" style={{ background: "#fffbeb" }}>🤖</div>
                <h3>AI Strategic Insights</h3>
                <span className="sa-badge gold">● LIVE</span>
              </div>
              <div className="sa-insight-list">
                {(dashboard.alerts || []).map((a, i) => (
                  <div className="sa-insight" key={i}>
                    <span className="sa-ins-dot blue" /><p>{a}</p>
                  </div>
                ))}
                <div className="sa-insight sa-ins-hl">
                  <span className="sa-ins-dot gold" />
                  <p><strong>Optimization Tip:</strong> Student engagement in "Generative AI" is peaking — consider expanding batch capacity.</p>
                </div>
                <div className="sa-insight">
                  <span className="sa-ins-dot green" />
                  <p>Trainer satisfaction is above average this quarter. Keep incentives consistent.</p>
                </div>
              </div>
            </div>

            {/* Platform Overview */}
            <div className="sa-card">
              <div className="sa-card-hd">
                <div className="sa-card-ic">📊</div>
                <h3>Platform Overview</h3>
              </div>
              <div className="sa-ov-grid">
                <OvTile icon="📚" value={dashboard.totalCourses  || 0} label="Courses"  color="blue" />
                <OvTile icon="🎓" value={dashboard.totalBatches  || 0} label="Batches"  color="gold" />
                <OvTile icon="👨‍🏫" value={dashboard.totalTrainers || 0} label="Trainers" color="green" />
                <OvTile icon="👩‍💻" value={dashboard.totalStudents || 0} label="Students" color="orange" />
                <OvTile icon="🏫" value={dashboard.totalAdmins   || 0} label="Admins"   color="purple" />
                <OvTile icon="✅" value={dashboard.activeBatches || 0} label="Active"   color="blue" />
              </div>
              <button className="sa-link-btn" onClick={() => navigate("/superadmin/analytics")}>
                View Full Analytics →
              </button>
            </div>

            {/* Meetings */}
            <div className="sa-card">
              <div className="sa-card-hd">
                <div className="sa-card-ic">📅</div>
                <h3>Upcoming Meetings</h3>
              </div>
              {(dashboard.upcomingMeetings || 0) > 0 ? (
                <div className="sa-meeting-box">
                  <span className="sa-meet-num">{dashboard.upcomingMeetings}</span>
                  <span className="sa-meet-sub">Meetings Scheduled</span>
                </div>
              ) : (
                <div className="sa-empty">
                  <span>📭</span><p>No upcoming sessions</p>
                </div>
              )}
              <button className="sa-btn full-w" onClick={() => navigate("/superadmin/meetings")}>
                Manage Schedule
              </button>
            </div>

            {/* System Health */}
            <div className="sa-card">
              <div className="sa-card-hd">
                <div className="sa-card-ic">⚡</div>
                <h3>System Health</h3>
                <span className="sa-badge green">ALL ONLINE</span>
              </div>
              <ul className="sa-health-list">
                <HealthRow label="Database"     status="Online"           dot="green" />
                <HealthRow label="API Gateway"  status="Peak Performance" dot="green" />
                <HealthRow label="AI Service"   status="Ready"            dot="gold"  />
                <HealthRow label="CDN / Assets" status="Operational"      dot="green" />
                <HealthRow label="Auth Server"  status="Secure"           dot="green" />
              </ul>
            </div>

            {/* Attendance Configuration */}
            <div className="sa-card sa-settings-card">
              <div className="sa-card-hd">
                <div className="sa-card-ic" style={{ background: "#f0fdf4" }}>📍</div>
                <h3>Attendance Configuration</h3>
                <span className="sa-badge blue">GEOFENCING</span>
              </div>
              <div className="sa-settings-form" style={{ padding: '15px' }}>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '15px' }}>
                  Set your institute's coordinates to restrict "Quick Punch" usage.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
                  <div className="sa-form-group">
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Latitude</label>
                    <input type="number" step="any" value={punchSettings.latitude} 
                      onChange={e => setPunchSettings({...punchSettings, latitude: parseFloat(e.target.value)})}
                      className="sa-input" style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                  <div className="sa-form-group">
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Longitude</label>
                    <input type="number" step="any" value={punchSettings.longitude} 
                      onChange={e => setPunchSettings({...punchSettings, longitude: parseFloat(e.target.value)})}
                      className="sa-input" style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                </div>
                <div className="sa-form-group" style={{ marginBottom: '15px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Allowed Radius (Meters)</label>
                  <input type="number" value={punchSettings.radiusMeters} 
                    onChange={e => setPunchSettings({...punchSettings, radiusMeters: parseFloat(e.target.value)})}
                    className="sa-input" style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="sa-btn sa-btn--secondary" onClick={handleAutoDetect} style={{ flex: 1, fontSize: '12px' }}>
                    🛰 Detect My Location
                  </button>
                  <button className="sa-btn sa-btn--primary" onClick={handleSaveSettings} style={{ flex: 1, fontSize: '12px', background: '#2563eb', color: '#fff' }}>
                    💾 Save Changes
                  </button>
                </div>
                {savetip && <div style={{ marginTop: '12px', fontSize: '12px', color: '#059669', textAlign: 'center', fontWeight: '600' }}>{savetip}</div>}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="sa-card sa-qa-card">
              <div className="sa-card-hd">
                <div className="sa-card-ic">⚙</div>
                <h3>Quick Actions</h3>
              </div>
              <div className="sa-qa-grid">
                <QABtn icon="➕" label="Add Admin"  color="blue"   onClick={() => navigate("/superadmin/create-admin")} />
                <QABtn icon="📋" label="Finance"    color="green"  onClick={() => navigate("/superadmin/finance")} />
                <QABtn icon="📅" label="Schedule"   color="gold"   onClick={() => navigate("/superadmin/meetings")} />
                <QABtn icon="📩" label="Messages"   color="purple" onClick={() => navigate("/superadmin/messages")} />
                <QABtn icon="📊" label="Analytics"  color="orange" onClick={() => navigate("/superadmin/analytics")} />
                <QABtn icon="📅" label="Leave Mgt"  color="blue"   onClick={() => navigate("/superadmin/leave")} />
              </div>
            </div>

          </div>{/* /sa-grid */}
        </div>{/* /sa-content */}
      </div>{/* /sa-main */}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────── */
function OvTile({ icon, value, label, color }) {
  return (
    <div className={`sa-ov-tile ${color}`}>
      <span className="sa-ov-ic">{icon}</span>
      <span className="sa-ov-val">{value}</span>
      <span className="sa-ov-lbl">{label}</span>
    </div>
  );
}

function HealthRow({ label, status, dot }) {
  return (
    <li className="sa-health-row">
      <div className="sa-hr-left">
        <span className={`sa-hr-dot ${dot}`} />
        <span className="sa-hr-label">{label}</span>
      </div>
      <span className={`sa-hr-status ${dot}`}>{status}</span>
    </li>
  );
}

function QABtn({ icon, label, color, onClick }) {
  return (
    <button className={`sa-qa-btn ${color}`} onClick={onClick}>
      <span className="sa-qa-ic">{icon}</span>
      <span className="sa-qa-lbl">{label}</span>
    </button>
  );
}
