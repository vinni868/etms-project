import { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import "./SuperAdminLists.css";
import { 
  FaWallet, FaClockRotateLeft, FaFileInvoiceDollar, 
  FaArrowTrendUp, FaArrowTrendDown, FaCalculator 
} from "react-icons/fa6";

function FinanceManagement() {
    const [summary, setSummary] = useState(null);
    const [salaries, setSalaries] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFinanceData();
    }, []);

    const fetchFinanceData = async () => {
        try {
            const [sumRes, salRes, expRes] = await Promise.all([
                api.get("/superadmin/finance/summary"),
                api.get("/superadmin/finance/salaries"),
                api.get("/superadmin/finance/expenses")
            ]);
            setSummary(sumRes.data);
            setSalaries(salRes.data);
            setExpenses(expRes.data);
        } catch (err) {
            console.error("Finance sync failed", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="sl-loader">
            <div className="sl-spinner"></div>
            <p>Syncing Ledger...</p>
        </div>
    );

    return (
        <div className="sa-page">
            <div className="sa-wrapper sl-wrapper-extra">
                
                {/* ── SIDE PANEL ── */}
                <div className="sa-side-panel">
                    <div className="sa-side-brand">
                        <span className="cu-side-et">Et</span><span className="cu-side-ms">MS</span>
                    </div>
                    <h2 className="sa-side-title">Treasury Module</h2>
                    <p className="sa-side-desc">
                        Real-time fiscal monitoring, salary disbursements, and operational expenditure tracking.
                    </p>

                    <div className="sl-side-card">
                        <span className="sl-sc-label">AVAILABLE LIQUIDITY</span>
                        <div className="sl-sc-value">₹{(summary?.netProfit || 0).toLocaleString()}</div>
                    </div>

                    <div className="sl-side-illustration">
                        <FaWallet size={120} style={{opacity: 0.15}} />
                    </div>
                </div>

                {/* ── MAIN CONTENT ── */}
                <div className="sl-main-panel">
                    <div className="sl-header">
                        <div className="sl-header-left">
                            <h1>Financial Oversight</h1>
                            <p>Full-spectrum audit of institutional revenue and costs</p>
                        </div>
                        <button className="sl-btn-primary">
                            <FaCalculator /> Generate Report
                        </button>
                    </div>

                    <div className="sl-stats-grid">
                        <div className="sl-stat-card">
                            <span className="sl-stat-label">Gross Revenue</span>
                            <div className="sl-stat-value">₹{summary?.totalRevenue?.toLocaleString()}</div>
                        </div>
                        <div className="sl-stat-card">
                            <span className="sl-stat-label">Human Capital</span>
                            <div className="sl-stat-value">₹{summary?.totalSalaries?.toLocaleString()}</div>
                        </div>
                        <div className="sl-stat-card">
                            <span className="sl-stat-label">General Burn</span>
                            <div className="sl-stat-value">₹{summary?.totalGeneralExpenses?.toLocaleString()}</div>
                        </div>
                        <div className="sl-stat-card">
                            <span className="sl-stat-label">Operational Delta</span>
                            <div className="sl-stat-value" style={{color: summary?.netProfit > 0 ? 'var(--sa-green)' : 'var(--sa-red)'}}>
                                {summary?.netProfit > 0 ? <FaArrowTrendUp /> : <FaArrowTrendDown />} ₹{Math.abs(summary?.netProfit || 0).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    <div className="sl-table-card">
                        <h3><FaFileInvoiceDollar /> Salary Disbursements</h3>
                        <table className="sl-table responsive-card-table">
                            <thead>
                                <tr>
                                    <th>Recipient Unit</th>
                                    <th>Disbursement</th>
                                    <th>Temporal Value</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salaries.map(s => (
                                    <tr key={s.id}>
                                        <td style={{fontWeight: 700}} data-label="Recipient Unit">{s.user?.name}</td>
                                        <td data-label="Disbursement">₹{s.amount.toLocaleString()}</td>
                                        <td data-label="Temporal Value">{s.month} {s.year}</td>
                                        <td data-label="Status"><span className="sl-status-pill sl-status-pill--active">{s.status}</span></td>
                                    </tr>
                                ))}
                                {salaries.length === 0 && <tr><td colSpan="4" style={{textAlign: 'center', padding: '2rem'}}>No disbursements logged.</td></tr>}
                            </tbody>
                        </table>
                    </div>

                    <div className="sl-table-card">
                        <h3><FaClockRotateLeft /> Operational Burn Log</h3>
                        <table className="sl-table responsive-card-table">
                            <thead>
                                <tr>
                                    <th>Objective</th>
                                    <th>Category</th>
                                    <th>Audit Date</th>
                                    <th>Magnitude</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map(e => (
                                    <tr key={e.id}>
                                        <td style={{fontWeight: 700}} data-label="Objective">{e.title}</td>
                                        <td data-label="Category">{e.category}</td>
                                        <td data-label="Audit Date">{e.date}</td>
                                        <td style={{color: 'var(--sa-red)', fontWeight: 700}} data-label="Magnitude">- ₹{e.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                                {expenses.length === 0 && <tr><td colSpan="4" style={{textAlign: 'center', padding: '2rem'}}>No recent expenses.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FinanceManagement;
