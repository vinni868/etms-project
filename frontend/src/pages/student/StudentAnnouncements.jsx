import { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import { FaBullhorn } from "react-icons/fa";
import "./StudentModule.css";

function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/announcements")
      .then(res => setAnnouncements(res.data || []))
      .catch(err => console.error("Failed to fetch announcements", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="module-container">
        <p style={{ color: "#64748b" }}>Loading announcements...</p>
      </div>
    );
  }

  return (
    <div className="module-container">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
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
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            Important updates from your admin team
          </p>
        </div>
      </div>

      {/* List */}
      <div className="announcement-list">
        {announcements.length > 0 ? (
          announcements.map(ann => (
            <div
              key={ann.id}
              className="announcement-card"
              style={{
                marginBottom: "16px",
                border: "1px solid #e2e8f0",
                borderLeft: "4px solid #4f46e5",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                borderRadius: "10px",
              }}
            >
              {/* Title + date */}
              <div className="ann-header">
                <h3 style={{ margin: 0, fontSize: "17px", color: "#0f172a", lineHeight: "1.4" }}>
                  {ann.title}
                </h3>
                <span
                  className="ann-date"
                  style={{ color: "#94a3b8", fontSize: "12px", whiteSpace: "nowrap", marginLeft: "12px" }}
                >
                  {new Date(ann.createdAt).toLocaleDateString("en-US", {
                    year: "numeric", month: "short", day: "numeric",
                  })}
                </span>
              </div>

              {/* Content — pre-wrap so newlines and emojis render correctly */}
              <p className="ann-content" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {ann.content}
              </p>

              {/* Footer */}
              <div className="ann-footer">
                <span className="ann-author">
                  Posted by: <strong>{ann.createdByName || "System"}</strong>
                </span>
                {ann.link && (
                  <a
                    href={ann.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ann-link-btn"
                  >
                    Open Resource
                  </a>
                )}
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
            <FaBullhorn style={{ fontSize: "32px", marginBottom: "10px", opacity: 0.35 }} />
            <p style={{ fontSize: "16px", margin: 0 }}>No announcements at the moment.</p>
            <p style={{ fontSize: "13px", marginTop: "4px", opacity: 0.7 }}>
              Check back later for updates from your team.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentAnnouncements;
