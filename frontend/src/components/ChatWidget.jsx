import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { FaComments, FaTimes, FaPaperPlane, FaHome, FaRegCommentDots, FaChevronLeft, FaWhatsapp, FaPhone, FaMicrophone, FaVolumeUp, FaVolumeMute, FaStop } from 'react-icons/fa';
import api from '../api/axiosConfig';
import './ChatWidget.css';

const getAuthContext = (pathname = '') => {
    try {
        const userStr = localStorage.getItem("user");
        
        const dashboardPrefixes = ['/admin', '/superadmin', '/student', '/trainer', '/marketer', '/counselor'];
        const isDashboardPath = dashboardPrefixes.some(p => pathname.startsWith(p));

        // Force public context if missing user data OR if browsing public routes (non-dashboard)
        if (!userStr || !isDashboardPath) {
            throw new Error("Force public context");
        }

        if(userStr) {
            const user = JSON.parse(userStr);
            const userRole = user.role;
            const role = (typeof userRole === 'string' ? userRole : userRole?.roleName)?.toUpperCase() || '';
            const name = user.name || 'User';

            if(role.includes('SUPERADMIN')) return { title: 'Command Center AI', subtitle: 'System Intelligence & Operations', initialText: `Welcome back, Super Admin. How can I assist the system today?`, isAuth: true };
            if(role.includes('ADMIN')) return { title: 'Admin Assistant AI', subtitle: 'Manage leave requests and operations', initialText: `Hello Admin. How can I help you today?`, isAuth: true };
            if(role.includes('STUDENT')) return { title: 'Student Companion', subtitle: 'Your personal ETMS AI guide', initialText: `Hi ${name}! How can I help you with your courses, attendance, or leaves today?`, isAuth: true };
            if(role.includes('COUNSELOR') || role.includes('MARKETER') || role.includes('TRAINER')) return { title: 'Staff Assistant AI', subtitle: 'Workflow intelligence & support', initialText: `Hello ${name}. How can I assist your workflow today?`, isAuth: true };
            
            return { title: 'Workspace AI', subtitle: 'Your smart assistant', initialText: `Welcome ${name}. How can I help you?`, isAuth: true };
        }
    } catch(e) {}
    
    return { 
        title: 'We are live!', 
        subtitle: 'Real human or AI on chat. Build your career with us!', 
        initialText: 'Hi! I am your AI assistant from AppTechno Careers. Before we start, could you please introduce yourself?',
        isAuth: false
    };
};

