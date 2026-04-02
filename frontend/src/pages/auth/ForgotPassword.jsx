import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import { FaFingerprint, FaArrowLeft, FaShieldAlt, FaEnvelope } from "react-icons/fa";
import "./Auth.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post("/auth/forgot-password", { email });
      setMessage(response.data.message || "Reset code sent successfully!");
      // Store email for subsequent steps
      sessionStorage.setItem("resetEmail", email);
      
      // Delay navigation to let user see success message
      setTimeout(() => navigate("/verify-otp"), 2000);
    } catch (err) {
      console.error("Forgot Password Error:", err);
      // Catch specific errors from backend
      const errMsg = err.response?.data?.message || "Failed to send reset code. Please check your connection.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-circle">
            <FaFingerprint className="auth-icon" />
          </div>
          <h1>Password Reset</h1>
          <p>Don't worry! Enter your email and we'll send you a 6-digit verification code.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Registered Email Address</label>
            <div className="input-with-icon">
              <FaEnvelope className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder="your.name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}

          <button 
            type="submit" 
            className="auth-btn" 
            disabled={loading || !email}
          >
            {loading ? (
              <span className="btn-loading flex items-center justify-center gap-2">
                Sending Code...
              </span>
            ) : "Send Reset Code"}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="back-link">
            <FaArrowLeft /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;