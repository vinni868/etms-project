import { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import "./SuperAdminLists.css";
import { 
  FaInbox, FaVideo, FaClock, FaPaperPlane, 
  FaLock, FaPlus 
} from "react-icons/fa6";

function MessagingHub() {
    const [messages, setMessages] = useState([]);
    const [meetings, setMeetings] = useState([]);
    const user = JSON.parse(localStorage.getItem("user"));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCommData();
    }, []);

    const fetchCommData = async () => {
        try {
            const [msgRes, meetRes] = await Promise.all([
                api.get(`/superadmin/messages/inbox/${user.id}`),
                api.get("/superadmin/meetings/all")
            ]);
            setMessages(msgRes.data);
            setMeetings(meetRes.data);
        } catch (err) {
            console.error("Comm link failure", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="sl-loader">
            <div className="sl-spinner"></div>
            <p>Establishing Secure Link...</p>
        </div>
    );

    return (
        <div className="sa-page">
            <div className="sa-wrapper sl-wrapper-extra">
                
                {/* ── SIDE PANEL ── */}
                <div className="sa-side-panel">
                    <div className="sa-side-brand">
                        <span className="cu-side-et">Et</span><span className="cu-side-ms">MS</span>
                    </div>
                    <h2 className="sa-side-title">Comm Hub</h2>
                    <p className="sa-side-desc">
                        Direct encrypted channels for administrative directives and strategic stakeholder coordination.
                    </p>

                    <div className="sl-side-card">
                        <span className="sl-sc-label">ENCRYPTION STATUS</span>
                        <div className="sl-sc-value">AES-256 ACTIVE</div>
                    </div>

                    <div className="sl-side-illustration">
                        <FaLock size={120} style={{opacity: 0.15}} />
                    </div>
                </div>

                {/* ── MAIN CONTENT ── */}
                <div className="sl-main-panel">
                    <div className="sl-header">
                        <div className="sl-header-left">
                            <h1>Secure Communications</h1>
                            <p>Managing internal correspondences and tactical sessions</p>
                        </div>
                        <button className="sl-btn-primary">
                            <FaPaperPlane /> Broadcast Directive
                        </button>
                    </div>

                    <div className="sl-table-card">
                        <h3><FaInbox /> Tactical Inbox</h3>
                        <div className="sl-list-container" style={{padding: '0 1.5rem 1.5rem'}}>
                            {messages.map(m => (
                                <div key={m.id} className="sl-list-item" style={{
                                    background: '#f8fafc',
                                    padding: '1.25rem',
                                    borderRadius: '12px',
                                    marginBottom: '1rem',
                                    border: '1px solid var(--sa-border)'
                                }}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                                        <strong style={{color: 'var(--sa-blue)'}}>{m.sender?.name}</strong>
                                        <span style={{fontSize: '0.75rem', color: 'var(--sa-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem'}}>
                                            <FaClock /> {new Date(m.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                    <p style={{margin: 0, fontSize: '0.9rem', color: 'var(--sa-text-mid)', lineHeight: '1.5'}}>{m.content}</p>
                                </div>
                            ))}
                            {messages.length === 0 && <p style={{textAlign: 'center', padding: '2rem', color: 'var(--sa-text-muted)'}}>Secure channel clear. No new messages.</p>}
                        </div>
                    </div>

                    <div className="sl-table-card">
                        <h3><FaVideo /> Strategy Sessions</h3>
                        <div className="sl-list-container" style={{padding: '0 1.5rem 1.5rem'}}>
                            {meetings.map(meet => (
                                <div key={meet.id} className="sl-list-item" style={{
                                    background: 'var(--sa-blue-light)',
                                    padding: '1.25rem',
                                    borderRadius: '12px',
                                    marginBottom: '1rem',
                                    border: '1px solid rgba(35,71,197,0.1)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <strong style={{color: 'var(--sa-blue-dark)', display: 'block'}}>{meet.title}</strong>
                                        <span style={{fontSize: '0.8rem', color: 'var(--sa-blue)', fontWeight: 600}}>
                                            {new Date(meet.startTime).toLocaleString()}
                                        </span>
                                    </div>
                                    <a href={meet.link} target="_blank" rel="noreferrer" className="sl-btn-primary" style={{padding: '0.5rem 1rem', fontSize: '0.75rem', textDecoration: 'none'}}>
                                        Join Link
                                    </a>
                                </div>
                            ))}
                            {meetings.length === 0 && <p style={{textAlign: 'center', padding: '2rem', color: 'var(--sa-text-muted)'}}>No upcoming strategic sessions.</p>}
                            <button className="ca-btn-primary" style={{marginTop: '1rem', width: '100%', justifyContent: 'center'}}>
                                <FaPlus /> Schedule New Session
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MessagingHub;
