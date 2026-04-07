import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { FaBullhorn, FaTimes } from 'react-icons/fa';

export default function GlobalAnnouncementPopup() {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const userObj = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userObj.token) return;

    api.get('/announcements')
      .then(res => {
        const data = res.data || [];
        const activePopups = data.filter(a => !!a.isPopup);
        const dismissed = JSON.parse(sessionStorage.getItem('dismissed_announcements') || '[]');
        const toShow = activePopups.filter(a => !dismissed.includes(a.id));
        setQueue(toShow);
        setCurrentIndex(0);
      })
      .catch(err => console.error('Failed to fetch announcement popups', err));
  }, []);

  const dismiss = () => {
    const current = queue[currentIndex];
    if (!current) return;
    // Persist dismissal for this session
    const dismissed = JSON.parse(sessionStorage.getItem('dismissed_announcements') || '[]');
    sessionStorage.setItem('dismissed_announcements', JSON.stringify([...dismissed, current.id]));

    if (currentIndex + 1 < queue.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setQueue([]);
    }
  };

  if (queue.length === 0 || currentIndex >= queue.length) return null;

  const p = queue[currentIndex];
  const total = queue.length;
  const isLast = currentIndex + 1 >= total;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.55)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      animation: 'annOverlayFadeIn 0.2s ease-out',
    }}>
      <style>{`
        @keyframes annOverlayFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes annModalSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .ann-modal-popup {
          background: white;
          border-radius: 18px;
          max-width: 520px;
          width: 100%;
          box-shadow: 0 30px 70px -10px rgba(0,0,0,0.35);
          overflow: hidden;
          animation: annModalSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          max-height: 88vh;
          display: flex;
          flex-direction: column;
        }
        .ann-popup-header {
          background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
          padding: 18px 22px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex-shrink: 0;
        }
        .ann-popup-icon {
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
          width: 38px; height: 38px;
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 17px; flex-shrink: 0; margin-top: 2px;
        }
        .ann-popup-header-text { flex: 1; }
        .ann-popup-label {
          font-size: 10px; font-weight: 700;
          letter-spacing: 1.5px; text-transform: uppercase;
          color: rgba(255,255,255,0.65); margin: 0 0 4px;
        }
        .ann-popup-title {
          font-size: 18px; font-weight: 700;
          color: white; margin: 0; line-height: 1.35;
        }
        .ann-popup-close {
          background: rgba(255,255,255,0.15);
          border: none; color: white; border-radius: 8px;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 15px; flex-shrink: 0; margin-top: 2px;
          transition: background 0.15s;
        }
        .ann-popup-close:hover { background: rgba(255,255,255,0.28); }
        .ann-popup-body {
          padding: 22px 24px;
          overflow-y: auto;
          flex: 1;
        }
        .ann-popup-content {
          font-size: 15px; color: #334155;
          line-height: 1.8; white-space: pre-wrap;
          word-break: break-word; margin: 0;
        }
        .ann-popup-footer {
          padding: 14px 22px;
          border-top: 1px solid #f1f5f9;
          background: #fafafa;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
          flex-wrap: wrap;
        }
        .ann-popup-meta {
          display: flex; flex-direction: column; gap: 2px;
        }
        .ann-popup-author {
          font-size: 12px; color: #64748b;
        }
        .ann-popup-counter {
          font-size: 11px; color: #94a3b8;
        }
        .ann-popup-actions {
          display: flex; gap: 8px; align-items: center;
        }
        .ann-popup-resource-btn {
          padding: 8px 16px;
          background: #014aa2; color: white;
          border-radius: 8px; text-decoration: none;
          font-size: 13px; font-weight: 500;
          transition: background 0.15s;
        }
        .ann-popup-resource-btn:hover { background: #013a82; }
        .ann-popup-gotit-btn {
          padding: 8px 20px;
          background: #4f46e5; color: white;
          border: none; border-radius: 8px;
          font-size: 13px; font-weight: 700;
          cursor: pointer; transition: background 0.15s;
          white-space: nowrap;
        }
        .ann-popup-gotit-btn:hover { background: #4338ca; }
      `}</style>

      <div className="ann-modal-popup">
        {/* ── Header ── */}
        <div className="ann-popup-header">
          <div className="ann-popup-icon"><FaBullhorn /></div>
          <div className="ann-popup-header-text">
            <p className="ann-popup-label">Announcement</p>
            <h3 className="ann-popup-title">{p.title}</h3>
          </div>
          <button className="ann-popup-close" onClick={dismiss} title="Close">
            <FaTimes />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="ann-popup-body">
          <p className="ann-popup-content">{p.content}</p>
        </div>

        {/* ── Footer ── */}
        <div className="ann-popup-footer">
          <div className="ann-popup-meta">
            <span className="ann-popup-author">
              Posted by: <strong>{p.createdByName || 'Admin'}</strong>
            </span>
            {total > 1 && (
              <span className="ann-popup-counter">
                {currentIndex + 1} of {total} announcements
              </span>
            )}
          </div>
          <div className="ann-popup-actions">
            {p.link && (
              <a
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                className="ann-popup-resource-btn"
              >
                Open Resource
              </a>
            )}
            <button className="ann-popup-gotit-btn" onClick={dismiss}>
              {isLast ? 'Got it ✓' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
