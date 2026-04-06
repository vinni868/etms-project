import React, { useState } from "react";
import "./TrainerAnnouncements.css";

function TrainerAnnouncements() {
  const [adminAnnouncements] = useState([
    { id: 1, title: "System Maintenance", date: "2026-02-21", content: "The LMS will be down for maintenance on Feb 25 from 1AM-4AM." },
    { id: 2, title: "New Guidelines", date: "2026-02-18", content: "Please review the updated training guidelines." }
  ]);

  const [trainerAnnouncements, setTrainerAnnouncements] = useState([
    { id: 1, title: "Project Assignment", date: "2026-02-20", content: "Submit your Java project by Feb 28." }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "" });

  const handleCreate = () => {
    if (newAnnouncement.title && newAnnouncement.content) {
      setTrainerAnnouncements([
        ...trainerAnnouncements,
        { id: trainerAnnouncements.length + 1, title: newAnnouncement.title, content: newAnnouncement.content, date: new Date().toISOString().split("T")[0] }
      ]);
      setNewAnnouncement({ title: "", content: "" });
      setShowModal(false);
    } else alert("Please enter title and content.");
  };

  return (
    <div className="trainer-announcements-container">
      <div className="trainer-announcements">
        <div className="header">
  <h2>Announcements</h2>
  <br />
  <button className="create-btn" onClick={() => setShowModal(true)}>
    + Create Announcement
  </button>
</div>

        {/* Admin Announcements */}
        <h3 className="section-title">Admin Announcements</h3>
        {adminAnnouncements.length === 0 ? (
          <p className="no-announcements">No announcements from admin.</p>
        ) : (
          <ul className="announcement-list">
            {adminAnnouncements.map((a) => (
              <li key={a.id} className="announcement-card admin-card">
                <div className="card-header">
                  <h3>{a.title}</h3>
                  <span className="date">{a.date}</span>
                </div>
                <p className="content">{a.content}</p>
                {a.link && (
                  <div style={{marginTop: '10px'}}>
                    <a href={a.link} target="_blank" rel="noopener noreferrer" style={{
                      display: 'inline-block', padding: '5px 12px', backgroundColor: '#014aa2', color: 'white',
                      textDecoration: 'none', borderRadius: '4px', fontSize: '13px'
                    }}>
                      Open Link
                    </a>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Trainer Announcements */}
        <h3 className="section-title">Your Announcements to Students</h3>
        {trainerAnnouncements.length === 0 ? (
          <p className="no-announcements">No announcements sent to students yet.</p>
        ) : (
          <ul className="announcement-list">
            {trainerAnnouncements.map((a) => (
              <li key={a.id} className="announcement-card trainer-card">
                <div className="card-header">
                  <h3>{a.title}</h3>
                  <span className="date">{a.date}</span>
                </div>
                <p className="content">{a.content}</p>
                {a.link && (
                  <div style={{marginTop: '10px'}}>
                    <a href={a.link} target="_blank" rel="noopener noreferrer" style={{
                      display: 'inline-block', padding: '5px 12px', backgroundColor: '#014aa2', color: 'white',
                      textDecoration: 'none', borderRadius: '4px', fontSize: '13px'
                    }}>
                      Open Link
                    </a>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Create Announcement Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Create Announcement for Students</h3>
              <input type="text" placeholder="Title" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} />
              <textarea placeholder="Content" value={newAnnouncement.content} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}></textarea>
              <div className="modal-actions">
                <button className="btn" onClick={handleCreate}>Send</button>
                <button className="btn cancel" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrainerAnnouncements;