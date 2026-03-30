import "./SuperAdminLists.css";
import { FaBullhorn, FaPlus } from "react-icons/fa6";

function Marketers() {

  const marketers = [
    { id: 1, name: "Kiran Kumar", email: "kiran.mkt@etms.edu", revenue: 50000 },
    { id: 2, name: "Sneha Kapur", email: "sneha.cap@etms.edu", revenue: 75000 },
    { id: 3, name: "Rohit Mathur", email: "rohit.mkt@etms.edu", revenue: 30000 },
  ];

  return (
    <div className="sa-page">
        <div className="sa-wrapper sl-wrapper-extra">
            
            {/* ── SIDE PANEL ── */}
            <div className="sa-side-panel">
                <div className="sa-side-brand">
                    <span className="cu-side-et">Et</span><span className="cu-side-ms">MS</span>
                </div>
                <h2 className="sa-side-title">Outreach Unit</h2>
                <p className="sa-side-desc">
                    Monitoring institutional marketing personnel and outreach revenue throughput across regional sectors.
                </p>

                <div className="sl-side-card">
                    <span className="sl-sc-label">UNIT PERFORMANCE</span>
                    <div className="sl-sc-value">₹{(marketers.reduce((acc, m) => acc + m.revenue, 0)).toLocaleString()}</div>
                </div>

                <div className="sl-side-illustration">
                    <FaBullhorn size={120} style={{opacity: 0.15}} />
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="sl-main-panel">
                <div className="sl-header">
                    <div className="sl-header-left">
                        <h1>Marketer Registry</h1>
                        <p>Authorized outreach personnel and acquisition performance metrics</p>
                    </div>
                    <button className="sl-btn-primary">
                        <FaPlus /> Provision Marketer
                    </button>
                </div>

                <div className="sl-table-card">
                    <table className="sl-table responsive-card-table">
                        <thead>
                            <tr>
                                <th>Personnel ID</th>
                                <th>Full Identity</th>
                                <th>Secure Email</th>
                                <th>Revenue Yield</th>
                            </tr>
                        </thead>
                        <tbody>
                            {marketers.map((marketer) => (
                                <tr key={marketer.id}>
                                    <td data-label="Personnel ID">#MK-{marketer.id}</td>
                                    <td style={{fontWeight: 700}} data-label="Full Identity">{marketer.name}</td>
                                    <td data-label="Secure Email">{marketer.email}</td>
                                    <td style={{color: 'var(--sa-green)', fontWeight: 700}} data-label="Revenue Yield">₹{marketer.revenue.toLocaleString()}</td>
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

export default Marketers;