import { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import { FaBullhorn } from "react-icons/fa";

function CounselorAnnouncements() {
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
      <div style={{ padding: "30px", color: "#64748b" }}>
        Loading announcements...
      </div>
    );
  }

  return (
    <div style={{ padding: "30px", maxWidth: "860px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <div style={{
          background: "linear-gradient(135deg,#0891b2,#06b6d4)",
          color: "white",
          width: "42px", height: "42px",
          borderRadius: "10px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "18px", flexShrink: 0,
        }}>
          <FaBullhorn />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: "22px", color: "#0f172a" }}>Announcements</h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            Updates from your admin team
          </p>
        </div>
      </div>

      {/* Cards */}
      {announcements.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
          <FaBullhorn style={{ fontSize: "32px", marginBottom: "10px", opacity: 0.35 }} />
          <p style={{ fontSize: "16px", margin: 0 }}>No announcements at the moment.</p>
          <p style={{ fontSize: "13px", marginTop: "4px", opacity: 0.7 }}>
            Check back later for updates.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {announcements.map(ann => (
            <div
              key={ann.id}
              style={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderLeft: "4px solid #0891b2",
                borderRadius: "10px",
                padding: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              {/* Title + date */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "10px" }}>
                <h3 style={{ margin: 0, fontSize: "17px", color: "#0f172a", lineHeight: "1.4", flex: 1 }}>
                  {ann.title}
                </h3>
                <span style={{ color: "#94a3b8", fontSize: "12px", whiteSpace: "nowrap" }}>
                  {new Date(ann.createdAt).toLocaleDateString("en-US", {
                    year: "numeric", month: "short", day: "numeric",
                  })}
                </span>
              </div>

              {/* Content */}
              <p style={{ color: "#475569", lineHeight: "1.7", fontSize: "14px", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: "0 0 14px" }}>
                {ann.content}
              </p>

              {/* Footer */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                borderTop: "1px solid #f1f5f9", paddingTop: "10px",
                fontSize: "12px", color: "#64748b", gap: "10px",
              }}>
                <span>Posted by: <strong>{ann.createdByName || "System"}</strong></span>
                {ann.link && (
                  <a
                    href={ann.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block", padding: "5px 14px",
                      backgroundColor: "#0891b2", color: "white",
                      textDecoration: "none", borderRadius: "5px",
                      fontSize: "12px", fontWeight: "500", flexShrink: 0,
                    }}
                  >
                    Open Resource
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CounselorAnnouncements;
