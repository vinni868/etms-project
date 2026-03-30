import { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import "./StudentSchedule.css";

function StudentSchedule() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [batches, setBatches] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const batchesRes = await api.get("/student/my-batches");
        setBatches(batchesRes.data);

        const batchIds = batchesRes.data.map(batch => batch.batchId);
        const scheduleRes = await api.get("/student/my-schedule");
        const filteredSchedule = scheduleRes.data.filter(s => batchIds.includes(s.batchId));
        setSchedule(filteredSchedule);
      } catch (error) {
        console.error("Error fetching timetable data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div className="loading">Loading timetable...</div>;

  const scheduleByBatch = batches.map(batch => ({
    ...batch,
    classes: schedule.filter(s => s.batchId === batch.batchId)
  }));

  return (
    <div className="student-schedule-container">
      <h1 className="welcome-text">Welcome, {user?.name}</h1>
      <h2 className="section-title">Your Timetable</h2>

      {/* ===== Batches Section ===== */}
      <h3 className="sub-title">Assigned Batches</h3>
      <div className="batches-grid">
        {batches.map(batch => (
          <div className="batch-card" key={batch.batchId}>
            <div className="batch-header">
              <h3>{batch.batchName || "Unnamed Batch"}</h3>
              <span className={`status ${batch.status ? batch.status.toLowerCase() : ""}`}>
                {batch.status || "N/A"}
              </span>
            </div>
            <div className="batch-body">
              <div className="batch-info">
                <p><strong>Course:</strong> {batch.courseName || "N/A"}</p>
                <p><strong>Trainer:</strong> {batch.trainerName || "Not Assigned"}</p>
                <p><strong>Email:</strong> {batch.trainerEmail || "-"}</p>
                <p><strong>Duration:</strong> {batch.startDate || "N/A"} to {batch.endDate || "N/A"}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== Schedule Section ===== */}
      <h3 className="sub-title">Class Schedule (Batch-wise)</h3>
      {scheduleByBatch.map(batch => (
        <div key={batch.batchId} className="batch-schedule">
          <h4 className="batch-title">{batch.batchName} ({batch.courseName})</h4>
          {batch.classes.length === 0 ? (
            <p className="no-schedule">No classes scheduled for this batch.</p>
          ) : (
            <div className="schedule-table-container">
              <table className="schedule-table responsive-card-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Trainer</th>
                  </tr>
                </thead>
                <tbody>
                  {batch.classes
                    .sort((a, b) => new Date(a.classDate) - new Date(b.classDate))
                    .map((cls, idx) => (
                      <tr key={idx}>
                        <td data-label="Date">{cls.classDate || "N/A"}</td>
                        <td data-label="Start">{cls.startTime || "N/A"}</td>
                        <td data-label="End">{cls.endTime || "N/A"}</td>
                        <td data-label="Trainer">{cls.trainerName || batch.trainerName || "N/A"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default StudentSchedule;