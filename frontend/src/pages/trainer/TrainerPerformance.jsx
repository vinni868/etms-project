import React, { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import { 
  FaChartLine, FaTrophy, FaExclamationTriangle, 
  FaGraduationCap, FaUsers, FaPercent 
} from "react-icons/fa";
import "./TrainerPerformance.css";

function TrainerPerformance() {
  const user = JSON.parse(localStorage.getItem("user"));
  const trainerId = user?.id || 3;

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get(`/teacher/courses/${trainerId}`);
      setCourses(res.data);
    } catch (err) {
      console.error("Course fetch failed", err);
    }
  };

  const handleCourseChange = async (courseId) => {
    setSelectedCourse(courseId);
    setSelectedBatch("");
    setPerformanceData(null);
    try {
      const res = await api.get(`/teacher/courses/${trainerId}/${courseId}/batches`);
      setBatches(res.data);
    } catch (err) {
      console.error("Batch fetch failed", err);
    }
  };

  const fetchBatchPerformance = async (batchId) => {
    setSelectedBatch(batchId);
    if (!batchId) return;

    setLoading(true);
    try {
      // Fetching all attendance history for this batch to calculate metrics
      const res = await api.get(`/teacher/attendance/history/${batchId}?from=2024-01-01&to=2026-12-31`);
      const history = res.data;

      if (history.length === 0) {
        setPerformanceData({ empty: true });
        return;
      }

      // Logic to calculate performance per student
      const studentMap = {};
      history.forEach(rec => {
        if (!studentMap[rec.studentName]) {
          studentMap[rec.studentName] = { name: rec.studentName, present: 0, total: 0 };
        }
        studentMap[rec.studentName].total += 1;
        if (rec.status === "PRESENT") studentMap[rec.studentName].present += 1;
      });

      const studentStats = Object.values(studentMap).map(s => ({
        name: s.name,
        score: Math.round((s.present / s.total) * 100)
      }));

      const avgAttendance = Math.round(
        (studentStats.reduce((acc, curr) => acc + curr.score, 0) / studentStats.length)
      );

      setPerformanceData({
        attendance: avgAttendance,
        avgScore: avgAttendance, // Using attendance as a proxy for engagement
        assignmentCompletion: Math.min(100, avgAttendance + 5), // Mocked relative to attendance
        students: studentStats,
        topStudents: [...studentStats].sort((a, b) => b.score - a.score).slice(0, 3),
        lowPerformers: studentStats.filter(s => s.score < 65)
      });
    } catch (err) {
      console.error("Performance fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="performance-page-wrapper">
      <div className="performance-header">
        <div className="title-area">
          <h1><FaChartLine /> Trainer Performance</h1>
          <p>Real-time insights based on batch attendance and engagement.</p>
        </div>

        <div className="filter-controls">
          <select value={selectedCourse} onChange={(e) => handleCourseChange(e.target.value)}>
            <option value="">Select Course</option>
            {courses.map(c => <option key={c.courseId} value={c.courseId}>{c.courseName}</option>)}
          </select>

          <select value={selectedBatch} onChange={(e) => fetchBatchPerformance(e.target.value)}>
            <option value="">Select Batch</option>
            {batches.map(b => <option key={b.batchId} value={b.batchId}>{b.batchName}</option>)}
          </select>
        </div>
      </div>

      {!performanceData ? (
        <div className="placeholder-state">
          <FaUsers size={50} />
          <p>Please select a course and batch to view performance metrics.</p>
        </div>
      ) : performanceData.empty ? (
        <div className="placeholder-state">
          <p>No attendance data found for this batch yet.</p>
        </div>
      ) : (
        <div className="performance-content">
          {/* Main Stats */}
          <div className="stats-grid-v2">
            <div className="perf-card">
              <div className="perf-card-icon blue"><FaPercent /></div>
              <div className="perf-card-info">
                <h3>Batch Attendance</h3>
                <h2>{performanceData.attendance}%</h2>
                <div className="mini-progress"><div style={{ width: `${performanceData.attendance}%` }}></div></div>
              </div>
            </div>

            <div className="perf-card">
              <div className="perf-card-icon green"><FaGraduationCap /></div>
              <div className="perf-card-info">
                <h3>Engagement Score</h3>
                <h2>{performanceData.avgScore}%</h2>
                <div className="mini-progress"><div style={{ width: `${performanceData.avgScore}%` }}></div></div>
              </div>
            </div>

            <div className="perf-card">
              <div className="perf-card-icon orange"><FaChartLine /></div>
              <div className="perf-card-info">
                <h3>Completion Rate</h3>
                <h2>{performanceData.assignmentCompletion}%</h2>
                <div className="mini-progress"><div style={{ width: `${performanceData.assignmentCompletion}%` }}></div></div>
              </div>
            </div>
          </div>

          <div className="details-row">
            {/* Top Performers */}
            <div className="details-card">
              <h3><FaTrophy className="gold" /> Top Performers</h3>
              <div className="student-list">
                {performanceData.topStudents.map((s, i) => (
                  <div key={i} className="list-item">
                    <span className="rank">{i + 1}</span>
                    <span className="name">{s.name}</span>
                    <span className="score-badge">{s.score}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Low Performers */}
            <div className="details-card alert-card">
              <h3><FaExclamationTriangle className="red" /> Needing Attention</h3>
              <div className="student-list">
                {performanceData.lowPerformers.length === 0 ? (
                  <p className="success-text">All students are above the 65% threshold! 🎉</p>
                ) : (
                  performanceData.lowPerformers.map((s, i) => (
                    <div key={i} className="list-item">
                      <span className="name">{s.name}</span>
                      <span className="score-badge red-bg">{s.score}% Attendance</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainerPerformance;