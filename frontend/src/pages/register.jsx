/*
 * DEVELOPER: Branis
 * RESPONSIBILITY: User registration interface and validation.
 *
 * TASKS:
 * - Validate required registration fields.
 * - Validate email format.
 * - Validate password requirements.
 * - Confirm that password and password confirmation match.
 * - Display backend registration errors, including duplicate email errors.
 * - Handle loading and successful registration feedback.
 *
 * INTEGRATION:
 * - Use the existing auth.js service.
 * - Do not duplicate authentication API requests.
 * - Coordinate successful registration with the existing authentication flow.
 */

import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPin,
  User,
} from "lucide-react";
import { registerUser } from "../services/auth";

function Register({ onNavigate }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    location: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    setSuccess("");

    const name = formData.name.trim();
    const email = formData.email.trim();
    const location = formData.location.trim();

    if (!name || !email || !location) {
      setError("Please fill in all required fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await registerUser({
        name,
        email,
        location,
        password: formData.password,
      });

      setSuccess("Your account has been created successfully. Please sign in.");

      setTimeout(() => {
        onNavigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.message || "Unable to create your account.");
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
            <p className="auth-eyebrow">JOIN THE COMMUNITY</p>
            <h1>Your local story starts here.</h1>
            <p>
              Create an account and become part of a community
              that supports local buying and selling.
            </p>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-success" role="status">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="register-name">Full name</label>
              <div className="auth-input-wrap">
                <User size={18} />
                <input
                  id="register-name"
                  type="text"
                  name="name"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-email">Email address</label>
              <div className="auth-input-wrap">
                <Mail size={18} />
                <input
                  id="register-email"
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
              <label htmlFor="register-location">Location</label>
              <div className="auth-input-wrap">
                <MapPin size={18} />
                <input
                  id="register-location"
                  type="text"
                  name="location"
                  placeholder="Your town or area"
                  value={formData.location}
                  onChange={handleChange}
                  autoComplete="address-level2"
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-password">Password</label>
              <div className="auth-input-wrap">
                <LockKeyhole size={18} />
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={8}
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
              <p className="auth-hint">Must be at least 8 characters.</p>
            </div>

            <div className="auth-field">
              <label htmlFor="register-confirm-password">
                Confirm password
              </label>
              <div className="auth-input-wrap">
                <LockKeyhole size={18} />
                <input
                  id="register-confirm-password"
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Enter your password again"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
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
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <button type="button" onClick={() => onNavigate("/login")}>
              Sign in
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

export default Register;