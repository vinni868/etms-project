import "./SuperAdminLists.css";
import { FaCalendarCheck, FaChartPie, FaDownload } from "react-icons/fa6";

function Attendance() {

  const attendanceData = [
    { id: 1, student: "Anil", course: "Full Stack", percent: 90 },
    { id: 2, student: "Meena", course: "Data Science", percent: 65 },
    { id: 3, student: "Vijay", course: "UI/UX", percent: 80 },
  ];

  const getStatusClass = (percent) => {
    return percent >= 75 ? "sl-status-pill--active" : "sl-status-pill--low";
  };

  return (
    <div className="sa-page">
        <div className="sa-wrapper sl-wrapper-extra">
            
            {/* ── SIDE PANEL ── */}
            <div className="sa-side-panel">
                <div className="sa-side-brand">
                    <span className="cu-side-et">Et</span><span className="cu-side-ms">MS</span>
                </div>
                <h2 className="sa-side-title">Presence Log</h2>
                <p className="sa-side-desc">
                    Monitoring institutional engagement metrics and academic attendance regularity across all units.
                </p>

                <div className="sl-side-card">
                    <span className="sl-sc-label">AVERAGE ENGAGEMENT</span>
                    <div className="sl-sc-value">78.3%</div>
                </div>

                <div className="sl-side-illustration">
                    <FaCalendarCheck size={120} style={{opacity: 0.15}} />
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="sl-main-panel">
                <div className="sl-header">
                    <div className="sl-header-left">
                        <h1>Attendance Audit</h1>
                        <p>Real-time verification of student engagement across academic streams</p>
                    </div>
                    <button className="sl-btn-primary">
                        <FaDownload /> Export Dataset
                    </button>
                </div>

                <div className="sl-table-card">
                    <table className="sl-table responsive-card-table">
                        <thead>
                            <tr>
                                <th>Unit ID</th>
                                <th>Student Identity</th>
                                <th>Academic Stream</th>
                                <th>Temporal Weight %</th>
                                <th>Heuristic Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendanceData.map((item) => (
                                <tr key={item.id}>
                                    <td data-label="Unit ID">#ST-{item.id}</td>
                                    <td style={{fontWeight: 700}} data-label="Student Identity">{item.student}</td>
                                    <td data-label="Academic Stream">{item.course}</td>
                                    <td data-label="Temporal Weight %">{item.percent}%</td>
                                    <td data-label="Heuristic Status">
                                        <span className={`sl-status-pill ${getStatusClass(item.percent)}`}>
                                            {item.percent >= 75 ? "Optimal" : "Sub-Nominal"}
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

export default Attendance;