import { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import "./SuperAdminLists.css";
import { FaLayerGroup, FaPlus, FaSync } from "react-icons/fa6";

function Batches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/batches");
      setBatches(res.data || []);
    } catch (err) {
      console.error("Failed to fetch batches:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sa-page">
        <div className="sa-wrapper sl-wrapper-extra">
            
            {/* ── SIDE PANEL ── */}
            <div className="sa-side-panel">
                <div className="sa-side-brand">
                    <span className="cu-side-et">Et</span><span className="cu-side-ms">MS</span>
                </div>
                <h2 className="sa-side-title">Batch Hub</h2>
                <p className="sa-side-desc">
                    Orchestrating academic cohorts and temporal scheduling across various institutional departments.
                </p>

                <div className="sl-side-card">
                    <span className="sl-sc-label">ACTIVE COHORTS</span>
                    <div className="sl-sc-value">{batches.length} Ready</div>
                </div>

                <div className="sl-side-illustration">
                    <FaLayerGroup size={120} style={{opacity: 0.15}} />
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="sl-main-panel">
                <div className="sl-header">
                    <div className="sl-header-left">
                        <h1>Cohort Management</h1>
                        <p>Detailed overview of active training batches and scheduling</p>
                    </div>
                    <button className="sl-btn-primary" onClick={fetchBatches}>
                        <FaSync /> Refresh
                    </button>
                </div>

                <div className="sl-table-card">
                    <table className="sl-table responsive-card-table">
                        <thead>
                            <tr>
                                <th>Batch ID</th>
                                <th>Cohort Name</th>
                                <th>Academic Stream</th>
                                <th>Assigned Lead</th>
                                <th>Temporal Slot</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{textAlign: 'center'}}>Syncing batches...</td></tr>
                            ) : batches.length === 0 ? (
                                <tr><td colSpan="5" style={{textAlign: 'center'}}>No batches found in system.</td></tr>
                            ) : batches.map((batch) => (
                                <tr key={batch.id}>
                                    <td data-label="Batch ID">
                                        <code style={{
                                            background: '#f1f5f9',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            color: '#2563eb',
                                            fontWeight: 'bold'
                                        }}>
                                            {batch.batchId || `BT-${batch.id}`}
                                        </code>
                                    </td>
                                    <td style={{fontWeight: 700}} data-label="Cohort Name">{batch.batchName}</td>
                                    <td data-label="Academic Stream">{batch.course?.courseName || "General"}</td>
                                    <td data-label="Assigned Lead">{batch.trainer?.name || "Unassigned"}</td>
                                    <td style={{fontSize: '0.85rem'}} data-label="Temporal Slot">
                                        {batch.startDate} to {batch.endDate}
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

export default Batches;