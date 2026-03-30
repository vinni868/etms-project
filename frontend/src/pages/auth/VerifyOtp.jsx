import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import { FaKey, FaArrowLeft } from "react-icons/fa";
import "./Auth.css";

const VerifyOtp = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const email = sessionStorage.getItem("resetEmail");

  useEffect(() => {
    if (!email) navigate("/forgot-password");
  }, [email, navigate]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length < 6) return;

    setLoading(true);
    setError("");

    try {
      await api.post("/auth/verify-otp", { email, otp: otpString });
      sessionStorage.setItem("resetOtp", otpString);
      navigate("/reset-password");
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed. Check code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-circle">
            <FaKey className="auth-icon" />
          </div>
          <h1>Verify OTP</h1>
          <p>We've sent a code to <strong>{email}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="otp-input-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                className="otp-digit"
                value={digit}
                maxLength={1}
                ref={(el) => (inputRefs.current[index] = el)}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
              />
            ))}
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-btn" disabled={loading || otp.join("").length < 6}>
            {loading ? "Verifying..." : "Verify Code"}
          </button>
        </form>

        <div className="auth-footer">
          <button onClick={() => navigate("/forgot-password")} className="back-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            Resend Code
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
