import { useState, useEffect, useRef, useMemo } from "react";
import { Outlet, useNavigate, NavLink, Link, useLocation } from "react-router-dom";
import Footer from "../components/Footer";
import { 
  FaPhoneAlt, FaEnvelope, FaFacebookF, FaTwitter, 
  FaLinkedinIn, FaInstagram, FaSignOutAlt,
  FaChevronDown, FaCog, FaShieldAlt, FaBullhorn,
  FaBook,  FaQrcode,
  FaBars,
  FaTimes,
  FaBriefcase,
  FaSatellite,
  FaUserShield,
  FaUsersCog,
  FaChartLine,
  FaClipboardList,
  FaChalkboardTeacher,
  FaLaptopCode,
  FaAward,
  FaHistory,
  FaCalendarAlt,
  FaBuilding,
  FaUserGraduate
} from 'react-icons/fa';
import GlobalAnnouncementPopup from "../components/GlobalAnnouncementPopup";
import NotificationDropdown from "../components/NotificationDropdown";
import "./DashboardLayout.css";

/* ============================================================ 
   PREMIUM MEGA LINK COMPONENT
   ============================================================ */
const MegaLink = ({ to, icon, name, desc, onClick }) => (
  <NavLink to={to} className="mega-link" onClick={onClick}>
    <div className="mega-icon-box">{icon}</div>
    <div className="mega-link-text">
      <span className="mega-link-name">{name}</span>
      {desc && <span className="mega-link-desc">{desc}</span>}
    </div>
  </NavLink>
);

/* ============================================================
   NAVIGATION DATA CONFIGURATION
   ============================================================ */
