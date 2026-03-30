import React from "react";
import { Link } from "react-router-dom";
import {
  FaFacebookF, FaLinkedinIn, FaTwitter, FaGithub, FaEnvelope,
  FaPhoneAlt, FaMapMarkerAlt, FaChevronRight, FaPlay, FaApple, FaGlobe
} from "react-icons/fa";
import "../styles/Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="main-footer">
      {/* 1. Main Footer Content */}
      <div className="footer-top">
        <div className="footer-container">
          
          {/* Brand & Mission */}
          <div className="footer-col brand-col">
            <div className="footer-logo-wrap">
              <img src="appteknow_logo.png" alt="AppTechno Careers" className="footer-logo-img" />
            </div>
            <p className="brand-desc">
              The world's most advanced Smart Learning Management System. 
              We bridge the gap between academic learning and industry 
              requirements through AI-driven placement tracking.
            </p>
            <div className="social-links-row">
              <a href="#" className="social-circle"><FaFacebookF /></a>
              <a href="#" className="social-circle"><FaLinkedinIn /></a>
              <a href="#" className="social-circle"><FaTwitter /></a>
              <a href="#" className="social-circle"><FaGithub /></a>
            </div>
            
            {/* App Store Links - Typical of top LMS sites */}
            <div className="app-download-links">
               <div className="store-btn">
                  <FaApple className="store-icon" />
                  <span>App Store</span>
               </div>
               <div className="store-btn">
                  <FaPlay className="store-icon" />
                  <span>Google Play</span>
               </div>
            </div>
          </div>

          {/* Top Categories */}
          <div className="footer-col">
            <h3>Trending Courses</h3>
            <ul className="footer-links">
              <li><Link to="/cat/development">Web Development</Link></li>
              <li><Link to="/cat/data-science">Data Science & AI</Link></li>
              <li><Link to="/cat/business">Business Management</Link></li>
              <li><Link to="/cat/design">UI/UX Design</Link></li>
              <li><Link to="/cat/marketing">Digital Marketing</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h3>Quick Explorer</h3>
            <ul className="footer-links">
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/careers">Careers</Link></li>
              <li><Link to="/blog">LMS Blog</Link></li>
              <li><Link to="/help">Help & Support</Link></li>
              <li><Link to="/affiliate">Become an Instructor</Link></li>
            </ul>
          </div>

          {/* Newsletter & Language */}
          <div className="footer-col contact-col">
            <h3>Stay Connected</h3>
            <div className="newsletter-box">
              <input type="email" placeholder="Email Address" />
              <button type="button">Join</button>
            </div>
            
            <div className="footer-contact-info">
              <p><FaPhoneAlt className="blue-icon" /> +91 86977 41611</p>
              <p><FaEnvelope className="blue-icon" /> contact@etms.com</p>
              
              {/* Language Switcher - Very common in global LMS */}
              <div className="language-selector">
                <FaGlobe />
                <select>
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>Hindi</option>
                </select>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Horizontal Divider */}
      <div className="footer-divider"></div>

      {/* 3. Footer Bottom */}
      <div className="footer-bottom">
        <div className="footer-container bottom-flex">
          <div className="bottom-left">
            <p>© {currentYear} <span className="highlight">EtMS Smart Learning</span>. Built for the future of education.</p>
          </div>
          <div className="bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
            <a href="#">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;