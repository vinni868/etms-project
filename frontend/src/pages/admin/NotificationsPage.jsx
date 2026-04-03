import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaCalendarTimes, FaUserPlus, FaInfoCircle, FaCheck, FaTrashAlt, FaFilter, FaSearch, FaHistory } from "react-icons/fa";
import api from "../../api/axiosConfig";
import "./NotificationsPage.css";

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL"); // ALL, UNREAD, LEAVE, USER_CREATION
    const [searchTerm, setSearchTerm] = useState("");

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await api.get("/notifications");
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (err) {
            console.error("Failed to mark as read:", err);
        }
    };

    const markAllRead = async () => {
        try {
            await api.patch("/notifications/mark-all-read");
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (err) {
            console.error("Failed to delete notification:", err);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case "LEAVE": return <FaCalendarTimes className="np-icon le" />;
            case "USER_CREATION": return <FaUserPlus className="np-icon us" />;
            case "QUERY": return <FaInfoCircle className="np-icon qu" />;
            default: return <FaInfoCircle className="np-icon sy" />;
        }
    };

    const navigate = useNavigate();
    const userRole = JSON.parse(localStorage.getItem("user") || "{}").role || "STUDENT";
    const rolePath = userRole.toLowerCase().replace("_", "");

    const getTargetLink = (n) => {
        switch (n.type) {
            case "LEAVE": return `/${rolePath}/leave`;
            case "USER_CREATION": return (userRole === "ADMIN") ? "/admin/students" : "/superadmin/users";
            case "QUERY": return `/${rolePath}/messages`;
            case "ANNOUNCEMENT": return `/${rolePath}/announcements`;
            default: return null;
        }
    };

    const handleItemClick = (n) => {
        const link = getTargetLink(n);
        if (link) {
            navigate(link);
        }
        if (!n.read) {
            markAsRead(n.id);
        }
    };

    const filteredNotifications = notifications.filter(n => {
        const matchesFilter = filter === "ALL" || (filter === "UNREAD" ? !n.read : n.type === filter);
        const matchesSearch = n.message.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="notifications-page">
            <header className="np-header">
                <div className="np-header-left">
                    <div className="np-title-box">
                        <FaBell className="np-bell-main" />
                        <div>
                            <h1>{userRole.replace("_", " ")} Notifications</h1>
                            <p>Manage and track your personalized alerts and system updates.</p>
                        </div>
                    </div>
                </div>
                <div className="np-header-actions">
                    <button className="np-btn secondary" onClick={fetchNotifications}>
                        <FaHistory /> Refresh
                    </button>
                    <button className="np-btn primary" onClick={markAllRead} disabled={unreadCount === 0}>
                        <FaCheck /> Mark All as Read
                    </button>
                </div>
            </header>

            <div className="np-stats-row">
                <div className="np-stat-card">
                    <span className="np-stat-val">{notifications.length}</span>
                    <span className="np-stat-lbl">Total Alerts</span>
                </div>
                <div className="np-stat-card warning">
                    <span className="np-stat-val">{unreadCount}</span>
                    <span className="np-stat-lbl">Unread Notifications</span>
                </div>
                <div className="np-stat-card success">
                    <span className="np-stat-val">{notifications.filter(n => n.type === 'USER_CREATION').length}</span>
                    <span className="np-stat-lbl">Role Updates</span>
                </div>
                <div className="np-stat-card info">
                    <span className="np-stat-val">{notifications.filter(n => n.type === 'LEAVE').length}</span>
                    <span className="np-stat-lbl">Lifecycle Events</span>
                </div>
            </div>

            <div className="np-content-card">
                <div className="np-toolbar">
                    <div className="np-filters">
                        <button className={`np-filter-btn ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter("ALL")}>All</button>
                        <button className={`np-filter-btn ${filter === 'UNREAD' ? 'active' : ''}`} onClick={() => setFilter("UNREAD")}>Unread</button>
                        <button className={`np-filter-btn ${filter === 'LEAVE' ? 'active' : ''}`} onClick={() => setFilter("LEAVE")}>Events</button>
                        <button className={`np-filter-btn ${filter === 'USER_CREATION' ? 'active' : ''}`} onClick={() => setFilter("USER_CREATION")}>System</button>
                    </div>
                    <div className="np-search-box">
                        <FaSearch className="np-search-ico" />
                        <input 
                            type="text" 
                            placeholder="Search notifications..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="np-list-container">
                    {loading ? (
                        <div className="np-loading">
                            <div className="np-spinner"></div>
                            <p>Analyzing alerts...</p>
                        </div>
                    ) : filteredNotifications.length > 0 ? (
                        filteredNotifications.map((n) => (
                            <div 
                                key={n.id} 
                                className={`np-item ${!n.read ? 'unread' : ''} ${getTargetLink(n) ? 'clickable' : ''}`}
                                onClick={() => handleItemClick(n)}
                            >
                                <div className="np-item-icon">{getIcon(n.type)}</div>
                                <div className="np-item-body">
                                    <div className="np-item-top">
                                        <span className="np-type-tag">{n.type.replace('_', ' ')}</span>
                                        <span className="np-date">{new Date(n.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="np-message">{n.message}</p>
                                    {getTargetLink(n) && <span className="np-action-tip">Click to view details →</span>}
                                </div>
                                <div className="np-item-actions">
                                    {!n.read && (
                                        <button className="np-action-btn read" onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }} title="Mark as Read">
                                            <FaCheck />
                                        </button>
                                    )}
                                    <button className="np-action-btn delete" onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }} title="Delete">
                                        <FaTrashAlt />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="np-empty">
                            <FaHistory className="np-ghost-ico" />
                            <h3>No notifications found</h3>
                            <p>Try adjusting your filters or search terms.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
