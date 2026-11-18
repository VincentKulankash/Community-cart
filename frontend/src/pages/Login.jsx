import { Link } from "react-router-dom";

function Login() {
  return (
    <section className="section-container">
      <div className="auth-container">
        <span className="eyebrow">WELCOME BACK</span>
        <h2>Login to Community Cart</h2>
        <p>Access your account and continue shopping.</p>

        <form className="auth-form">
          <label>Email Address</label>
          <input type="email" placeholder="Enter your email" required />

          <label>Password</label>
          <input type="password" placeholder="Enter your password" required />

          <button type="submit" className="primary-button">Login</button>
        </form>

        <p>Don't have an account? <Link to="/register">Register here</Link></p>
      </div>
    </section>
  );
}

export default Login;
