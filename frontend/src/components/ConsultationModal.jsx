import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheckCircle, FaPaperPlane } from 'react-icons/fa';
import api from '../api/axiosConfig';
import './ConsultationModal.css';

const ConsultationModal = ({ isOpen, onClose, courseTitle }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });
    const [status, setStatus] = useState('idle'); // 'idle', 'submitting', 'success'

    // Disable body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target.className === 'modal-overlay') {
            onClose();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');
        try {
            await api.post('/consultations/book', {
                ...formData,
                course: courseTitle
            });
            setStatus('success');
            setTimeout(() => {
                onClose();
                setStatus('idle');
                setFormData({ name: '', email: '', phone: '', message: '' });
            }, 3000);
        } catch (error) {
            console.error("Booking error:", error);
            alert("Something went wrong. Please try again or call us!");
            setStatus('idle');
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="consultation-modal" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}><FaTimes /></button>
                
                {status === 'success' ? (
                    <div className="success-view">
                        <FaCheckCircle className="success-icon" />
                        <h2>Booking Confirmed!</h2>
                        <p>Our senior counselor will contact you shortly regarding <strong>{courseTitle}</strong>.</p>
                    </div>
                ) : (
                    <div className="form-view">
                        <div className="modal-header">
                            <h2>{courseTitle === 'Free Demo Class' ? 'Book Free Demo Class' : 'Free Consultation'}</h2>
                            <p>
                                {courseTitle === 'Free Demo Class' 
                                    ? 'Reserve your spot for our upcoming live interactive session'
                                    : <>Get career guidance for <span>{courseTitle}</span></>}
                            </p>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label>Full Name</label>
                                <input 
                                    required 
                                    type="text" 
                                    placeholder="Enter your name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="input-grid">
                                <div className="input-group">
                                    <label>Email Address</label>
                                    <input 
                                        required 
                                        type="email" 
                                        placeholder="email@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Phone Number</label>
                                    <input 
                                        required 
                                        type="tel" 
                                        placeholder="+91"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Special Requirements/Questions</label>
                                <textarea 
                                    placeholder="Anything else you'd like to ask?"
                                    rows="3"
                                    value={formData.message}
                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                ></textarea>
                            </div>
                            <button type="submit" className="submit-consult-btn" disabled={status === 'submitting'}>
                                {status === 'submitting' ? 'Booking your slot...' : <>Schedule Now <FaPaperPlane /></>}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConsultationModal;
