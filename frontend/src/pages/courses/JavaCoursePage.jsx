import React, { useState } from 'react';
import { FaJava, FaRobot, FaBriefcase, FaGraduationCap, FaCheckCircle, FaClock, FaCalendarAlt, FaMapMarkerAlt, FaRocket, FaHandPointRight, FaShieldAlt } from 'react-icons/fa';
import './JavaCoursePage.css';

const JavaCoursePage = () => {
    const [formData, setFormData] = useState({ name: '', phone: '', email: '' });

    const handleFormSubmit = (e) => {
        e.preventDefault();
        alert("Thank you! Our counselor will call you shortly to schedule your FREE DEMO.");
        setFormData({ name: '', phone: '', email: '' });
    };

    return (
        <div className="java-course-container">
            {/* Hero Section */}
            <header className="course-hero">
                <div className="hero-content">
                    <span className="badge">100% Job Guarantee Program</span>
                    <h1>Full Stack Java Course with AI in Bangalore</h1>
                    <p className="sub-tagline">Learn Java from IT companies' live projects in 3 months & get hired. Experience the power of AI-driven training!</p>
                    
                    <div className="hero-features">
                        <div className="h-feat">
                            <FaClock /> <span>3 Months Duration</span>
                        </div>
                        <div className="h-feat">
                            <FaMapMarkerAlt /> <span>BTM Layout / Online</span>
                        </div>
                        <div className="h-feat">
                            <FaShieldAlt /> <span>Pay 50% After Placement</span>
                        </div>
                    </div>

                    <div className="hero-actions">
                        <button className="cta-primary" onClick={() => document.getElementById('register-form').scrollIntoView({ behavior: 'smooth' })}>
                            Schedule Free Demo Today
                        </button>
                        <button className="cta-secondary">Download Brochure</button>
                    </div>
                </div>

                <div className="hero-form-card" id="register-form">
                    <h3>Reserve Your Spot</h3>
                    <p>Get a callback from our senior counselor</p>
                    <form onSubmit={handleFormSubmit}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input required type="text" placeholder="John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input required type="tel" placeholder="+91" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>Email ID</label>
                            <input required type="email" placeholder="john@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <button type="submit" className="submit-btn">Register for Demo</button>
                    </form>
                </div>
            </header>

            {/* AI Tools Section */}
            <section className="ai-tools-section">
                <div className="section-header">
                    <h2>Our Exclusive AI Tools for Students</h2>
                    <p>We train you 10X faster with proprietary AI innovations</p>
                </div>
                
                <div className="ai-tools-grid">
                    <div className="ai-tool-card elts">
                        <div className="tool-icon"><FaRobot /></div>
                        <h3>ELTS: AI for English</h3>
                        <p>Practice English communication for 5000+ minutes with our AI tool. Master fluency for international interviews.</p>
                        <ul>
                            <li><FaCheckCircle /> Sentence Formation</li>
                            <li><FaCheckCircle /> AI-Driven Conversations</li>
                            <li><FaCheckCircle /> Real-time Pronunciation</li>
                        </ul>
                    </div>

                    <div className="ai-tool-card placements">
                        <div className="tool-icon"><FaBriefcase /></div>
                        <h3>Careers.Appteknow</h3>
                        <p>Complete lifecycle placement AI tool. From resume building to getting 50+ interview calls.</p>
                        <ul>
                            <li><FaCheckCircle /> AI Resume Builder</li>
                            <li><FaCheckCircle /> 50+ Mock Interviews</li>
                            <li><FaCheckCircle /> Unlimited Job Applications</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Course Curriculum */}
            <section className="curriculum-section">
                <div className="section-header">
                    <h2>What You Will Master</h2>
                    <p>Designed for Industrial Readiness & High-Paying Roles</p>
                </div>

                <div className="syllabus-grid">
                    <div className="module">
                        <div className="module-header">
                            <FaJava /> <span>Core Java & AI Tools</span>
                        </div>
                        <p>Java Syntax, OOPS, Collections with AI-assisted coding prompts.</p>
                    </div>
                    <div className="module">
                        <div className="module-header">
                            <FaRocket /> <span>Advanced Java & Spring Boot</span>
                        </div>
                        <p>Hibernate, Spring Data JPA, Security, and Microservices architecture.</p>
                    </div>
                    <div className="module">
                        <div className="module-header">
                            <FaHandPointRight /> <span>Full Stack Frontend</span>
                        </div>
                        <p>Integrating React.js with Java backends for complex dashboards.</p>
                    </div>
                    <div className="module">
                        <div className="module-header">
                            <FaGraduationCap /> <span>Real-Time Projects</span>
                        </div>
                        <p>Work on live projects from our partner IT companies.</p>
                    </div>
                </div>
            </section>

            {/* Why Us Section */}
            <section className="why-us">
                <div className="why-image-content">
                    <h2>Why AppTechno for Java?</h2>
                    <div className="points">
                        <div className="point">
                            <FaCheckCircle />
                            <div>
                                <h4>On The Job Training</h4>
                                <p>Work under corporate environments on real IT projects from Day 1.</p>
                            </div>
                        </div>
                        <div className="point">
                            <FaCheckCircle />
                            <div>
                                <h4>Job Guarantee</h4>
                                <p>We don't just train; we get you hired with 100% assistance.</p>
                            </div>
                        </div>
                        <div className="point">
                            <FaCheckCircle />
                            <div>
                                <h4>Pay 50% After Job</h4>
                                <p>No huge upfront fees. Pay half once you start earning.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="final-cta">
                <div className="cta-container">
                    <h2>Ready to Build your Java Career?</h2>
                    <p>Join 2500+ successful alumni working in top MNCs.</p>
                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        Register Now & Start Free
                    </button>
                </div>
            </section>
        </div>
    );
};

export default JavaCoursePage;