const NAV_CONFIG = {
  SUPERADMIN: [
    {
      group: "Governance Hub",
      id: "governance",
      items: [
        { to: "/superadmin/create-user", icon: <FaUsersCog />, name: "Provision", desc: "Manage core user accounts" },
        { to: "/superadmin/users", icon: "👥", name: "Global Directory", desc: "Cross-portal user database" },
        { to: "/superadmin/notifications", icon: <FaBullhorn />, name: "Notifications Hub", desc: "Manage system-wide alerts" },
        { to: "/superadmin/leave", icon: "📅", name: "Leave Board", desc: "Monitor staff/student absence" },
      ]
    },
    {
      group: "Intelligence Center",
      id: "analytics",
      items: [
        { to: "/superadmin/performance", icon: <FaChartLine />, name: "Performance Metrics", desc: "System-wide success tracking" },
        { to: "/superadmin/finance", icon: "💰", name: "Finance Ledger", desc: "Revenue and fee collection audits" },
        { to: "/superadmin/reviews", icon: "⭐", name: "Platform Reviews", desc: "Monitor user feedback" },
        { to: "/superadmin/attendance-report", icon: <FaClipboardList />, name: "Audit Log", desc: "Daily attendance consolidation" },
        { to: "/superadmin/violations", icon: "⚠️", name: "Violations", desc: "Attendance violation records" },
        { to: "/superadmin/meetings", icon: "🤝", name: "Strategy Room", desc: "Executive session scheduler" },
      ]
    },
    {
      group: "System Config",
      id: "config",
      items: [
        { to: "/superadmin/settings", icon: <FaCog />, name: "Core Settings", desc: "Global platform parameters" },
        { to: "/superadmin/qr-station", icon: <FaSatellite />, name: "Tracking Hardware", desc: "Maintain QR & GPS infrastructure" },
        { to: "/superadmin/announcements", icon: "📢", name: "Broadcasts", desc: "Global announcement alerts" },
        { to: "/superadmin/messages", icon: "💬", name: "Internal Comms", desc: "Admin messaging terminal" },
      ]
    }
  ],
  ADMIN: [
    {
      group: "Registry Hub",
      id: "admin-registry",
      items: [
        { to: "/admin/students", icon: <FaUserGraduate />, name: "Students", desc: "Complete student lifecycle" },
        { to: "/admin/trainers", icon: <FaChalkboardTeacher />, name: "Trainers", desc: "Instructors and trainers" },
        { to: "/admin/create-user", icon: "👤+", name: "Provision", desc: "Create new user accounts" },
        { to: "/admin/id-management", icon: "🔢", name: "ID Control", desc: "Access card and ID generator" },
      ]
    },
    {
      group: "Academic Hub",
      id: "admin-academic",
      items: [
        { to: "/admin/courses", icon: "📚", name: "Course Catalog", desc: "Digital academic registry" },
        { to: "/admin/create-batch", icon: "🗂", name: "Batches", desc: "Manage active learning groups" },
        { to: "/admin/create-course", icon: "➕", name: "New Course", desc: "Define new academic modules" },
        { to: "/admin/schedule-class", icon: <FaCalendarAlt />, name: "Class Scheduler", desc: "Plan and publish session timings" },
        { to: "/admin/student-allotment", icon: "🔗", name: "Allotment", desc: "Batch and course mapping" },
        { to: "/admin/attendance", icon: "🗓", name: "Attendance", desc: "Central monitoring panel" },
        { to: "/admin/leave", icon: "🛌", name: "Leaves", desc: "Review student absence requests" },
        { to: "/admin/fees", icon: "💰", name: "Finance", desc: "Financial records and dues" },
      ]
    },
    {
      group: "Career Hub",
      id: "admin-career",
      items: [
        { to: "/admin/post-job", icon: <FaBriefcase />, name: "Placement Prep", desc: "Post job opportunities" },
        { to: "/admin/manage-jobs", icon: "📝", name: "Listings", desc: "Edit and manage active posts" },
        { to: "/admin/post-internship", icon: "🎓", name: "Internships", desc: "Create internship programs" },
        { to: "/admin/company-partners", icon: <FaBuilding />, name: "Partners", desc: "Industrial tie-up registry" },
        { to: "/admin/job-applications", icon: "📥", name: "Applications", desc: "Submission desk manager" },
      ]
    },
    {
      group: "Operations",
      id: "admin-ops",
      items: [
        { to: "/admin/qr-station", icon: <FaQrcode />, name: "QR Station", desc: "Physical scanning terminal" },
        { to: "/admin/time-tracking", icon: <FaHistory />, name: "System Check-in", desc: "Daily punch records" },
        { to: "/admin/announcements", icon: "📢", name: "Bulletins", desc: "Publish general announcements" },
        { to: "/admin/notifications", icon: <FaBullhorn />, name: "Notifications Hub", desc: "Manage administrative alerts" },
        { to: "/admin/reviews", icon: "⭐", name: "User Reviews", desc: "Read platform feedback" },
        { to: "/admin/violations", icon: "⚠️", name: "Violations", desc: "Attendance violation records" },
      ]
    }
  ],
  STUDENT: [
    {
      group: "Learning Hub",
      id: "st-learn",
      items: [
        { to: "/student/courses", icon: <FaBook />, name: "Knowledge Base", desc: "My Courses and Active Batches" },
        { to: "/student/timetable", icon: "📅", name: "Calendar", desc: "My daily learning schedule" },
        { to: "/student/announcements", icon: "📢", name: "Bulletins", desc: "Important updates and notices" },
        { to: "/student/attendance", icon: <FaHistory />, name: "Audit Log", desc: "Historical presence records" },
        { to: "/student/time-tracking", icon: <FaQrcode />, name: "Punch Portal", desc: "Live daily check-in station" },
        { to: "/student/notifications", icon: <FaBullhorn />, name: "Notifications Hub", desc: "My personal alert history" },
        { to: "/student/fees", icon: "💰", name: "Finance", desc: "Secure fee payment records" },
        { to: "/student/leave", icon: <FaCalendarAlt />, name: "Absence", desc: "Request leave of absence" },
        { to: "/student/counseling", icon: "🧑‍⚕️", name: "Wellness", desc: "Connect with counselors" },
      ]
    },
    {
      group: "Career Hub",
      id: "st-hiring",
      items: [
        { to: "/student/jobs", icon: <FaBriefcase />, name: "Placement", desc: "Global professional roles" },
        { to: "/student/internships", icon: <FaLaptopCode />, name: "Internships", desc: "Gain real-world experience" },
        { to: "/student/certificates", icon: <FaAward />, name: "Vault", desc: "Download earned certificates" },
      ]
    }
  ],
  TRAINER: [
    {
      group: "Teaching Hub",
      id: "tr-teach",
      items: [
        { to: "/trainer/course", icon: <FaBook />, name: "My Courses", desc: "Assigned courses and materials" },
        { to: "/trainer/timetable", icon: "📅", name: "Schedule", desc: "My teaching timetable" },
        { to: "/trainer/announcements", icon: "📢", name: "Bulletins", desc: "Important notices" },
        { to: "/trainer/attendance", icon: <FaHistory />, name: "Attendance", desc: "Class attendance records" },
        { to: "/trainer/time-tracking", icon: <FaQrcode />, name: "Punch Portal", desc: "Daily check-in station" },
        { to: "/trainer/notifications", icon: <FaBullhorn />, name: "Notifications Hub", desc: "My personal alert history" },
        { to: "/trainer/leave", icon: <FaCalendarAlt />, name: "Leave", desc: "Request absence" },
      ]
    }
  ],
  MARKETER: [
    {
      group: "Growth Hub",
      id: "mk-growth",
      items: [
        { to: "/marketer/leads", icon: <FaChartLine />, name: "Leads CRM", desc: "Generate, assign & track leads" },
        { to: "/marketer/campaigns", icon: <FaBullhorn />, name: "Campaigns", desc: "Run social & digital campaigns" },
        { to: "/marketer/time-tracking", icon: <FaQrcode />, name: "Punch Portal", desc: "Daily check-in station" },
        { to: "/marketer/notifications", icon: <FaBullhorn />, name: "Notifications Hub", desc: "My alert history" },
        { to: "/marketer/leave", icon: <FaCalendarAlt />, name: "Leave", desc: "Request absence" },
      ]
    }
  ],
  COUNSELOR: [
    {
      group: "Conversion Hub",
      id: "cs-conversion",
      items: [
        { to: "/counselor/leads", icon: <FaChartLine />, name: "My Leads", desc: "Call, follow-up & convert leads" },
        { to: "/counselor/time-tracking", icon: <FaQrcode />, name: "Punch Portal", desc: "Daily check-in station" },
        { to: "/counselor/notifications", icon: <FaBullhorn />, name: "Notifications Hub", desc: "My alert history" },
        { to: "/counselor/leave", icon: <FaCalendarAlt />, name: "Leave", desc: "Request absence" },
      ]
    }
  ]
};

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role || "STUDENT";
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
      if (isMobileMenuOpen && !event.target.closest('.main-dashboard-header') && !event.target.closest('.mobile-drawer')) {
        closeMobileMenu();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen, activeDropdown]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const avatarLetter = user?.name?.charAt(0).toUpperCase() || "U";
  const rolePath = role.toLowerCase().replace("_", "");
  const navItems = NAV_CONFIG[role] || [];

  return (
    <div className="dashboard-page-wrapper">
      {/* 🔹 TOP BAR */}
      <div className="top-contact-bar">
        <div className="nav-container-inner">
          <div className="contact-left">
            <span><FaPhoneAlt size={12} /> +91 7022928198</span>
            <span className="v-sep">|</span>
            <span><FaEnvelope size={12} /> appteknow-pcsglobal@gmail.com</span>
          </div>
          <div className="social-right">
            <FaFacebookF /> <FaTwitter /> <FaLinkedinIn /> <FaInstagram />
          </div>
        </div>
      </div>

      {/* 🏛️ MAIN HEADER */}
      <header className="main-dashboard-header">
        <div className="nav-container-inner" ref={dropdownRef}>
          
          <Link to="/" className="logo-section-left">
            <div className="logo-container-white" style={{ background: '#fff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #eee', display: 'flex', alignItems: 'center' }}>
              <img src="appteknow_logo.png" alt="AppTechno Careers" className="brand-logo-img" style={{ height: '38px' }} />
            </div>
          </Link>

          {/* 📱 MOBILE HEADER ACTIONS */}
          <div className="mobile-header-actions">
            <NotificationDropdown 
              isOpen={activeDropdown === 'mobile-notifications'} 
              onToggle={() => toggleDropdown('mobile-notifications')} 
            />
            <div className="mobile-id-badge">{user?.portalId || user?.studentId || "ID"}</div>
            <button className="hamburger-btn" onClick={() => setIsMobileMenuOpen(true)}>
              <span /><span /><span />
            </button>
          </div>

          {/* 📱 MOBILE SIDE DRAWER */}
          <div className={`mobile-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
            <div className="drawer-header">
              <div className="drawer-user">
                <div className="avatar-circle">{avatarLetter}</div>
                <div className="user-info-text">
                  <div className="user-name">{user?.name || "User"}</div>
                  <div className="user-id">{user?.studentId || user?.portalId || "ID: -"}</div>
                </div>
              </div>
              <button className="drawer-close-x" onClick={closeMobileMenu}>✕</button>
            </div>

            <div className="drawer-scroll-area">
              <p className="drawer-section-label">Command Center</p>
              <NavLink to={`/${rolePath}/dashboard`} className="drawer-item" onClick={closeMobileMenu}>🏠 Dashboard</NavLink>
              
              {navItems.map((group) => (
                <div key={group.id}>
                  <p className="drawer-section-label">{group.group}</p>
                  {group.items.map((item, idx) => (
                    <NavLink key={idx} to={item.to} className="drawer-item" onClick={closeMobileMenu}>
                      {typeof item.icon === 'string' ? <span style={{marginRight:'8px'}}>{item.icon}</span> : <span style={{marginRight:'8px', display:'flex'}}>{item.icon}</span>}
                      {item.name}
                    </NavLink>
                  ))}
                </div>
              ))}

              <p className="drawer-section-label">Account</p>
              {role !== "COUNSELOR" && (
                <NavLink to={`/${rolePath}/performance`} className="drawer-item" onClick={closeMobileMenu}>📈 Performance</NavLink>
              )}
              <NavLink to={`/${rolePath}/profile`} className="drawer-item" onClick={closeMobileMenu}>👤 Profile</NavLink>
              <NavLink to={`/${rolePath}/app-review`} className="drawer-item" onClick={closeMobileMenu} style={{color: '#fbbf24'}}>⭐ App Review</NavLink>

              <div className="drawer-divider" />
              <button className="drawer-item drawer-logout" onClick={handleLogout}><FaSignOutAlt style={{marginRight:'8px'}}/> Logout</button>
            </div>
          </div>

          <div className={`drawer-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={closeMobileMenu} />

          {/* 🔹 DESKTOP NAV-RIGHT */}
          <div className="nav-right-collapse">
            <nav className="header-nav-menu">
              <NavLink to={`/${rolePath}/dashboard`} className="nav-menu-link">📊 Dashboard</NavLink>
              
              {navItems.map((group) => (
                <div className="nav-dropdown" key={group.id}>
                  <button className={`nav-menu-link ${activeDropdown === group.id ? 'active-btn' : ''}`} onClick={() => toggleDropdown(group.id)}>
                    {group.group} <FaChevronDown className={`drop-icon ${activeDropdown === group.id ? 'rotate' : ''}`} />
                  </button>
                  <div className={`mega-menu ${activeDropdown === group.id ? 'open' : ''}`}>
                    <div className="mega-group">
                      <div className="mega-group-title">{group.group}</div>
                      <div className={`mega-items-grid ${group.items.length > 5 ? 'is-multi-column' : ''}`}>
                        {group.items.map((item, idx) => (
                          <MegaLink 
                            key={idx}
                            to={item.to} 
                            icon={item.icon} 
                            name={item.name} 
                            desc={item.desc}
                            onClick={() => setActiveDropdown(null)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {role !== "COUNSELOR" && (
                <NavLink to={`/${rolePath}/performance`} className="nav-menu-link">📈 Performance</NavLink>
              )}
              <NavLink to={`/${rolePath}/profile`} className="nav-menu-link">👤 Profile</NavLink>
              <NavLink to={`/${rolePath}/app-review`} className="nav-menu-link" style={{color: '#fbbf24', fontWeight: 'bold'}}>⭐ App Review</NavLink>
            </nav>

            <div className="user-actions-right">
              <NotificationDropdown 
                isOpen={activeDropdown === 'notifications'} 
                onToggle={() => toggleDropdown('notifications')} 
              />
              
              <div className="nav-user-info">
                <div className="nav-user-text">
                  <span className="nav-user-role">{role.replace("_", " ")}</span>
                  <span className="nav-user-id">{user?.portalId || user?.studentId || "ID: -"}</span>
                </div>
                <div className="nav-avatar">{avatarLetter}</div>
              </div>

              <button className="nav-logout-btn logout-btn-desktop" onClick={handleLogout}>Logout</button>
            </div>
          </div>

          {/* 📱 MOBILE TAB BAR (Fixed Bottom) */}
          <nav className="mobile-tab-bar">
            <NavLink to={`/${rolePath}/dashboard`} className="tab-item">
              <span>🏠</span><label>Home</label>
            </NavLink>
            <NavLink to={`/${rolePath}/profile`} className="tab-item">
              <span>👤</span><label>Profile</label>
            </NavLink>
            <div className="tab-item" onClick={() => setIsMobileMenuOpen(true)}>
              <span>☰</span><label>Menu</label>
            </div>
          </nav>

        </div>
      </header>

      {/* 🚀 CONTENT VIEW */}
      <main className="dashboard-view-content">
        <GlobalAnnouncementPopup />
        <div className="nav-container-inner">
          <div className="content-fluid-wrapper">
             <Outlet />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default DashboardLayout;