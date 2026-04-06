import { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import "./StudentTimetable.css";
import { 
  FaCalendarAlt, FaVideo, FaExclamationCircle, 
  FaChevronLeft, FaChevronRight, FaClock
} from "react-icons/fa";

/* ── Calendar Logic Helpers ── */
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

/* ── Formatting Helpers ── */
const formatTime12h = (timeStr) => {
  if (!timeStr) return "N/A";
  try {
    let [h, m] = timeStr.split(":");
    let hours = parseInt(h);
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${m} ${ampm}`;
  } catch (e) {
    return timeStr;
  }
};

function StudentTimetable() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  
  /* ── Calendar State ── */
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all batches the student is enrolled in
      const batchRes = await api.get("/student/my-batches");
      const fetchedBatches = batchRes.data || [];
      setBatches(fetchedBatches);
      
      // 2. Fetch the collective schedule for all batches
      const scheduleRes = await api.get("/student/my-schedule");
      setClasses(scheduleRes.data || []);
      
    } catch (err) {
      console.error("Failed to sync timetable", err);
    } finally {
      setLoading(false);
    }
  };

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  /* ── Navigation ── */
  const changeMonth = (offset) => {
    const newDate = new Date(currentYear, currentMonth + offset, 1);
    setViewDate(newDate);
  };

  /* ── Calendar Mapping ── */
  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push({ day: null, dateStr: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({ day: d, dateStr });
  }

  /* ── Group classes by date for easy lookup ── */
  const classesByDate = classes.reduce((acc, cls) => {
    const d = cls.classDate; // Backend uses camelCase classDate in my-schedule
    if (!acc[d]) acc[d] = [];
    acc[d].push(cls);
    return acc;
  }, {});

  if (loading) return <div className="timetable-container"><div className="sa-loader"></div><p>Syncing Full Schedule...</p></div>;

  return (
    <div className="timetable-container">
      <div className="timetable-header">
        <div className="header-left">
          <div className="title-row">
            <h2><FaCalendarAlt /> Study Timetable</h2>
            <span className="header-sub">Viewing all enrolled batch sessions in your unified calendar.</span>
          </div>
          <div className="calendar-legend-header">
            <div className="legend-item"><span className="dot blue"></span> Today</div>
            <div className="legend-item"><span className="dot primary-blue"></span> Scheduled Classes</div>
            <div className="legend-item"><span className="dot red"></span> Holiday</div>
          </div>
        </div>
      </div>

      {batches.length === 0 ? (
        <div className="empty-state">
           <FaExclamationCircle size={40} color="#94a3b8" />
           <p>You are not enrolled in any active batches yet.</p>
        </div>
      ) : (
        <div className="calendar-card">
          <div className="calendar-nav-header">
            <button className="nav-btn" onClick={() => changeMonth(-1)} title="Previous Month">
              <FaChevronLeft />
            </button>
            <div className="month-display">
               <h3>{MONTHS[currentMonth]} {currentYear}</h3>
            </div>
            <button className="nav-btn" onClick={() => changeMonth(1)} title="Next Month">
              <FaChevronRight />
            </button>
          </div>

          <div className="calendar-scroll-container">
            <div className="calendar-grid-wrapper">
              <div className="days-header-row">
                {DAYS_OF_WEEK.map(d => <div key={d} className="day-label">{d}</div>)}
              </div>

              <div className="calendar-day-grid">
                {calendarCells.map((cell, idx) => {
                  const dayClasses = cell.dateStr ? classesByDate[cell.dateStr] : null;
                  const isToday = cell.dateStr === todayStr;
                  const isSunday = cell.day && idx % 7 === 0;
                  
                  return (
                    <div 
                      key={idx} 
                      className={`calendar-day-cell ${!cell.day ? 'empty' : ''} ${isToday ? 'is-today' : ''} ${dayClasses ? 'has-event' : ''} ${isSunday ? 'is-sunday' : ''}`}
                    >
                      <div className="day-header-meta">
                        <div className="day-number">{cell.day}</div>
                        {isSunday && (
                          <div className="holiday-indicator" title="Sunday Holiday">
                             <span className="holiday-badge">Holiday</span>
                          </div>
                        )}
                      </div>
                    
                    {dayClasses && (
                      <div className="cell-content">
                        {dayClasses.map((cls, cIdx) => {
                          const batchInfo = batches.find(b => Number(b.batchId) === Number(cls.batchId));
                          const displayName = cls.batchName || batchInfo?.batchName || "Batch Session";
                          const meetUrl = cls.meetingLink || batchInfo?.meetingLink;

                          return (
                            <div key={cIdx} className="class-detail-card">
                              <span className="batch-tag-inline">{displayName}</span>
                              <div className="time-row">
                                <FaClock size={10} /> {formatTime12h(cls.startTime)} - {formatTime12h(cls.endTime)}
                              </div>
                              {meetUrl && (
                                <button 
                                  className="join-btn-tiny"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(meetUrl, "_blank");
                                  }}
                                >
                                  Join Class
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentTimetable;