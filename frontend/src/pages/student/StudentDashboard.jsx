import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import "./StudentDashboard.css";
import QuickPunch from "../../components/QuickPunch/QuickPunch";
import AttendanceRules from "../../components/AttendanceRules/AttendanceRules";

/* ══════════════════════════════════════════════════
   SESSION-BASED ACTIVITY TRACKER
   Key is tied to user ID so different students
   never share activity. Cleared on logout.
══════════════════════════════════════════════════ */


/* ══════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════ */
const COURSE_ICON_MAP = {
  java: "☕", react: "⚛️", node: "🟢", mysql: "🗄️",
  python: "🐍", angular: "🅰️", spring: "🍃", html: "🌐",
  css: "🎨", js: "🟡", javascript: "🟡", default: "📘",
};

function getCourseIcon(name = "") {
  const lower = name.toLowerCase();
  for (const key of Object.keys(COURSE_ICON_MAP)) {
    if (key !== "default" && lower.includes(key)) return COURSE_ICON_MAP[key];
  }
  return COURSE_ICON_MAP.default;
}

function formatClassTime(dateStr, timeStr) {
  if (!dateStr) return "";
  const d      = new Date(dateStr);
  const today  = new Date(); today.setHours(0, 0, 0, 0);
  const tmrw   = new Date(today); tmrw.setDate(today.getDate() + 1);
  const dFloor = new Date(d); dFloor.setHours(0, 0, 0, 0);
  let label;
  if      (dFloor.getTime() === today.getTime()) label = "Today";
  else if (dFloor.getTime() === tmrw.getTime())  label = "Tomorrow";
  else label = d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  return timeStr ? `${label}  ${timeStr}` : label;
}

function isToday(dateStr) {
  const d     = new Date(dateStr); d.setHours(0,0,0,0);
  const today = new Date();         today.setHours(0,0,0,0);
  return d.getTime() === today.getTime();
}

function isFutureOrToday(dateStr) {
  const d     = new Date(dateStr); d.setHours(0,0,0,0);
  const today = new Date();         today.setHours(0,0,0,0);
  return d.getTime() >= today.getTime();
}

