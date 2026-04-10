import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../../api/axiosConfig";
import "./Register.css";

const LOGO_URL = "https://cdn-icons-png.flaticon.com/512/3429/3429153.png";

// ── Password rules ──────────────────────────────────────
const rules = [
  { id: "len",     label: "At least 8 characters",             test: (p) => p.length >= 8 },
  { id: "lower",   label: "Lowercase letters (a-z)",           test: (p) => /[a-z]/.test(p) },
  { id: "upper",   label: "Uppercase letters (A-Z)",           test: (p) => /[A-Z]/.test(p) },
  { id: "number",  label: "Numbers (0-9)",                     test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "Special character (!@#$%^&*)",      test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

function getStrength(password) {
  const passed = rules.filter((r) => r.test(password)).length;
  if (passed <= 1) return { level: 0, label: "Very Weak",  color: "#ef4444" };
  if (passed === 2) return { level: 1, label: "Weak",       color: "#f97316" };
  if (passed === 3) return { level: 2, label: "Fair",       color: "#eab308" };
  if (passed === 4) return { level: 3, label: "Strong",     color: "#22c55e" };
  return              { level: 4, label: "Very Strong", color: "#16a34a" };
}

function Register() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const fromGoogle      = location.state?.fromGoogle      === true;
  const manuallyVerified = location.state?.manuallyVerified === true;
  const isVerified      = fromGoogle || manuallyVerified;
  const initialEmail    = location.state?.googleEmail || location.state?.verifiedEmail || "";
  const initialName     = location.state?.googleName  || "";

  const [data, setData] = useState({ name: initialName, email: initialEmail, phone: "", password: "" });
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pwFocused,    setPwFocused]    = useState(false);
  const [agreed,       setAgreed]       = useState(false);

  const strength    = getStrength(data.password);
  const allRulesMet = rules.every((r) => r.test(data.password));
  const formValid   = allRulesMet && agreed && data.phone.length === 10;

  useEffect(() => {
    if (!isVerified) navigate("/signup", { replace: true });
  }, [isVerified, navigate]);

  useEffect(() => {
    if (isVerified) setData((prev) => ({ ...prev, email: initialEmail, name: initialName || prev.name }));
  }, [isVerified, initialEmail, initialName]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formValid) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/auth/register", { ...data, role: "STUDENT" });
      setSuccess("Account created successfully. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isVerified) return null;

  return (
    <div className="etms-register-container">
      <div className="etms-register-card">

        {/* Header */}
        <div className="etms-register-header">
          <img src={LOGO_URL} alt="EtMS Logo" />
          <h1>Complete Profile</h1>
          <p>Provide a few more details to get started</p>
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
          <div className="etms-manual-badge">
            <svg viewBox="0 0 24 24" className="etms-google-badge-icon" fill="none" stroke="currentColor" strokeWidth="2.5">
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

          {/* Full Name */}
          <div className="etms-input-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              required
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
            />
          </div>

          {/* Email */}
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
                readOnly={isVerified}
                className={isVerified ? "etms-email-locked" : ""}
              />
              {isVerified && <span className="etms-lock-icon">🔒</span>}
            </div>
            {isVerified && <p className="etms-email-hint">Verified email is locked for security.</p>}
          </div>

          {/* Phone */}
          <div className="etms-input-group">
            <label>Phone Number</label>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              required
              maxLength="10"
              value={data.phone}
              onChange={(e) => setData({ ...data, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
            />
            {data.phone && data.phone.length < 10 && (
              <p className="etms-validation-error">⚠️ Exactly 10 digits required</p>
            )}
          </div>

          {/* Password */}
          <div className="etms-input-group">
            <label>Create Password</label>
            <div className="etms-password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                value={data.password}
                onChange={(e) => setData({ ...data, password: e.target.value })}
                onFocus={() => setPwFocused(true)}
                onBlur={() => setPwFocused(false)}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="etms-password-toggle">
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {/* Strength Bar */}
            {data.password && (
              <div className="etms-strength-bar-wrap">
                <div className="etms-strength-bar">
                  {[0,1,2,3,4].map((i) => (
                    <div
                      key={i}
                      className="etms-strength-segment"
                      style={{ background: i <= strength.level ? strength.color : "#e2e8f0" }}
                    />
                  ))}
                </div>
                <span className="etms-strength-label" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}

            {/* Password Rules Checklist */}
            {(pwFocused || data.password) && (
              <div className="etms-pw-rules">
                <p className="etms-pw-rules-title">Your password must contain:</p>
                {rules.map((rule) => {
                  const passed = rule.test(data.password);
                  return (
                    <div key={rule.id} className={`etms-pw-rule ${passed ? "passed" : ""}`}>
                      <span className="etms-pw-rule-icon">{passed ? "✓" : "✓"}</span>
                      <span>{rule.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Terms & Conditions Checkbox */}
          <div className="etms-terms-wrap">
            <label className="etms-terms-label">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="etms-terms-checkbox"
              />
              <span>
                By registering, you agree to AppTechno Careers{" "}
                <a href="/#/terms" target="_blank" rel="noreferrer">Terms of Service</a>
                {" "}and{" "}
                <a href="/#/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
                Your data is handled securely and never shared with third parties.
              </span>
            </label>
          </div>

          <button type="submit" className="etms-submit-btn" disabled={loading || !formValid}>
            {loading ? "Processing..." : "Register Now"}
          </button>
        </form>

        <div className="etms-register-footer">
          Changed your mind? <Link to="/login">Back to Sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
