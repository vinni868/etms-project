import { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import { FaBullhorn } from "react-icons/fa";
import "./TrainerAnnouncements.css";

function TrainerAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/announcements")
      .then(res => setAnnouncements(res.data || []))
      .catch(err => console.error("Failed to load announcements", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="trainer-announcements-container">
        <p style={{ padding: "20px", color: "#6b7280" }}>Loading announcements...</p>
      </div>
    );
  }

  return (
    <div className="trainer-announcements-container">
      <div className="trainer-announcements">
        {/* Header */}
        <div className="header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              background: "linear-gradient(135deg,#4f46e5,#6366f1)",
              color: "white",
              width: "42px", height: "42px",
              borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px", flexShrink: 0,
            }}>
              <FaBullhorn />
            </div>
            <div>
              <h2 style={{ margin: 0 }}>Announcements</h2>
              <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                Updates from your admin team
              </p>
            </div>
          </div>
        </div>

        {/* List */}
        {announcements.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
            <FaBullhorn style={{ fontSize: "32px", marginBottom: "10px", opacity: 0.35 }} />
            <p style={{ fontSize: "16px", margin: 0 }}>No announcements at the moment.</p>
            <p style={{ fontSize: "13px", marginTop: "4px", opacity: 0.7 }}>
              Check back later for updates.
            </p>
          </div>
        ) : (
          <ul className="announcement-list">
            {announcements.map(a => (
              <li key={a.id} className="announcement-card admin-card">
                {/* Title + date */}
                <div className="card-header">
                  <h3>{a.title}</h3>
                  <span className="date">
                    {new Date(a.createdAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </span>
                </div>

                {/* Content — pre-wrap so newlines and emojis render correctly */}
                <p className="content" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {a.content}
                </p>

                {/* Footer */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "12px",
                  paddingTop: "10px",
                  borderTop: "1px solid #f0f0f0",
                  fontSize: "13px",
                  color: "#6b7280",
                  gap: "10px",
                }}>
                  <span>
                    Posted by: <strong>{a.createdByName || "Admin"}</strong>
                  </span>
                  {a.link && (
                    <a
                      href={a.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        padding: "5px 14px",
                        backgroundColor: "#014aa2",
                        color: "white",
                        textDecoration: "none",
                        borderRadius: "5px",
                        fontSize: "12px",
                        fontWeight: "500",
                        flexShrink: 0,
                      }}
                    >
                      Open Resource
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TrainerAnnouncements;
