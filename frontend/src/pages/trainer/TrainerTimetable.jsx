import { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import "./TrainerTimetable.css";
import { FaCalendarAlt, FaClock, FaVideo, FaChevronRight } from "react-icons/fa";

function TrainerTimetable() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const trainerId = user?.id;

  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [batches, setBatches] = useState([]);
  const PAGE_SIZE = 10;

  useEffect(() => {
    if (trainerId) {
      fetchActiveBatches();
      fetchSchedule(0);
    }
  }, [trainerId]);

  const fetchActiveBatches = async () => {
    try {
      const res = await api.get(`/teacher/active-batches/${trainerId}`);
      setBatches(res.data || []);
    } catch (err) {
      console.error("Failed to fetch batches", err);
    }
  };

  const fetchSchedule = async (pageNum) => {
    setLoading(true);
    try {
      const res = await api.get(
        `/teacher/schedule/${trainerId}?page=${pageNum}&size=${PAGE_SIZE}`
      );
      setSchedule(res.data.content || []);
      setTotal(res.data.total || 0);
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to fetch schedule", err);
    } finally {
      setLoading(false);
    }
  };

  const isToday = (dateStr) => {
    const d = new Date(dateStr);
    const t = new Date();
    return (
      d.getFullYear() === t.getFullYear() &&
      d.getMonth() === t.getMonth() &&
      d.getDate() === t.getDate()
    );
  };

  const getMeetingLink = (batchName) => {
    const batch = batches.find(
      (b) => b.batchName?.toLowerCase() === batchName?.toLowerCase()
    );
    return batch?.meetingLink || null;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isToday(dateStr)) return "Today";
    return d.toLocaleDateString("en-IN", {
      weekday: "short", month: "short", day: "numeric"
    });
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="timetable-container">
      <div className="timetable-header">
        <div>
          <h2>📅 My Teaching Schedule</h2>
          <p className="timetable-subtitle">Upcoming classes and session details</p>
        </div>
        <div className="batch-count-pill">{total} Sessions</div>
      </div>

      {loading ? (
        <div className="tt-loading">
          <div className="tt-spinner" />
          <span>Loading schedule…</span>
        </div>
      ) : schedule.length === 0 ? (
        <div className="tt-empty">
          <FaCalendarAlt size={48} opacity={0.3} />
          <p>No upcoming classes scheduled.</p>
        </div>
      ) : (
        <>
          <div className="calendar-grid">
            {schedule.map((cls, idx) => {
              const todayBadge = isToday(cls.class_date);
              const meetLink = getMeetingLink(cls.batch_name);
              return (
                <div
                  key={idx}
                  className={`class-card ${todayBadge ? "class-card--today" : ""}`}
                >
                  {todayBadge && <div className="today-ribbon">TODAY</div>}

                  <div className="class-card-header">
                    <h3>{cls.batch_name || "Batch Session"}</h3>
                  </div>

                  <div className="class-info">
                    <p>
                      <FaCalendarAlt className="ci-icon" />
                      <strong>{formatDate(cls.class_date)}</strong>
                    </p>
                    <p>
                      <FaClock className="ci-icon" />
                      {cls.start_time} – {cls.end_time}
                    </p>
                  </div>

                  {meetLink ? (
                    <a href={meetLink} target="_blank" rel="noreferrer" className="join-btn">
                      <FaVideo /> Join Session
                    </a>
                  ) : (
                    <button className="join-btn join-btn--disabled" disabled>
                      No Link Set
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="tt-pagination">
              <button
                className="tt-page-btn"
                disabled={page === 0}
                onClick={() => fetchSchedule(page - 1)}
              >
                ← Prev
              </button>
              <span>
                Page {page + 1} of {totalPages}
              </span>
              <button
                className="tt-page-btn"
                disabled={page >= totalPages - 1}
                onClick={() => fetchSchedule(page + 1)}
              >
                Next → <FaChevronRight />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TrainerTimetable;