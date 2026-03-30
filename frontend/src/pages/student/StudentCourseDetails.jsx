import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import "./StudentCourseDetails.css";

function StudentCourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        // This matches your Spring Boot CourseMaster controller endpoint
        const response = await api.get(`/courses/${id}`);
        setCourse(response.data);
      } catch (err) {
        console.error("Error fetching course details:", err);
        setError("Course details could not be loaded.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCourseDetails();
    }
  }, [id]);

  if (loading) return <div className="loading-container">Loading course details...</div>;
  if (error) return <div className="error-container">{error}</div>;
  if (!course) return <div className="error-container">Course Not Found</div>;

  // Assuming syllabus/modules are stored as a comma-separated string or array in your DB
  // If your syllabus is a file path, you might show a "Download Syllabus" button instead
  const modules = course.description ? course.description.split(",") : ["General Overview"];

  return (
    <div className="course-details-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back to Courses
      </button>

      <div className="details-card">
        <div className="course-header">
          <span className="course-badge">{course.duration || "N/A"}</span>
          <h2>{course.courseName}</h2>
        </div>
        
        <p className="description">
          {course.description || "No detailed description available for this course yet."}
        </p>

        <div className="info-grid">
          <div className="info-item">
            <strong>Duration:</strong> <span>{course.duration}</span>
          </div>
          <div className="info-item">
            <strong>Status:</strong> <span>{course.status || "Active"}</span>
          </div>
        </div>

        <div className="modules-section">
          <h3>Syllabus / Modules</h3>
          {course.syllabusFileName ? (
             <div className="syllabus-download">
                <p>Curriculum file: {course.syllabusFileName}</p>
                <button className="download-btn">View Full Syllabus</button>
             </div>
          ) : (
            <ul>
              {modules.map((module, index) => (
                <li key={index}>
                  <span className="module-number">{index + 1}</span>
                  {module.trim()}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentCourseDetails;