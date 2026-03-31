import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, NavLink, Link } from "react-router-dom";
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
  FaBriefcase
} from 'react-icons/fa';
import GlobalAnnouncementPopup from "../components/GlobalAnnouncementPopup";
import NotificationDropdown from "../components/NotificationDropdown";
import "./DashboardLayout.css";

function DashboardLayout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close dropdowns on outside click
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
      // Close mobile menu on outside click
      if (isMobileMenuOpen && !event.target.closest('.main-dashboard-header')) {
        closeMobileMenu();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const avatarLetter = user?.name?.charAt(0).toUpperCase() || "U";
  const rolePath = user?.role?.toLowerCase().replace("_", "") || "student";

  return (
    <div className="dashboard-page-wrapper">
      {/* ===== TOP BAR ===== */}
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

      {/* ===== MAIN HEADER ===== */}
      <header className="main-dashboard-header">
        <div className="nav-container-inner" ref={dropdownRef}>
          
          <Link to="/" className="logo-section-left">
            <div className="logo-icon-box"><FaGraduationCap /></div>
            <div className="logo-text-group">
              <h1 className="brand-name">EtMS</h1>
              <span className="brand-tagline">SMART LEARNING</span>
            </div>
          </Link>

          <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>

          <div className={`nav-right-collapse ${isMobileMenuOpen ? 'open' : ''}`}>
            <nav className="header-nav-menu">
            <NavLink to={`/${rolePath}/dashboard`} className="nav-menu-link" onClick={closeMobileMenu}>📊 Dashboard</NavLink>

            {/* SUPER ADMIN */}
            {user?.role === "SUPERADMIN" && (
              <>
                <div className="nav-dropdown">
                  <button className={`nav-menu-link ${activeDropdown === 'governance' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('governance')}>
                    <FaShieldAlt /> Governance <FaChevronDown className={`drop-icon ${activeDropdown === 'governance' ? 'rotate' : ''}`} />
                  </button>
                  {activeDropdown === 'governance' && (
                    <div className="dropdown-content">
                      <NavLink to="/superadmin/create-admin" onClick={closeMobileMenu}>🛡️ Administration Desk</NavLink>
                      <NavLink to="/superadmin/create-user" onClick={closeMobileMenu}>👤+ Provision Account</NavLink>
                      <NavLink to="/superadmin/users" onClick={closeMobileMenu}>👥 Global Registry</NavLink>
                      <NavLink to="/superadmin/attendance-report" onClick={closeMobileMenu}>⏱️ Attendance Audits</NavLink>
                    </div>
                  )}
                </div>

                <div className="nav-dropdown">
                  <button className={`nav-menu-link ${activeDropdown === 'analytics' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('analytics')}>
                    <FaCog /> Execution Hub <FaChevronDown className={`drop-icon ${activeDropdown === 'analytics' ? 'rotate' : ''}`} />
                  </button>
                  {activeDropdown === 'analytics' && (
                    <div className="dropdown-content">
                      <NavLink to="/superadmin/performance" onClick={closeMobileMenu}>🧠 Intelligence Hub</NavLink>
                      <NavLink to="/superadmin/finance" onClick={closeMobileMenu}>💰 Finance Hub</NavLink>
                      <NavLink to="/superadmin/meetings" onClick={closeMobileMenu}>🤝 Strategy Sessions</NavLink>
                      <NavLink to="/superadmin/qr-station" onClick={closeMobileMenu}>📱 QR Station</NavLink>
                      <NavLink to="/superadmin/attendance-report" onClick={closeMobileMenu}>📄 Daily Reports</NavLink>
                      <NavLink to="/superadmin/announcements" onClick={closeMobileMenu}>📢 Announcements</NavLink>
                      <NavLink to="/superadmin/messages" onClick={closeMobileMenu}>💬 Comms Hub</NavLink>
                      <NavLink to="/superadmin/leave" onClick={closeMobileMenu}>📅 Staff & Student Leaves</NavLink>
                    </div>
                  )}
                </div>

                <div className="nav-dropdown">
                  <button className={`nav-menu-link ${activeDropdown === 'config' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('config')}>
                    <FaCog /> System Config <FaChevronDown className={`drop-icon ${activeDropdown === 'config' ? 'rotate' : ''}`} />
                  </button>
                  {activeDropdown === 'config' && (
                    <div className="dropdown-content">
                      <NavLink to="/superadmin/profile" onClick={closeMobileMenu}>👤 Profile Identity</NavLink>
                      <NavLink to="/superadmin/settings" onClick={closeMobileMenu}>⚙️ Global Settings</NavLink>
                      <NavLink to="/superadmin/qr-station" onClick={closeMobileMenu}>📲 QR & GPS Setup</NavLink>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ADMIN */}
            {user?.role === "ADMIN" && (
              <>
                {/* Academic & User Hub (Combined to save space) */}
                <div className="nav-dropdown">
                  <button className={`nav-menu-link ${activeDropdown === 'admin-academic' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('admin-academic')}>
                    <FaBook /> Academic & User Hub <FaChevronDown className={`drop-icon ${activeDropdown === 'admin-academic' ? 'rotate' : ''}`} />
                  </button>
                  {activeDropdown === 'admin-academic' && (
                    <div className="dropdown-content">
                      <div style={{ padding: '4px 20px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginTop: '4px' }}>Users</div>
                      <NavLink to="/admin/create-user" onClick={closeMobileMenu}>👤+ Create Student/User</NavLink>
                      <NavLink to="/admin/students" onClick={closeMobileMenu}>🧩 Student Management Hub</NavLink>
                      <NavLink to="/admin/trainers" onClick={closeMobileMenu}>👨‍🏫 Trainer Management Hub</NavLink>
                      <NavLink to="/admin/id-management" onClick={closeMobileMenu}>🔢 ID Control Panel</NavLink>
                      
                      <div style={{ padding: '8px 20px 4px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Academics</div>
                      <NavLink to="/admin/create-course" onClick={closeMobileMenu}>➕ Define Course</NavLink>
                      <NavLink to="/admin/courses" onClick={closeMobileMenu}>📚 Academic Registry</NavLink>
                      <NavLink to="/admin/create-batch" onClick={closeMobileMenu}>🗂 Batch Manager</NavLink>
                      
                      <NavLink to="/admin/fees" onClick={closeMobileMenu}>💰 Fee Manager</NavLink>
                    </div>
                  )}
                </div>

                {/* Engagement Hub */}
                <div className="nav-dropdown">
                  <button className={`nav-menu-link ${activeDropdown === 'admin-engagement' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('admin-engagement')}>
                    <FaCog /> Engagement <FaChevronDown className={`drop-icon ${activeDropdown === 'admin-engagement' ? 'rotate' : ''}`} />
                  </button>
                  {activeDropdown === 'admin-engagement' && (
                    <div className="dropdown-content">
                      <NavLink to="/admin/student-allotment" onClick={closeMobileMenu}>🔗 Course & Batch Allotment</NavLink>
                      <NavLink to="/admin/schedule-class" onClick={closeMobileMenu}>⏰ Class Scheduler</NavLink>
                      <NavLink to="/admin/attendance" onClick={closeMobileMenu}>🗓 Attendance Panel</NavLink>
                      <NavLink to="/admin/time-tracking" onClick={closeMobileMenu}>⏱️ Personal Punch-In</NavLink>
                      <NavLink to="/admin/qr-station" onClick={closeMobileMenu}>📲 QR Scanner Station</NavLink>
                      <NavLink to="/admin/leave" onClick={closeMobileMenu}>📅 Student Leaves</NavLink>
                      <NavLink to="/admin/my-leave" onClick={closeMobileMenu}>🛌 My Personal Leave</NavLink>
                      <NavLink to="/admin/announcements" onClick={closeMobileMenu}>📢 Announcements</NavLink>

                    </div>
                  )}
                </div>

                {/* Career Hub */}
                <div className="nav-dropdown">
                  <button className={`nav-menu-link ${activeDropdown === 'admin-career' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('admin-career')}>
                    <FaBriefcase /> Career Hub <FaChevronDown className={`drop-icon ${activeDropdown === 'admin-career' ? 'rotate' : ''}`} />
                  </button>
                  {activeDropdown === 'admin-career' && (
                    <div className="dropdown-content">
                      <NavLink to="/admin/post-job" onClick={closeMobileMenu}>💼 Placement Prep</NavLink>
                      <NavLink to="/admin/manage-jobs" onClick={closeMobileMenu}>📝 Listing Manager</NavLink>
                      <NavLink to="/admin/post-internship" onClick={closeMobileMenu}>🎓 Post Internship</NavLink>
                      <NavLink to="/admin/job-applications" onClick={closeMobileMenu}>📥 Application Desk</NavLink>
                      <NavLink to="/admin/company-partners" onClick={closeMobileMenu}>🏢 Industry Partners</NavLink>
                      <NavLink to="/admin/placement-stats" onClick={closeMobileMenu}>📈 Placement CRM</NavLink>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* TRAINER */}
            {user?.role === "TRAINER" && (
              <>
                {/* Trainer Academic Hub */}
                <div className="nav-dropdown">
                  <button className={`nav-menu-link ${activeDropdown === 'trainer-academic' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('trainer-academic')}>
                    <FaBook /> Academic <FaChevronDown className={`drop-icon ${activeDropdown === 'trainer-academic' ? 'rotate' : ''}`} />
                  </button>
                  {activeDropdown === 'trainer-academic' && (
                    <div className="dropdown-content">
                      <NavLink to="/trainer/course" onClick={closeMobileMenu}>📚 My Batches</NavLink>

                      <NavLink to="/trainer/attendance" onClick={closeMobileMenu}>🗓 Mark Attendance</NavLink>
                      <NavLink to="/trainer/leave" onClick={closeMobileMenu}>🛌 Leave Requests</NavLink>
                      <NavLink to="/trainer/assignments" onClick={closeMobileMenu}>📝 Assignments</NavLink>
                      <NavLink to="/trainer/timetable" onClick={closeMobileMenu}>📅 Timetable</NavLink>
                    </div>
                  )}
                </div>

                {/* Trainer Engagement Hub */}
                <div className="nav-dropdown">
                  <button className={`nav-menu-link ${activeDropdown === 'trainer-engage' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('trainer-engage')}>
                    <FaCog /> Engagement <FaChevronDown className={`drop-icon ${activeDropdown === 'trainer-engage' ? 'rotate' : ''}`} />
                  </button>
                  {activeDropdown === 'trainer-engage' && (
                    <div className="dropdown-content">
                      <NavLink to="/trainer/assignments" onClick={closeMobileMenu}>📝 Assignments</NavLink>
                      <NavLink to="/trainer/announcements" onClick={closeMobileMenu}>📢 Announcements</NavLink>
                      <NavLink to="/trainer/time-tracking" onClick={closeMobileMenu}>⏱️ Punch In / Out</NavLink>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* MARKETER */}
            {user?.role === "MARKETER" && (
              <div className="nav-dropdown">
                <button className={`nav-menu-link ${activeDropdown === 'marketing' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('marketing')}>
                  <FaBullhorn /> Marketing <FaChevronDown className={`drop-icon ${activeDropdown === 'marketing' ? 'rotate' : ''}`} />
                </button>
                {activeDropdown === 'marketing' && (
                  <div className="dropdown-content">
                    <NavLink to="/marketer/leads" onClick={closeMobileMenu}>🎯 Lead Management</NavLink>
                    <NavLink to="/marketer/campaigns" onClick={closeMobileMenu}>📣 Campaigns</NavLink>
                    <NavLink to="/marketer/time-tracking" onClick={closeMobileMenu}>⏱️ Punch In / Out</NavLink>
                    <NavLink to="/marketer/vouchers" onClick={closeMobileMenu}>🎟️ Vouchers</NavLink>
                    <NavLink to="/marketer/leave" onClick={closeMobileMenu}>🛌 My Leaves</NavLink>
                  </div>
                )}
              </div>
            )}

            {/* COUNSELOR */}
            {user?.role === "COUNSELOR" && (
              <div className="nav-dropdown">
                <button className={`nav-menu-link ${activeDropdown === 'counseling' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('counseling')}>
                  <FaHeartbeat /> Student Wellness <FaChevronDown className={`drop-icon ${activeDropdown === 'counseling' ? 'rotate' : ''}`} />
                </button>
                {activeDropdown === 'counseling' && (
                  <div className="dropdown-content">
                    <NavLink to="/counselor/sessions" onClick={closeMobileMenu}>📅 Manage Sessions</NavLink>
                    <NavLink to="/counselor/time-tracking" onClick={closeMobileMenu}>⏱️ Punch In / Out</NavLink>
                    <NavLink to="/counselor/messages" onClick={closeMobileMenu}>💬 Messages</NavLink>
                    <NavLink to="/counselor/leave" onClick={closeMobileMenu}>🛌 My Leaves</NavLink>
                  </div>
                )}
              </div>
            )}

            {/* STUDENT */}

            {user?.role === "STUDENT" && (
              <>
                <div className="nav-dropdown">
                  <button className={`nav-menu-link ${activeDropdown === 'st-learn' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('st-learn')}>
                    <FaBook /> Learning Hub <FaChevronDown className={`drop-icon ${activeDropdown === 'st-learn' ? 'rotate' : ''}`} />
                  </button>
                  {activeDropdown === 'st-learn' && (
                    <div className="dropdown-content">
                      <NavLink to="/student/courses" onClick={closeMobileMenu}>📚 My Courses & Batches</NavLink>
                      <NavLink to="/student/attendance" onClick={closeMobileMenu}>🗓 Attendance</NavLink>
                      <NavLink to="/student/time-tracking" onClick={closeMobileMenu}>⏱️ Punch In / Out</NavLink>
                      <NavLink to="/student/timetable" onClick={closeMobileMenu}>📅 Timetable</NavLink>
                      <NavLink to="/student/announcements" onClick={closeMobileMenu}>📢 Announcements</NavLink>
                      <NavLink to="/student/fees" onClick={closeMobileMenu}>💰 Fee Records</NavLink>
                      <NavLink to="/student/leave" onClick={closeMobileMenu}>📅 My Leaves</NavLink>
                      <NavLink to="/student/counseling" onClick={closeMobileMenu}>🧑‍⚕️ Counseling</NavLink>
                      <NavLink to="/student/certificates" onClick={closeMobileMenu}>🏆 Certificates</NavLink>


                    </div>
                  )}
                </div>
                <div className="nav-dropdown">
                  <button className={`nav-menu-link ${activeDropdown === 'st-hiring' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('st-hiring')}>
                    <FaBriefcase /> Career <FaChevronDown className={`drop-icon ${activeDropdown === 'st-hiring' ? 'rotate' : ''}`} />
                  </button>
                  {activeDropdown === 'st-hiring' && (
                    <div className="dropdown-content">
                      <NavLink to="/student/jobs" onClick={closeMobileMenu}>🏢 Job Board</NavLink>
                      <NavLink to="/student/internships" onClick={closeMobileMenu}>🎓 Internships</NavLink>
                    </div>
                  )}
                </div>
              </>
            )}

            <NavLink to={`/${rolePath}/performance`} className="nav-menu-link" onClick={closeMobileMenu}>📈 Performance</NavLink>
            <NavLink to={`/${rolePath}/profile`} className="nav-menu-link" onClick={closeMobileMenu}>👤 Profile</NavLink>
          </nav>

          <div className="user-actions-right">
            {(user?.role === "ADMIN" || user?.role === "SUPERADMIN") && <NotificationDropdown />}
            <div className="user-role-badge">
              <div className="role-badge-content">
                <span className="role-text-label">{user?.role?.replace("_", " ")}</span>
                {(user?.portalId || user?.studentId) && (
                  <span className="student-id-label">{user.portalId || user.studentId}</span>
                )}
              </div>
              <div className="avatar-circle">{avatarLetter}</div>
            </div>
            {/* <button className="nav-logout-btn" onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button> */}
            {/* ── LOGOUT: clears activity so next login starts fresh ── */}
                <button className="sd-drop-btn sd-drop-btn--danger" onClick={() => {
                  handleLogout();
                  localStorage.clear();
                  navigate("/login");
                }}>🚪 Logout</button>
            </div>
          </div>
        </div>
      </header>

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