import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, NavLink, Link, useLocation } from "react-router-dom";
import Footer from "../components/Footer";
import { 
  FaPhoneAlt, FaEnvelope, FaFacebookF, FaTwitter, 
  FaLinkedinIn, FaInstagram, FaGraduationCap, FaSignOutAlt,
  FaChevronDown, FaCog, FaShieldAlt, FaBullhorn,
  FaBook,  FaQrcode,
  FaBars,
  FaTimes,
  FaMoneyBillWave,
  FaHeartbeat,
  FaComments,
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

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // FIXED: Automatically close dropdown when route changes
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
      if (isMobileMenuOpen && !event.target.closest('.main-dashboard-header')) {
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
  const rolePath = user?.role?.toLowerCase().replace("_", "") || "student";

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

          {/* 🍔 Hamburger menu (Mobile Only) */}
          {window.innerWidth <= 1024 && (
            <button className="hamburger-btn" onClick={() => setIsMobileMenuOpen(true)}>
              <span /><span /><span />
            </button>
          )}

          {/* 📱 MOBILE SIDE DRAWER (Hidden on Desktop by default) */}
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
              <p className="drawer-section-label">Academic Life</p>
              <NavLink to={`/${rolePath}/dashboard`} className="drawer-item" onClick={closeMobileMenu}>🏠 Dashboard</NavLink>
              {user?.role === "STUDENT" && (
                <>
                  <NavLink to="/student/courses" className="drawer-item" onClick={closeMobileMenu}>📚 Knowledge Base</NavLink>
                  <NavLink to="/student/timetable" className="drawer-item" onClick={closeMobileMenu}>📅 Calendar</NavLink>
                  <NavLink to="/student/announcements" className="drawer-item" onClick={closeMobileMenu}>📢 Bulletins</NavLink>
                </>
              )}
              {/* Other role logic follows this 1-column pattern for mobile simplicity */}

              <p className="drawer-section-label">Operations</p>
              {user?.role === "STUDENT" && (
                <>
                  <NavLink to="/student/time-tracking" className="drawer-item" onClick={closeMobileMenu}>✅ Punch Portal</NavLink>
                  <NavLink to="/student/attendance" className="drawer-item" onClick={closeMobileMenu}>📋 Audit Log</NavLink>
                  <NavLink to="/student/leave" className="drawer-item" onClick={closeMobileMenu}>🗓 Absence</NavLink>
                </>
              )}

              <p className="drawer-section-label">Support</p>
              {user?.role === "STUDENT" && (
                <>
                  <NavLink to="/student/fees" className="drawer-item" onClick={closeMobileMenu}>💰 Finance</NavLink>
                  <NavLink to="/student/counseling" className="drawer-item" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }}>💚 Wellness</NavLink>
                </>
              )}
              <NavLink to={`/${rolePath}/profile`} className="drawer-item" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }}>👤 Profile</NavLink>
              <NavLink to={`/${rolePath}/app-review`} className="drawer-item" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }}>⭐ App Review</NavLink>

              <div className="drawer-divider" />
              <button className="drawer-item drawer-logout" onClick={handleLogout}>🚪 Logout</button>
            </div>
          </div>

          <div className={`drawer-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />

          {/* 🔹 DESKTOP NAV-RIGHT (Remains Hidden on Mobile via CSS) */}
          <div className="nav-right-collapse">
            <nav className="header-nav-menu">
              <NavLink to={`/${rolePath}/dashboard`} className="nav-menu-link">📊 Dashboard</NavLink>
              
              {user?.role === "SUPERADMIN" && (
                <>
                  <div className="nav-dropdown">
                    <button className={`nav-menu-link ${activeDropdown === 'governance' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('governance')}>
                      🛡️ Governance Hub <FaChevronDown className={`drop-icon ${activeDropdown === 'governance' ? 'rotate' : ''}`} />
                    </button>
                    <div className={`mega-menu ${activeDropdown === 'governance' ? 'open' : ''}`}>
                      <div className="mega-group">
                        <div className="mega-group-title">Administration</div>
                        <MegaLink to="/superadmin/create-admin" icon={<FaUserShield/>} name="Admin Desk" desc="Manage regional administrators" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/superadmin/create-user" icon={<FaUsersCog/>} name="Provision" desc="Manage core user accounts" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Master Registry</div>
                        <MegaLink to="/superadmin/users" icon="👥" name="Global Directory" desc="Cross-portal user database" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/superadmin/notifications" icon={<FaBullhorn/>} name="Notifications Hub" desc="Manage system-wide alerts" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/superadmin/leave" icon="📅" name="Leave Board" desc="Monitor staff/student absence" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                    </div>
                  </div>

                  <div className="nav-dropdown">
                    <button className={`nav-menu-link ${activeDropdown === 'analytics' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('analytics')}>
                      🚀 Intelligence Center <FaChevronDown className={`drop-icon ${activeDropdown === 'analytics' ? 'rotate' : ''}`} />
                    </button>
                    <div className={`mega-menu ${activeDropdown === 'analytics' ? 'open' : ''}`}>
                      <div className="mega-group">
                        <div className="mega-group-title">Analytics</div>
                        <MegaLink to="/superadmin/performance" icon={<FaChartLine/>} name="Performance Metrics" desc="System-wide success tracking" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/superadmin/finance" icon="💰" name="Finance Ledger" desc="Revenue and fee collection audits" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/superadmin/reviews" icon="⭐" name="Platform Reviews" desc="Monitor user feedback" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Operations</div>
                        <MegaLink to="/superadmin/attendance-report" icon={<FaClipboardList/>} name="Audit Log" desc="Daily attendance consolidation" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/superadmin/meetings" icon="🤝" name="Strategy Room" desc="Executive session scheduler" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                    </div>
                  </div>

                  <div className="nav-dropdown">
                    <button className={`nav-menu-link ${activeDropdown === 'config' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('config')}>
                      ⚙️ System Config <FaChevronDown className={`drop-icon ${activeDropdown === 'config' ? 'rotate' : ''}`} />
                    </button>
                    <div className={`mega-menu ${activeDropdown === 'config' ? 'open' : ''}`}>
                      <div className="mega-group">
                        <div className="mega-group-title">Setup</div>
                        <MegaLink to="/superadmin/settings" icon={<FaCog/>} name="Core Settings" desc="Global platform parameters" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/superadmin/qr-station" icon={<FaSatellite/>} name="Tracking Hardware" desc="Maintain QR & GPS infrastructure" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Communication</div>
                        <MegaLink to="/superadmin/announcements" icon="📢" name="Broadcasts" desc="Global announcement alerts" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/superadmin/messages" icon="💬" name="Internal Comms" desc="Admin messaging terminal" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {user?.role === "ADMIN" && (
                <>
                  <div className="nav-dropdown">
                    <button className={`nav-menu-link ${activeDropdown === 'admin-registry' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('admin-registry')}>
                      🏢 Registry Hub <FaChevronDown className={`drop-icon ${activeDropdown === 'admin-registry' ? 'rotate' : ''}`} />
                    </button>
                    <div className={`mega-menu ${activeDropdown === 'admin-registry' ? 'open' : ''}`}>
                      <div className="mega-group">
                        <div className="mega-group-title">Users</div>
                        <MegaLink to="/admin/students" icon={<FaUserGraduate/>} name="Students" desc="Complete student lifecycle" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/admin/trainers" icon={<FaChalkboardTeacher/>} name="Trainers" desc="Instructors and trainers" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/admin/create-user" icon="👤+" name="Provision" desc="Create new user accounts" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Security</div>
                        <MegaLink to="/admin/id-management" icon="🔢" name="ID Control" desc="Access card and ID generator" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                    </div>
                  </div>

                  <div className="nav-dropdown">
                    <button className={`nav-menu-link ${activeDropdown === 'admin-academic' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('admin-academic')}>
                      📚 Academic Hub <FaChevronDown className={`drop-icon ${activeDropdown === 'admin-academic' ? 'rotate' : ''}`} />
                    </button>
                    <div className={`mega-menu ${activeDropdown === 'admin-academic' ? 'open' : ''}`} style={{gap: '60px'}}>
                      <div className="mega-group">
                        <div className="mega-group-title">Curriculum</div>
                        <MegaLink to="/admin/courses" icon="📚" name="Course Catalog" desc="Digital academic registry" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/admin/create-batch" icon="🗂" name="Batches" desc="Manage active learning groups" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/admin/create-course" icon="➕" name="New Course" desc="Define new academic modules" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Scheduling</div>
                        <MegaLink to="/admin/schedule-class" icon={<FaCalendarAlt/>} name="Class Scheduler" desc="Plan and publish session timings" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/admin/student-allotment" icon="🔗" name="Allotment" desc="Batch and course mapping" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Operations</div>
                        <MegaLink to="/admin/attendance" icon="🗓" name="Attendance" desc="Central monitoring panel" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/admin/leave" icon="🛌" name="Leaves" desc="Review student absence requests" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/admin/fees" icon="💰" name="Finance" desc="Financial records and dues" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                    </div>
                  </div>

                  <div className="nav-dropdown">
                    <button className={`nav-menu-link ${activeDropdown === 'admin-career' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('admin-career')}>
                      💼 Career Hub <FaChevronDown className={`drop-icon ${activeDropdown === 'admin-career' ? 'rotate' : ''}`} />
                    </button>
                    <div className={`mega-menu ${activeDropdown === 'admin-career' ? 'open' : ''}`}>
                      <div className="mega-group">
                        <div className="mega-group-title">Placement</div>
                        <MegaLink to="/admin/post-job" icon={<FaBriefcase/>} name="Placement Prep" desc="Post job opportunities" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/admin/manage-jobs" icon="📝" name="Listings" desc="Edit and manage active posts" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/admin/post-internship" icon="🎓" name="Internships" desc="Create internship programs" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">External</div>
                        <MegaLink to="/admin/company-partners" icon={<FaBuilding/>} name="Partners" desc="Industrial tie-up registry" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/admin/job-applications" icon="📥" name="Applications" desc="Submission desk manager" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                    </div>
                  </div>

                  <div className="nav-dropdown">
                    <button className={`nav-menu-link ${activeDropdown === 'admin-ops' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('admin-ops')}>
                      ⚙️ Operations <FaChevronDown className={`drop-icon ${activeDropdown === 'admin-ops' ? 'rotate' : ''}`} />
                    </button>
                    <div className={`mega-menu ${activeDropdown === 'admin-ops' ? 'open' : ''}`}>
                      <div className="mega-group">
                        <div className="mega-group-title">Terminal</div>
                        <MegaLink to="/admin/qr-station" icon={<FaQrcode/>} name="QR Station" desc="Physical scanning terminal" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/admin/time-tracking" icon={<FaHistory/>} name="System Check-in" desc="Daily punch records" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Comms</div>
                        <MegaLink to="/admin/announcements" icon="📢" name="Bulletins" desc="Publish general announcements" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/admin/notifications" icon={<FaBullhorn/>} name="Notifications Hub" desc="Manage administrative alerts" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/admin/reviews" icon="⭐" name="User Reviews" desc="Read platform feedback" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {user?.role === "STUDENT" && (
                <>
                  <div className="nav-dropdown">
                    <button className={`nav-menu-link ${activeDropdown === 'st-learn' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('st-learn')}>
                      🎓 Learning Hub <FaChevronDown className={`drop-icon ${activeDropdown === 'st-learn' ? 'rotate' : ''}`} />
                    </button>
                    <div className={`mega-menu ${activeDropdown === 'st-learn' ? 'open' : ''}`}>
                      <div className="mega-group">
                        <div className="mega-group-title">Academic Life</div>
                        <MegaLink to="/student/courses" icon={<FaBook/>} name="Knowledge Base" desc="My Courses and Active Batches" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/student/timetable" icon="📅" name="Calendar" desc="My daily learning schedule" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/student/announcements" icon="📢" name="Bulletins" desc="Important updates and notices" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Operations</div>
                        <MegaLink to="/student/attendance" icon={<FaHistory/>} name="Audit Log" desc="Historical presence records" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/student/time-tracking" icon={<FaQrcode/>} name="Punch Portal" desc="Live daily check-in station" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/student/notifications" icon={<FaBullhorn/>} name="Notifications Hub" desc="My personal alert history" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Support</div>
                        <MegaLink to="/student/fees" icon="💰" name="Finance" desc="Secure fee payment records" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/student/leave" icon={<FaCalendarAlt/>} name="Absence" desc="Request leave of absence" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/student/counseling" icon="🧑‍⚕️" name="Wellness" desc="Connect with counselors" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                    </div>
                  </div>

                  <div className="nav-dropdown">
                    <button className={`nav-menu-link ${activeDropdown === 'st-hiring' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('st-hiring')}>
                      🚀 Career Hub <FaChevronDown className={`drop-icon ${activeDropdown === 'st-hiring' ? 'rotate' : ''}`} />
                    </button>
                    <div className={`mega-menu ${activeDropdown === 'st-hiring' ? 'open' : ''}`}>
                      <div className="mega-group">
                        <div className="mega-group-title">Growth</div>
                        <MegaLink to="/student/jobs" icon={<FaBriefcase/>} name="Placement" desc="Global professional roles" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/student/internships" icon={<FaLaptopCode/>} name="Internships" desc="Gain real-world experience" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Achievement</div>
                        <MegaLink to="/student/certificates" icon={<FaAward/>} name="Vault" desc="Download earned certificates" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {user?.role === "TRAINER" && (
                <>
                  <div className="nav-dropdown">
                    <button className={`nav-menu-link ${activeDropdown === 'tr-teach' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('tr-teach')}>
                      🏫 Teaching Hub <FaChevronDown className={`drop-icon ${activeDropdown === 'tr-teach' ? 'rotate' : ''}`} />
                    </button>
                    <div className={`mega-menu ${activeDropdown === 'tr-teach' ? 'open' : ''}`}>
                      <div className="mega-group">
                        <div className="mega-group-title">My Work</div>
                        <MegaLink to="/trainer/course" icon={<FaBook/>} name="My Courses" desc="Assigned courses and materials" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/trainer/timetable" icon="📅" name="Schedule" desc="My teaching timetable" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/trainer/announcements" icon="📢" name="Bulletins" desc="Important notices" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Tracking</div>
                        <MegaLink to="/trainer/attendance" icon={<FaHistory/>} name="Attendance" desc="Class attendance records" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/trainer/time-tracking" icon={<FaQrcode/>} name="Punch Portal" desc="Daily check-in station" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/trainer/notifications" icon={<FaBullhorn/>} name="Notifications Hub" desc="My personal alert history" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/trainer/leave" icon={<FaCalendarAlt/>} name="Leave" desc="Request absence" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {user?.role === "MARKETER" && (
                <>
                  <div className="nav-dropdown">
                    <button className={`nav-menu-link ${activeDropdown === 'mk-growth' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('mk-growth')}>
                      📣 Growth Hub <FaChevronDown className={`drop-icon ${activeDropdown === 'mk-growth' ? 'rotate' : ''}`} />
                    </button>
                    <div className={`mega-menu ${activeDropdown === 'mk-growth' ? 'open' : ''}`}>
                      <div className="mega-group">
                        <div className="mega-group-title">Marketing</div>
                        <MegaLink to="/marketer/leads" icon={<FaChartLine/>} name="Leads" desc="Manage and track leads" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/marketer/campaigns" icon={<FaBullhorn/>} name="Campaigns" desc="Active marketing campaigns" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/marketer/vouchers" icon="🎟️" name="Vouchers" desc="Discount and coupon management" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Operations</div>
                        <MegaLink to="/marketer/time-tracking" icon={<FaQrcode/>} name="Punch Portal" desc="Daily check-in station" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/marketer/notifications" icon={<FaBullhorn/>} name="Notifications Hub" desc="My alert history" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/marketer/leave" icon={<FaCalendarAlt/>} name="Leave" desc="Request absence" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {user?.role === "COUNSELOR" && (
                <>
                  <div className="nav-dropdown">
                    <button className={`nav-menu-link ${activeDropdown === 'cs-wellness' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('cs-wellness')}>
                      🧑‍⚕️ Wellness Hub <FaChevronDown className={`drop-icon ${activeDropdown === 'cs-wellness' ? 'rotate' : ''}`} />
                    </button>
                    <div className={`mega-menu ${activeDropdown === 'cs-wellness' ? 'open' : ''}`}>
                      <div className="mega-group">
                        <div className="mega-group-title">My Work</div>
                        <MegaLink to="/counselor/sessions" icon={<FaHeartbeat/>} name="Sessions" desc="Active counseling sessions" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/counselor/messages" icon={<FaComments/>} name="Messages" desc="Student communications" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Operations</div>
                        <MegaLink to="/counselor/time-tracking" icon={<FaQrcode/>} name="Punch Portal" desc="Daily check-in station" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/counselor/notifications" icon={<FaBullhorn/>} name="Notifications Hub" desc="My alert history" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                        <MegaLink to="/counselor/leave" icon={<FaCalendarAlt/>} name="Leave" desc="Request absence" onClick={() => { closeMobileMenu(); setActiveDropdown(null); }} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {user?.role !== "COUNSELOR" && (
                <NavLink to={`/${rolePath}/performance`} className="nav-menu-link">📈 Performance</NavLink>
              )}
              <NavLink to={`/${rolePath}/profile`} className="nav-menu-link">👤 Profile</NavLink>
              <NavLink to={`/${rolePath}/app-review`} className="nav-menu-link" style={{color: '#fbbf24', fontWeight: 'bold'}}>⭐ App Review</NavLink>
            </nav>

            <div className="user-actions-right">
              {/* 📱 MOBILE BELL — Hidden on desktop */}
              <button className="mobile-bell-btn" style={{display:'none'}}>🔔</button>

              <NotificationDropdown 
                isOpen={activeDropdown === 'notifications'} 
                onToggle={() => toggleDropdown('notifications')} 
              />
              
              <div className="nav-user-info">
                <div className="nav-user-text">
                  <span className="nav-user-role">{user?.role?.replace("_", " ")}</span>
                  <span className="nav-user-id">{user?.portalId || user?.studentId || "ID: -"}</span>
                </div>
                <div className="nav-avatar">{avatarLetter}</div>
              </div>

              <button className="nav-logout-btn logout-btn-desktop" onClick={handleLogout}>Logout</button>
            </div>
          </div>

          {/* 📱 MOBILE TAB BAR (Fixed Bottom) */}
          <nav className="mobile-tab-bar" style={{display:'none'}}>
            <NavLink to={`/${rolePath}/dashboard`} className="tab-item">
              <span>🏠</span><label>Home</label>
            </NavLink>

            {user?.role === "STUDENT" && (
              <>
                <NavLink to="/learning-hub" className="tab-item">
                  <span>📚</span><label>Learn</label>
                </NavLink>
                <NavLink to="/career-hub" className="tab-item">
                  <span>🚀</span><label>Career</label>
                </NavLink>
                <NavLink to="/student/performance" className="tab-item">
                  <span>📊</span><label>Results</label>
                </NavLink>
              </>
            )}

            {user?.role === "SUPERADMIN" && (
              <>
                <NavLink to="/superadmin/accounts" className="tab-item">
                  <span>👥</span><label>Accounts</label>
                </NavLink>
                <NavLink to="/superadmin/performance" className="tab-item">
                  <span>📈</span><label>Analytics</label>
                </NavLink>
                <NavLink to="/superadmin/attendance-report" className="tab-item">
                  <span>⚙️</span><label>Ops</label>
                </NavLink>
              </>
            )}

            {user?.role === "ADMIN" && (
              <>
                <NavLink to="/admin/manage-users" className="tab-item">
                  <span>👨‍💻</span><label>Users</label>
                </NavLink>
                <NavLink to="/admin/manage-batches" className="tab-item">
                  <span>🏢</span><label>Batches</label>
                </NavLink>
                <NavLink to="/admin/announcements" className="tab-item">
                  <span>📢</span><label>Comms</label>
                </NavLink>
              </>
            )}

            {user?.role === "TRAINER" && (
              <>
                <NavLink to="/trainer/batches" className="tab-item">
                  <span>📅</span><label>Batches</label>
                </NavLink>
                <NavLink to="/trainer/students" className="tab-item">
                  <span>👨‍🎓</span><label>Students</label>
                </NavLink>
                <NavLink to="/trainer/leave" className="tab-item">
                  <span>🗓</span><label>Leave</label>
                </NavLink>
              </>
            )}

            {user?.role === "COUNSELOR" && (
              <>
                <NavLink to="/counselor/enrollments" className="tab-item">
                  <span>🎓</span><label>Enroll</label>
                </NavLink>
                <NavLink to="/counselor/queries" className="tab-item">
                  <span>💬</span><label>Queries</label>
                </NavLink>
                <NavLink to="/counselor/reports" className="tab-item">
                  <span>📊</span><label>Reports</label>
                </NavLink>
              </>
            )}

            {user?.role === "MARKETER" && (
              <>
                <NavLink to="/marketer/campaigns" className="tab-item">
                  <span>📢</span><label>Campaigns</label>
                </NavLink>
                <NavLink to="/marketer/leads" className="tab-item">
                  <span>🔗</span><label>Leads</label>
                </NavLink>
                <NavLink to="/marketer/social-metrics" className="tab-item">
                  <span>📊</span><label>Metrics</label>
                </NavLink>
              </>
            )}

            <div className="tab-item" onClick={() => setIsMobileMenuOpen(true)}>
              <span>☰</span><label>More</label>
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