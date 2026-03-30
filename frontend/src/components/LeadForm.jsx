import React, { useState } from 'react';
import api from '../api/axiosConfig';
import './LeadForm.css';

const LeadForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        course: ''
    });
    const [status, setStatus] = useState({ type: '', msg: '' });
    const [loading, setLoading] = useState(false);

    const itCourses = [
        "Full Stack Java with AI",
        "Python Training with AI",
        "Software Testing with AI",
        "MERN Stack with AI"
    ];

    const nonItCourses = [
        "Data Analytics",
        "Digital Marketer",
        "Tally ERP 9 + GST",
        "Softskills + Aptitude"
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', msg: '' });

        try {
            const response = await api.post('/v1/queries/submit', formData);
            setStatus({ type: 'success', msg: response.data.message });
            setFormData({ name: '', email: '', phone: '', course: '' });
        } catch (error) {
            setStatus({ 
                type: 'error', 
                msg: error.response?.data?.error || "Something went wrong. Please try again." 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="lead-form-section">
            <div className="container">
                <div className="form-card">
                    <div className="form-header">
                        <h2>Looking for better solutions?</h2>
                        <p>Please Leave Your Details</p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="actual-form">
                        <div className="form-row">
                            <div className="input-group">
                                <label>Name *</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    placeholder="Enter your name" 
                                    value={formData.name}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                            <div className="input-group">
                                <label>Email *</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    placeholder="Enter your email" 
                                    value={formData.email}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="input-group">
                                <label>Phone *</label>
                                <input 
                                    type="tel" 
                                    name="phone" 
                                    placeholder="Enter your phone number" 
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                            <div className="input-group">
                                <label>Course Interested *</label>
                                <select 
                                    name="course" 
                                    value={formData.course}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select a course</option>
                                    <optgroup label="IT COURSES (AI POWERED)">
                                        {itCourses.map((c, i) => (
                                            <option key={`it-${i}`} value={c}>{c}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="NON-IT COURSES">
                                        {nonItCourses.map((c, i) => (
                                            <option key={`nonit-${i}`} value={c}>{c}</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? "Submitting..." : "Submit"}
                        </button>

                        {status.msg && (
                            <div className={`form-status ${status.type}`}>
                                {status.msg}
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </section>
    );
};

export default LeadForm;
