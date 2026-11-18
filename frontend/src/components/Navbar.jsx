
import { Link, NavLink } from "react-router-dom";
import { ShoppingCart, Search, Menu, UserRound } from "lucide-react";

function Navbar() {
  return (
    <header className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo">
          <span className="logo-icon">C</span>
          <span>Community<span className="logo-highlight">Cart</span></span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/products">Shop</NavLink>
          <a href="#categories">Categories</a>
          <a href="#about">About</a>
        </nav>

        <div className="nav-actions">
          <Link to="/products" className="nav-search">
            <Search size={19} />
          </Link>

          <Link to="/login" className="nav-account">
            <UserRound size={19} />
            <span>Account</span>
          </Link>

          <Link to="/cart" className="cart-button">
            <ShoppingCart size={19} />
            <span>Cart</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