const ChatWidget = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [authContext, setAuthContext] = useState(() => getAuthContext(window.location.hash || window.location.pathname));
    
    // Logged in users skip the 'home' and 'form' screens
    const [view, setView] = useState(() => getAuthContext(window.location.hash || window.location.pathname).isAuth ? 'chat' : 'home');
    
    const [messages, setMessages] = useState([
        { sender: 'bot', text: getAuthContext(window.location.hash || window.location.pathname).initialText }
    ]);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [sessionId, setSessionId] = useState(() => Math.random().toString(36).substring(7));
    const prevUserRef = useRef(localStorage.getItem('user') || '');

    // ── Reset Chat on Auth State Change ──────────────────────────────────────
    useEffect(() => {
        const currentUser = localStorage.getItem('user') || '';
        const dashboardPrefixes = ['/admin', '/superadmin', '/student', '/trainer', '/marketer', '/counselor'];
        const isPublicRoute = !dashboardPrefixes.some(p => location.pathname.startsWith(p));
        
        // Use functional state updates to avoid stale closures on authContext
        setAuthContext(prevContext => {
            if (currentUser !== prevUserRef.current || (isPublicRoute && prevContext.isAuth)) {
                prevUserRef.current = currentUser;
                const newContext = getAuthContext(location.pathname);
                
                // Immediately sync messages and view state
                setMessages([{ sender: 'bot', text: newContext.initialText }]);
                setSessionId(Math.random().toString(36).substring(7));
                setView(newContext.isAuth ? 'chat' : 'home');
                setIsOpen(false);
                
                return newContext;
            }
            return prevContext;
        });
    }, [location.pathname]); // Safe because it only reacts to location changes

    // ── Voice State ──────────────────────────────────────────────────────────
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [voiceSupported, setVoiceSupported] = useState(false);
    const [listenError, setListenError] = useState(null);

    const chatEndRef = useRef(null);
    const widgetRef = useRef(null);
    const recognitionRef = useRef(null);

    // ── Check browser voice support ──────────────────────────────────────────
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        setVoiceSupported(!!SpeechRecognition && !!window.speechSynthesis);
    }, []);

    // ── Close on outside click ───────────────────────────────────────────────
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
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // ── Auto-scroll ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (view === 'chat' || view === 'form') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping, view]);

    // ── Cleanup speech on unmount ────────────────────────────────────────────
    useEffect(() => {
        return () => {
            if (recognitionRef.current) recognitionRef.current.abort();
            window.speechSynthesis?.cancel();
        };
    }, []);

    // ── Speak AI response ────────────────────────────────────────────────────
    const speakText = useCallback((text) => {
        if (!voiceEnabled || !window.speechSynthesis) return;

        // Clean emojis and non-ASCII chars so TTS sounds natural
        const cleanText = text.replace(/[\u{1F300}-\u{1FFFF}]/gu, '').replace(/[^\x00-\x7F]/g, '').trim();
        if (!cleanText) return;

        window.speechSynthesis.cancel();

        const buildAndSpeak = (voices) => {
            const utterance = new SpeechSynthesisUtterance(cleanText);
            const preferred = voices.find(v =>
                v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Female'))
            ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

            if (preferred) utterance.voice = preferred;
            utterance.rate  = 0.95;
            utterance.pitch = 1.05;
            utterance.volume = 1;

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend   = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);

            window.speechSynthesis.speak(utterance);
        };

        // Voices load asynchronously on first call in Chrome/Edge
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            buildAndSpeak(voices);
        } else {
            window.speechSynthesis.addEventListener('voiceschanged', function onReady() {
                buildAndSpeak(window.speechSynthesis.getVoices());
                window.speechSynthesis.removeEventListener('voiceschanged', onReady);
            });
        }
    }, [voiceEnabled]);

    const stopSpeaking = () => {
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
    };

    // ── Start microphone recording ───────────────────────────────────────────
    const startListening = () => {
        setListenError(null);
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        // Stop any ongoing speech before listening
        stopSpeaking();

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        recognition.onstart = () => setIsListening(true);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.trim();
            setIsListening(false);
            if (transcript) {
                setInputText(transcript);
                // Auto-send after a short delay to let UI update
                setTimeout(() => {
                    sendMessage(transcript);
                }, 100);
            }
        };

        recognition.onerror = (event) => {
            setIsListening(false);
            if (event.error === 'no-speech') {
                setListenError('No speech detected. Try again.');
            } else if (event.error === 'not-allowed') {
                setListenError('Microphone access denied.');
            } else {
                setListenError('Could not hear you. Try again.');
            }
            setTimeout(() => setListenError(null), 3000);
        };

        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
    };

    const stopListening = () => {
        recognitionRef.current?.stop();
        setIsListening(false);
    };

    // ── Core send logic (used by both text and voice) ────────────────────────
    const sendMessage = async (text) => {
        const msgText = (text || inputText).trim();
        if (!msgText) return;

        const userMsg = { sender: 'user', text: msgText };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

        try {
            const response = await api.post('/public/chat/message', {
                message: msgText,
                sessionId: sessionId
            });

            const botReply = response.data.response;
            setIsTyping(false);
            setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);

            // Speak the reply if voice mode is enabled
            speakText(botReply);

        } catch (error) {
            console.error('Chat error:', error);
            setIsTyping(false);
            const fallback = "I'm having trouble connecting! Please call +91 7022928198 for direct help.";
            setMessages(prev => [...prev, { sender: 'bot', text: fallback }]);
            speakText(fallback);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        sendMessage(inputText);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setView('chat');
        const welcomeMsg = `Welcome, ${formData.name}! How can I help you regarding our IT or Non-IT courses today? You can type or use the 🎤 microphone to speak!`;
        setMessages(prev => [...prev, { sender: 'bot', text: welcomeMsg }]);
        speakText(welcomeMsg);
    };

    const toggleChat = () => setIsOpen(!isOpen);

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
                        {view !== 'home' && !authContext.isAuth && (
                            <button className="back-btn" onClick={() => setView('home')}>
                                <FaChevronLeft />
                            </button>
                        )}
                        <h3>{authContext.title}</h3>
                        <p>{authContext.subtitle}</p>
                    </div>

                    {/* Voice Status Bar */}
                    {view === 'chat' && (
                        <div className="voice-status-bar">
                            {isListening && (
                                <div className="voice-listening-indicator">
                                    <div className="voice-wave">
                                        <span /><span /><span /><span /><span />
                                    </div>
                                    <span className="voice-status-text">Listening...</span>
                                </div>
                            )}
                            {isSpeaking && (
                                <div className="voice-speaking-indicator">
                                    <FaVolumeUp className="speaking-icon" />
                                    <span className="voice-status-text">AI is speaking...</span>
                                    <button className="stop-speak-btn" onClick={stopSpeaking}>
                                        <FaStop />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
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
                                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Your Name" />
                                </div>
                                <div className="tawk-form-group">
                                    <label>Phone</label>
                                    <input required type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91" />
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
                            {isTyping && (
                                <div className="message-bubble bot typing">
                                    <div className="typing-dots">
                                        <span /><span /><span />
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    )}
                </div>

                {view === 'chat' && (
                    <div className="chat-input-wrapper">
                        {listenError && (
                            <div className="voice-error">{listenError}</div>
                        )}
                        <form className="chat-input-area" onSubmit={handleSendMessage}>
                            {/* Voice Toggle */}
                            {voiceSupported && (
                                <button
                                    type="button"
                                    className={`voice-toggle-btn ${voiceEnabled ? 'enabled' : 'disabled'}`}
                                    onClick={() => { setVoiceEnabled(v => !v); if (isSpeaking) stopSpeaking(); }}
                                    title={voiceEnabled ? 'Voice replies ON — click to mute' : 'Voice replies OFF — click to unmute'}
                                >
                                    {voiceEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
                                </button>
                            )}

                            <input
                                type="text"
                                placeholder={isListening ? '🔴 Listening...' : 'Type here or use mic...'}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                autoFocus
                                disabled={isListening}
                            />

                            {/* Mic Button */}
                            {voiceSupported && (
                                <button
                                    type="button"
                                    className={`mic-btn ${isListening ? 'listening' : ''}`}
                                    onClick={isListening ? stopListening : startListening}
                                    title={isListening ? 'Stop recording' : 'Speak your message'}
                                >
                                    {isListening ? <FaStop /> : <FaMicrophone />}
                                </button>
                            )}

                            {/* Send Button */}
                            <button type="submit" className="send-btn" disabled={!inputText.trim() || isListening}>
                                <FaPaperPlane />
                            </button>
                        </form>
                    </div>
                )}

                {/* Only show bottom navigation for public users */}
                {!authContext.isAuth && (
                    <div className="chat-footer-nav">
                        <button className={`nav-item ${view === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>
                            <FaHome /><span>Home</span>
                        </button>
                        <button className={`nav-item ${view === 'chat' ? 'active' : ''}`} onClick={() => setView('chat')}>
                            <FaComments /><span>Chat</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatWidget;
