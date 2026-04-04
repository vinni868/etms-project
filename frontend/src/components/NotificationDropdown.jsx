import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaBell, FaUserPlus, FaCalendarTimes, FaCheck, FaInfoCircle, FaClock } from "react-icons/fa";
import api from "../api/axiosConfig";
import "./NotificationDropdown.css";

const NotificationDropdown = ({ isOpen, onToggle }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const rolePath = user?.role?.toLowerCase().replace("_", "") || "admin";
  const notificationsPath = `/${rolePath}/notifications`;

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications/unread");
      setNotifications(res.data.slice(0, 5)); // Show only top 5
      
      const countRes = await api.get("/notifications/unread-count");
      setUnreadCount(countRes.data.count);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "LEAVE": return <FaCalendarTimes className="notif-icon le" />;
      case "USER_CREATION": return <FaUserPlus className="notif-icon us" />;
      case "QUERY": return <FaInfoCircle className="notif-icon qu" />;
      default: return <FaInfoCircle className="notif-icon sy" />;
    }
  };

  const getTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button className="nav-bell-btn" onClick={onToggle}>
        <FaBell />
        {unreadCount > 0 && <span className="notif-badge-pulsing">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notif-glass-dropdown">
          <div className="notif-drop-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && <span>{unreadCount} unread</span>}
          </div>
          
          <div className="notif-drop-body">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div key={n.id} className="notif-row-item" onClick={() => { onToggle(); navigate(notificationsPath); }}>
                  <div className="notif-icon-box">{getIcon(n.type)}</div>
                  <div className="notif-content">
                    <p className="notif-msg">{n.message}</p>
                    <span className="notif-time"><FaClock /> {getTimeAgo(n.createdAt)}</span>
                  </div>
                  <button className="notif-check-btn" onClick={(e) => handleMarkRead(n.id, e)} title="Mark as read">
                    <FaCheck />
                  </button>
                </div>
              ))
            ) : (
              <div className="notif-empty-state">
                <FaBell className="ghost-bell" />
                <p>No new notifications</p>
              </div>
            )}
          </div>

          <div className="notif-drop-footer">
            <Link to={notificationsPath} onClick={onToggle}>
              View All Notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
