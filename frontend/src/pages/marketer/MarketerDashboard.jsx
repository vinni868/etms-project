function MarketerDashboard() {
  return (
    <div>
      <h2>Marketer Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Total Leads</div>
          <div className="stat-value">150</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Converted</div>
          <div className="stat-value">40</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Revenue</div>
          <div className="stat-value">₹3,50,000</div>
        </div>
      </div>
    </div>
  );
}

export default MarketerDashboard;