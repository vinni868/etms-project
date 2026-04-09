import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import QuickPunch from '../../components/QuickPunch/QuickPunch';
import AttendanceRules from '../../components/AttendanceRules/AttendanceRules';
import './CounselorDashboard.css';

export default function CounselorDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    api.get('/counselor/dashboard')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pipeline = stats ? [
    { label: 'New',        count: stats.newLeads,    color: '#6366f1', bg: '#eef2ff' },
    { label: 'Contacted',  count: stats.contacted,   color: '#0ea5e9', bg: '#e0f2fe' },
    { label: 'Interested', count: stats.interested,  color: '#f59e0b', bg: '#fef3c7' },
    { label: 'Demo Booked',count: stats.demoBooked,  color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Enrolled',   count: stats.enrolled,    color: '#10b981', bg: '#d1fae5' },
    { label: 'Lost',       count: stats.lost,        color: '#ef4444', bg: '#fee2e2' },
  ] : [];

  const priorityColor = (p) => p === 'HIGH' ? '#ef4444' : p === 'MEDIUM' ? '#f59e0b' : '#94a3b8';

  const waLink = (phone) => `https://wa.me/91${phone?.replace(/\D/g, '')}`;

  return (
    <div className="crd-page">

      {/* ── Hero ── */}
      <header className="crd-hero">
        <div className="crd-hero__inner">
          <div className="crd-hero__left">
            <span className="crd-chip">Lead Conversion Specialist</span>
            <h1 className="crd-hero__name">{greeting}, {user?.name?.split(' ')[0] || 'Counselor'}!</h1>
            <p className="crd-hero__sub">Your mission: turn every lead into an enrolled student.</p>
          </div>
          <div className="crd-hero__right">
            <div className="crd-clock">
              <div className="crd-clock__time">
                {nowTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}
              </div>
              <div className="crd-clock__date">
                {nowTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="crd-content">

        {/* ── Attendance ── */}
        <div className="crd-attendance">
          <QuickPunch variant="horizontal" />
          <div style={{ marginTop: '1rem' }}><AttendanceRules /></div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="crd-kpi-row">
          <div className="crd-kpi crd-kpi--blue">
            <div className="crd-kpi__icon">📋</div>
            <div className="crd-kpi__body">
              <span className="crd-kpi__val">{loading ? '…' : stats?.totalAssigned ?? 0}</span>
              <span className="crd-kpi__label">Leads Assigned</span>
            </div>
          </div>
          <div className="crd-kpi crd-kpi--green">
            <div className="crd-kpi__icon">🎓</div>
            <div className="crd-kpi__body">
              <span className="crd-kpi__val">{loading ? '…' : stats?.enrolled ?? 0}</span>
              <span className="crd-kpi__label">Enrolled</span>
            </div>
          </div>
          <div className="crd-kpi crd-kpi--purple">
            <div className="crd-kpi__icon">📈</div>
            <div className="crd-kpi__body">
              <span className="crd-kpi__val">{loading ? '…' : (stats?.conversionRate ?? 0) + '%'}</span>
              <span className="crd-kpi__label">Conversion Rate</span>
            </div>
          </div>
          <div className="crd-kpi crd-kpi--orange">
            <div className="crd-kpi__icon">📞</div>
            <div className="crd-kpi__body">
              <span className="crd-kpi__val">{loading ? '…' : stats?.callsToday ?? 0}</span>
              <span className="crd-kpi__label">Calls Today</span>
            </div>
          </div>
        </div>

        {/* ── Pipeline Funnel ── */}
        {!loading && stats && (
          <div className="crd-section">
            <h2 className="crd-section__title">My Pipeline</h2>
            <div className="crd-pipeline">
              {pipeline.map(stage => (
                <div className="crd-stage" key={stage.label} style={{ borderTop: `3px solid ${stage.color}`, background: stage.bg }}>
                  <span className="crd-stage__count" style={{ color: stage.color }}>{stage.count}</span>
                  <span className="crd-stage__label">{stage.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Today's Follow-Ups ── */}
        <div className="crd-section">
          <div className="crd-section__header">
            <h2 className="crd-section__title">Today's Follow-Ups</h2>
            <span className="crd-badge crd-badge--red">
              {loading ? '…' : (stats?.todayFollowups?.length ?? 0)} due today
            </span>
          </div>

          {loading ? (
            <div className="crd-skeleton-list">
              {[1,2,3].map(i => <div key={i} className="crd-skeleton" />)}
            </div>
          ) : !stats?.todayFollowups?.length ? (
            <div className="crd-empty">
              <span className="crd-empty__icon">✅</span>
              <p>No follow-ups due today. Great work!</p>
            </div>
          ) : (
            <div className="crd-followup-list">
              {stats.todayFollowups.map(lead => (
                <div className="crd-followup-card" key={lead.id}>
                  <div className="crd-fc__left">
                    <div className="crd-fc__avatar" style={{ background: priorityColor(lead.priority) }}>
                      {lead.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="crd-fc__info">
                      <h3 className="crd-fc__name">{lead.name}</h3>
                      <p className="crd-fc__course">{lead.courseInterest || 'Course not specified'}</p>
                      <div className="crd-fc__meta">
                        <span className={`crd-status crd-status--${lead.status?.toLowerCase().replace('_', '-')}`}>
                          {lead.status?.replace('_', ' ')}
                        </span>
                        <span className="crd-priority" style={{ color: priorityColor(lead.priority) }}>
                          {lead.priority === 'HIGH' ? '🔥' : lead.priority === 'MEDIUM' ? '⭐' : '❄️'} {lead.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="crd-fc__actions">
                    <a href={`tel:${lead.phone}`} className="crd-action-btn crd-action-btn--call" title="Call">
                      📞
                    </a>
                    <a href={waLink(lead.whatsappNumber || lead.phone)} target="_blank" rel="noreferrer"
                       className="crd-action-btn crd-action-btn--wa" title="WhatsApp">
                      💬
                    </a>
                    <a href="/counselor/leads" className="crd-action-btn crd-action-btn--view" title="View Lead">
                      →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Quick Tips ── */}
        <div className="crd-tips">
          <h3 className="crd-tips__title">Pro Tips</h3>
          <div className="crd-tips__list">
            <div className="crd-tip">💡 Always log a note after every call — even missed ones.</div>
            <div className="crd-tip">🎯 Set a follow-up date before closing any lead interaction.</div>
            <div className="crd-tip">💬 WhatsApp works best after hours — use the quick button on each lead.</div>
            <div className="crd-tip">🔥 Focus on HIGH priority leads first — they convert 3× faster.</div>
          </div>
        </div>

      </div>
    </div>
  );
}
