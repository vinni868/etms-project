import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { FaBullhorn, FaTimes } from 'react-icons/fa';

export default function GlobalAnnouncementPopup() {
  const [popups, setPopups] = useState([]);
  
  useEffect(() => {
    // Only fetch if logged in
    const token = localStorage.getItem('token');
    if (!token) return;

    api.get('/api/announcements')
      .then(res => {
        const data = res.data || [];
        // Filter for announcements marked as popup banners
        const activePopups = data.filter(a => a.isPopup === true);
        
        // check against sessionStorage so we don't spam the user every single page load
        // they can dismiss it, and it will stay hidden for the rest of their session.
        const dismissed = JSON.parse(sessionStorage.getItem('dismissed_announcements') || '[]');
        const toShow = activePopups.filter(a => !dismissed.includes(a.id));
        
        setPopups(toShow);
      })
      .catch(err => console.error("Failed to fetch announcements popup", err));
  }, []);

  const dismiss = (id) => {
    setPopups(prev => prev.filter(p => p.id !== id));
    const dismissed = JSON.parse(sessionStorage.getItem('dismissed_announcements') || '[]');
    sessionStorage.setItem('dismissed_announcements', JSON.stringify([...dismissed, id]));
  };

  if (popups.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '25px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxWidth: '350px',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {popups.map(p => (
        <div key={p.id} style={{
          background: '#eff6ff', 
          border: '1px solid #3b82f6', 
          borderRadius: '10px', 
          padding: '16px', 
          boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.2)',
          position: 'relative'
        }}>
          <button onClick={() => dismiss(p.id)} style={{
            position: 'absolute', top: '12px', right: '12px', 
            background: 'none', border: 'none', cursor: 'pointer', color: '#64748b'
          }}>
            <FaTimes />
          </button>
          
          <div style={{display:'flex', alignItems:'center', gap:'8px', color:'#1e40af', marginBottom:'6px'}}>
            <FaBullhorn size={16} />
            <strong style={{fontSize:'15px', paddingRight:'20px'}}>{p.title}</strong>
          </div>
          <p style={{margin:0, fontSize:'14px', color:'#334155', lineHeight:'1.5'}}>{p.content}</p>
        </div>
      ))}
    </div>
  );
}
