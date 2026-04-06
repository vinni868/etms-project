import {
  FaBook, FaChalkboardTeacher, FaUsers,
  FaLayerGroup, FaCheckCircle, FaTimesCircle,
  FaUserSlash, FaUserCheck, FaUserGraduate, FaUserTie,
  FaSync, FaCalendarTimes
} from "react-icons/fa";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axiosConfig";
import "./AdminDashboard.css";
import QuickPunch from "../../components/QuickPunch/QuickPunch";
import AttendanceRules from "../../components/AttendanceRules/AttendanceRules";

/* ── Constants ── */
const PAGE_SIZE_APPROVAL = 8;
const PAGE_SIZE_USERS    = 10;

const AVATAR_COLORS = [
  { bg:"#eff6ff", color:"#2563eb" }, { bg:"#f5f3ff", color:"#7c3aed" },
  { bg:"#ecfdf5", color:"#059669" }, { bg:"#fff7ed", color:"#ea580c" },
  { bg:"#fdf2f8", color:"#db2777" }, { bg:"#ecfeff", color:"#0891b2" },
];

const STATUS_META = {
  ACTIVE:   { label:"Active",   cls:"adm-status--active",   dot:"●" },
  PENDING:  { label:"Pending",  cls:"adm-status--pending",  dot:"◐" },
  INACTIVE: { label:"Inactive", cls:"adm-status--inactive", dot:"○" },
  REJECTED: { label:"Rejected", cls:"adm-status--rejected", dot:"✕" },
};

/* ── Reusable components ── */
function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.INACTIVE;
  return <span className={`adm-status-badge ${m.cls}`}>{m.dot} {m.label}</span>;
}

