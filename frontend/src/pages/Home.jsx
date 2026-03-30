import React, { useState } from 'react';
import { 
  FaSearch, FaUserCheck, FaUsersCog, FaCode, 
  FaBriefcase, FaGraduationCap, FaCertificate, 
  FaRobot, FaComments, FaHandHoldingUsd, FaCheckCircle
} from 'react-icons/fa';
import '../styles/Home.css';
import SuccessStories from '../components/SuccessStories';
import LeadForm from '../components/LeadForm';
import ConsultationModal from '../components/ConsultationModal';
import { Link } from 'react-router-dom';

const Home = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState("");
    
    const openConsultModal = (course) => {
        setSelectedCourse(course);
        setIsConsultModalOpen(true);
    };
    const searchData = [
        { title: "Full Stack Java", type: "Course", link: "/courses/java" },
        { title: "Python Training", type: "Course", link: "/courses/python" },
        { title: "MERN Stack", type: "Course", link: "/courses/mern" },
        { title: "Software Testing", type: "Course", link: "/courses/testing" },
        { title: "Data Analytics", type: "Course", link: "/courses/data-analytics" },
        { title: "Java Jobs in Bangalore", type: "Job", link: "/jobs/java" },
        { title: "Tester Openings", type: "Job", link: "/jobs/testing" },
    ];

    const filteredResults = searchQuery.length >= 2
        ? searchData.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
        : [];

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (filteredResults.length > 0) {
            window.location.href = filteredResults[0].link;
        }
    };

    const programs = [
        {
            title: "Full Stack Java Development",
            desc: "Learn Java, Spring Boot, Angular to build enterprise-grade applications.",
            features: ["Strong Java + Spring Boot", "Frontend with React", "IT Company Projects", "6 Months Exp. Certificate", "AI Powered Placement"],
            color: "blue"
        },
        {
            title: "Full Stack Python Development",
            desc: "Master Python, Django, React for full stack web development.",
            features: ["Strong Python + Django", "Frontend with React", "IT Company Projects", "6 Months Exp. Certificate", "AI Powered Placement"],
            color: "blue"
        },
        {
            title: "Software Testing & Automation",
            desc: "Train in Manual, Selenium & API Testing for QA careers.",
            features: ["Manual + Selenium Automation", "Rest API Training", "IT Company Projects", "6 Months Exp. Certificate", "AI Powered Placement"],
            color: "blue"
        },
        {
            title: "MERN Stack Development",
            desc: "Build apps with MongoDB, Express, React, Node.js.",
            features: ["End-to-end JavaScript", "API Integrations", "IT Company Projects", "6 Months Exp. Certificate", "AI Powered Placement"],
            color: "blue"
        },
        {
            title: "Data Analytics",
            desc: "Learn SQL, Power BI, Python to analyze and visualize data.",
            features: ["PowerBI, SQL & Python", "Dashboard Creation", "IT Company Projects", "6 Months Exp. Certificate", "AI Powered Placement"],
            color: "blue"
        },
        {
            title: "Cyber Security",
            desc: "Gain skills in ethical hacking & cyber defense.",
            features: ["Ethical Hacking Tools", "Vulnerability Testing", "Security Compliance", "IT & BFSI Demand", "Placement Guarantee"],
            color: "blue"
        }
    ];

    return (
        <div className="home-page">
            {/* HERO SECTION */}
            <section className="hero-section">
                <div className="hero-overlay">
                    <div className="container">
                        <div className="hero-content">
                            <h1 className="hero-title">Advance Your Skills with <span className="text-accent">EtMS</span></h1>
                            <p className="hero-subtitle">
                                Get Trained & Certified by Software Companies. Work on live projects and pay up to 50% fees after placement.
                            </p>

                            <div className="search-wrapper">
                                <form className="search-inner" onSubmit={handleSearchSubmit}>
                                    <FaSearch className="search-icon" />
                                    <input 
                                        type="text" 
                                        placeholder="Search for courses (e.g. Java, Python, Testing)..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <button type="submit" className="btn-search">Search</button>
                                </form>
                                {filteredResults.length > 0 && (
                                    <div className="search-suggestions-overlay">
                                        {filteredResults.map((item, idx) => (
                                            <Link key={idx} to={item.link} className="suggestion-row">
                                                <span className="s-title">{item.title}</span>
                                                <span className="s-tag">{item.type}</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="hero-badges">
                                <span><FaCheckCircle /> Pay 50% After Placement</span>
                                <span><FaCheckCircle /> IT Company Certified</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* PROGRAMS SECTION */}
            <section className="programs-section">
                <div className="container">
                    <div className="section-header">
                        <span className="sub-tag">CAREER IN 2026</span>
                        <h2 className="section-heading">Our Top Training Programs For You</h2>
                    </div>
                    <div className="programs-grid">
                        {programs.map((item, idx) => (
                            <div className="program-card" key={idx}>
                                <div className="card-body">
                                    <h3>{item.title}</h3>
                                    <p>{item.desc}</p>
                                    <ul className="feature-list">
                                        {item.features.map((f, i) => (
                                            <li key={i}><FaCheckCircle className="check-icon" /> {f}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="card-footer">
                                    <button 
                                        className="btn-consult"
                                        onClick={() => openConsultModal(item.title)}
                                    >
                                        Schedule a consultation
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* WHO WE ARE */}
            <section className="who-we-are">
                <div className="container grid-2">
                    <div className="about-text">
                        <span className="sub-tag">WHO WE ARE</span>
                        <h2>Welcome to <span className="text-blue">EtMS Smart Learning</span></h2>
                        <p>
                            Traditional classroom training with dummy projects is no longer enough. The IT industry has transitioned to an era of AI. 
                            We have partnered with IT companies in India and the US to train you exactly as per industry needs.
                        </p>
                        <p>
                            Starting in the year 2000, we have a <strong>20+ years Legacy</strong>, having trained over 70,000 students and placed them in reputed MNCs.
                        </p>
                        <Link to="/about-us" className="btn-primary-blue">Learn More About Us</Link>
                    </div>
                    <div className="why-choose-grid">
                        <div className="why-card">
                            <FaRobot className="why-icon" />
                            <h4>AI Placement Tool</h4>
                        </div>
                        <div className="why-card">
                            <FaComments className="why-icon" />
                            <h4>AI English Coach</h4>
                        </div>
                        <div className="why-card">
                            <FaCertificate className="why-icon" />
                            <h4>IT Experience Certificate</h4>
                        </div>
                        <div className="why-card">
                            <FaHandHoldingUsd className="why-icon" />
                            <h4>Pay After Placement</h4>
                        </div>
                    </div>
                </div>
            </section>

            {/* CORE MODULES */}
            <section className="modules-section">
                <div className="container">
                    <h2 className="section-heading">Our Core LMS Modules</h2>
                    <div className="modules-grid">
                        <div className="module-card">
                            <div className="module-icon"><FaUserCheck /></div>
                            <h3>Attendance Management</h3>
                            <p>Automated tracking and reporting for students and trainers.</p>
                        </div>
                        <div className="module-card">
                            <div className="module-icon"><FaUsersCog /></div>
                            <h3>Batch Management</h3>
                            <p>Schedule and monitor multiple batches with ease.</p>
                        </div>
                        <div className="module-card">
                            <div className="module-icon"><FaCode /></div>
                            <h3>Assessments & Coding</h3>
                            <p>Built-in AI tools for aptitude and technical coding tests.</p>
                        </div>
                        <div className="module-card">
                            <div className="module-icon"><FaBriefcase /></div>
                            <h3>Placement Tracking</h3>
                            <p>Real-time analytics for student interviews and job offers.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CONTACT FORM (NEW) */}
            <LeadForm />

            <ConsultationModal 
                isOpen={isConsultModalOpen} 
                onClose={() => setIsConsultModalOpen(false)} 
                courseTitle={selectedCourse}
            />

            {/* SUCCESS STORIES */}
            <SuccessStories />

            {/* CTA */}
            <section className="home-cta">
                <div className="container">
                    <h2>Ready to start your professional journey?</h2>
                    <p>Join the thousands of students already working in Top MNCs.</p>
                    <div className="cta-btns">
                        <button 
                            className="btn-blue-solid"
                            onClick={() => openConsultModal("Free Demo Class")}
                        >
                            Book Free Demo Class
                        </button>
                        <button 
                            className="btn-blue-outline"
                            onClick={() => window.open('https://wa.me/917022928198', '_blank')}
                        >
                            Talk to Counsellor
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;