import React, { useState, useEffect } from 'react';
import QuickPunch from '../../components/QuickPunch/QuickPunch';
import AttendanceRules from '../../components/AttendanceRules/AttendanceRules';
import { FaUsers, FaChartPie, FaMoneyBillWave, FaSync } from 'react-icons/fa';
import './MarketerDashboard.css';

function MarketerDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [nowTime, setNowTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNowTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  })();

  return (
    <div className="mk-page">
      {/* ── Hero Header ── */}
      <header className="mk-hero">
        <div className="mk-hero__inner">
          <div className="mk-hero__left">
            <div className="mk-greeting-chip">{greeting} 👋</div>
            <h1 className="mk-hero__name">{user?.name || "Marketer"}</h1>
            <p className="mk-hero__role">Growth & Marketing · EtMS Smart Learning</p>
          </div>

          <div className="mk-hero__right">
            <div className="mk-live-clock">
              <div className="mk-clock__time">
                {nowTime.toLocaleTimeString('en-US', { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase()}
              </div>
              <div className="mk-clock__date">
                {nowTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mk-content">
        {/* ── Attendance Unit ── */}
        <div className="mk-attendance-section">
          <QuickPunch variant="horizontal" />
          <div style={{ marginTop: '1rem' }}>
            <AttendanceRules />
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="mk-stats-grid">
          <div className="mk-stat-card mk-stat--leads">
            <div className="mk-stat__icon"><FaUsers /></div>
            <div className="mk-stat__body">
              <span className="mk-stat__val">150</span>
              <span className="mk-stat__label">Total Leads</span>
            </div>
          </div>

          <div className="mk-stat-card mk-stat--conv">
            <div className="mk-stat__icon"><FaChartPie /></div>
            <div className="mk-stat__body">
              <span className="mk-stat__val">40</span>
              <span className="mk-stat__label">Conversions</span>
            </div>
          </div>

          <div className="mk-stat-card mk-stat--rev">
            <div className="mk-stat__icon"><FaMoneyBillWave /></div>
            <div className="mk-stat__body">
              <span className="mk-stat__val">₹3.5L</span>
              <span className="mk-stat__label">Revenue Contribution</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketerDashboard;