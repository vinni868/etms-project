import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axiosConfig";
import "./Login.css";

const LOGO_URL = "https://cdn-icons-png.flaticon.com/512/3429/3429153.png"; 

function Login() {
  const navigate = useNavigate();
  const [data, setData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", data);
      const user = { ...res.data, role: res.data.role?.toUpperCase() };
      localStorage.setItem("user", JSON.stringify(user));

      const routes = {
        SUPERADMIN: "/superadmin/dashboard",
        ADMIN: "/admin/dashboard",
        TRAINER: "/trainer/dashboard",
        STUDENT: "/student/dashboard",
        MARKETER: "/marketer/dashboard",
        COUNSELOR: "/counselor/dashboard",
      };

      navigate(routes[user.role] || "/login");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clean-login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <img src={LOGO_URL} alt="EtMS" className="brand-logo" />
          <h1>Welcome back</h1>
          <p>Please enter your details to sign in</p>
        </div>

        {error && (
          <div className="error-banner">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          {/* Email */}
          <div className="form-group">
            <label>Email address</label>
            <input
              type="email"
              placeholder="e.g. alex@example.com"
              required
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                value={data.password}
                onChange={(e) => setData({ ...data, password: e.target.value })}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="toggle-btn"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {/* Forgot Link moved here: After input */}
            <div className="forgot-container">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          </div>

          <button type="submit" className="signin-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="login-footer">
          <p>New to EtMS? <Link to="/signup">Create an account</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Login;