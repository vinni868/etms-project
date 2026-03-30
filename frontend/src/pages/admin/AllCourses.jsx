import { useEffect, useState, useRef } from "react";
import api from "../../api/axiosConfig";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import {
  FaSearch, FaBell, FaClock,
  FaArrowRight, FaTimes, FaGraduationCap, FaUsers,
  FaLayerGroup
} from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import "./AllCourses.css";

/* Course accent colours — cycles through cards */
const CARD_ACCENTS = [
  { gradient: "linear-gradient(135deg,#2563eb,#1e40af)", light: "#eff6ff", icon: "#2563eb" },
  { gradient: "linear-gradient(135deg,#7c3aed,#5b21b6)", light: "#f5f3ff", icon: "#7c3aed" },
  { gradient: "linear-gradient(135deg,#0891b2,#0e7490)", light: "#ecfeff", icon: "#0891b2" },
  { gradient: "linear-gradient(135deg,#059669,#047857)", light: "#ecfdf5", icon: "#059669" },
  { gradient: "linear-gradient(135deg,#ea580c,#c2410c)", light: "#fff7ed", icon: "#ea580c" },
  { gradient: "linear-gradient(135deg,#db2777,#be185d)", light: "#fdf2f8", icon: "#db2777" },
];

const COURSE_ICONS = {
  java: "☕", react: "⚛️", node: "🟢", python: "🐍",
  angular: "🅰️", spring: "🍃", mysql: "🗄️", web: "🌐",
  data: "📊", ml: "🤖", cloud: "☁️", mobile: "📱",
  default: "📘",
};

function getCourseIcon(name = "") {
  const lower = name.toLowerCase();
  for (const key of Object.keys(COURSE_ICONS)) {
    if (key !== "default" && lower.includes(key)) return COURSE_ICONS[key];
  }
  return COURSE_ICONS.default;
}

/* Helper: get real student count from course object */
function getStudentCount(course) {
  if (course.students && course.students.length > 0) return course.students.length;
  if (course.studentCount != null) return course.studentCount;
  return 0;
}

function CourseCard({ course, index, onClick }) {
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
  const icon   = getCourseIcon(course.courseName);
  const count  = getStudentCount(course);

  return (
    <div
      className="ac2-card"
      style={{ "--accent": accent.gradient, "--accent-lt": accent.light, "--accent-icon": accent.icon }}
      onClick={onClick}
    >
      <div className="ac2-card__bar" />

      <div className="ac2-card__header">
        <div className="ac2-card__icon-wrap">
          <span className="ac2-card__emoji">{icon}</span>
        </div>
        <span className="ac2-card__dur">
          <FaClock className="ac2-card__dur-icon" />
          {course.duration}
        </span>
      </div>

      <div className="ac2-card__body">
        <h2 className="ac2-card__title">{course.courseName}</h2>
        <p className="ac2-card__desc">
          {course.description || "Comprehensive learning module covering industry-standard practices and modern concepts."}
        </p>
      </div>

      <div className="ac2-card__stats">
        <div className="ac2-card__stat">
          <FaUsers className="ac2-card__stat-icon" />
          <span>{count} student{count !== 1 ? "s" : ""}</span>
        </div>
        <div className="ac2-card__stat">
          <FaLayerGroup className="ac2-card__stat-icon" />
          <span>Course {course.id}</span>
        </div>
      </div>

      <div className="ac2-card__footer">
        <button className="ac2-card__cta">
          <span>View Details</span>
          <span className="ac2-card__cta-arrow"><FaArrowRight /></span>
        </button>
      </div>
    </div>
  );
}

function AllCourses() {
  const [courses, setCourses]                       = useState([]);
  const [searchTerm, setSearchTerm]                 = useState("");
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [loading, setLoading]                       = useState(true);

  const lastCourseCount = useRef(0);
  const navigate        = useNavigate();

  useEffect(() => {
    fetchCourses(true);
    const interval = setInterval(() => fetchCourses(false), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCourses = async (isFirstLoad) => {
    try {
      const response   = await api.get("admin/courses/details");
      const newCourses = response.data;

      if (!isFirstLoad && newCourses.length > lastCourseCount.current) {
        setHasNewNotification(true);
        toast.info("📚 New curriculum tracks added!", { position: "top-right", theme: "colored" });
      }

      setCourses(newCourses);
      lastCourseCount.current = newCourses.length;
    } catch (error) {
      console.error("Error fetching courses", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = () => {
    if (hasNewNotification) {
      setHasNewNotification(false);
      toast.success("Catalog updated!");
    }
  };

  const filteredCourses = courses.filter((c) =>
    c.courseName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* FIX: sum students from students array (backend returns students[] inside each course) */
  const totalStudents = courses.reduce((sum, c) => sum + getStudentCount(c), 0);

  return (
    <div className="ac2-page">
      <ToastContainer />

      <header className="ac2-header">
        <div className="ac2-header__inner">
          <div className="ac2-header__brand">
            <div className="ac2-header__brand-icon">
              <FaGraduationCap />
            </div>
            <div>
              <h1 className="ac2-header__title">Academic Catalog</h1>
              <p className="ac2-header__sub">
                {filteredCourses.length} learning track{filteredCourses.length !== 1 ? "s" : ""} available
              </p>
            </div>
          </div>

          <div className="ac2-header__controls">
            <div className="ac2-search">
              <FaSearch className="ac2-search__icon" />
              <input
                className="ac2-search__input"
                type="text"
                placeholder="Search courses…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="ac2-search__clear" onClick={() => setSearchTerm("")}>
                  <FaTimes />
                </button>
              )}
            </div>

            <button className="ac2-notif-btn" onClick={handleNotificationClick}>
              <FaBell className={hasNewNotification ? "ac2-bell-swing" : ""} />
              {hasNewNotification && <span className="ac2-notif-dot" />}
            </button>
          </div>
        </div>

        <div className="ac2-header__strip">
          <div className="ac2-strip-stat">
            <span className="ac2-strip-stat__num">{courses.length}</span>
            <span className="ac2-strip-stat__lbl">Total Courses</span>
          </div>
          <div className="ac2-strip-divider" />
          <div className="ac2-strip-stat">
            <span className="ac2-strip-stat__num">{totalStudents}</span>
            <span className="ac2-strip-stat__lbl">Total Students</span>
          </div>
          <div className="ac2-strip-divider" />
         
        </div>
      </header>

      <main className="ac2-main">
        {loading ? (
          <div className="ac2-state-center">
            <div className="ac2-spinner" />
            <p className="ac2-state-text">Loading catalog…</p>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="ac2-grid">
            {filteredCourses.map((course, i) => (
              <CourseCard
                key={course.id}
                course={course}
                index={i}
                onClick={() => navigate(`/admin/course-details/${course.id}`, { state: course })}
              />
            ))}
          </div>
        ) : (
          <div className="ac2-empty">
            <div className="ac2-empty__icon">📂</div>
            <h3 className="ac2-empty__title">No Courses Found</h3>
            <p className="ac2-empty__sub">
              {searchTerm ? `No results for "${searchTerm}"` : "No courses have been added yet."}
            </p>
            {searchTerm && (
              <button className="ac2-empty__clear" onClick={() => setSearchTerm("")}>
                Clear Search
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default AllCourses;