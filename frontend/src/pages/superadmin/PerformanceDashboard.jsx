import { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import "./PerformanceDashboard.css";
import "./SuperAdminCommon.css";
import { 
  FaBrain, FaChartLine, FaWallet, FaUserGraduate, 
  FaLightbulb, FaExclamationTriangle, FaMicrochip, FaCogs
} from "react-icons/fa";

function PerformanceDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalOperationalCost: 0,
    profitMargin: 0
  });
  const [activeBatches, setActiveBatches] = useState(0);
  const [aiAdvice, setAiAdvice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, adviceRes] = await Promise.all([
          api.get("/superadmin/performance/stats"),
          api.get("/superadmin/performance/ai-advice")
        ]);
        setStats(statsRes.data);
        setActiveBatches(statsRes.data.activeBatches || 0);
        setAiAdvice(adviceRes.data.advice);
      } catch (err) {
        console.error("Performance fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="pd-loader">
      <div className="pd-spinner" />
      <p>Consulting Intelligence Layer...</p>
    </div>
  );

  return (
    <div className="sa-page">
      <div className="sa-wrapper pd-wrapper-extra">
        
        {/* ── SIDE PANEL ── */}
        <div className="sa-side-panel">
          <div className="sa-side-brand">
            <span className="cu-side-et">Et</span><span className="cu-side-ms">MS</span>
          </div>
          <h2 className="sa-side-title">Neural Engine</h2>
          <p className="sa-side-desc">
            Processing real-time operational heuristics and platform analytics to deliver high-fidelity strategic advice.
          </p>

          <div className="pd-side-card">
              <FaMicrochip className="pd-side-icon" />
              <div className="pd-side-info">
                  <span className="pd-side-label">PROCESSING STATUS</span>
                  <span className="pd-side-value">SYNCED [OPTIMAL]</span>
              </div>
          </div>

          <div className="pd-side-illustration">
             <FaBrain size={120} style={{opacity: 0.15}} />
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="pd-main-panel">
          <div className="pd-header">
            <div className="pd-header__left">
              <h1>Platform Intelligence</h1>
              <p>Strategic metrics and AI-driven governance overview</p>
            </div>
            <div className="pd-header__badge">
              <FaCogs /> AI CORE ACTIVE
            </div>
          </div>

          <div className="pd-stats-grid">
            <div className="pd-stat-card pd-stat-card--blue">
              <div className="pd-stat-visual">
                <FaUserGraduate />
              </div>
              <div className="pd-stat-content">
                <span className="pd-stat-value">{stats.totalStudents}</span>
                <span className="pd-stat-label">Active Engagement</span>
              </div>
            </div>

            <div className="pd-stat-card pd-stat-card--green">
              <div className="pd-stat-visual">
                <FaWallet />
              </div>
              <div className="pd-stat-content">
                <span className="pd-stat-value">{stats.profitMargin}%</span>
                <span className="pd-stat-label">Operational Efficiency</span>
              </div>
            </div>

            <div className="pd-stat-card pd-stat-card--purple">
              <div className="pd-stat-visual">
                <FaChartLine />
              </div>
              <div className="pd-stat-content">
                <span className="pd-stat-value">{activeBatches}</span>
                <span className="pd-stat-label">Training Velocity</span>
              </div>
            </div>
          </div>

          <div className="pd-ai-grid">
            <div className="pd-ai-card">
              <div className="pd-ai-card__header">
                <FaLightbulb /> 
                <h3>Strategic Advisory</h3>
              </div>
              <div className="pd-ai-card__body">
                <p className="pd-ai-text">{aiAdvice}</p>
                <div className="pd-ai-footer">
                   <span className="pd-ai-tag">High Fidelity</span>
                   <span className="pd-ai-tag">Verified Strategy</span>
                </div>
              </div>
            </div>

            <div className="pd-ai-card pd-ai-card--alert">
              <div className="pd-ai-card__header">
                <FaExclamationTriangle />
                <h3>Platform Anomalies</h3>
              </div>
              <div className="pd-ai-card__body">
                <ul className="pd-alert-list">
                  <li>Inconsistent cost scaling detected in Marketer Unit 4.</li>
                  <li>Trainer engagement frequency below nominal threshold.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pd-charts-card">
            <div className="pd-charts-header">
              <h3>Resource Allocation Heuristics</h3>
            </div>
            <div className="pd-mock-chart">
               <div className="pd-cost-row">
                 <span className="pd-c-label">Core Operations</span>
                 <div className="pd-c-bar-bg"><div className="pd-c-bar" style={{width: '65%', background: 'var(--sa-blue)'}}></div></div>
                 <span className="pd-c-pct">65%</span>
               </div>
               <div className="pd-cost-row">
                 <span className="pd-c-label">Human Capital</span>
                 <div className="pd-c-bar-bg"><div className="pd-c-bar" style={{width: '25%', background: 'var(--sa-cyan)'}}></div></div>
                 <span className="pd-c-pct">25%</span>
               </div>
               <div className="pd-cost-row">
                 <span className="pd-c-label">Outreach Systems</span>
                 <div className="pd-c-bar-bg"><div className="pd-c-bar" style={{width: '10%', background: 'var(--sa-gold)'}}></div></div>
                 <span className="pd-c-pct">10%</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PerformanceDashboard;
