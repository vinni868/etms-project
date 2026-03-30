import { useState, useRef, useEffect } from 'react';
import { FaComments, FaTimes, FaPaperPlane, FaHome, FaRegCommentDots, FaChevronLeft, FaWhatsapp, FaPhone } from 'react-icons/fa';
import api from '../api/axiosConfig';
import './ChatWidget.css';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState('home'); 
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Hi! I am your AI assistant from AppTechno Careers. Before we start, could you please introduce yourself?' }
    ]);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [sessionId] = useState(() => Math.random().toString(36).substring(7));
    const chatEndRef = useRef(null);
    const widgetRef = useRef(null);

    const toggleChat = () => setIsOpen(!isOpen);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (widgetRef.current && !widgetRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    useEffect(() => {
        if (view === 'chat' || view === 'form') {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isTyping, view]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setView('chat');
        const welcomeMsg = `Welcome, ${formData.name}! How can I help you regarding our IT or Non-IT courses today?`;
        setMessages(prev => [...prev, { sender: 'bot', text: welcomeMsg }]);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const userMsg = { sender: 'user', text: inputText };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

        try {
            console.log("DEBUG: Sending message to AI:", inputText);
            
            const response = await api.post('/public/chat/message', {
                message: inputText,
                sessionId: sessionId
            });
            
            setIsTyping(false);
            setMessages(prev => [...prev, { sender: 'bot', text: response.data.response }]);
        } catch (error) {
            console.error("Chat error:", error);
            setIsTyping(false);
            // Fallback response if backend is down
            setMessages(prev => [...prev, { 
                sender: 'bot', 
                text: "I'm having trouble connecting to my brain! please call +91 7022928198 for direct help." 
            }]);
        }
    };

    return (
        <div className="etms-chat-wrapper" ref={widgetRef}>
            {!isOpen && (
                <div className="chat-badge-label">
                    <span>We Are Here!</span>
                </div>
            )}
            <button className={`chat-toggle-btn ${isOpen ? 'active' : ''}`} onClick={toggleChat}>
                {isOpen ? <FaTimes /> : (
                    <>
                        <FaComments />
                        <span className="notification-badge">1</span>
                    </>
                )}
            </button>

            <div className={`chat-window ${isOpen ? 'open' : ''}`}>
                <div className="chat-header">
                    <div className="header-top">
                        {view !== 'home' && (
                            <button className="back-btn" onClick={() => setView('home')}>
                                <FaChevronLeft />
                            </button>
                        )}
                        <h3>We are live!</h3>
                        <p>Real human or AI on chat. Build your career with us!</p>
                    </div>
                </div>

                <div className="chat-body">
                    {view === 'home' ? (
                        <>
                            <div className="new-convo-card" onClick={() => setView('form')}>
                                <div className="card-top">
                                    <h4>New Conversation</h4>
                                    <p>Tell us about your career goals</p>
                                </div>
                                <button className="start-btn">
                                    <FaPaperPlane />
                                </button>
                            </div>
                            <div className="recent-activity">
                                <p className="activity-label">Active Session</p>
                                <div className="recent-chat-preview" onClick={() => setView('chat')}>
                                    <FaRegCommentDots />
                                    <div className="preview-info">
                                        <span>Current Chat</span>
                                        <p>{messages[messages.length - 1].text.substring(0, 30)}...</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : view === 'form' ? (
                        <div className="chat-form-container">
                            <form onSubmit={handleFormSubmit}>
                                <div className="tawk-form-group">
                                    <label>Name</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Your Name" />
                                </div>
                                <div className="tawk-form-group">
                                    <label>Phone</label>
                                    <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91" />
                                </div>
                                <button type="submit" className="tawk-start-btn">
                                    Start Chatting
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="chat-thread">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`message-bubble ${msg.sender}`}>
                                    {msg.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                                    {(msg.text.includes('+91') || msg.text.includes('Senior Counselor')) && (
                                        <div className="handoff-actions">
                                            <a href="https://wa.me/917022928198" target="_blank" rel="noreferrer" className="wa-btn">
                                                <FaWhatsapp /> WhatsApp
                                            </a>
                                            <a href="tel:+917022928198" className="call-btn">
                                                <FaPhone /> Call Now
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isTyping && <div className="message-bubble bot typing">AI is thinking...</div>}
                            <div ref={chatEndRef} />
                        </div>
                    )}
                </div>

                {view === 'chat' && (
                    <form className="chat-input-area" onSubmit={handleSendMessage}>
                        <input 
                            type="text" 
                            placeholder="Type here..." 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            autoFocus
                        />
                        <button type="submit" disabled={!inputText.trim()}>
                            <FaPaperPlane />
                        </button>
                    </form>
                )}

                <div className="chat-footer-nav">
                    <button className={`nav-item ${view === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>
                        <FaHome /><span>Home</span>
                    </button>
                    <button className={`nav-item ${view === 'chat' ? 'active' : ''}`} onClick={() => setView('chat')}>
                        <FaComments /><span>Chat</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatWidget;
