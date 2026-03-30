import "./SuperAdminLists.css";
import { FaChalkboardUser, FaPlus } from "react-icons/fa6";

function Trainers() {

  const trainers = [
    { id: 1, name: "Rahul Sharma", email: "rahul.acad@etms.edu", phone: "+91 98765 43210" },
    { id: 2, name: "Priya Verma", email: "priya.acad@etms.edu", phone: "+91 98765 43211" },
    { id: 3, name: "Arjun Reddy", email: "arjun.acad@etms.edu", phone: "+91 98765 43212" },
  ];

  return (
    <div className="sa-page">
        <div className="sa-wrapper sl-wrapper-extra">
            
            {/* ── SIDE PANEL ── */}
            <div className="sa-side-panel">
                <div className="sa-side-brand">
                    <span className="cu-side-et">Et</span><span className="cu-side-ms">MS</span>
                </div>
                <h2 className="sa-side-title">Faculty Board</h2>
                <p className="sa-side-desc">
                    Managing institutional academic facilitators and subject matter experts across all learning verticals.
                </p>

                <div className="sl-side-card">
                    <span className="sl-sc-label">ACTIVE FACULTY</span>
                    <div className="sl-sc-value">{trainers.length} Experts</div>
                </div>

                <div className="sl-side-illustration">
                    <FaChalkboardUser size={120} style={{opacity: 0.15}} />
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="sl-main-panel">
                <div className="sl-header">
                    <div className="sl-header-left">
                        <h1>Trainer Directory</h1>
                        <p>Manifest of authorized academic facilitators and contact matrices</p>
                    </div>
                    <button className="sl-btn-primary">
                        <FaPlus /> Induct Trainer
                    </button>
                </div>

                <div className="sl-table-card">
                    <table className="sl-table responsive-card-table">
                        <thead>
                            <tr>
                                <th>Faculty ID</th>
                                <th>Personnel Identity</th>
                                <th>Secure Email</th>
                                <th>Direct Comms</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trainers.map((trainer) => (
                                <tr key={trainer.id}>
                                    <td data-label="Faculty ID">#TR-{trainer.id}</td>
                                    <td style={{fontWeight: 700}} data-label="Personnel Identity">{trainer.name}</td>
                                    <td data-label="Secure Email">{trainer.email}</td>
                                    <td data-label="Direct Comms">{trainer.phone}</td>
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

export default Trainers;