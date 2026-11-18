import { Link } from "react-router-dom";
import { ShoppingCart, ArrowRight } from "lucide-react";

function Cart() {
  return (
    <section className="section-container">
      <div className="section-heading">
        <div>
          <span className="eyebrow">YOUR SHOPPING</span>
          <h2>Shopping Cart</h2>
        </div>
      </div>

      <div className="empty-cart">
        <ShoppingCart size={48} />
        <h3>Your cart is currently empty</h3>
        <p>Explore our marketplace and find something you love.</p>
        <Link to="/products" className="primary-button">
          Start Shopping <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}

export default Cart;
