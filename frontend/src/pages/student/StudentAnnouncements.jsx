import { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import "./StudentModule.css";

function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get("/announcements");
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error("Failed to fetch announcements", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="module-container"><p>Loading announcements...</p></div>;

  return (
    <div className="module-container">
      <h2>Announcements</h2>

      <div className="announcement-list">
        {announcements.length > 0 ? (
          announcements.map((ann) => (
            <div key={ann.id} className="announcement-card">
              <div className="ann-header">
                <h3>{ann.title}</h3>
                <span className="ann-date">
                  {new Date(ann.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="ann-content">{ann.content}</p>
              <div className="ann-footer">
                <span className="ann-author">Posted by: {ann.createdByName || "System"}</span>
              </div>
            </div>
          ))
        ) : (
          <p style={{textAlign: 'center', padding: '2rem', color: '#64748b'}}>No new announcements at the moment. Check back later!</p>
        )}
      </div>
    </div>
  );
}

export default StudentAnnouncements;