import { Link } from "react-router-dom";

function Register() {
  return (
    <section className="section-container">
      <div className="auth-container">
        <span className="eyebrow">JOIN OUR COMMUNITY</span>
        <h2>Create Your Account</h2>
        <p>Register and start shopping from local businesses.</p>

        <form className="auth-form">
          <label>Full Name</label>
          <input type="text" placeholder="Enter your full name" required />

          <label>Email Address</label>
          <input type="email" placeholder="Enter your email" required />

          <label>Password</label>
          <input type="password" placeholder="Create a password" required />

          <button type="submit" className="primary-button">Create Account</button>
        </form>

        <p>Already registered? <Link to="/login">Login</Link></p>
      </div>
    </section>
  );
}

export default Register;
