import { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import "./StudentTimetable.css";
import { FaCalendarAlt, FaClock, FaVideo, FaExclamationCircle } from "react-icons/fa";

function StudentTimetable() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchTimetable(selectedBatch);
    }
  }, [selectedBatch]);

  const fetchBatches = async () => {
    try {
      const res = await api.get("/student/my-batches");
      setBatches(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedBatch(res.data[0].batchId);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to fetch batches", err);
      setLoading(false);
    }
  };

  const fetchTimetable = async (batchId) => {
    setLoading(true);
    try {
      const res = await api.get(`/student/batch-classes?batchId=${batchId}`);
      setClasses(res.data || []);
    } catch (err) {
      console.error("Failed to fetch timetable", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && batches.length > 0) return <div className="timetable-container"><p>Loading timetable...</p></div>;

  return (
    <div className="timetable-container">
      <div className="timetable-header">
        <h2>Study Timetable</h2>
        {batches.length > 0 && (
          <div className="batch-selector">
            <label>Switch Batch: </label>
            <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
              {batches.map(b => (
                <option key={b.batchId} value={b.batchId}>{b.batchName}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {batches.length === 0 ? (
        <div className="empty-state">
           <FaExclamationCircle size={40} color="#94a3b8" />
           <p>You are not enrolled in any active batches yet.</p>
        </div>
      ) : (
        <>
          <div className="timetable-section">
            <h3>📅 Schedule</h3>
            <div className="calendar-grid">
              {classes.length > 0 ? (
                classes.map((cls) => (
                  <div
                    key={cls.id}
                    className={`class-card ${cls.is_today ? "is-today" : ""}`}
                  >
                    <div className="class-card-badge">
                        {cls.is_today ? "TODAY" : "UPCOMING"}
                    </div>
                    <h3>Batch Session</h3>
                    <div className="class-info">
                      <p><FaCalendarAlt /> {cls.class_date}</p>
                      <p><FaClock /> {cls.start_time} - {cls.end_time}</p>
                    </div>

                    <a href={batches.find(b => b.batchId == selectedBatch)?.meetingLink || "#"} target="_blank" rel="noreferrer">
                      <button className="join-btn">
                        <FaVideo /> Join Session
                      </button>
                    </a>
                  </div>
                ))
              ) : (
                <p className="no-data">No sessions scheduled for this batch at the moment.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default StudentTimetable;