import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import './QrDisplayPage.css';

/**
 * QR Station Page — Light theme, radius display, QR-only print
 * Route: /admin/qr-station  |  /superadmin/qr-station
 */
export default function QrDisplayPage() {
  const user        = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = user.role === 'SUPERADMIN';

  const [settings, setSettings] = useState({
    activeToken: '', instituteLat: '', instituteLng: '', radiusMeters: 200,
  });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      // Use existing endpoints that are already compiled in the backend
      const [configRes, punchRes] = await Promise.all([
        api.get('/qr/config'),
        api.get('/qr/punch-settings').catch(() => ({ data: { latitude: 0, longitude: 0, radiusMeters: 200 } })),
      ]);
      
      setSettings({
        activeToken:  configRes.data.qrSecret || '',
        instituteLat: punchRes.data.latitude || '',
        instituteLng: punchRes.data.longitude || '',
        radiusMeters: punchRes.data.radiusMeters || 200,
      });
    } catch (err) {
      console.error('Failed to load QR settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCoords = async () => {
    setSaving(true);
    try {
      // Use the existing punch-settings endpoint which is working
      await api.post('/qr/punch-settings', {
        latitude:     parseFloat(settings.instituteLat),
        longitude:    parseFloat(settings.instituteLng),
        radiusMeters: parseFloat(settings.radiusMeters),
      });

      showMsg('✅ Settings saved successfully!', 'ok');
    } catch {
      showMsg('❌ Failed to save. Please try again.', 'err');
    } finally {
      setSaving(false);
    }
  };

  const handleRotate = async () => {
    if (!window.confirm('This will invalidate all current QR codes. Continue?')) return;
    setSaving(true);
    try {
      // Use the existing config/regenerate endpoint which is working
      const res = await api.post('/qr/config/regenerate');
      if (res.data.qrSecret) {
        setSettings(p => ({ ...p, activeToken: res.data.qrSecret }));
      }
      showMsg('✅ New QR token generated!', 'ok');
    } catch {
      showMsg('❌ Failed to regenerate.', 'err');
    } finally {
      setSaving(false);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported.');
    navigator.geolocation.getCurrentPosition(
      pos => setSettings(p => ({
        ...p,
        instituteLat: pos.coords.latitude.toFixed(8),
        instituteLng: pos.coords.longitude.toFixed(8),
      })),
      () => alert('Location access denied.')
    );
  };

  const showMsg = (text, type) => {
    setSaveMsg({ text, type });
    setTimeout(() => setSaveMsg(null), 3500);
  };

  const qrUrl = settings.activeToken
    ? `https://api.qrserver.com/v1/create-qr-code/?size=700x700&data=${encodeURIComponent(settings.activeToken)}&color=1e3a8a&bgcolor=ffffff&margin=1`
    : '';

  const hasCoords = settings.instituteLat && settings.instituteLng &&
                    parseFloat(settings.instituteLat) !== 0;

  const steps = [
    { n: 1, icon: '📱', label: 'Open EtMS',     desc: 'Login to your EtMS portal on mobile or browser' },
    { n: 2, icon: '🗂️', label: 'Time Tracking', desc: 'Go to "Time Tracking" in the sidebar' },
    { n: 3, icon: '📷', label: 'Scan QR',        desc: 'Tap "Scan QR to Punch In" and point your camera here' },
    { n: 4, icon: '📍', label: 'Allow GPS',       desc: 'Grant location access when the browser asks' },
    { n: 5, icon: '✅', label: 'Done!',            desc: 'Attendance is recorded instantly and securely' },
  ];

  return (
    <div className="qrs-page">

      {/* ── TOP BAR (Screen only) ── */}
      <div className="qrs-topbar no-print">
        <div className="qrs-brand">
          <div className="qrs-brand-logo">A</div>
          <div>
            <div className="qrs-brand-name">AppTeKnow</div>
            <div className="qrs-brand-tag">Smart Learning Institute</div>
          </div>
        </div>
        <div className="qrs-topbar-right">
          {hasCoords && (
            <div className="qrs-radius-chip">
              <span className="qrs-radius-icon">📍</span>
              <span>Scan radius: <strong>{settings.radiusMeters}m</strong></span>
            </div>
          )}
          <button className="qrs-btn qrs-btn-outline" onClick={fetchAll} disabled={loading}>
            🔄 Refresh
          </button>
          <button className="qrs-btn qrs-btn-primary" onClick={() => window.print()}>
            🖨️ Print QR
          </button>
        </div>
      </div>

      {/* ── MAIN TWO-COLUMN ── */}
      <div className="qrs-main no-print">

        {/* LEFT: Branding + Steps */}
        <div className="qrs-left">

          {/* Brand hero */}
          <div className="qrs-hero-card">
            <div className="qrs-hero-icon">A</div>
            <div className="qrs-hero-text">
              <h1>AppTeKnow</h1>
              <p>Excellence in Technology Training</p>
            </div>
            <div className="qrs-live-badge">
              <span className="qrs-dot" />
              Attendance Station Live
            </div>
          </div>

          {/* Radius info */}
          {hasCoords && (
            <div className="qrs-info-banner">
              <div className="qrs-info-icon">📍</div>
              <div>
                <strong>Geofence Active</strong>
                <span>
                  Users must be within <strong>{settings.radiusMeters}m</strong> of the institute to scan.
                  Lat: {parseFloat(settings.instituteLat).toFixed(4)}, Lng: {parseFloat(settings.instituteLng).toFixed(4)}
                </span>
              </div>
            </div>
          )}

          {/* Feature pills */}
          <div className="qrs-pills">
            {[
              { icon: '🛡️', text: 'Secure Token' },
              { icon: '📍', text: 'Location Enforced' },
              { icon: '⏱️', text: 'Real-time Tracking' },
              { icon: '🔔', text: 'Auto Checkout' },
            ].map(p => (
              <div key={p.text} className="qrs-pill">
                <span>{p.icon}</span> {p.text}
              </div>
            ))}
          </div>

          {/* Steps */}
          <div className="qrs-steps-card">
            <h3 className="qrs-steps-title">How to Use the Punch Machine</h3>
            <div className="qrs-steps">
              {steps.map(s => (
                <div key={s.n} className="qrs-step">
                  <div className="qrs-step-n">{s.n}</div>
                  <div className="qrs-step-ico">{s.icon}</div>
                  <div className="qrs-step-body">
                    <strong>{s.label}</strong>
                    <span>{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: QR Code */}
        <div className="qrs-right">
          <div className="qrs-qr-card">
            <div className="qrs-qr-label">📲 Scan to Punch In / Out</div>
            <div className="qrs-qr-sub-label">Point your phone camera at this code</div>

            <div className="qrs-qr-frame">
              {loading ? (
                <div className="qrs-loading-box">
                  <div className="qrs-spinner" />
                  <p>Loading QR Code...</p>
                </div>
              ) : settings.activeToken ? (
                <img src={qrUrl} alt="Attendance QR Code" key={settings.activeToken} />
              ) : (
                <div className="qrs-loading-box" style={{ color: '#dc2626' }}>
                  ⚠️ QR not configured
                </div>
              )}
            </div>

            <div className="qrs-qr-status">
              <span className="qrs-dot qrs-dot-green" />
              <span>Active &amp; Secure</span>
            </div>

            {hasCoords && (
              <div className="qrs-radius-display">
                <div className="qrs-radius-ring">
                  <span className="qrs-radius-number">{settings.radiusMeters}</span>
                  <span className="qrs-radius-unit">meters</span>
                </div>
                <div className="qrs-radius-label">Scan Radius</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PRINT ONLY: QR sheet ── */}
      <div className="print-only qrs-print-sheet">
        <div className="qrs-print-header">
          <div className="qrs-print-logo">A</div>
          <div>
            <div className="qrs-print-name">AppTeKnow</div>
            <div className="qrs-print-tagline">Smart Learning Institute · Attendance Station</div>
          </div>
        </div>
        <div className="qrs-print-qr">
          {settings.activeToken && (
            <img src={qrUrl} alt="Attendance QR Code" />
          )}
        </div>
        <div className="qrs-print-caption">
          <strong>📲 Scan to Punch In / Out</strong>
          <p>Open EtMS Portal → Time Tracking → Tap "Scan QR to Punch In" → Allow GPS</p>
          {hasCoords && <p className="qrs-print-radius">📍 Must be within {settings.radiusMeters}m of institute to scan</p>}
        </div>
      </div>

      {/* ── SUPERADMIN PANEL ── */}
      {isSuperAdmin && (
        <div className="qrs-admin-panel no-print">
          <div className="qrs-admin-header">
            <div>
              <h3>⚙️ SuperAdmin Controls</h3>
              <p>Configure GPS coordinates and radius for geofence enforcement</p>
            </div>
            <span className="qrs-restricted">Restricted</span>
          </div>

          {saveMsg && (
            <div className={`qrs-msg ${saveMsg.type}`}>{saveMsg.text}</div>
          )}

          <div className="qrs-admin-grid">
            <div className="qrs-field">
              <label>Institute Latitude</label>
              <input type="text" value={settings.instituteLat}
                onChange={e => setSettings(p => ({ ...p, instituteLat: e.target.value }))}
                placeholder="e.g. 12.9716" />
            </div>
            <div className="qrs-field">
              <label>Institute Longitude</label>
              <input type="text" value={settings.instituteLng}
                onChange={e => setSettings(p => ({ ...p, instituteLng: e.target.value }))}
                placeholder="e.g. 77.5946" />
            </div>
            <div className="qrs-field">
              <label>Scan Radius (metres)</label>
              <input type="number" value={settings.radiusMeters} min="20" max="2000"
                onChange={e => setSettings(p => ({ ...p, radiusMeters: e.target.value }))}
                placeholder="e.g. 200" />
            </div>
          </div>

          <div className="qrs-admin-actions">
            <button className="qrs-btn qrs-btn-outline" onClick={getLocation}>📍 Use My GPS</button>
            <button className="qrs-btn qrs-btn-green"  onClick={handleSaveCoords} disabled={saving}>💾 Save Settings</button>
            <button className="qrs-btn qrs-btn-danger" onClick={handleRotate}     disabled={saving}>🔄 Generate New Scanner QR</button>
          </div>
        </div>
      )}

      <div className="qrs-footer no-print">
        EtMS Attendance Station · AppTeKnow © {new Date().getFullYear()}
      </div>
    </div>
  );
}
