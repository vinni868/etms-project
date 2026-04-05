import { useState, useRef, useEffect } from 'react';
import api from '../api/axiosConfig';
import './QrScannerModal.css';

/**
 * QrScannerModal
 *
 * Props:
 *  - isOpen      : boolean  — whether to show the scanner
 *  - onClose     : fn       — called when user cancels
 *  - onSuccess   : fn(data) — called with the scan result after a successful punch
 */
export default function QrScannerModal({ isOpen, onClose, onSuccess }) {
  const [scanMsg, setScanMsg]       = useState('');
  const [scanResult, setScanResult] = useState(null); // { success, message, sessionInfo }
  const qrCodeRef                   = useRef(null);
  const locationRef                 = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setScanMsg('');
      setScanResult(null);
      startScanner();
    }
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ─── Start Camera + Geolocation ──────────────────────────────────────────
  const startScanner = async () => {
    qrCodeRef.current = { isPending: true };
    setScanMsg('Requesting GPS location. Please allow when prompted...');

    // 1. Get geolocation first
    await new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            locationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setScanMsg('Location acquired. Starting camera...');
            resolve();
          },
          () => {
            locationRef.current = null;
            setScanMsg('Location denied. Please enable GPS in your browser settings to scan.');
            resolve();
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        setScanMsg('Geolocation not supported by this browser.');
        resolve();
      }
    });

    if (!qrCodeRef.current?.isPending) return; // closed while waiting

    // 2. Short delay to ensure #qr-reader DOM node is mounted
    setTimeout(async () => {
      if (!qrCodeRef.current?.isPending) return;

      try {
        const { Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5QrcodeScanType } = await import('html5-qrcode');
        
        const html5QrcodeScanner = new Html5QrcodeScanner(
          'qr-reader',
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 }, 
            aspectRatio: 1.0,
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
          },
          /* verbose= */ false
        );
        
        qrCodeRef.current = html5QrcodeScanner;

        html5QrcodeScanner.render(
          (decodedText) => {
            // Success handler
            onScanSuccess(decodedText);
            // Clear the scanner UI
            html5QrcodeScanner.clear().catch(e => console.error(e));
          },
          (errorMessage) => {
            // Camera errors or parse errors (ignored usually, don't spam user)
          }
        );

        setScanMsg(''); // clear message after camera starts
      } catch (err) {
        console.error('Scanner startup error:', err);
        setScanMsg(`Camera Error: ${err?.message || 'Access denied. Please enable camera.'}`);
      }
    }, 150);
  };

  // ─── Stop Camera ─────────────────────────────────────────────────────────
  const stopScanner = async () => {
    const current = qrCodeRef.current;
    qrCodeRef.current = null;

    if (current && typeof current.clear === 'function') {
      try { await current.clear(); } catch (_) { /* ignore */ }
    } else if (current && current.isScanning) {
      try { await current.stop(); } catch (_) { /* ignore */ }
    }
  };

  // ─── Scan Success Callback ────────────────────────────────────────────────
  const onScanSuccess = async (decodedText) => {
    await stopScanner();
    setScanMsg('Processing QR code...');

    try {
      const body = { qrToken: decodedText };
      if (locationRef.current) {
        body.latitude  = locationRef.current.lat;
        body.longitude = locationRef.current.lng;
      } else {
        setScanResult({ success: false, message: 'Location is required. Please enable GPS and try again.' });
        return;
      }

      const res = await api.post('/qr/scan', body);
      const data = res.data;

      setScanResult({ success: true, message: data.message, sessionInfo: data.sessionInfo });
      if (onSuccess) onSuccess(data);

    } catch (err) {
      const errMsg = err?.response?.data?.message
                  || err?.response?.data
                  || err.message
                  || 'Connection error. Please try again.';
      setScanResult({ success: false, message: errMsg });
    }
  };

  // ─── Handle Cancel ────────────────────────────────────────────────────────
  const handleClose = () => {
    stopScanner();
    setScanResult(null);
    setScanMsg('');
    onClose();
  };

  if (!isOpen) return null;

  // ─── Show Result Card ─────────────────────────────────────────────────────
  if (scanResult) {
    const si = scanResult.sessionInfo || {};
    const isPunchIn = si.punchType === 'IN';

    return (
      <div className="qr-result-overlay" onClick={handleClose}>
        <div className="qr-result-card" onClick={(e) => e.stopPropagation()}>
          <div className={`qr-result-icon ${scanResult.success ? 'success' : 'fail'}`}>
            {scanResult.success ? '✓' : '✕'}
          </div>

          <h2>
            {scanResult.success
              ? (isPunchIn ? 'Punched In! 🎉' : 'Punched Out! 👋')
              : 'Scan Failed'}
          </h2>

          {scanResult.success && si.userName && (
            <div className="qr-user-pill">
              <div className="name">{si.userName}</div>
              <div className="meta">{si.role} • {si.studentId}</div>
            </div>
          )}

          <p>{scanResult.message}</p>

          {scanResult.success && si.loginTime && (
            <div className="qr-session-details">
              <div className="qr-session-row">
                <span>Arrival</span>
                <span>{(() => {
                  const timePart = si.loginTime.includes('T') ? si.loginTime.split('T')[1] : si.loginTime;
                  const [hStr, mStr] = timePart.split(':');
                  const h = parseInt(hStr, 10), m = parseInt(mStr, 10);
                  const period = h >= 12 ? 'PM' : 'AM';
                  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
                })()}</span>
              </div>

              {si.logoutTime && (
                <>
                  <div className="qr-session-row">
                    <span>Departure</span>
                    <span>{(() => {
                      const timePart = si.logoutTime.includes('T') ? si.logoutTime.split('T')[1] : si.logoutTime;
                      const [hStr, mStr] = timePart.split(':');
                      const h = parseInt(hStr, 10), m = parseInt(mStr, 10);
                      const period = h >= 12 ? 'PM' : 'AM';
                      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                      return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
                    })()}</span>
                  </div>
                  <div className="qr-divider" />
                  <div className="qr-session-row">
                    <span>Duration</span>
                    <span className="qr-duration">{si.duration || `${Math.floor(si.totalMinutes / 60)}h ${si.totalMinutes % 60}m`}</span>
                  </div>
                </>
              )}
            </div>
          )}

          <button className="qr-close-btn" onClick={handleClose}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  // ─── Show Scanner Modal ───────────────────────────────────────────────────
  return (
    <div className="qr-modal-overlay" onClick={handleClose}>
      <div className="qr-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="qr-modal-icon">⏱️</div>
        <h2>Work Hours Scanner</h2>
        <p>Scan the institute QR code to punch in or out</p>

        <div id="qr-reader" />

        {scanMsg && (
          <div className={`qr-scan-msg ${scanMsg.includes('Error') || scanMsg.includes('denied') ? 'error' : 'info'}`}>
            {scanMsg}
          </div>
        )}

        <button className="qr-cancel-btn" onClick={handleClose}>
          ✕ Cancel Scanning
        </button>
      </div>
    </div>
  );
}