function Avatar({ name, idx }) {
  const s = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  return (
    <div className="adm-avatar" style={{ background: s.bg, color: s.color }}>
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

function RoleTag({ role }) {
  const r = (role || "").toLowerCase();
  return (
    <span className={`adm-role-tag adm-role-tag--${r}`}>
      {role || "—"}
    </span>
  );
}

function ActionBtns({ user, onApprove, onReject, onDeactivate, onActivate }) {
  const isPending = user.status === "PENDING" || user.approvalStatus === "PENDING";
  const isStudent = user.role?.roleName === "STUDENT";

  return (
    <div className="adm-action-group">
      {isPending && (
        <>
          {isStudent ? (
            <>
              <button className="adm-btn adm-btn--approve" onClick={() => onApprove(user.id)}>
                <FaCheckCircle /> Approve
              </button>
              <button className="adm-btn adm-btn--reject" onClick={() => onReject(user.id)}>
                <FaTimesCircle /> Reject
              </button>
            </>
          ) : (
            <>
              <span className="adm-btn adm-btn--locked" title="Super Admin approval required for this role">
                🔒 Super Admin Review
              </span>
              <button className="adm-btn adm-btn--locked" style={{opacity: 0.5}} disabled>
                <FaTimesCircle /> Reject Restricted
              </button>
            </>
          )}
        </>
      )}
      {!isPending && isStudent && user.status === "ACTIVE" && (
        <button className="adm-btn adm-btn--deactivate" onClick={() => onDeactivate(user.id)}>
          <FaUserSlash /> Deactivate
        </button>
      )}
      {!isPending && isStudent && (user.status === "INACTIVE" || user.status === "REJECTED") && (
        <button className="adm-btn adm-btn--activate" onClick={() => onActivate(user.id)}>
          <FaUserCheck /> Activate
        </button>
      )}
      {!isPending && !isStudent && (
        <span className="adm-btn adm-btn--locked" style={{fontStyle: 'normal'}} title="Staff lifecycle is managed exclusively by Super Admin">
          🔒 Super Admin Managed
        </span>
      )}
    </div>
  );
}

function Pagination({ currentPage, totalPages, onChange, total, pageSize }) {
  if (totalPages <= 1) return null;
  const from = (currentPage - 1) * pageSize + 1;
  const to   = Math.min(currentPage * pageSize, total);

  const nums = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p===1 || p===totalPages || (p>=currentPage-1 && p<=currentPage+1)) nums.push(p);
    else if (p===2 && currentPage>3) nums.push("...");
    else if (p===totalPages-1 && currentPage<totalPages-2) nums.push("...");
  }
  const deduped = [...new Set(nums)];

  return (
    <div className="adm-pagination">
      <span className="adm-pag-info">{from}–{to} of {total}</span>
      <div className="adm-pag-btns">
        <button className="adm-pag-btn adm-pag-nav" disabled={currentPage===1}
          onClick={() => onChange(p => p - 1)}>‹ Prev</button>
        {deduped.map((p, i) =>
          p === "..."
            ? <span key={`e${i}`} className="adm-pag-dots">…</span>
            : <button key={p}
                className={`adm-pag-btn ${currentPage===p ? "adm-pag-btn--on" : ""}`}
                onClick={() => onChange(p)}>{p}</button>
        )}
        <button className="adm-pag-btn adm-pag-nav" disabled={currentPage===totalPages}
          onClick={() => onChange(p => p + 1)}>Next ›</button>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [data, setData] = useState({
    totalCourses: 0, totalTrainers: 0, totalStudents: 0, activeBatches: 0, pendingApprovals: 0
  });
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState([]);

  const [activeSection, setActiveSection] = useState("approval");
  const [approvalSearch, setApprovalSearch] = useState("");
  const [approvalPage,   setApprovalPage]   = useState(1);
  const [userSearch,   setUserSearch]   = useState("");
  const [roleFilter,   setRoleFilter]   = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [userPage,     setUserPage]     = useState(1);

  const [nowTime, setNowTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNowTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  })();

  useEffect(() => { setApprovalPage(1); }, [approvalSearch]);
  useEffect(() => { setUserPage(1); }, [userSearch, roleFilter, statusFilter]);

  const fetchDashboardData = async () => {
    try { const res = await api.get("/admin/dashboard"); setData(res.data); }
    catch (err) { console.error(err); }
  };

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/all-users");
      const list = res.data || [];
      setUsers(list.filter(u => u.role?.roleName !== "SUPERADMIN"));
    } catch (err) { 
      console.error("Dashboard reload failed:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchRecentNotifs = async () => {
    try {
      const res = await api.get("/notifications/unread");
      setRecentNotifs(res.data.slice(0, 5));
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchDashboardData(); fetchAllUsers(); fetchRecentNotifs(); }, []);

  const approveUser    = async (id) => { 
    let overrideId = window.prompt("To auto-generate ID, leave blank. To manually assign an ID, enter it below:");
    if (overrideId === null) return; 
    await api.patch(`/admin/users/approve/${id}`, { generatedId: overrideId });
    fetchAllUsers(); fetchDashboardData(); 
  };
  const rejectUser     = async (id) => { await api.patch(`/admin/users/reject/${id}`);     fetchAllUsers(); };
  const deactivateUser = async (id) => { await api.patch(`/admin/users/${id}/status`); fetchAllUsers(); };
  const reactivateUser = async (id) => { await api.patch(`/admin/users/${id}/status`); fetchAllUsers(); fetchDashboardData(); };
  const handleRefresh  = () => { fetchDashboardData(); fetchAllUsers(); fetchRecentNotifs(); };

  const pendingUsers  = users.filter(u => u.status === "PENDING" || u.approvalStatus === "PENDING");
  const pendingCount  = pendingUsers.length;
  const studentsCount = users.filter(u => u.role?.roleName === "STUDENT").length;
  const trainersCount = users.filter(u => u.role?.roleName === "TRAINER").length;
  const marketersCount = users.filter(u => u.role?.roleName === "MARKETER").length;
  const counselorsCount = users.filter(u => u.role?.roleName === "COUNSELOR").length;
  const activeCount   = users.filter(u => u.status === "ACTIVE").length;

  const approvalList = users
    .filter(u => {
      const t = approvalSearch.toLowerCase();
      const matchSearch = !t || u.name?.toLowerCase().includes(t) || u.email?.toLowerCase().includes(t);
      return matchSearch;
    })
    .sort((a, b) => {
      if (a.status==="PENDING" && b.status!=="PENDING") return -1;
      if (a.status!=="PENDING" && b.status==="PENDING") return 1;
      return 0;
    });

  const approvalTotalPages = Math.max(1, Math.ceil(approvalList.length / PAGE_SIZE_APPROVAL));
  const approvalPaged = approvalList.slice(
    (approvalPage-1)*PAGE_SIZE_APPROVAL, approvalPage*PAGE_SIZE_APPROVAL
  );

  const allUsersList = users.filter(u => {
    const t = userSearch.toLowerCase();
    const matchSearch = !t || u.name?.toLowerCase().includes(t)
      || u.email?.toLowerCase().includes(t) || u.phone?.toLowerCase().includes(t);
    const matchRole   = roleFilter==="ALL" || u.role?.roleName === roleFilter;
    const matchStatus = statusFilter==="ALL" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const userTotalPages = Math.max(1, Math.ceil(allUsersList.length / PAGE_SIZE_USERS));
  const userPaged = allUsersList.slice(
    (userPage-1)*PAGE_SIZE_USERS, userPage*PAGE_SIZE_USERS
  );

  const showRoleColumn = roleFilter === "ALL";

  const STAT_CARDS = [
    { label:"Total Courses",  val:data.totalCourses,  icon:<FaBook />,              cls:"adm-sc--blue",   delay:"0.05s" },
    { label:"Total Trainers", val:data.totalTrainers, icon:<FaChalkboardTeacher />, cls:"adm-sc--purple", delay:"0.10s" },
    { label:"Total Students", val:data.totalStudents, icon:<FaUsers />,              cls:"adm-sc--green",  delay:"0.15s" },
    { label:"Active Batches", val:data.activeBatches, icon:<FaLayerGroup />,         cls:"adm-sc--amber",  delay:"0.20s" },
    { label:"Pending Approvals", val:data.pendingApprovals, icon:<FaUserCheck />,    cls:"adm-sc--amber",  delay:"0.25s" },
    { label:"Student Leaves", val: "Manage", icon:<FaCalendarTimes />, onClick: () => navigate("/admin/leave"), cls:"adm-sc--blue", delay:"0.30s" },
  ];

  return (
    <div className="adm-page">

      {/* ══════════ HERO HEADER ══════════ */}
      <header className="adm-hero">
        <div className="adm-hero__orb adm-hero__orb--1" />
        <div className="adm-hero__orb adm-hero__orb--2" />
        <div className="adm-hero__orb adm-hero__orb--3" />

        <div className="adm-hero__inner">
          <div className="adm-hero__left">
            <div className="adm-greeting-chip">{greeting} 👋</div>
            <h1 className="adm-hero__name">{user?.name || "Administrator"}</h1>
            {(user?.portalId || user?.studentId) && (
              <div className="adm-hero__id-badge">System ID: {user.portalId || user.studentId}</div>
            )}
            <p className="adm-hero__role">Admin Portal · EtMS Smart Learning</p>
          </div>

          <div className="adm-hero__right">
            <div className="adm-hero__right-box">
              <div className="adm-live-clock">
                <div className="adm-clock__time">
                  {nowTime.toLocaleTimeString('en-US', { hour:"2-digit", minute:"2-digit", hour12:true }).toUpperCase()}
                </div>
                <div className="adm-clock__date">
                  {nowTime.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}
                </div>
              </div>

              <button className="adm-refresh-btn" onClick={handleRefresh} title="Refresh">
                <FaSync />
              </button>
            </div>
          </div>
        </div>

        {/* Stat pills */}
        <div className="adm-hero__stats">
          {STAT_CARDS.map((c, i) => (
            <div key={i} className={`adm-stat-pill ${c.cls}`} style={{ animationDelay: c.delay, cursor: c.onClick ? 'pointer' : 'default' }} onClick={c.onClick}>
              <div className="adm-stat-pill__icon">{c.icon}</div>
              <div className="adm-stat-pill__body">
                <span className="adm-stat-pill__val">{c.val}</span>
                <span className="adm-stat-pill__lbl">{c.label}</span>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* ══════════ QUICK PUNCH (HORIZONTAL BAR) ══════════ */}
      <div className="adm-punch-container" style={{ margin: '20px 30px 10px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <QuickPunch variant="horizontal" />
        <AttendanceRules />
      </div>

      {/* ══════════ LIVE STATUS OVERVIEW ══════════ */}
      <div className="adm-status-overview">
        <div className="adm-status-card adm-status-card--student">
          <div className="adm-status-card__meta"><FaUserGraduate /> Students</div>
          <div className="adm-status-card__val">{studentsCount}</div>
        </div>
        <div className="adm-status-card adm-status-card--trainer">
          <div className="adm-status-card__meta"><FaUserTie /> Trainers</div>
          <div className="adm-status-card__val">{trainersCount}</div>
        </div>
        <div className="adm-status-card adm-status-card--active">
          <div className="adm-status-card__meta"><div className="adm-live-pulse" /> Live Active</div>
          <div className="adm-status-card__val">{activeCount}</div>
        </div>
      </div>

      {/* ══════════ RECENT ACTIVITY ══════════ */}
      {recentNotifs.length > 0 && (
        <div className="adm-activity-widget">
          <div className="adm-card" style={{ marginBottom: 0 }}>
            <div className="adm-card__toolbar">
               <h3 className="adm-card__title">Recent System Activity</h3>
               <Link to="/admin/notifications" className="adm-link" style={{ fontSize: '12px' }}>History →</Link>
            </div>
            <div className="adm-activity-grid">
              {recentNotifs.map(n => {
                const isLeave  = n.type?.toUpperCase() === "LEAVE" || n.message?.toLowerCase().includes("leave");
                const isEnroll = n.message?.toLowerCase().includes("enrol") || n.message?.toLowerCase().includes("mapping");
                const isFee    = n.type?.toUpperCase() === "FEE" || n.message?.toLowerCase().includes("pay");
                
                const itemClass = isLeave ? "adm-activity-item--leave" : isEnroll ? "adm-activity-item--enroll" : isFee ? "adm-activity-item--fees" : "";
                
                return (
                  <div key={n.id} className={`adm-activity-item ${itemClass}`}>
                    <div className="adm-activity-content">
                      <div className="adm-activity-msg">{n.message}</div>
                      <div className="adm-activity-meta">
                        {new Date(n.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}
                        <span className="adm-activity-dot">●</span>
                        {n.type || "System"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ SECTION TABS ══════════ */}
      <div className="adm-section-tabs">
        <button
          className={`adm-sec-tab ${activeSection==="approval" ? "adm-sec-tab--active" : ""}`}
          onClick={() => setActiveSection("approval")}
        >
          <FaCheckCircle /> User Approvals
          {pendingCount > 0 && <span className="adm-tab-badge">{pendingCount}</span>}
        </button>
        <button
          className={`adm-sec-tab ${activeSection==="users" ? "adm-sec-tab--active" : ""}`}
          onClick={() => setActiveSection("users")}
        >
          <FaUsers /> All Users
          <span className="adm-tab-chip">{users.length}</span>
        </button>
      </div>

      {/* ══════════ TABLE CONTENT ══════════ */}
      {activeSection === "approval" ? (
        <div className="adm-card">
          <div className="adm-card__toolbar">
            <div className="adm-card__toolbar-left">
              <h3 className="adm-card__title">User Approvals</h3>
              {pendingCount > 0 && <span className="adm-pending-chip">⚠ {pendingCount} pending</span>}
            </div>
            <div className="adm-search">
              <span className="adm-search__ico">🔍</span>
              <input className="adm-search__inp" type="text" placeholder="Search by name or email…" value={approvalSearch} onChange={e => setApprovalSearch(e.target.value)} />
            </div>
          </div>
          <Pagination currentPage={approvalPage} totalPages={approvalTotalPages} onChange={setApprovalPage} total={approvalList.length} pageSize={PAGE_SIZE_APPROVAL} />
          <div className="adm-table-wrap">
            <table className="adm-table responsive-card-table">
              <thead><tr><th>#</th><th>User Details</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan="5"><div className="adm-spinner"/></td></tr> : approvalPaged.length === 0 ? <tr><td colSpan="5">No users found.</td></tr> :
                  approvalPaged.map((u, i) => {
                    const idx = (approvalPage-1)*PAGE_SIZE_APPROVAL + i;
                    return (
                      <tr key={u.id} className={u.status==="PENDING" ? "adm-row--pending" : ""}>
                        <td className="adm-td--num" data-label="#"><span className="adm-rnum">{idx+1}</span></td>
                        <td className="adm-td" data-label="User Details"><div className="adm-user-cell"><Avatar name={u.name} idx={idx} /><div><div className="adm-user-cell__name">{u.name}</div><div className="adm-user-cell__sub">{u.email}</div></div></div></td>
                        <td className="adm-td" data-label="Role"><RoleTag role={u.role?.roleName} /></td>
                        <td className="adm-td" data-label="Status"><StatusBadge status={u.status} /></td>
                        <td className="adm-td--actions" data-label="Actions"><ActionBtns user={u} onApprove={approveUser} onReject={rejectUser} onDeactivate={deactivateUser} onActivate={reactivateUser} /></td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="adm-card">
          <div className="adm-card__toolbar adm-card__toolbar--wrap">
            <div className="adm-card__toolbar-left"><h3 className="adm-card__title">All Users</h3></div>
            <div className="adm-filters-row">
              <div className="adm-filter-tabs">
                {["ALL","STUDENT","TRAINER", "MARKETER", "COUNSELOR"].map(r => (
                  <button key={r} className={`adm-ftab ${roleFilter===r ? "adm-ftab--on" : ""}`} onClick={() => { setRoleFilter(r); setUserPage(1); }}>{r}</button>
                ))}
              </div>
              <div className="adm-search">
                 <input className="adm-search__inp" type="text" placeholder="Search..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              </div>
            </div>
          </div>
          <Pagination currentPage={userPage} totalPages={userTotalPages} onChange={setUserPage} total={allUsersList.length} pageSize={PAGE_SIZE_USERS} />
          <div className="adm-table-wrap">
            <table className="adm-table responsive-card-table">
              <thead><tr><th>#</th><th>Name</th><th>Email</th>{showRoleColumn && <th>Role</th>}<th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan="6">Loading...</td></tr> : userPaged.map((u, i) => {
                  const idx = (userPage-1)*PAGE_SIZE_USERS + i;
                  return (
                    <tr key={u.id}>
                      <td className="adm-td--num" data-label="#"><span className="adm-rnum">{idx+1}</span></td>
                      <td className="adm-td" data-label="Name"><div className="adm-user-cell"><Avatar name={u.name} idx={idx} /><span className="adm-user-cell__name">{u.name}</span></div></td>
                      <td className="adm-td" data-label="Email">{u.email}</td>
                      {showRoleColumn && <td className="adm-td" data-label="Role"><RoleTag role={u.role?.roleName} /></td>}
                      <td className="adm-td" data-label="Status"><StatusBadge status={u.status} /></td>
                      <td className="adm-td--actions" data-label="Actions"><ActionBtns user={u} onApprove={approveUser} onReject={rejectUser} onDeactivate={deactivateUser} onActivate={reactivateUser} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;