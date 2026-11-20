/*
 * DEVELOPER: Branis
 * RESPONSIBILITY: User login interface and validation.
 *
 * TASKS:
 * - Validate required login fields.
 * - Validate email format.
 * - Display meaningful errors for invalid credentials.
 * - Handle loading and failed login requests.
 * - Provide appropriate feedback after successful login.
 *
 * INTEGRATION:
 * - Use the existing auth.js service.
 * - Do not duplicate authentication API requests.
 * - Coordinate successful login with App.jsx authentication state.
 * - Do not modify App.jsx.
 */

import { useState, useEffect } from "react";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, AlertTriangle, CheckCircle2 } from "lucide-react";
import { loginUser } from "../services/auth";

function Login({ onNavigate, onAuthSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("localloop_remembered_email");
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
    if (error) setError("");
  }

  function handlePasswordKey(event) {
    if (event.getModifierState) {
      setCapsLockOn(event.getModifierState("CapsLock"));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const email = formData.email.trim();

    if (!email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      const user = await loginUser({
        email,
        password: formData.password,
      });

      if (rememberMe) {
        localStorage.setItem("localloop_remembered_email", email);
      } else {
        localStorage.removeItem("localloop_remembered_email");
      }

      const displayName = user?.name || user?.user?.name || "";
      setSuccess(
        displayName
          ? `Welcome back, ${displayName}! Signing you in...`
          : "Welcome back! Signing you in..."
      );

      setTimeout(() => {
        onAuthSuccess(user);
        onNavigate("/");
      }, 900);
    } catch (err) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-container">
        <button
          type="button"
          className="auth-back-button"
          onClick={() => onNavigate("/")}
        >
          <ArrowLeft size={18} />
          Back to LocalLoop
        </button>

        <div className="auth-card">
          <div className="auth-brand">
            <span className="auth-brand-icon">L</span>
            <span>LocalLoop</span>
          </div>

          <div className="auth-heading">
            <p className="auth-eyebrow">WELCOME BACK</p>
            <h1>Good to see you again.</h1>
            <p>
              Sign in to discover local finds, manage your listings,
              and connect with your community.
            </p>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-success" role="status">
              <CheckCircle2 size={18} />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="login-email">Email address</label>

              <div className="auth-input-wrap">
                <Mail size={18} />
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Password</label>

              <div className="auth-input-wrap">
                <LockKeyhole size={18} />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  onKeyDown={handlePasswordKey}
                  onKeyUp={handlePasswordKey}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {capsLockOn && (
                <p className="auth-warning" role="status">
                  <AlertTriangle size={16} />
                  Caps Lock is on
                </p>
              )}
            </div>

            <label className="auth-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>

            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="auth-switch">
            New to LocalLoop?{" "}
            <button type="button" onClick={() => onNavigate("/register")}>
              Create an account
            </button>
          </p>

          <p className="auth-footer">
            Discover more. Support local. Keep it in the loop.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;