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
  FaUserGraduate,
  FaBell
} from 'react-icons/fa';
import GlobalAnnouncementPopup from "../components/GlobalAnnouncementPopup";
import NotificationDropdown from "../components/NotificationDropdown";
import { MENU_CONFIG } from "../config/menuConfig";
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
  const roleKey = user?.role?.toUpperCase();
  const menuData = MENU_CONFIG[roleKey];
  const rolePath = menuData?.basePath || `/${user?.role?.toLowerCase().replace("_", "")}`;

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
              <NavLink to={`${rolePath}/dashboard`} className="nav-menu-link" onClick={closeMobileMenu}>📊 Dashboard</NavLink>

              {/* 🚀 DYNAMIC MEGA MENU SYSTEM */}
              {menuData?.hubs.map((hub) => (
                <div key={hub.title} className="nav-dropdown">
                  <button 
                    className={`nav-menu-link ${activeDropdown === hub.title ? 'active-btn' : ''}`} 
                    onClick={() => toggleDropdown(hub.title)}
                  >
                    {hub.icon} {hub.title} <FaChevronDown className={`drop-icon ${activeDropdown === hub.title ? 'rotate' : ''}`} />
                  </button>
                  <div className={`mega-menu ${activeDropdown === hub.title ? 'open' : ''}`}>
                    <div className="mega-group">
                      <div className="mega-group-title">{hub.title} Strategic Hub</div>
                      {hub.links.map((link) => (
                        <MegaLink 
                          key={link.path}
                          to={`${rolePath}/${link.path}`} 
                          icon={link.icon} 
                          name={link.label} 
                          desc={link.desc || `Access ${link.label}`} 
                          onClick={closeMobileMenu} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <NavLink to={`${rolePath}/profile`} className="nav-menu-link" onClick={closeMobileMenu}>👤 Profile</NavLink>
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
              <button className="sd-drop-btn sd-drop-btn--danger" style={{padding: '8px 16px', fontSize: '12px'}} onClick={handleLogout}>🚪 Logout</button>
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