/* ══════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════ */
function StatCard({ value, label, icon, color, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end  = parseFloat(value);
    if (isNaN(end)) return;
    const step  = end / (1200 / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className={`sd-stat sd-stat--${color}`}>
      <div className="sd-stat__icon">{icon}</div>
      <div className="sd-stat__body">
        <div className="sd-stat__val">{display}{suffix}</div>
        <div className="sd-stat__label">{label}</div>
      </div>
      <div className="sd-stat__ring">
        <svg viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3" className="sd-ring-bg" />
          <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3"
            className="sd-ring-fill"
            strokeDasharray={`${Math.min(parseFloat(value) || 0, 100) * 0.94} 94`}
            strokeDashoffset="23.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */
function StudentDashboard() {
  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem("user") || '{"name":"Student","email":""}');

  const [showNotif,   setShowNotif]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [greeting,    setGreeting]    = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab,   setActiveTab]   = useState("overview");

  const quotes = [
    "The secret of getting ahead is getting started.",
    "Small steps in the right direction can turn into a giant leap.",
    "Your education is a dress rehearsal for a life that is yours to lead.",
    "The beautiful thing about learning is that no one can take it away from you.",
    "Don't let what you cannot do interfere with what you can do.",
    "Everything you've ever wanted is on the other side of fear.",
    "Success is the sum of small efforts, repeated day in and day out.",
    "The future belongs to those who believe in the beauty of their dreams.",
    "It always seems impossible until it's done.",
    "The only way to achieve the impossible is to believe it is possible.",
    "Believe in yourself and all that you are. You are stronger than you think.",
    "Quality is not an act, it is a habit.",
    "The harder you work for something, the greater you'll feel when you achieve it.",
    "Dream big, stay positive, work hard, and enjoy the journey.",
    "Strive for progress, not perfection.",
    "Don't wait for opportunity. Create it.",
    "Your limitation—it's only your imagination.",
    "Push yourself, because no one else is going to do it for you.",
    "Great things never come from comfort zones.",
    "Focus on being productive instead of busy.",
    "Success doesn't just find you. You have to go out and get it.",
    "The key to success is to focus on goals, not obstacles.",
    "Do something today that your future self will thank you for.",
    "Little things make big days.",
    "Don't stop when you're tired. Stop when you're done.",
    "Wake up with determination. Go to bed with satisfaction.",
    "It's going to be hard, but hard does not mean impossible.",
    "Learning is a treasure that will follow its owner everywhere.",
    "Motivation is what gets you started. Habit is what keeps you going.",
    "The expert in anything was once a beginner.",
    "Stay focused and never give up on your dreams."
  ];
  
  const dailyQuote = quotes[new Date().getDate() % quotes.length];



  /* ── Stats ── */
  const [stats, setStats] = useState({
    totalCourses: 0, attendance: 0, progress: 0, profileCompletion: 0, docsUploaded: 0
  });

  /* ── Batches: ALL batches student belongs to ── */
  const [allBatches,   setAllBatches]   = useState([]);  // [{batchId, batchName, meetingLink}]
  const [batchNames,   setBatchNames]   = useState("");  // comma-joined for hero chip

  /* ── Location from user profile (dynamic) ── */
  const [userLocation, setUserLocation] = useState("");

  /* ── Notifications (dynamic from batches + courses) ── */
  const [notifs,      setNotifs]      = useState([]);
  const [notifsReady, setNotifsReady] = useState(false);

  /* ── Courses (enrolled only, no fake progress) ── */
  const [courses,        setCourses]        = useState([]);
  const [coursesLoaded,  setCoursesLoaded]  = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);

  /* ── Schedule (ongoing + future only) ── */
  const [scheduleItems, setScheduleItems] = useState([]);
  const [upcomingItems, setUpcomingItems] = useState([]);
  const [schedLoaded,   setSchedLoaded]   = useState(false);
  const [schedLoading,  setSchedLoading]  = useState(false);

  const notifRef   = useRef();
  const profileRef = useRef();
  const token      = localStorage.getItem("token");
  const headers    = { Authorization: `Bearer ${token}` };



  /* ── Greeting ── */
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening");
  }, []);

  /* ── Clock ── */
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);



  /* ════════════════════════════════════════════
     1. DASHBOARD STATS
  ════════════════════════════════════════════ */
  useEffect(() => {
    api.get("/student/dashboard", { headers, withCredentials: true })
      .then(res => {
        setStats({
          totalCourses:       res.data.totalCourses       ?? 0,
          attendance:         res.data.attendance         ?? 0,
          progress:           res.data.progress           ?? 0,
          profileCompletion:  res.data.profileCompletion  ?? 0,
          docsUploaded:       res.data.docsUploaded       ?? 0,
        });
      })
      .catch(err => console.error("Dashboard stats error:", err));
  }, []);

  /* ════════════════════════════════════════════
     2. BATCHES — fetch ALL batches, show all names
        /api/student/my-batches
  ════════════════════════════════════════════ */
  useEffect(() => {
    api.get("/student/my-batches", { headers, withCredentials: true })
      .then(res => {
        const batches = res.data || [];
        setAllBatches(batches);
        // Show all batch names joined by " · "
        const names = batches.map(b => b.batchName).filter(Boolean).join(" · ");
        setBatchNames(names);
      })
      .catch(() => {});
  }, []);

  /* ════════════════════════════════════════════
     3. USER PROFILE for dynamic location
        /api/student/profile  OR  use user object
        from localStorage if it has city/address
  ════════════════════════════════════════════ */
  useEffect(() => {
    // Try to get location from stored user object first
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (storedUser.city || storedUser.location || storedUser.address) {
      setUserLocation(storedUser.city || storedUser.location || storedUser.address);
      return;
    }
    // If not in localStorage, try fetching profile
    api.get("/student/profile", { headers, withCredentials: true })
      .then(res => {
        const loc = res.data?.city || res.data?.location || res.data?.address || "";
        setUserLocation(loc);
      })
      .catch(() => {
        // No profile endpoint or no location — leave empty, don't show static text
        setUserLocation("");
      });
  }, []);

  /* ════════════════════════════════════════════
     4. DYNAMIC NOTIFICATIONS
        Built from: batch assignments + courses
        mapped to student. Real data, not static.
  ════════════════════════════════════════════ */
  const buildNotifications = useCallback(async (batches, courseList) => {
    const notifList = [];
    const today = new Date(); today.setHours(0,0,0,0);

    // A. Notify for each ongoing batch
    batches.forEach(b => {
      notifList.push({
        id:     `batch-${b.batchId}`,
        icon:   "🎓",
        text:   `You are enrolled in batch: ${b.batchName}`,
        unread: false,
      });
    });

    // B. Notify for each enrolled course
    courseList.forEach(c => {
      notifList.push({
        id:     `course-${c.id}`,
        icon:   "📘",
        text:   `Course enrolled: ${c.name}`,
        unread: false,
      });
    });

    // C. Notify for upcoming classes today
    try {
      for (const b of batches) {
        const cr = await api.get(
          `/student/batch-classes?batchId=${b.batchId}`,
          { headers, withCredentials: true }
        );
        const todayClasses = (cr.data || []).filter(cls => {
          const d = new Date(cls.class_date || cls.classDate || "");
          d.setHours(0,0,0,0);
          return d.getTime() === today.getTime();
        });
        todayClasses.forEach(cls => {
          const time = cls.start_time || cls.startTime || "";
          notifList.push({
            id:     `class-today-${cls.id}`,
            icon:   "📅",
            text:   `Class today: ${b.batchName}${time ? " at " + time : ""}`,
            unread: true,
          });
        });
      }
    } catch { /* skip */ }

    // Mark first 3 as unread if any
    const final = notifList.map((n, i) => ({ ...n, unread: i < 3 ? true : n.unread }));
    setNotifs(final);
    setNotifsReady(true);
  }, []);

  /* ════════════════════════════════════════════
     5. SCHEDULE — ongoing + future ONLY
        Sorted: today's classes first, then future
  ════════════════════════════════════════════ */
  const fetchSchedule = useCallback(async () => {
    if (schedLoaded) return;
    setSchedLoading(true);
    try {
      const batchRes = await api.get("/student/my-batches", { headers, withCredentials: true });
      const batches  = batchRes.data || [];
      if (!batches.length) { setSchedLoading(false); setSchedLoaded(true); return; }

      const all = [];
      for (const b of batches) {
        try {
          const cr = await api.get(
            `/student/batch-classes?batchId=${b.batchId}`,
            { headers, withCredentials: true }
          );
          (cr.data || []).forEach(cls => {
            const dateKey = cls.class_date || cls.classDate || "";
            // ── ONLY include today + future ──
            if (!isFutureOrToday(dateKey)) return;
            all.push({
              id:          cls.id,
              subject:     b.batchName,
              classDate:   dateKey,
              startTime:   cls.start_time || cls.startTime || "",
              endTime:     cls.end_time   || cls.endTime   || "",
              type:        "Live Class",
              meetingLink: b.meetingLink || null,
              isToday:     isToday(dateKey),
            });
          });
        } catch { /* skip failed batch */ }
      }

      // Sort: today's classes first, then future ascending
      all.sort((a, b) => {
        if (a.isToday && !b.isToday) return -1;
        if (!a.isToday && b.isToday) return 1;
        return new Date(a.classDate) - new Date(b.classDate);
      });

      setScheduleItems(all);

      // Upcoming = same list sliced to 3 for overview panel
      const upcoming = all.slice(0, 3).map(c => ({
        id:      c.id,
        subject: c.subject,
        time:    formatClassTime(c.classDate, c.startTime),
        type:    c.type,
        color:   c.isToday ? "blue" : "indigo",
      }));
      setUpcomingItems(upcoming);
      setSchedLoaded(true);
    } catch (err) {
      console.error("Schedule fetch error:", err);
    } finally {
      setSchedLoading(false);
    }
  }, [schedLoaded]);

  /* ════════════════════════════════════════════
     6. COURSES — enrolled list only, no progress
  ════════════════════════════════════════════ */
  const fetchCourses = useCallback(async () => {
    if (coursesLoaded) return;
    setCoursesLoading(true);
    try {
      const res     = await api.get("/student/my-courses", { headers, withCredentials: true });
      const mapped  = (res.data || []).map(c => ({
        id:          c.id,
        name:        c.courseName || c.name || "Course",
        icon:        getCourseIcon(c.courseName || c.name || ""),
        duration:    c.duration    || "",
        description: c.description || "",
        syllabusFileName: c.syllabusFileName || "",
      }));
      setCourses(mapped);
      setCoursesLoaded(true);

      // Build notifications once we have batches + courses
      if (allBatches.length > 0) buildNotifications(allBatches, mapped);
    } catch (err) {
      console.error("Courses fetch error:", err);
    } finally {
      setCoursesLoading(false);
    }
  }, [coursesLoaded, allBatches, buildNotifications]);

  // When batches load, trigger notification build if courses already loaded
  useEffect(() => {
    if (allBatches.length > 0 && coursesLoaded) {
      buildNotifications(allBatches, courses);
    }
    // Also pre-build with just batches (courses empty array fallback)
    if (allBatches.length > 0 && !notifsReady) {
      buildNotifications(allBatches, courses);
    }
  }, [allBatches]);

  /* Pre-fetch schedule on mount */
  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  /* ── Tab handler ── */
  const handleTabChange = tab => {
    setActiveTab(tab);
    if (tab === "courses")  { fetchCourses(); }
    if (tab === "schedule") { fetchSchedule(); }
  };

  /* ── Click outside dropdowns ── */
  useEffect(() => {
    const h = e => {
      if (notifRef.current   && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const unreadCount = notifs.filter(n => n.unread).length;
  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, unread: false })));
    pushActivity("🔔", "Marked all notifications as read", "amber");
  };

  const timeStr = currentTime.toLocaleTimeString('en-US', { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase();
  const dateStr = currentTime.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  /* ════════════════════════════════════════════
     JSX
  ════════════════════════════════════════════ */
  return (
    <div className="sd-page">

      {/* ══════════ HERO ══════════ */}
      <div className="sd-hero">
        <div className="sd-hero__bg" />
        <div className="sd-hero__left">
          <div className="sd-greeting-tag">{greeting} 👋</div>
          <h1 className="sd-hero__name">{user?.name || "Student"}</h1>
          <p className="sd-hero__quote">“{dailyQuote}”</p>
          <p className="sd-hero__sub">Keep pushing — you're making great progress today.</p>
        </div>

        <div className="sd-hero__right">
          <div className="sd-clock">
            <div className="sd-clock__time">{timeStr}</div>
            <div className="sd-clock__date">{dateStr}</div>
          </div>




        </div>
      </div>

      {/* ══════════ STAT CARDS ══════════ */}
      <div className="sd-stats">
        <StatCard value={stats.totalCourses}       label="Enrolled Courses" icon="📚" color="blue" />
        <StatCard value={stats.attendance}         label="Attendance Rate"  icon="✅" color="green"  suffix="%" />
        <StatCard value={stats.profileCompletion}  label="Profile Hub"      icon="🛡️" color="purple" suffix="%" />
        <StatCard value={stats.progress}           label="Overall Progress" icon="🚀" color="indigo" suffix="%" />
      </div>

      {/* ══════════ TABS ══════════ */}
      <div className="sd-tabs">
        {["overview","courses","schedule"].map(tab => (
          <button key={tab}
            className={`sd-tab ${activeTab === tab ? "sd-tab--active" : ""}`}
            onClick={() => handleTabChange(tab)}>
            {tab === "overview"  && "📊 Overview"}
            {tab === "courses"   && "📚 My Courses"}
            {tab === "schedule"  && "📅 Schedule"}
          </button>
        ))}
      </div>

      {/* ══════════ OVERVIEW TAB ══════════ */}
      {activeTab === "overview" && (
        <div className="sd-overview-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="sd-punch-full-width" style={{ width: '100%' }}>
            <QuickPunch variant="horizontal" />
            <div style={{ marginTop: '1rem' }}>
              <AttendanceRules />
            </div>
          </div>

          <div className="sd-grid-3">

          <div className="sd-card">
            <div className="sd-card-head"><h2>⚡ Quick Actions</h2></div>
            <div className="sd-actions">
              <button className="sd-action-btn sd-action-btn--blue" onClick={() => {
                navigate("/student/courses");
              }}><span>📚</span><span>View Courses</span></button>
              <button className="sd-action-btn sd-action-btn--green" onClick={() => {
                navigate("/student/attendance");
              }}><span>📊</span><span>My Attendance</span></button>
              <button className="sd-action-btn sd-action-btn--purple" onClick={() => {
                navigate("/student/performance");
              }}><span>🏆</span><span>Performance</span></button>
              <button className="sd-action-btn sd-action-btn--orange" onClick={() => {
                navigate("/student/time-tracking");
              }}><span>⚡</span><span>Punch In / Out</span></button>
            </div>
          </div>

          <div className="sd-card">
            <div className="sd-card-head">
              <h2>📈 Learning Progress</h2>
              <span className="sd-card-badge">{stats.progress}% done</span>
            </div>
            <div className="sd-progress-circle">
              <svg viewBox="0 0 120 120" className="sd-donut">
                <circle cx="60" cy="60" r="50" fill="none" strokeWidth="12" className="sd-donut-bg" />
                <circle cx="60" cy="60" r="50" fill="none" strokeWidth="12"
                  className="sd-donut-fill"
                  strokeDasharray={`${stats.progress * 3.14} 314`}
                  strokeDashoffset="78.5" strokeLinecap="round" />
                <text x="60" y="64" textAnchor="middle" className="sd-donut-text">{stats.progress}%</text>
              </svg>
            </div>
            <div className="sd-prog-label">
              <span>0%</span>
              <span className="sd-prog-center">Based on Attendance</span>
              <span>100%</span>
            </div>
          </div>

          <div className="sd-card">
            <div className="sd-card-head">
              <h2>📅 Upcoming Classes</h2>
              <button className="sd-link-btn" onClick={() => handleTabChange("schedule")}>
                View all →
              </button>
            </div>
            {schedLoading ? (
              <div className="sd-mini-loader"><div className="sd-mini-spin" /><span>Loading…</span></div>
            ) : upcomingItems.length === 0 ? (
              <div className="sd-empty-msg">No upcoming classes scheduled</div>
            ) : (
              <div className="sd-upcoming-list">
                {upcomingItems.map(u => (
                  <div key={u.id} className={`sd-upcoming-item sd-upcoming-item--${u.color}`}>
                    <div className="sd-upcoming-dot" />
                    <div className="sd-upcoming-body">
                      <div className="sd-upcoming-name">{u.subject}</div>
                      <div className="sd-upcoming-time">{u.time}</div>
                    </div>
                    <span className={`sd-type-chip sd-type-chip--${u.color}`}>
                      {u.color === "blue" ? "Today" : u.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          </div>
        </div>
      )}

      {/* ══════════ COURSES TAB — enrolled list only, no progress ══════════ */}
      {activeTab === "courses" && (
        <div className="sd-courses-wrapper">
          {coursesLoading ? (
            <div className="sd-loader-center">
              <div className="sd-mini-spin" /> Loading courses…
            </div>
          ) : courses.length === 0 ? (
            <div className="sd-empty-msg">No courses assigned yet.</div>
          ) : (
            <div className="sd-course-grid">
              {courses.map(c => (
                <div key={c.id} className="sd-course-tile">
                  <div className="sd-course-tile__icon">{c.icon}</div>
                  <div className="sd-course-tile__body">
                    <div className="sd-course-tile__name">{c.name}</div>
                    {c.duration && (
                      <div className="sd-course-tile__meta">⏱ {c.duration}</div>
                    )}
                    {c.description && (
                      <div className="sd-course-tile__desc">{c.description}</div>
                    )}
                  </div>
                  <div className="sd-course-tile__actions">
                    <span className="sd-enrolled-chip">✓ Enrolled</span>
                    <button className="sd-course-btn" onClick={() => {
                      navigate("/student/courses");
                    }}>View →</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════ SCHEDULE TAB — ongoing + future only ══════════ */}
      {activeTab === "schedule" && (
        <div className="sd-schedule">
          {schedLoading ? (
            <div className="sd-loader-center">
              <div className="sd-mini-spin" /> Loading schedule…
            </div>
          ) : scheduleItems.length === 0 ? (
            <div className="sd-empty-msg">No upcoming classes found.</div>
          ) : (
            <>
              {/* Today section */}
              {scheduleItems.some(u => u.isToday) && (
                <div className="sd-sched-section-label">Today's Classes</div>
              )}
              {scheduleItems.filter(u => u.isToday).map(u => (
                <div key={u.id} className="sd-sched-card sd-sched-card--today">
                  <div className="sd-sched-accent sd-sched-accent--blue" />
                  <div className="sd-sched-body">
                    <div className="sd-sched-top">
                      <span className="sd-sched-name">{u.subject}</span>
                      <div className="sd-sched-chips">
                        <span className="sd-type-chip sd-type-chip--blue">Live Class</span>
                        <span className="sd-today-badge">TODAY</span>
                      </div>
                    </div>
                    <div className="sd-sched-time">
                      🕐 {u.startTime || "Time TBD"}
                      {u.endTime && ` – ${u.endTime}`}
                    </div>
                  </div>
                  {u.meetingLink
                    ? <a className="sd-join-btn" href={u.meetingLink}
                         target="_blank" rel="noreferrer">
                         Join Now →
                      </a>
                    : <button className="sd-join-btn">
                         Join Now →
                      </button>
                  }
                </div>
              ))}

              {/* Future section */}
              {scheduleItems.some(u => !u.isToday) && (
                <div className="sd-sched-section-label sd-sched-section-label--future">
                  📆 Upcoming Classes
                </div>
              )}
              {scheduleItems.filter(u => !u.isToday).map(u => (
                <div key={u.id} className="sd-sched-card sd-sched-card--indigo">
                  <div className="sd-sched-accent sd-sched-accent--indigo" />
                  <div className="sd-sched-body">
                    <div className="sd-sched-top">
                      <span className="sd-sched-name">{u.subject}</span>
                      <span className="sd-type-chip sd-type-chip--indigo">Live Class</span>
                    </div>
                    <div className="sd-sched-time">
                      🕐 {formatClassTime(u.classDate, u.startTime)}
                      {u.endTime && ` – ${u.endTime}`}
                    </div>
                  </div>
                  {u.meetingLink
                    ? <a className="sd-join-btn sd-join-btn--outline"
                         href={u.meetingLink} target="_blank" rel="noreferrer">
                         Join →
                      </a>
                    : <button className="sd-join-btn sd-join-btn--outline">
                         Join →
                      </button>
                  }
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ══════════ ACTIVITY TAB ══════════ */}
      {activeTab === "activity" && (
        <div className="sd-card sd-activity-card">
          <div className="sd-card-head">
            <h2>🕐 This Session</h2>
            <div className="sd-activity-meta">
              <span className="sd-card-badge">{activity.length} events</span>
              <span className="sd-activity-note">Clears on logout</span>
            </div>
          </div>

          {activity.length === 0 ? (
            <div className="sd-empty-msg" style={{ padding: "40px 0" }}>
              No activity yet this session.
            </div>
          ) : (
            <div className="sd-timeline">
              {activity.map((a, i) => (
                <div key={a.id} className="sd-timeline-item">
                  <div className="sd-timeline-dot-wrap">
                    <div className="sd-timeline-dot"
                      style={{
                        background: `${activityColors[a.color] || activityColors.blue}18`,
                        color:       activityColors[a.color] || activityColors.blue,
                      }}>
                      {a.icon}
                    </div>
                    {i < activity.length - 1 && <div className="sd-timeline-line" />}
                  </div>
                  <div className="sd-timeline-body">
                    <div className="sd-timeline-text">{a.text}</div>
                    <div className="sd-timeline-time">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default StudentDashboard;
