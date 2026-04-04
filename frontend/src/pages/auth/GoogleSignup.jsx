import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axiosConfig";
import "./GoogleSignup.css";

const LOGO_URL = "https://cdn-icons-png.flaticon.com/512/3429/3429153.png";

// ─── Environment Variable for better Production Hosting Security ───────────────────
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1076398521639-0ue5haenlao9htqbu0ce3v4kngq5vc80.apps.googleusercontent.com";

// ────────────────────────────────────────────────────────────────────────────

function GoogleSignup() {
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);

  // Flow State: 'CHOOSER' | 'EMAIL_INPUT' | 'OTP_INPUT'
  const [step, setStep] = useState('CHOOSER');
  
  // Data State
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Timer Effect for Resend OTP
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // ── 1. Google Identity Services Setup ──
  useEffect(() => {
    let scriptElement = null;
    let isMounted = true;

    if (step === 'CHOOSER') {
      const initializeGoogle = () => {
        if (!window.google || !googleBtnRef.current || !isMounted) return;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Render the Official Google button naturally
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          width: googleBtnRef.current.offsetWidth || 340,
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "center",
        });
      };

      const loadGoogleScript = () => {
        if (window.google) {
          initializeGoogle();
          return;
        }
        
        // Ensure no duplicate script tags
        if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
           // wait for script to load if already in DOM
           setTimeout(initializeGoogle, 500);
           return;
        }

        scriptElement = document.createElement("script");
        scriptElement.src = "https://accounts.google.com/gsi/client";
        scriptElement.async = true;
        scriptElement.defer = true;
        scriptElement.onload = initializeGoogle;
        document.head.appendChild(scriptElement);
      };

      loadGoogleScript();
    }

    return () => {
        isMounted = false;
        // Optional cleanup if required
    };
  }, [step]);

  // ── 2. Google Response Handler ──
  const handleGoogleResponse = (response) => {
    try {
      // Decode the JWT token returned by Google
      const base64Url = response.credential.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));

      const googleEmail = payload.email;
      const googleName = payload.name || "";

      if (!googleEmail.endsWith("@gmail.com") && !googleEmail.includes("@")) {
        alert("Please sign in with a valid Google account.");
        return;
      }

      // Navigate to register page with Google email pre-filled
      navigate("/register", {
        state: {
          googleEmail,
          googleName,
          fromGoogle: true,
        },
      });
    } catch (err) {
      console.error("Google token decode error:", err);
      alert("Google sign-in failed. Please try again.");
    }
  };

  // ── 3. Manual Email Handlers ──
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.toLowerCase().endsWith("@gmail.com")) {
      setError("Please enter a valid @gmail.com address.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/send-signup-otp", { email });
      setSuccess(res.data.message || "OTP sent successfully.");
      setStep("OTP_INPUT");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp || otp.length < 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/verify-signup-otp", { email, otp });
      setSuccess("Email verified successfully! Redirecting...");
      
      // Navigate to register page passing the manually verified email
      setTimeout(() => {
        navigate("/register", {
          state: {
            verifiedEmail: email,
            manuallyVerified: true,
          },
        });
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || loading) return;
    
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await api.post("/auth/send-signup-otp", { email });
      setSuccess(res.data.message || "A new OTP has been sent.");
      setResendTimer(60);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="gs-container">
      {/* Animated background blobs */}
      <div className="gs-blob gs-blob-1" />
      <div className="gs-blob gs-blob-2" />
      <div className="gs-blob gs-blob-3" />

      <div className="gs-card">
        <div className="gs-header">
          <div className="gs-logo-wrap">
            <img src={LOGO_URL} alt="EtMS Logo" className="gs-logo" />
          </div>
          <h1 className="gs-title">Create Your Account</h1>
          <p className="gs-subtitle">
            {step === 'CHOOSER' ? "Choose how you want to sign up" : 
             step === 'EMAIL_INPUT' ? "Verify your Gmail address" : 
             "Enter verification code"}
          </p>
        </div>

        {error && (
          <div className="gs-alert gs-alert-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="gs-alert gs-alert-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        <div className="gs-options">
          
          {/* STEP 1: CHOOSER */}
          {step === 'CHOOSER' && (
            <>
              <div id="google-btn-container">
                <div ref={googleBtnRef} />
              </div>

              <div className="gs-divider">
                <span>or</span>
              </div>

              <button className="gs-email-btn" onClick={() => setStep('EMAIL_INPUT')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,12 2,6" />
                </svg>
                Continue with Email
              </button>
            </>
          )}

          {/* STEP 2: EMAIL INPUT (OTP Request) */}
          {step === 'EMAIL_INPUT' && (
            <form onSubmit={handleSendOtp} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
              <div className="gs-form-group">
                <label className="gs-form-label">Gmail Address</label>
                <input 
                  type="email" 
                  autoFocus
                  placeholder="name@gmail.com" 
                  className="gs-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div style={{display: 'flex', gap: '12px'}}>
                <button type="button" onClick={() => {setStep('CHOOSER'); setError("");}} style={{flex: 1, padding: '14px', background: '#f1f5f9', border: 'none', borderRadius: '12px', color: '#475569', fontWeight: '700', cursor: 'pointer', transition: '0.2s'}}>
                  Back
                </button>
                <button type="submit" disabled={loading} className="gs-email-btn" style={{flex: 2}}>
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: OTP VERIFICATION */}
          {step === 'OTP_INPUT' && (
            <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
              <form onSubmit={handleVerifyOtp} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                <div style={{fontSize: '14px', color: '#64748b', textAlign: 'center', lineHeight: '1.6'}}>
                  We sent a 6-digit code to <br/><strong style={{color: '#0f172a'}}>{email}</strong>
                </div>

                <div className="gs-form-group">
                  <label className="gs-form-label">Verification Code</label>
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="000000" 
                    className="gs-input"
                    style={{letterSpacing: '8px', textAlign: 'center', fontSize: '20px', fontWeight: '800'}}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                  />
                </div>

                <div style={{display: 'flex', gap: '12px'}}>
                  <button type="button" onClick={() => {setStep('EMAIL_INPUT'); setOtp(""); setError(""); setSuccess("");}} style={{flex: 1, padding: '14px', background: '#f1f5f9', border: 'none', borderRadius: '12px', color: '#475569', fontWeight: '700', cursor: 'pointer', transition: '0.2s'}}>
                    Back
                  </button>
                  <button type="submit" disabled={loading} className="gs-email-btn" style={{flex: 2, background: 'linear-gradient(135deg, #059669, #10b981)'}}>
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
              </form>
              
              <div style={{textAlign: 'center', paddingTop: '10px', borderTop: '1px solid #f1f5f9'}}>
                <p style={{fontSize: '14px', color: '#64748b'}}>
                  Didn't receive the code?{' '}
                  {resendTimer > 0 ? (
                    <span style={{color: '#0f172a', fontWeight: '700'}}>Resend in {resendTimer}s</span>
                  ) : (
                    <button 
                      onClick={handleResendOtp} 
                      disabled={loading}
                      style={{
                        background: 'none', 
                        border: 'none', 
                        color: '#2563eb', 
                        cursor: loading ? 'not-allowed' : 'pointer', 
                        fontWeight: '700',
                        fontSize: '14px',
                        padding: '0 4px',
                        textDecoration: 'underline'
                      }}
                    >
                      Resend Code
                    </button>
                  )}
                </p>
              </div>
            </div>
          )}

        </div>

        <div className="gs-footer">
          Already have an account?
          <Link to="/login" className="gs-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default GoogleSignup;

