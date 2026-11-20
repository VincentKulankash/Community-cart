
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { loginUser } from "../services/auth";

function Login({ onNavigate, onAuthSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!formData.email.trim() || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const user = await loginUser({
        email: formData.email.trim(),
        password: formData.password,
      });

      onAuthSuccess(user);
      onNavigate("/");
    } catch (err) {
      setError(err.message || "Unable to log in. Please try again.");
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
          Back to Community-cart
        </button>

        <div className="auth-card">
          <div className="auth-brand">
            <span className="auth-brand-icon">C</span>
            <span>ommunity-Cart</span>
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
            </div>

            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="auth-switch">
            New to Community-Cart?{" "}
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
