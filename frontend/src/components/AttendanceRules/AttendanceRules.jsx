import React from 'react';
import { FaInfoCircle, FaMapMarkerAlt, FaHistory, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import './AttendanceRules.css';

const AttendanceRules = () => {
    const rules = [
        { 
            icon: <FaMapMarkerAlt color="#4f46e5" />, 
            text: "GPS/Location access is MANDATORY. Ensure your browser permission is set to 'Allow'." 
        },
        { 
            icon: <FaCheckCircle color="#10b981" />, 
            text: "You must be physically present at the institute. Punching from outside is blocked." 
        },
        { 
            icon: <FaHistory color="#f59e0b" />, 
            text: "The system watches your location every 30s. Leaving without punching out triggers a violation." 
        },
        { 
            icon: <FaExclamationTriangle color="#ef4444" />, 
            text: "All active sessions are auto-closed at 23:59:00 daily. Ensure you log out before leaving." 
        }
    ];

    return (
        <div className="attendance-rules-box">
            <div className="rules-header">
                <FaInfoCircle />
                <h4>Attendance Rules & Regulations</h4>
            </div>
            <div className="rules-grid">
                {rules.map((rule, index) => (
                    <div key={index} className="rule-item">
                        <div className="rule-icon">{rule.icon}</div>
                        <p>{rule.text}</p>
                    </div>
                ))}
            </div>
            <div className="rules-footer">
                Failure to comply may result in a "Location Violation" record.
            </div>
        </div>
    );
};

export default AttendanceRules;
