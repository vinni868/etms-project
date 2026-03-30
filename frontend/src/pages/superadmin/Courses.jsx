import "./SuperAdminLists.css";
import { FaBookOpen, FaPlus } from "react-icons/fa6";

function Courses() {

  const courses = [
    { id: 1, name: "Full Stack Development", trainer: "Rahul Sharma", students: 120, status: "ACTIVE" },
    { id: 2, name: "Data Science & ML", trainer: "Priya Verma", students: 80, status: "ACTIVE" },
    { id: 3, name: "UI/UX Design Systems", trainer: "Arjun Reddy", students: 45, status: "INACTIVE" },
  ];

  return (
    <div className="sa-page">
        <div className="sa-wrapper sl-wrapper-extra">
            
            {/* ── SIDE PANEL ── */}
            <div className="sa-side-panel">
                <div className="sa-side-brand">
                    <span className="cu-side-et">Et</span><span className="cu-side-ms">MS</span>
                </div>
                <h2 className="sa-side-title">Curriculum Lab</h2>
                <p className="sa-side-desc">
                    Managing institutional academic programs and course-level engagement heuristics.
                </p>

                <div className="sl-side-card">
                    <span className="sl-sc-label">TOTAL CURRICULAE</span>
                    <div className="sl-sc-value">{courses.length} Modules</div>
                </div>

                <div className="sl-side-illustration">
                    <FaBookOpen size={120} style={{opacity: 0.15}} />
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="sl-main-panel">
                <div className="sl-header">
                    <div className="sl-header-left">
                        <h1>Academic Streams</h1>
                        <p>Central registry of authorized institutional courses and participation</p>
                    </div>
                    <button className="sl-btn-primary">
                        <FaPlus /> Authorize Course
                    </button>
                </div>

                <div className="sl-table-card">
                    <table className="sl-table responsive-card-table">
                        <thead>
                            <tr>
                                <th>Module ID</th>
                                <th>Course Title</th>
                                <th>Academic Lead</th>
                                <th>Unit Count</th>
                                <th>Operation Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.map((course) => (
                                <tr key={course.id}>
                                    <td data-label="Module ID">#CR-{course.id}</td>
                                    <td style={{fontWeight: 700}} data-label="Course Title">{course.name}</td>
                                    <td data-label="Academic Lead">{course.trainer}</td>
                                    <td data-label="Unit Count">{course.students} Units</td>
                                    <td data-label="Operation Status">
                                        <span className={`sl-status-pill ${course.status === 'ACTIVE' ? 'sl-status-pill--active' : 'sl-status-pill--low'}`}>
                                            {course.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
  );
}

export default Courses;