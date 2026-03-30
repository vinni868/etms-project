import "./SuperAdminLists.css";
import "./SuperAdminLists.css";
import api from "../../api/axiosConfig";
import { FaUserGraduate, FaPlus, FaEye, FaUserMinus, FaSearch } from "react-icons/fa6";

function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get("/superadmin/users");
        // Filter for students only
        const studentList = res.data.filter(u => u.role === "ROLE_STUDENT" || u.role === "STUDENT");
        setStudents(studentList);
      } catch (err) {
        console.error("Failed to fetch students:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="sa-page">
        <div className="sa-wrapper sl-wrapper-extra">
            
            {/* ── SIDE PANEL ── */}
            <div className="sa-side-panel">
                <div className="sa-side-brand">
                    <span className="cu-side-et">Et</span><span className="cu-side-ms">MS</span>
                </div>
                <h2 className="sa-side-title">Global Registry</h2>
                <p className="sa-side-desc">
                    Managing institutional learner identities and academic progression across the decentralized network.
                </p>

                <div className="sl-side-card">
                    <span className="sl-sc-label">TOTAL ENROLLMENT</span>
                    <div className="sl-sc-value">{students.length} Units</div>
                </div>

                <div className="sl-side-illustration">
                    <FaUserGraduate size={120} style={{opacity: 0.15}} />
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="sl-main-panel">
                <div className="sl-header">
                    <div className="sl-header-left">
                        <h1>Student Governance</h1>
                        <p>Complete manifest of registered institutional learners</p>
                    </div>
                    <div className="sl-header-right" style={{display: 'flex', gap: '1rem'}}>
                        <div className="sl-search-box">
                            <FaSearch />
                            <input 
                                type="text" 
                                placeholder="Search by name or ID..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="sl-btn-primary">
                            <FaPlus /> Manual Enrollment
                        </button>
                    </div>
                </div>

                <div className="sl-table-card">
                    <table className="sl-table responsive-card-table">
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Student Name</th>
                                <th>Subject Stream</th>
                                <th>Current Status</th>
                                <th>Operations</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{textAlign: 'center', padding: '3rem'}}>Loading learners...</td></tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr><td colSpan="5" style={{textAlign: 'center', padding: '3rem'}}>No learners found.</td></tr>
                            ) : filteredStudents.map((s) => (
                                <tr key={s.id}>
                                    <td className="sl-td-id" data-label="Student ID">{s.studentId || `ID-${s.id}`}</td>
                                    <td style={{fontWeight: 700}} data-label="Student Name">{s.name}</td>
                                    <td data-label="Subject Stream">{s.courseName || "General"}</td>
                                    <td data-label="Current Status">
                                        <span className={`sl-status-pill ${s.status === 'ACTIVE' || s.enabled ? 'sl-status-pill--active' : 'sl-status-pill--warn'}`}>
                                            {s.enabled ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td data-label="Operations">
                                        <div style={{display: 'flex', gap: '0.75rem'}}>
                                            <button className="sl-btn-icon" title="View Dossier"><FaEye /></button>
                                            <button className="sl-btn-icon" style={{color: 'var(--sa-red)'}} title="Revoke Access"><FaUserMinus /></button>
                                        </div>
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

export default Students;