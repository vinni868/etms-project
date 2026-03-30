import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import './SuperAdminCommon.css';

const CONFIG_DEFAULTS = {
  platformName: 'EtMS - Education & Training Management System',
  supportEmail: 'support@etms.com',
  maxStudentsPerBatch: '30',
  sessionTimeoutMinutes: '60',
  maintenanceMode: false,
  allowSelfRegistration: true,
  requireSuperAdminApproval: true,
};

export default function SuperAdminSettings() {
  const [config, setConfig] = useState(CONFIG_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [stats, setStats] = useState({ totalUsers: 0, pendingUsers: 0 });

  useEffect(() => {
    fetchStats();
    // Load saved settings from localStorage for now
    const saved = localStorage.getItem('etms_platform_config');
    if (saved) {
      try { setConfig({ ...CONFIG_DEFAULTS, ...JSON.parse(saved) }); } catch (e) {}
    }
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/superadmin/users/all');
      const all = res.data || [];
      setStats({
        totalUsers: all.length,
        pendingUsers: all.filter(u => u.status === 'PENDING').length,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    // Persist to localStorage (platform config can be extended to a backend table)
    localStorage.setItem('etms_platform_config', JSON.stringify(config));
    setTimeout(() => {
      setSaving(false);
      setMsg({ type: 'ok', text: '✅ Settings saved successfully!' });
    }, 500);
  };

  const toggle = (key) => setConfig(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="sa-content">
      <div className="sa-hero">
        <div className="sa-hero-left">
          <p className="sa-hero-eyebrow">⚙️ Platform Administration</p>
          <h2 className="sa-hero-heading">System Settings</h2>
          <p className="sa-hero-desc">Configure platform-wide behaviour, security policies, and operational controls.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
          <div className="sa-card" style={{ textAlign: 'center', padding: '1rem 1.5rem', minWidth: '120px' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#4f46e5' }}>{stats.totalUsers}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Users</div>
          </div>
          <div className="sa-card" style={{ textAlign: 'center', padding: '1rem 1.5rem', minWidth: '120px' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f59e0b' }}>{stats.pendingUsers}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Pending Approval</div>
          </div>
        </div>
      </div>

      {msg && (
        <div style={{
          background: msg.type === 'ok' ? '#dcfce7' : '#fee2e2',
          color: msg.type === 'ok' ? '#166534' : '#991b1b',
          padding: '0.85rem 1.25rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 500
        }}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* General */}
        <div className="sa-card">
          <h3 style={{ marginBottom: '1.25rem', color: '#0f172a' }}>🏢 General Configuration</h3>
          <div className="settings-grid">
            <div className="form-group">
              <label>Platform Name</label>
              <input
                value={config.platformName}
                onChange={e => setConfig({ ...config, platformName: e.target.value })}
                placeholder="EtMS — Education & Training Management System"
              />
            </div>
            <div className="form-group">
              <label>Support Email</label>
              <input
                type="email"
                value={config.supportEmail}
                onChange={e => setConfig({ ...config, supportEmail: e.target.value })}
                placeholder="support@etms.com"
              />
            </div>
            <div className="form-group">
              <label>Max Students Per Batch</label>
              <input
                type="number"
                min={1}
                max={500}
                value={config.maxStudentsPerBatch}
                onChange={e => setConfig({ ...config, maxStudentsPerBatch: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Session Timeout (minutes)</label>
              <input
                type="number"
                min={5}
                max={480}
                value={config.sessionTimeoutMinutes}
                onChange={e => setConfig({ ...config, sessionTimeoutMinutes: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Access Control */}
        <div className="sa-card">
          <h3 style={{ marginBottom: '1.25rem', color: '#0f172a' }}>🔒 Access & Security Policies</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <ToggleRow
              label="Maintenance Mode"
              desc="Block all user logins and show a maintenance notice."
              value={config.maintenanceMode}
              onChange={() => toggle('maintenanceMode')}
              danger
            />
            <ToggleRow
              label="Allow Self-Registration"
              desc="Let new users register via the public registration form."
              value={config.allowSelfRegistration}
              onChange={() => toggle('allowSelfRegistration')}
            />
            <ToggleRow
              label="Require SuperAdmin Approval"
              desc="All new accounts (including Admin-created ones) must be approved by the Super Admin."
              value={config.requireSuperAdminApproval}
              onChange={() => toggle('requireSuperAdminApproval')}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            className="sa-btn-primary"
            style={{ padding: '0.75rem 2rem', fontSize: '1rem', borderRadius: '10px', cursor: 'pointer' }}
            disabled={saving}
          >
            {saving ? 'Saving…' : '💾 Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange, danger }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0'
    }}>
      <div>
        <div style={{ fontWeight: 600, color: danger && value ? '#dc2626' : '#0f172a' }}>{label}</div>
        <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem' }}>{desc}</div>
      </div>
      <button
        type="button"
        onClick={onChange}
        style={{
          width: '52px', height: '28px', borderRadius: '14px',
          background: value ? (danger ? '#dc2626' : '#4f46e5') : '#e2e8f0',
          border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0
        }}
      >
        <span style={{
          position: 'absolute', top: '4px',
          left: value ? '26px' : '4px',
          width: '20px', height: '20px', borderRadius: '50%',
          background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }} />
      </button>
    </div>
  );
}
