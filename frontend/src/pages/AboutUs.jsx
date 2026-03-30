import React from 'react';
import { FaUsers, FaHistory, FaAward, FaGlobe, FaRobot, FaBriefcase, FaGraduationCap, FaCheckCircle, FaComments } from 'react-icons/fa';
import './AboutUs.css';

const AboutUs = () => {
    return (
        <div className="about-us-container">
            {/* Header / Hero */}
            <header className="about-hero">
                <div className="container">
                    <span className="sub-tag">OUR STORY & VISION</span>
                    <h1>Empowering Careers Since 2000</h1>
                    <p className="lead-text">
                        Welcome to EtMS (Emerging Technology Managed Services)—a pioneer in Industry-standard technical training and placements.
                    </p>
                </div>
            </header>

            {/* Core Story Section */}
            <section className="about-content">
                <div className="container grid-2">
                    <div className="text-block">
                        <h2>Who We Are</h2>
                        <p>
                            Traditional classroom training with dummy projects is no longer enough in today's fast-paced world. 
                            The IT industry has transitioned into an era of Artificial Intelligence, and at EtMS, we've evolved ahead of the curve.
                        </p>
                        <p>
                            Starting in the year 2000, we boast a <strong>20+ years Legacy</strong>. We aren't just a training institute; 
                            we are a bridge between aspiring talent and the global IT industry. Our mission is to train you exactly as per 
                            industry needs, ensuring you are "Job Ready" from Day 1.
                        </p>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <h3>20+</h3>
                                <p>Years Legacy</p>
                            </div>
                            <div className="stat-card">
                                <h3>70,000+</h3>
                                <p>Students Trained</p>
                            </div>
                            <div className="stat-card">
                                <h3>500+</h3>
                                <p>Hiring Partners</p>
                            </div>
                        </div>
                    </div>
                    <div className="image-block">
                        <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" alt="Team Collaboration" />
                    </div>
                </div>
            </section>

            {/* Our Partnerships */}
            <section className="partnership-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Global Partnerships</h2>
                        <p>Our training is driven by current requirements from leading IT companies in India and the US.</p>
                    </div>
                    <div className="partners-grid">
                        <div className="partner-card">
                            <FaGlobe className="p-icon" />
                            <h4>US-Based Training Standards</h4>
                            <p>We follow international curriculum standards for global competitiveness.</p>
                        </div>
                        <div className="partner-card">
                            <FaBriefcase className="p-icon" />
                            <h4>Live Project Access</h4>
                            <p>Partnerships with IT companies allow our students to work on real-world, live projects.</p>
                        </div>
                        <div className="partner-card">
                            <FaAward className="p-icon" />
                            <h4>Industry-Recognized Certification</h4>
                            <p>Your certification carries the weight of 20 years of industrial trust.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Innovation Section */}
            <section className="ai-innovation">
                <div className="container">
                    <div className="header-flex">
                        <h2>Our AI-Driven Ecosystem</h2>
                        <p>We don't just teach technology; we use it to enhance your learning journey.</p>
                    </div>
                    <div className="ai-tools-detailed">
                        <div className="ai-row">
                            <div className="ai-info">
                                <div className="tool-tag"><FaRobot /> AI Placement Tool</div>
                                <h3>Careers.Appteknow</h3>
                                <p>Our proprietary AI engine tracks your progress, suggests improvements in your coding style, and applies for 50+ matches automatically.</p>
                            </div>
                            <div className="ai-info">
                                <div className="tool-tag"><FaComments /> AI English Coach</div>
                                <h3>ELTS Coach</h3>
                                <p>Master professional communication with our AI voice-bot. Practice interviews and receive real-time feedback on pronunciation and grammar.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Join Us Checklist */}
            <section className="why-join-summary">
                <div className="container">
                    <h2>Why Students Trust EtMS</h2>
                    <div className="checklist-grid">
                        <div className="check-item"><FaCheckCircle /> <span>Real-time Industrial Experience</span></div>
                        <div className="check-item"><FaCheckCircle /> <span>Experience Certificates from IT Partners</span></div>
                        <div className="check-item"><FaCheckCircle /> <span>100% Placement Support & Guidance</span></div>
                        <div className="check-item"><FaCheckCircle /> <span>Pay 50% Fees Only After Placement</span></div>
                        <div className="check-item"><FaCheckCircle /> <span>Mentorship by Senior Software Engineers</span></div>
                        <div className="check-item"><FaCheckCircle /> <span>Unlimited Mock Interviews with AI & Mentors</span></div>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="about-cta">
                <div className="container">
                    <h2>Transform Your Future Today</h2>
                    <p>Be a part of our 70,000+ strong alumni network.</p>
                    <button className="btn-white-premium" onClick={() => window.location.href='/register'}>Get Started Now</button>
                </div>
            </section>
        </div>
    );
};

export default AboutUs;
