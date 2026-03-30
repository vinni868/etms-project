import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram,
  FaPhoneAlt, FaEnvelope, FaGraduationCap, FaBars, FaTimes, FaChevronDown
} from "react-icons/fa";
import "./Navbar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeJobBlock, setActiveJobBlock] = useState("locations");
  // State for mobile dropdowns
  const [mobileDrop, setMobileDrop] = useState(null);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    setMobileDrop(null);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setMobileDrop(null);
  };

  const handleMobileDrop = (name) => {
    if (window.innerWidth <= 1024) {
      setMobileDrop(mobileDrop === name ? null : name);
    }
  };

  // Close menu on click outside
  React.useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuOpen && !event.target.closest('.main-header-wrap')) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen]);

  // Close menu on resize to desktop
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024 && menuOpen) {
        closeMenu();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [menuOpen]);

  return (
    <>
      <div className="navbar-fixed-wrapper">
        {/* TOP BAR */}
        <div className="top-bar-blue">
          <div className="nav-container-flex">
            <div className="contact-links">
              <span className="info-item">
                <FaPhoneAlt /> <span className="call-label">Call for Enquiry: </span> <a href="tel:+917022928198">+91 7022928198</a>
              </span>
              <span className="line-sep">|</span>
              <span className="info-item hide-mobile">
                <FaEnvelope /> <a href="mailto:appteknow-pcsglobal@gmail.com">appteknow-pcsglobal@gmail.com</a>
              </span>
            </div>
            <div className="social-icons-wrap">
              <a href="#"><FaFacebookF /></a>
              <a href="#"><FaTwitter /></a>
              <a href="#"><FaLinkedinIn /></a>
              <a href="#"><FaInstagram /></a>
            </div>
          </div>
        </div>

        {/* MAIN HEADER */}
        <header className="main-header-wrap">
          <div className="nav-container-flex">

            <Link to="/" className="brand-logo-wrap" onClick={closeMenu}>
              <div className="logo-container-white">
                <img src="appteknow_logo.png" alt="AppTechno Careers" className="brand-logo-img" />
              </div>
            </Link>

            {/* NAVIGATION AREA */}
            <nav className={`nav-links-outer ${menuOpen ? "is-open" : ""}`}>
              <ul className="nav-menu-list">
                {/* MOBILE ONLY AUTH SECTION - MOVED TO TOP FOR VISIBILITY */}
                <li className="mobile-auth-drawer">
                  <Link to="/login" className="mob-login" onClick={closeMenu}>Login</Link>
                  <Link to="/signup" className="mob-reg" onClick={closeMenu}>Register Now</Link>
                </li>

                <li><NavLink to="/" end className="nav-link-anchor" onClick={closeMenu}>Home</NavLink></li>

                {/* IT Courses Dropdown */}
                <li className={`has-mega-menu ${mobileDrop === 'it-courses' ? 'mob-active' : ''}`}>
                  <div className="nav-link-anchor" onClick={() => handleMobileDrop('it-courses')}>
                    <span>IT Courses <span className="promo-tag">AI</span></span>
                    <FaChevronDown className={`chev-icon ${mobileDrop === 'it-courses' ? 'rotate' : ''}`} />
                  </div>
                  <div className="mega-menu-panel single-col">
                    <div className="mega-column">
                      <Link to="/java-training-bangalore" onClick={closeMenu}>Full Stack Java with AI</Link>
                      <Link to="/courses/python" onClick={closeMenu}>Python Training with AI</Link>
                      <Link to="/courses/testing" onClick={closeMenu}>Software Testing with AI</Link>
                      <Link to="/courses/mern" onClick={closeMenu}>MERN Stack with AI</Link>
                    </div>
                  </div>
                </li>

                {/* Non IT Courses Dropdown */}
                <li className={`has-mega-menu ${mobileDrop === 'non-it' ? 'mob-active' : ''}`}>
                  <div className="nav-link-anchor" onClick={() => handleMobileDrop('non-it')}>
                    <span>Non IT Courses</span>
                    <FaChevronDown className={`chev-icon ${mobileDrop === 'non-it' ? 'rotate' : ''}`} />
                  </div>
                  <div className="mega-menu-panel single-col">
                    <div className="mega-column">
                      <Link to="/courses/data-analytics" onClick={closeMenu}>Data Analytics</Link>
                      <Link to="/courses/digital-marketing" onClick={closeMenu}>Digital Marketer</Link>
                      <Link to="/courses/tally" onClick={closeMenu}>Tally ERP 9 + GST</Link>
                      <Link to="/courses/softskills" onClick={closeMenu}>Softskills + Aptitude</Link>
                    </div>
                  </div>
                </li>


                {/* Jobs Dropdown */}
                <li className={`has-mega-menu ${mobileDrop === 'jobs' ? 'mob-active' : ''}`}>
                  <div className="nav-link-anchor" onClick={() => handleMobileDrop('jobs')}>
                    <span>Jobs</span>
                    <FaChevronDown className={`chev-icon ${mobileDrop === 'jobs' ? 'rotate' : ''}`} />
                  </div>
                  <div className="mega-menu-panel single-col">
                    <div className="mega-column">
                      <Link to="/jobs/bangalore" onClick={closeMenu}>Bangalore Jobs</Link>
                      <Link to="/jobs/mumbai" onClick={closeMenu}>Mumbai Jobs</Link>
                      <Link to="/jobs/java" onClick={closeMenu}>Java Developer Roles</Link>
                      <Link to="/jobs/testing" onClick={closeMenu}>Testing Roles</Link>
                    </div>
                  </div>
                </li>

                {/* Placements Dropdown */}
                <li className={`has-mega-menu ${mobileDrop === 'placements' ? 'mob-active' : ''}`}>
                  <div className="nav-link-anchor" onClick={() => handleMobileDrop('placements')}>
                    <span>Placements</span>
                    <FaChevronDown className={`chev-icon ${mobileDrop === 'placements' ? 'rotate' : ''}`} />
                  </div>
                  <div className="mega-menu-panel single-col">
                    <div className="mega-column">
                      <Link to="/placements/gallery" onClick={closeMenu}>Student Gallery</Link>
                      <Link to="/placements/testimonials" onClick={closeMenu}>Testimonials</Link>
                      <Link to="/placements/offers" onClick={closeMenu}>Offer Letters</Link>
                    </div>
                  </div>
                </li>

                <li><NavLink to="/internships" className="nav-link-anchor" onClick={closeMenu}>Internships</NavLink></li>
                <li><NavLink to="/contact" className="nav-link-anchor" onClick={closeMenu}>Contact Us</NavLink></li>


              </ul>
            </nav>

            {/* DESKTOP AUTH ACTIONS */}
            <div className="auth-action-btns">
              <Link to="/login" className="login-link hide-mobile">Login</Link>
              <Link to="/signup" className="register-btn-solid hide-mobile">Register Now</Link>

              <button className="mobile-hamburger" onClick={toggleMenu}>
                {menuOpen ? <FaTimes /> : <FaBars />}
              </button>
            </div>
          </div>
        </header>
      </div>
      <div className="nav-spacer"></div>
    </>
  );
};

export default Navbar;