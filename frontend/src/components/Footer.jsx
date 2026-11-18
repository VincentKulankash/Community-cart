
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer" id="about">
      <div className="footer-container">
        <div>
          <h2>Community<span>Cart</span></h2>
          <p>Shop local. Support local businesses. Grow together.</p>
        </div>

        <div>
          <h3>Explore</h3>
          <Link to="/">Home</Link>
          <Link to="/products">Shop Products</Link>
          <Link to="/cart">Shopping Cart</Link>
        </div>

        <div>
          <h3>Account</h3>
          <Link to="/login">Login</Link>
          <Link to="/register">Create Account</Link>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} Community Cart. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
