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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
      if (isMobileMenuOpen && !event.target.closest('.main-dashboard-header')) {
        closeMobileMenu();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

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

              {/* 👑 SUPER ADMIN — STRATEGIC OVERHAUL */}
              {user?.role === "SUPERADMIN" && (
                <>
                  <div className="nav-dropdown">
                    <button className={`nav-menu-link ${activeDropdown === 'governance' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('governance')}>
                      🛡️ Governance Hub <FaChevronDown className={`drop-icon ${activeDropdown === 'governance' ? 'rotate' : ''}`} />
                    </button>
                    <div className={`mega-menu ${activeDropdown === 'governance' ? 'open' : ''}`}>
                      <div className="mega-group">
                        <div className="mega-group-title">Administration</div>
                        <MegaLink to="/superadmin/create-admin" icon={<FaUserShield/>} name="Admin Desk" desc="Manage regional administrators" onClick={closeMobileMenu} />
                        <MegaLink to="/superadmin/create-user" icon={<FaUsersCog/>} name="Provision" desc="Manage core user accounts" onClick={closeMobileMenu} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Master Registry</div>
                        <MegaLink to="/superadmin/users" icon="👥" name="Global Directory" desc="Cross-portal user database" onClick={closeMobileMenu} />
                        <MegaLink to="/superadmin/leave" icon="📅" name="Leave Board" desc="Monitor staff/student absence" onClick={closeMobileMenu} />
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
                        <MegaLink to="/superadmin/performance" icon={<FaChartLine/>} name="Performance Metrics" desc="System-wide success tracking" onClick={closeMobileMenu} />
                        <MegaLink to="/superadmin/finance" icon="💰" name="Finance Ledger" desc="Revenue and fee collection audits" onClick={closeMobileMenu} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Operations</div>
                        <MegaLink to="/superadmin/attendance-report" icon={<FaClipboardList/>} name="Audit Log" desc="Daily attendance consolidation" onClick={closeMobileMenu} />
                        <MegaLink to="/superadmin/meetings" icon="🤝" name="Strategy Room" desc="Executive session scheduler" onClick={closeMobileMenu} />
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
                        <MegaLink to="/superadmin/settings" icon={<FaCog/>} name="Core Settings" desc="Global platform parameters" onClick={closeMobileMenu} />
                        <MegaLink to="/superadmin/qr-station" icon={<FaSatellite/>} name="Tracking Hardware" desc="Maintain QR & GPS infrastructure" onClick={closeMobileMenu} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Communication</div>
                        <MegaLink to="/superadmin/announcements" icon="📢" name="Broadcasts" desc="Global announcement alerts" onClick={closeMobileMenu} />
                        <MegaLink to="/superadmin/messages" icon="💬" name="Internal Comms" desc="Admin messaging terminal" onClick={closeMobileMenu} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* 🛡️ ADMIN — OPERATIONAL OVERHAUL */}
              {user?.role === "ADMIN" && (
                <>
                  <div className="nav-dropdown">
                    <button className={`nav-menu-link ${activeDropdown === 'admin-registry' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('admin-registry')}>
                      🏢 Registry Hub <FaChevronDown className={`drop-icon ${activeDropdown === 'admin-registry' ? 'rotate' : ''}`} />
                    </button>
                    <div className={`mega-menu ${activeDropdown === 'admin-registry' ? 'open' : ''}`}>
                      <div className="mega-group">
                        <div className="mega-group-title">Users</div>
                        <MegaLink to="/admin/students" icon={<FaUserGraduate/>} name="Students" desc="Complete student lifecycle" onClick={closeMobileMenu} />
                        <MegaLink to="/admin/trainers" icon={<FaChalkboardTeacher/>} name="Faculty" desc="Instructors and trainers" onClick={closeMobileMenu} />
                        <MegaLink to="/admin/create-user" icon="👤+" name="Provision" desc="Create new user accounts" onClick={closeMobileMenu} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Security</div>
                        <MegaLink to="/admin/id-management" icon="🔢" name="ID Control" desc="Access card and ID generator" onClick={closeMobileMenu} />
                      </div>
                    </div>
                  </div>

                  <div className="nav-dropdown">
                    <button className={`nav-menu-link ${activeDropdown === 'admin-academic' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('admin-academic')}>
                      📚 Academic Hub <FaChevronDown className={`drop-icon ${activeDropdown === 'admin-academic' ? 'rotate' : ''}`} />
                    </button>
                    <div className={`mega-menu`} style={{gap: '60px'}}>
                      <div className="mega-group">
                        <div className="mega-group-title">Curriculum</div>
                        <MegaLink to="/admin/courses" icon="📚" name="Course Catalog" desc="Digital academic registry" onClick={closeMobileMenu} />
                        <MegaLink to="/admin/create-batch" icon="🗂" name="Batches" desc="Manage active learning groups" onClick={closeMobileMenu} />
                        <MegaLink to="/admin/create-course" icon="➕" name="New Course" desc="Define new academic modules" onClick={closeMobileMenu} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Scheduling</div>
                        <MegaLink to="/admin/schedule-class" icon={<FaCalendarAlt/>} name="Class Scheduler" desc="Plan and publish session timings" onClick={closeMobileMenu} />
                        <MegaLink to="/admin/student-allotment" icon="🔗" name="Allotment" desc="Batch and course mapping" onClick={closeMobileMenu} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Operations</div>
                        <MegaLink to="/admin/attendance" icon="🗓" name="Attendance" desc="Central monitoring panel" onClick={closeMobileMenu} />
                        <MegaLink to="/admin/leave" icon="🛌" name="Leaves" desc="Review student absence requests" onClick={closeMobileMenu} />
                        <MegaLink to="/admin/fees" icon="💰" name="Finance" desc="Financial records and dues" onClick={closeMobileMenu} />
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
                        <MegaLink to="/admin/post-job" icon={<FaBriefcase/>} name="Placement Prep" desc="Post job opportunities" onClick={closeMobileMenu} />
                        <MegaLink to="/admin/manage-jobs" icon="📝" name="Listings" desc="Edit and manage active posts" onClick={closeMobileMenu} />
                        <MegaLink to="/admin/post-internship" icon="🎓" name="Internships" desc="Create internship programs" onClick={closeMobileMenu} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">External</div>
                        <MegaLink to="/admin/company-partners" icon={<FaBuilding/>} name="Partners" desc="Industrial tie-up registry" onClick={closeMobileMenu} />
                        <MegaLink to="/admin/job-applications" icon="📥" name="Applications" desc="Submission desk manager" onClick={closeMobileMenu} />
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
                        <MegaLink to="/admin/qr-station" icon={<FaQrcode/>} name="QR Station" desc="Physical scanning terminal" onClick={closeMobileMenu} />
                        <MegaLink to="/admin/time-tracking" icon={<FaHistory/>} name="System Check-in" desc="Daily punch records" onClick={closeMobileMenu} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Comms</div>
                        <MegaLink to="/admin/announcements" icon="📢" name="Bulletins" desc="Publish general announcements" onClick={closeMobileMenu} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* 🎓 STUDENT — LEARNING PATHWAY */}
              {user?.role === "STUDENT" && (
                <>
                  <div className="nav-dropdown">
                    <button className={`nav-menu-link ${activeDropdown === 'st-learn' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('st-learn')}>
                      🎓 Learning Hub <FaChevronDown className={`drop-icon ${activeDropdown === 'st-learn' ? 'rotate' : ''}`} />
                    </button>
                    <div className={`mega-menu ${activeDropdown === 'st-learn' ? 'open' : ''}`}>
                      <div className="mega-group">
                        <div className="mega-group-title">Academic Life</div>
                        <MegaLink to="/student/courses" icon={<FaBook/>} name="Knowledge Base" desc="My Courses and Active Batches" onClick={closeMobileMenu} />
                        <MegaLink to="/student/timetable" icon="📅" name="Calendar" desc="My daily learning schedule" onClick={closeMobileMenu} />
                        <MegaLink to="/student/announcements" icon="📢" name="Bulletins" desc="Important updates and notices" onClick={closeMobileMenu} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Operations</div>
                        <MegaLink to="/student/attendance" icon={<FaHistory/>} name="Audit Log" desc="Historical presence records" onClick={closeMobileMenu} />
                        <MegaLink to="/student/time-tracking" icon={<FaQrcode/>} name="Punch Portal" desc="Live daily check-in station" onClick={closeMobileMenu} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Support</div>
                        <MegaLink to="/student/fees" icon="💰" name="Finance" desc="Secure fee payment records" onClick={closeMobileMenu} />
                        <MegaLink to="/student/leave" icon={<FaCalendarAlt/>} name="Absence" desc="Request leave of absence" onClick={closeMobileMenu} />
                        <MegaLink to="/student/counseling" icon="🧑‍⚕️" name="Wellness" desc="Connect with counselors" onClick={closeMobileMenu} />
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
                        <MegaLink to="/student/jobs" icon={<FaBriefcase/>} name="Placement" desc="Global professional roles" onClick={closeMobileMenu} />
                        <MegaLink to="/student/internships" icon={<FaLaptopCode/>} name="Internships" desc="Gain real-world experience" onClick={closeMobileMenu} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Achievement</div>
                        <MegaLink to="/student/certificates" icon={<FaAward/>} name="Vault" desc="Download earned certificates" onClick={closeMobileMenu} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* 🏫 TRAINER — TEACHING HUB */}
              {user?.role === "TRAINER" && (
                <>
                  <div className="nav-dropdown">
                    <button className={`nav-menu-link ${activeDropdown === 'tr-teach' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('tr-teach')}>
                      🏫 Teaching Hub <FaChevronDown className={`drop-icon ${activeDropdown === 'tr-teach' ? 'rotate' : ''}`} />
                    </button>
                    <div className={`mega-menu ${activeDropdown === 'tr-teach' ? 'open' : ''}`}>
                      <div className="mega-group">
                        <div className="mega-group-title">My Work</div>
                        <MegaLink to="/trainer/course" icon={<FaBook/>} name="My Courses" desc="Assigned courses and materials" onClick={closeMobileMenu} />
                        <MegaLink to="/trainer/timetable" icon="📅" name="Schedule" desc="My teaching timetable" onClick={closeMobileMenu} />
                        <MegaLink to="/trainer/announcements" icon="📢" name="Bulletins" desc="Important notices" onClick={closeMobileMenu} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Tracking</div>
                        <MegaLink to="/trainer/attendance" icon={<FaHistory/>} name="Attendance" desc="Class attendance records" onClick={closeMobileMenu} />
                        <MegaLink to="/trainer/time-tracking" icon={<FaQrcode/>} name="Punch Portal" desc="Daily check-in station" onClick={closeMobileMenu} />
                        <MegaLink to="/trainer/leave" icon={<FaCalendarAlt/>} name="Leave" desc="Request absence" onClick={closeMobileMenu} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* 📣 MARKETER — GROWTH HUB */}
              {user?.role === "MARKETER" && (
                <>
                  <div className="nav-dropdown">
                    <button className={`nav-menu-link ${activeDropdown === 'mk-growth' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('mk-growth')}>
                      📣 Growth Hub <FaChevronDown className={`drop-icon ${activeDropdown === 'mk-growth' ? 'rotate' : ''}`} />
                    </button>
                    <div className={`mega-menu ${activeDropdown === 'mk-growth' ? 'open' : ''}`}>
                      <div className="mega-group">
                        <div className="mega-group-title">Marketing</div>
                        <MegaLink to="/marketer/leads" icon={<FaChartLine/>} name="Leads" desc="Manage and track leads" onClick={closeMobileMenu} />
                        <MegaLink to="/marketer/campaigns" icon={<FaBullhorn/>} name="Campaigns" desc="Active marketing campaigns" onClick={closeMobileMenu} />
                        <MegaLink to="/marketer/vouchers" icon="🎟️" name="Vouchers" desc="Discount and coupon management" onClick={closeMobileMenu} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Operations</div>
                        <MegaLink to="/marketer/time-tracking" icon={<FaQrcode/>} name="Punch Portal" desc="Daily check-in station" onClick={closeMobileMenu} />
                        <MegaLink to="/marketer/leave" icon={<FaCalendarAlt/>} name="Leave" desc="Request absence" onClick={closeMobileMenu} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* 🧑‍⚕️ COUNSELOR — WELLNESS HUB */}
              {user?.role === "COUNSELOR" && (
                <>
                  <div className="nav-dropdown">
                    <button className={`nav-menu-link ${activeDropdown === 'cs-wellness' ? 'active-btn' : ''}`} onClick={() => toggleDropdown('cs-wellness')}>
                      🧑‍⚕️ Wellness Hub <FaChevronDown className={`drop-icon ${activeDropdown === 'cs-wellness' ? 'rotate' : ''}`} />
                    </button>
                    <div className={`mega-menu ${activeDropdown === 'cs-wellness' ? 'open' : ''}`}>
                      <div className="mega-group">
                        <div className="mega-group-title">My Work</div>
                        <MegaLink to="/counselor/sessions" icon={<FaHeartbeat/>} name="Sessions" desc="Active counseling sessions" onClick={closeMobileMenu} />
                        <MegaLink to="/counselor/messages" icon={<FaComments/>} name="Messages" desc="Student communications" onClick={closeMobileMenu} />
                      </div>
                      <div className="mega-group">
                        <div className="mega-group-title">Operations</div>
                        <MegaLink to="/counselor/time-tracking" icon={<FaQrcode/>} name="Punch Portal" desc="Daily check-in station" onClick={closeMobileMenu} />
                        <MegaLink to="/counselor/leave" icon={<FaCalendarAlt/>} name="Leave" desc="Request absence" onClick={closeMobileMenu} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {user?.role !== "COUNSELOR" && (
                <NavLink to={`/${rolePath}/performance`} className="nav-menu-link" onClick={closeMobileMenu}>📈 Performance</NavLink>
              )}
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
              <button className="nav-logout-btn" onClick={handleLogout}>🚪 Logout</button>
            </div>
          </div>
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