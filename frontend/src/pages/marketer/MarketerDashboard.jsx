import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import QuickPunch from '../../components/QuickPunch/QuickPunch';
import AttendanceRules from '../../components/AttendanceRules/AttendanceRules';
import './MarketerDashboard.css';

const SOURCE_ICONS = {
  FACEBOOK: '📘', INSTAGRAM: '📷', GOOGLE: '🔍', WHATSAPP: '💬',
  WEBSITE: '🌐', PHONE: '📞', REFERRAL: '🤝', WALK_IN: '🚶', YOUTUBE: '▶️',
};

export default function MarketerDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
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
    Promise.all([
      api.get('/marketer/stats'),
      api.get('/marketer/campaigns'),
    ]).then(([sRes, cRes]) => {
      setStats(sRes.data);
      setCampaigns((cRes.data || []).slice(0, 4));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const pipeline = stats ? [
    { label: 'New',         count: stats.newLeads,    color: '#6366f1' },
    { label: 'Contacted',   count: stats.contacted,   color: '#0ea5e9' },
    { label: 'Interested',  count: stats.interested,  color: '#f59e0b' },
    { label: 'Demo Booked', count: stats.demoBooked,  color: '#8b5cf6' },
    { label: 'Enrolled',    count: stats.enrolled,    color: '#10b981' },
    { label: 'Lost',        count: stats.lost,        color: '#ef4444' },
  ] : [];

  const maxPipeline = pipeline.reduce((m, s) => Math.max(m, s.count || 0), 1);

  return (
    <div className="mkd-page">

      {/* ── Hero ── */}
      <header className="mkd-hero">
        <div className="mkd-hero__inner">
          <div className="mkd-hero__left">
            <span className="mkd-chip">Growth & Marketing</span>
            <h1 className="mkd-hero__name">{greeting}, {user?.name?.split(' ')[0] || 'Marketer'}!</h1>
            <p className="mkd-hero__sub">Generate leads · Run campaigns · Fuel conversions</p>
          </div>
          <div className="mkd-hero__right">
            <div className="mkd-clock">
              <div className="mkd-clock__time">
                {nowTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}
              </div>
              <div className="mkd-clock__date">
                {nowTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mkd-content">

        {/* ── Attendance ── */}
        <div className="mkd-attendance">
          <QuickPunch variant="horizontal" />
          <div style={{ marginTop: '1rem' }}><AttendanceRules /></div>
        </div>

        {/* ── KPI Row ── */}
        <div className="mkd-kpi-row">
          <div className="mkd-kpi mkd-kpi--blue">
            <div className="mkd-kpi__icon">👥</div>
            <div><span className="mkd-kpi__val">{loading ? '…' : stats?.totalLeads ?? 0}</span><span className="mkd-kpi__label">Total Leads</span></div>
          </div>
          <div className="mkd-kpi mkd-kpi--green">
            <div className="mkd-kpi__icon">🎓</div>
            <div><span className="mkd-kpi__val">{loading ? '…' : stats?.enrolled ?? 0}</span><span className="mkd-kpi__label">Enrolled</span></div>
          </div>
          <div className="mkd-kpi mkd-kpi--purple">
            <div className="mkd-kpi__icon">📈</div>
            <div><span className="mkd-kpi__val">{loading ? '…' : (stats?.conversionRate ?? 0) + '%'}</span><span className="mkd-kpi__label">Conversion Rate</span></div>
          </div>
          <div className="mkd-kpi mkd-kpi--orange">
            <div className="mkd-kpi__icon">📣</div>
            <div><span className="mkd-kpi__val">{loading ? '…' : campaigns.length}</span><span className="mkd-kpi__label">Active Campaigns</span></div>
          </div>
        </div>

        {/* ── Two-column ── */}
        <div className="mkd-two-col">

          {/* Pipeline Funnel */}
          <div className="mkd-card">
            <h2 className="mkd-card__title">Lead Pipeline</h2>
            {loading ? (
              <div className="mkd-skeleton-list">{[1,2,3,4,5,6].map(i=><div key={i} className="mkd-skeleton" style={{height:'32px'}}/>)}</div>
            ) : (
              <div className="mkd-funnel">
                {pipeline.map(stage => (
                  <div className="mkd-funnel-row" key={stage.label}>
                    <span className="mkd-funnel-label">{stage.label}</span>
                    <div className="mkd-funnel-bar-wrap">
                      <div className="mkd-funnel-bar" style={{
                        width: `${((stage.count || 0) / maxPipeline) * 100}%`,
                        background: stage.color,
                      }} />
                    </div>
                    <span className="mkd-funnel-count" style={{ color: stage.color }}>{stage.count || 0}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leads by Source */}
          <div className="mkd-card">
            <h2 className="mkd-card__title">Leads by Source</h2>
            {loading ? (
              <div className="mkd-skeleton-list">{[1,2,3,4].map(i=><div key={i} className="mkd-skeleton" style={{height:'44px'}}/>)}</div>
            ) : stats?.bySource && Object.keys(stats.bySource).length > 0 ? (
              <div className="mkd-sources">
                {Object.entries(stats.bySource).sort((a,b)=>b[1]-a[1]).map(([src, cnt]) => {
                  const total = stats.totalLeads || 1;
                  const pct = Math.round((cnt / total) * 100);
                  return (
                    <div className="mkd-source-row" key={src}>
                      <span className="mkd-source-icon">{SOURCE_ICONS[src] || '📌'}</span>
                      <div className="mkd-source-body">
                        <div className="mkd-source-top">
                          <span className="mkd-source-name">{src.replace('_', ' ')}</span>
                          <span className="mkd-source-cnt">{cnt} ({pct}%)</span>
                        </div>
                        <div className="mkd-source-bar-wrap">
                          <div className="mkd-source-bar" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mkd-empty-sm">No leads yet. Start adding leads!</div>
            )}
          </div>
        </div>

        {/* ── Counselor Performance ── */}
        {!loading && stats?.counselorStats?.length > 0 && (
          <div className="mkd-card">
            <h2 className="mkd-card__title">Counselor Performance</h2>
            <div className="mkd-counselor-table">
              <div className="mkd-ct-header">
                <span>Counselor</span>
                <span>Assigned</span>
                <span>Enrolled</span>
                <span>Rate</span>
              </div>
              {stats.counselorStats.map(c => {
                const rate = c.totalAssigned > 0 ? Math.round((c.enrolled / c.totalAssigned) * 100) : 0;
                return (
                  <div className="mkd-ct-row" key={c.id}>
                    <span className="mkd-ct-name">
                      <span className="mkd-ct-avatar">{c.name?.charAt(0).toUpperCase()}</span>
                      {c.name}
                    </span>
                    <span className="mkd-ct-num">{c.totalAssigned}</span>
                    <span className="mkd-ct-num" style={{color:'#10b981'}}>{c.enrolled}</span>
                    <span className="mkd-ct-rate">
                      <div className="mkd-ct-bar-wrap">
                        <div className="mkd-ct-bar" style={{ width: `${rate}%` }} />
                      </div>
                      {rate}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Recent Campaigns ── */}
        <div className="mkd-card">
          <div className="mkd-card__header">
            <h2 className="mkd-card__title">Recent Campaigns</h2>
            <a href="/marketer/campaigns" className="mkd-view-all">View All →</a>
          </div>
          {loading ? (
            <div className="mkd-skeleton-list">{[1,2].map(i=><div key={i} className="mkd-skeleton" style={{height:'64px'}}/>)}</div>
          ) : campaigns.length === 0 ? (
            <div className="mkd-empty-sm">
              No campaigns yet. <a href="/marketer/campaigns" className="mkd-link">Create your first campaign →</a>
            </div>
          ) : (
            <div className="mkd-campaign-list">
              {campaigns.map(c => (
                <div className="mkd-campaign-row" key={c.id}>
                  <span className="mkd-campaign-icon">{SOURCE_ICONS[c.channel] || '📣'}</span>
                  <div className="mkd-campaign-info">
                    <span className="mkd-campaign-name">{c.name}</span>
                    <span className="mkd-campaign-meta">{c.channel} · {c.leadsCount || 0} leads</span>
                  </div>
                  <span className={`mkd-campaign-status mkd-cs--${(c.status||'').toLowerCase()}`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
