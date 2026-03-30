import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../../api/axiosConfig";
import "./Register.css";

const LOGO_URL = "https://cdn-icons-png.flaticon.com/512/3429/3429153.png";

function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Detect verified email state ──────────────────────────────
  const fromGoogle = location.state?.fromGoogle === true;
  const manuallyVerified = location.state?.manuallyVerified === true;
  const isVerified = fromGoogle || manuallyVerified;
  
  const initialEmail = location.state?.googleEmail || location.state?.verifiedEmail || "";
  const initialName  = location.state?.googleName || "";
  // ────────────────────────────────────────────────────────────────────────

  const [data, setData] = useState({
    name: initialName,
    email: initialEmail,
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // If user lands on /register without going through Google, redirect them
  // to the signup chooser page (/signup) so the flow is enforced.
  // Remove this block if you want to keep manual email registration too.
  useEffect(() => {
    // Sync data if state changes (e.g. back navigation)
    if (isVerified) {
      setData((prev) => ({
        ...prev,
        email: initialEmail,
        name: initialName || prev.name,
      }));
    }
  }, [isVerified, initialEmail, initialName]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/auth/register", {
        ...data,
        role: "STUDENT",
      });
      setSuccess("Account created successfully. Redirecting...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="etms-register-container">
      <div className="etms-register-card">
        <div className="etms-register-header">
          <img src={LOGO_URL} alt="EtMS Logo" />
          <h1>Create Account</h1>
          <p>Start your journey with EtMS</p>
        </div>

        {/* Verified Badges */}
        {fromGoogle && (
          <div className="etms-google-badge">
            <svg viewBox="0 0 24 24" className="etms-google-badge-icon">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Verified with Google</span>
            <svg viewBox="0 0 24 24" fill="none" className="etms-check-icon">
              <circle cx="12" cy="12" r="10" fill="#22c55e"/>
              <path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
        {manuallyVerified && (
          <div className="etms-google-badge" style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderColor: '#93c5fd', color: '#1e40af' }}>
            <svg viewBox="0 0 24 24" className="etms-google-badge-icon" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Email Verified Successfully</span>
            <svg viewBox="0 0 24 24" fill="none" className="etms-check-icon">
              <circle cx="12" cy="12" r="10" fill="#2563eb"/>
              <path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}

        {error   && <div className="etms-alert error">{error}</div>}
        {success && <div className="etms-alert success">{success}</div>}

        <form onSubmit={handleRegister} className="etms-register-form">
          <div className="etms-input-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              required
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
            />
          </div>

          <div className="etms-input-group">
            <label>
              Email Address
              {isVerified && (
                <span className="etms-locked-badge">
                  🔒 {fromGoogle ? "Google Verified" : "Email Verified"}
                </span>
              )}
            </label>
            <div className={`etms-input-wrapper ${isVerified ? "locked" : ""}`}>
              <input
                type="email"
                placeholder="name@email.com"
                required
                value={data.email}
                onChange={(e) => {
                  // Only allow changes if NOT verified
                  if (!isVerified) setData({ ...data, email: e.target.value });
                }}
                readOnly={isVerified}
                className={isVerified ? "etms-email-locked" : ""}
              />
              {isVerified && (
                <span className="etms-lock-icon" title="Email verified and cannot be changed">
                  🔒
                </span>
              )}
            </div>
            {isVerified && (
              <p className="etms-email-hint">
                This email was verified and cannot be changed.
              </p>
            )}
          </div>

          <div className="etms-input-group">
            <label>Phone Number</label>
            <input
              type="tel"
              placeholder="10-digit number"
              required
              value={data.phone}
              onChange={(e) =>
                setData({ ...data, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
              }
            />
          </div>

          <div className="etms-input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Create a password"
              required
              value={data.password}
              onChange={(e) => setData({ ...data, password: e.target.value })}
            />
          </div>

          <button type="submit" className="etms-submit-btn" disabled={loading}>
            {loading ? "Processing..." : "Register Now"}
          </button>
        </form>

        <div className="etms-register-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;