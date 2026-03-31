import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/axiosConfig";
import { useNavigate } from "react-router-dom";
import QuickPunch from "../../components/QuickPunch/QuickPunch";
import AttendanceRules from "../../components/AttendanceRules/AttendanceRules";
import {
  FaSync,
  FaUser,
  FaBook,
  FaCalendarAlt,
  FaFileAlt,
  FaClipboardCheck,
  FaChevronLeft,
  FaChevronRight,
  FaVideo,
  FaClock,
  FaLayerGroup,
  FaBullhorn,
  FaChartLine,
  FaBed
} from "react-icons/fa";
import "./TrainerDashboard.css";

/* ── helpers ── */
const toDateStr = (d) => d.toISOString().split("T")[0]; // "YYYY-MM-DD"

const formatTime = (time) => {
  if (!time) return "";
  const [hour, minute] = time.split(":");
  let h = parseInt(hour);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${minute} ${ampm}`;
};

const formatDisplayDate = (date) =>
  date.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric"
  });

const isToday = (date) =>
  toDateStr(date) === toDateStr(new Date());

const isTomorrow = (date) => {
  const tmrw = new Date();
  tmrw.setDate(tmrw.getDate() + 1);
  return toDateStr(date) === toDateStr(tmrw);
};

const dayLabel = (date) => {
  if (isToday(date))    return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

/* status of a class slot at this moment */
const classStatus = (item, viewDate) => {
  const now = new Date();
  const todayStr = toDateStr(new Date());
  const viewStr  = toDateStr(viewDate);

  if (viewStr !== todayStr) return "scheduled"; // future date — just show as scheduled

  const [sh, sm] = item.start_time.split(":").map(Number);
  const [eh, em] = item.end_time.split(":").map(Number);
  const startMs = sh * 60 + sm;
  const endMs   = eh * 60 + em;
  const nowMs   = now.getHours() * 60 + now.getMinutes();

  if (nowMs < startMs) return "upcoming";
  if (nowMs >= startMs && nowMs <= endMs) return "live";
  return "done"; // ended — still visible so trainer can join if late
};

/* ── stat card accent maps ── */
const STAT_ACCENTS = {
  batches:  { gradient: "linear-gradient(135deg,#2563eb,#1e40af)", iconBg: "rgba(37,99,235,0.15)", color: "#93c5fd" },
  students: { gradient: "linear-gradient(135deg,#7c3aed,#5b21b6)", iconBg: "rgba(124,58,237,0.15)", color: "#c4b5fd" },
  today:    { gradient: "linear-gradient(135deg,#059669,#047857)", iconBg: "rgba(5,150,105,0.15)",  color: "#6ee7b7" },
};

const QUICK_ACTIONS = [
  { label: "My Profile",  icon: FaUser,           path: "/trainer/profile",     color: "#3b82f6", bg: "rgba(59,130,246,0.12)"  },
  { label: "Attendance",  icon: FaClipboardCheck, path: "/trainer/attendance",  color: "#10b981", bg: "rgba(16,185,129,0.12)"  },
  { label: "Leaves",      icon: FaBed,            path: "/trainer/leave",       color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  { label: "Assignments", icon: FaFileAlt,        path: "/trainer/assignments", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)"  },
  { label: "Courses",     icon: FaBook,           path: "/trainer/course",      color: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
];

/* ─────────────────────────────────────────── */
function TrainerDashboard() {
  const navigate   = useNavigate();
  const user       = JSON.parse(localStorage.getItem("user") || "{}");
  const trainerId  = user?.id;
  const trainerName = user?.name || "Trainer";

  /* stats */
  const [stats, setStats] = useState({
    totalBatches: 0, totalStudents: 0, todayClasses: 0
  });

  /* date navigation */
  const [viewDate,  setViewDate]  = useState(new Date());

  /* schedule loading */
  const [schedLoading, setSchedLoading] = useState(false);

  /* client-side pagination — applied AFTER date filtering */
  const [page,       setPage]       = useState(0);
  const [allDayItems, setAllDayItems] = useState([]); // all classes for the viewed date
  const PAGE_SIZE = 5;

  /* derived: total pages from filtered list */
  const totalPages = Math.max(1, Math.ceil(allDayItems.length / PAGE_SIZE));
  /* derived: classes for the current page */
  const schedule   = allDayItems.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  /* live clock */
  const [nowTime, setNowTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNowTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  /* greeting */
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  })();

  /* ── fetch dashboard stats ── */
  const fetchDashboard = useCallback(async () => {
    if (!trainerId) return;
    try {
      const res = await api.get(`/teacher/dashboard/${trainerId}`);
      setStats({
        totalBatches:  res.data.totalBatches  ?? 0,
        totalStudents: res.data.totalStudents ?? 0,
        todayClasses:  res.data.todayClasses  ?? 0,
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  }, [trainerId]);

  /* ── fetch ALL schedule entries, filter by date client-side ── */
  const fetchSchedule = useCallback(async (date = viewDate) => {
    if (!trainerId) return;
    setSchedLoading(true);
    setPage(0); // always reset to page 0 on fresh fetch
    try {
      /* Request a large page so we get everything in one shot.
         Adjust size if your backend has more than 200 total schedules. */
      const res = await api.get(
        `/teacher/schedule/${trainerId}?page=0&size=200`
      );

      const allItems = res.data.content || [];
      const targetStr = toDateStr(date);

      /* Filter to ONLY the selected date */
      const dayItems = allItems.filter(
        (item) => (item.class_date || "").startsWith(targetStr)
      );

      /* Sort by start_time ascending */
      dayItems.sort((a, b) =>
        (a.start_time || "").localeCompare(b.start_time || "")
      );

      setAllDayItems(dayItems); // pagination is now computed from this
    } catch (err) {
      console.error("Schedule fetch error:", err);
    } finally {
      setSchedLoading(false);
    }
  }, [trainerId, viewDate]);

  /* initial load + 60s auto-refresh */
  useEffect(() => {
    if (!trainerId) return;
    fetchDashboard();
    fetchSchedule(viewDate);

    const iv = setInterval(() => {
      fetchDashboard();
      fetchSchedule(viewDate);
    }, 60000);
    return () => clearInterval(iv);
  }, [trainerId]);

  /* re-fetch when viewed date changes */
  useEffect(() => {
    fetchSchedule(viewDate);
  }, [viewDate]);

  /* date navigation */
  const goDay = (delta) => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + delta);
    setViewDate(d);
  };

  const goToday = () => setViewDate(new Date());

  return (
    <div className="td-page">

      {/* ══════════════ HERO HEADER ══════════════ */}
      <header className="td-hero">
        <div className="td-hero__orb td-hero__orb--1" />
        <div className="td-hero__orb td-hero__orb--2" />
        <div className="td-hero__orb td-hero__orb--3" />

        <div className="td-hero__inner">
          <div className="td-hero__left">
            <div className="td-greeting-chip">{greeting} 👋</div>
            <h1 className="td-hero__name">{trainerName}</h1>
            {(user?.portalId || user?.studentId) && (
              <div className="td-hero__id-badge">System ID: {user.portalId || user.studentId}</div>
            )}
            <p className="td-hero__role">Trainer · EtMS Smart Learning</p>
          </div>

          <div className="td-hero__right">
            <div className="td-live-clock">
              <div className="td-clock__time">
                {nowTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="td-clock__date">
                {nowTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </div>
            </div>
            <button className="td-refresh-btn" onClick={() => { fetchDashboard(); fetchSchedule(page, viewDate); }} title="Refresh">
              <FaSync />
            </button>
          </div>
        </div>

        {/* Stat pills on hero */}
        <div className="td-hero__stats">
          {[
            { key: "batches",  label: "Total Batches",   value: stats.totalBatches,  icon: FaLayerGroup   },
            { key: "students", label: "Total Students",  value: stats.totalStudents, icon: FaUser         },
            { key: "today",    label: "Today's Classes", value: stats.todayClasses,  icon: FaCalendarAlt  },
          ].map(({ key, label, value, icon: Icon }) => (
            <div key={key} className={`td-stat td-stat--${key}`}>
              <div className="td-stat__icon"><Icon /></div>
              <div className="td-stat__body">
                <span className="td-stat__val">{value}</span>
                <span className="td-stat__label">{label}</span>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* ══════════════ BODY ══════════════ */}
      <div className="td-body">
 
        <div className="td-left-col">
          <QuickPunch />
          <AttendanceRules />

          {/* ── LEFT: Quick Actions ── */}
          <div className="td-card td-card--actions">
            <div className="td-card__head">
              <h3 className="td-card__title">⚡ Quick Actions</h3>
            </div>
            <div className="td-actions-grid">
              {QUICK_ACTIONS.map(({ label, icon: Icon, path, color, bg }) => (
                <button
                  key={label}
                  className="td-action-tile"
                  style={{ "--tile-color": color, "--tile-bg": bg }}
                  onClick={() => navigate(path)}
                >
                  <div className="td-action-tile__icon"><Icon /></div>
                  <span className="td-action-tile__label">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Schedule ── */}
        <div className="td-card td-card--schedule">

          {/* Date navigation bar */}
          <div className="td-date-nav">
            <button className="td-date-nav__arrow" onClick={() => goDay(-1)}>
              <FaChevronLeft />
            </button>

            <div className="td-date-nav__center">
              <span className="td-date-nav__label">{dayLabel(viewDate)}</span>
              <span className="td-date-nav__full">{formatDisplayDate(viewDate)}</span>
            </div>

            <button className="td-date-nav__arrow" onClick={() => goDay(1)}>
              <FaChevronRight />
            </button>

            {!isToday(viewDate) && (
              <button className="td-today-pill" onClick={goToday}>Today</button>
            )}
          </div>

          {/* Schedule list */}
          <div className="td-schedule-list">
            {schedLoading ? (
              <div className="td-sched-loader">
                <div className="td-spinner" />
                <span>Loading schedule…</span>
              </div>
            ) : schedule.length === 0 ? (
              <div className="td-sched-empty">
                <div className="td-sched-empty__icon">📅</div>
                <p className="td-sched-empty__text">
                  No classes scheduled for {dayLabel(viewDate)}.
                </p>
              </div>
            ) : (
              schedule.map((item, idx) => {
                const status = classStatus(item, viewDate);
                return (
                  <div
                    key={`${item.id}-${item.class_date}`}
                    className={`td-class-card td-class-card--${status}`}
                    style={{ animationDelay: `${idx * 0.07}s` }}
                  >
                    {/* Time column */}
                    <div className="td-class-card__time">
                      <span className="td-class-card__time-start">{formatTime(item.start_time)}</span>
                      <div className="td-class-card__time-line" />
                      <span className="td-class-card__time-end">{formatTime(item.end_time)}</span>
                    </div>

                    {/* Content */}
                    <div className="td-class-card__content">
                      <div className="td-class-card__top">
                        <h4 className="td-class-card__batch">{item.batch_name}</h4>
                        <span className={`td-status-chip td-status-chip--${status}`}>
                          {status === "live"      ? "🔴 Live Now"  :
                           status === "upcoming"  ? "⏳ Upcoming"  :
                           status === "done"      ? "✓ Ended"      :
                                                    "📅 Scheduled" }
                        </span>
                      </div>

                      <div className="td-class-card__meta">
                        <span><FaClock className="td-meta-icon" /> {formatTime(item.start_time)} – {formatTime(item.end_time)}</span>
                      </div>

                      {/* Join button — always visible so trainer can join even if late */}
                      {item.meeting_link && (
                        <a
                          className={`td-join-btn ${status === "live" ? "td-join-btn--live" : ""}`}
                          href={item.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FaVideo /> {status === "live" ? "Join Live" : "Join Session"}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {allDayItems.length > PAGE_SIZE && (
            <div className="td-sched-pagination">
              <button
                className="td-pag-btn td-pag-btn--nav"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >‹ Prev</button>

              <span className="td-pag-info">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, allDayItems.length)} of {allDayItems.length}
              </span>

              <button
                className="td-pag-btn td-pag-btn--nav"
                disabled={(page + 1) * PAGE_SIZE >= allDayItems.length}
                onClick={() => setPage(p => p + 1)}
              >Next ›</button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default TrainerDashboard;
