import { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import "./StudentModule.css";

function StudentPerformance() {
  const [perf, setPerf] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      const res = await api.get("/student/performance");
      setPerf(res.data);
    } catch (err) {
      console.error("Failed to fetch performance", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="module-container"><p>Loading performance...</p></div>;

  return (
    <div className="module-container">
      <h2>Performance Overview</h2>

      <div className="performance-grid">
        <div className="progress-card">
          <p>Overall Academic Progress</p>
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
              style={{ width: `${perf?.overallProgress || 0}%`, background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }} 
            />
          </div>
          <span style={{fontWeight: 'bold', color: '#1e293b'}}>{perf?.overallProgress || 0}% Completed</span>
        </div>

        <div className="stats-row" style={{display: 'flex', gap: '1.5rem', marginTop: '2rem'}}>
          <div className="stat-mini-card" style={{flex: 1, padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
             <span style={{fontSize: '0.85rem', color: '#64748b'}}>Attendance</span>
             <h3 style={{margin: '0.5rem 0', color: '#0f172a'}}>{perf?.attendancePercentage || 0}%</h3>
             <div style={{height: '4px', background: '#e2e8f0', borderRadius: '2px'}}>
                <div style={{height: '100%', width: `${perf?.attendancePercentage || 0}%`, background: '#10b981', borderRadius: '2px'}} />
             </div>
          </div>
          
          <div className="stat-mini-card" style={{flex: 1, padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
             <span style={{fontSize: '0.85rem', color: '#64748b'}}>Task Completion</span>
             <h3 style={{margin: '0.5rem 0', color: '#0f172a'}}>{perf?.taskCompletionRate || 0}%</h3>
             <div style={{height: '4px', background: '#e2e8f0', borderRadius: '2px'}}>
                <div style={{height: '100%', width: `${perf?.taskCompletionRate || 0}%`, background: '#f59e0b', borderRadius: '2px'}} />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentPerformance;