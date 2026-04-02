import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import { FaLockOpen, FaArrowLeft, FaHistory } from "react-icons/fa";
import "./Auth.css";

const VerifyOtp = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(60); // 60 seconds resend cooldown
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const email = sessionStorage.getItem("resetEmail");

  useEffect(() => {
    if (!email) navigate("/forgot-password");
  }, [email, navigate]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

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

  const handlePaste = (e) => {
    const pasteData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pasteData)) return;

    const newOtp = [...otp];
    pasteData.split("").forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasteData.length, 5)].focus();
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
      setError(err.response?.data?.message || "Invalid or expired OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0].focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    
    setResending(true);
    setError("");
    try {
      await api.post("/auth/forgot-password", { email });
      setTimer(60);
      alert("A new OTP has been sent to your email.");
    } catch (err) {
      setError("Failed to resend OTP. Please try again later.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-circle">
            <FaLockOpen className="auth-icon" />
          </div>
          <h1>Verify Security Code</h1>
          <p>We've sent a 6-digit code to <br/><span className="text-brand"><strong>{email}</strong></span></p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="otp-input-container" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                className="otp-digit"
                value={digit}
                maxLength={1}
                inputMode="numeric"
                ref={(el) => (inputRefs.current[index] = el)}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
              />
            ))}
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button 
            type="submit" 
            className="auth-btn" 
            disabled={loading || otp.join("").length < 6}
          >
            {loading ? "Verifying..." : "Verify Identity"}
          </button>
        </form>

        <div className="auth-footer resend-section">
          <p className="resend-text">
            Didn't get the code? <br/>
            {timer > 0 ? (
              <span className="timer-text"><FaHistory className="inline mr-1" /> Resend in {timer}s</span>
            ) : (
              <button 
                onClick={handleResend} 
                className="resend-link-btn"
                disabled={resending}
              >
                {resending ? "Sending..." : "Resend Code"}
              </button>
            )}
          </p>
          <Link to="/forgot-password" title="Change email" className="back-link mt-4">
             Change Email
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
