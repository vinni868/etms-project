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
function getSessionKey() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return `sd_activity_${user?.id || "guest"}`;
}

function getSessionActivity() {
  try {
    // If login just happened (flag set), wipe old data first
    if (sessionStorage.getItem("sd_fresh_login") === "1") {
      sessionStorage.removeItem(getSessionKey());
      sessionStorage.removeItem("sd_fresh_login");
    }
    return JSON.parse(sessionStorage.getItem(getSessionKey()) || "[]");
  } catch { return []; }
}

function addSessionActivity(icon, text, color = "blue") {
  const key  = getSessionKey();
  const prev = (() => {
    try { return JSON.parse(sessionStorage.getItem(key) || "[]"); }
    catch { return []; }
  })();

  const now = Date.now();
  const entry = {
    id:    now,
    icon,
    text,
    color,
    time:  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };

  // Deduplicate — skip if same text logged within last 60 seconds
  const deduped = prev.filter(p => !(p.text === text && now - p.id < 60000));
  const updated = [entry, ...deduped].slice(0, 15); // keep max 15 items
  sessionStorage.setItem(key, JSON.stringify(updated));
  return updated;
}

function clearSessionActivity() {
  sessionStorage.removeItem(getSessionKey());
  sessionStorage.removeItem("sd_login_logged");
  sessionStorage.removeItem("sd_fresh_login");
}

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

  /* ── Session activity ── */
  const [activity, setActivity] = useState(() => getSessionActivity());

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

  /* ── push activity helper ── */
  const pushActivity = useCallback((icon, text, color) => {
    setActivity(addSessionActivity(icon, text, color));
  }, []);

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

  /* ── Log login (once per session) ── */
  useEffect(() => {
    const alreadyLogged = sessionStorage.getItem("sd_login_logged");
    if (!alreadyLogged) {
      const updated = addSessionActivity("🔐", `Logged in as ${user?.name || "Student"}`, "indigo");
      setActivity(updated);
      sessionStorage.setItem("sd_login_logged", "1");
    }
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
      pushActivity("📚", `Viewed ${mapped.length} enrolled course(s)`, "blue");

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
    if (tab === "courses")  { fetchCourses();  pushActivity("📚", "Opened My Courses tab", "blue"); }
    if (tab === "schedule") { fetchSchedule(); pushActivity("📅", "Checked class schedule", "indigo"); }
    if (tab === "activity") { pushActivity("🕐", "Viewed session activity", "green"); }
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

  const timeStr = currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = currentTime.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  const activityColors = {
    blue: "#2563eb", green: "#16a34a", indigo: "#4f46e5",
    amber: "#d97706", red: "#dc2626", purple: "#7c3aed",
  };

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
          {(user?.portalId || user?.studentId) && (
            <div className="sd-hero__student-id">System ID: {user.portalId || user.studentId}</div>
          )}
          <p className="sd-hero__sub">Keep pushing — you're making great progress today.</p>
          <div className="sd-hero__meta">
            {/* Dynamic: shows ALL batch names */}
            {batchNames && (
              <span className="sd-meta-chip">🎓 {batchNames}</span>
            )}
            {/* Dynamic: shows location from user profile, hidden if empty */}
            {userLocation && (
              <span className="sd-meta-chip">📍 {userLocation}</span>
            )}
          </div>
        </div>

        <div className="sd-hero__right">
          <div className="sd-clock">
            <div className="sd-clock__time">{timeStr}</div>
            <div className="sd-clock__date">{dateStr}</div>
          </div>



          {/* ── Profile ── */}
          <div className="sd-profile-wrap" ref={profileRef}>
            <button className="sd-avatar"
              onClick={() => { setShowProfile(v => !v); setShowNotif(false); }}>
              {user?.name?.charAt(0)?.toUpperCase() || "S"}
            </button>

            {showProfile && (
              <div className="sd-dropdown sd-profile-drop">
                <div className="sd-profile-info">
                  <div className="sd-profile-avatar-lg">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <div className="sd-profile-name">{user?.name}</div>
                    <div className="sd-profile-email">{user?.email}</div>
                    {(user?.portalId || user?.studentId) && (
                      <div className="sd-profile-student-id">ID: {user.portalId || user.studentId}</div>
                    )}
                  </div>
                </div>
                <hr className="sd-divider" />
                <button className="sd-drop-btn" onClick={() => {
                  setShowProfile(false);
                  pushActivity("👤", "Visited My Profile", "blue");
                  navigate("/student/profile");
                }}>👤 My Profile</button>

                <button className="sd-drop-btn" onClick={() => {
                  setShowProfile(false);
                  navigate("/change-password");
                }}>🔑 Change Password</button>


                <hr className="sd-divider" />

                
              </div>
            )}
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
        {["overview","courses","schedule","activity"].map(tab => (
          <button key={tab}
            className={`sd-tab ${activeTab === tab ? "sd-tab--active" : ""}`}
            onClick={() => handleTabChange(tab)}>
            {tab === "overview"  && "📊 Overview"}
            {tab === "courses"   && "📚 My Courses"}
            {tab === "schedule"  && "📅 Schedule"}
            {tab === "activity"  && "🕐 Activity"}
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
                pushActivity("📚","Navigated to Courses","blue");
                navigate("/student/courses");
              }}><span>📚</span><span>View Courses</span></button>
              <button className="sd-action-btn sd-action-btn--green" onClick={() => {
                pushActivity("📊","Opened Attendance","green");
                navigate("/student/attendance");
              }}><span>📊</span><span>My Attendance</span></button>
              <button className="sd-action-btn sd-action-btn--purple" onClick={() => {
                pushActivity("🏆","Checked Performance","purple");
                navigate("/student/performance");
              }}><span>🏆</span><span>Performance</span></button>
              <button className="sd-action-btn sd-action-btn--orange" onClick={() => {
                pushActivity("⚡","Opened Punch In/Out","amber");
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
                      pushActivity("📘", `Opened course: ${c.name}`, "indigo");
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
                         target="_blank" rel="noreferrer"
                         onClick={() => pushActivity("🎥",`Joined: ${u.subject}`,"blue")}>
                         Join Now →
                      </a>
                    : <button className="sd-join-btn"
                        onClick={() => pushActivity("🎥",`Join clicked: ${u.subject}`,"blue")}>
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
                         href={u.meetingLink} target="_blank" rel="noreferrer"
                         onClick={() => pushActivity("🎥",`Joined: ${u.subject}`,"indigo")}>
                         Join →
                      </a>
                    : <button className="sd-join-btn sd-join-btn--outline"
                        onClick={() => pushActivity("🎥",`Join clicked: ${u.subject}`,"indigo")}>
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
