
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShoppingBasket,
  Truck,
  ShieldCheck,
  Heart
} from "lucide-react";

const categories = [
  { name: "Fresh Produce", icon: "🥑" },
  { name: "Groceries", icon: "🛒" },
  { name: "Fashion", icon: "👕" },
  { name: "Electronics", icon: "📱" },
  { name: "Home & Living", icon: "🏡" },
  { name: "Beauty", icon: "✨" }
];

const products = [
  {
    id: 1,
    name: "Fresh Organic Avocados",
    category: "Fresh Produce",
    price: 250,
    image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600"
  },
  {
    id: 2,
    name: "Classic Cotton T-Shirt",
    category: "Fashion",
    price: 850,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600"
  },
  {
    id: 3,
    name: "Wireless Headphones",
    category: "Electronics",
    price: 2500,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"
  },
  {
    id: 4,
    name: "Everyday Leather Backpack",
    category: "Accessories",
    price: 1800,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600"
  }
];

function Home() {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">WELCOME TO YOUR COMMUNITY MARKETPLACE</span>

          <h1>Good Shopping.<br /><span>Stronger Communities.</span></h1>

          <p>
            Discover quality products from local businesses and independent
            sellers. Every purchase helps your community grow.
          </p>

          <div className="hero-buttons">
            <Link to="/products" className="primary-button">
              Explore Products <ArrowRight size={18} />
            </Link>
            <Link to="/register" className="secondary-button">
              Join Our Community
            </Link>
          </div>

          <div className="hero-trust">
            <span><ShoppingBasket size={17} /> Local Products</span>
            <span><Heart size={17} /> Community First</span>
          </div>
        </div>

        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1000"
            alt="Fresh produce at a local marketplace"
          />
          <div className="hero-image-label">
            <strong>Shop Local</strong>
            <span>Make every purchase count.</span>
          </div>
        </div>
      </section>

      <section className="benefits">
        <div><ShoppingBasket /><strong>Quality Products</strong><span>Carefully selected goods</span></div>
        <div><Truck /><strong>Convenient Shopping</strong><span>Shop from anywhere</span></div>
        <div><ShieldCheck /><strong>Trusted Marketplace</strong><span>Shop with confidence</span></div>
      </section>

      <section className="section-container" id="categories">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SHOP BY CATEGORY</span>
            <h2>Explore Categories</h2>
          </div>
          <Link to="/products">View all <ArrowRight size={17} /></Link>
        </div>

        <div className="category-grid">
          {categories.map((category) => (
            <Link
              to={`/products?category=${encodeURIComponent(category.name)}`}
              className="category-card"
              key={category.name}
            >
              <span>{category.icon}</span>
              <strong>{category.name}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-container featured-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">HANDPICKED FOR YOU</span>
            <h2>Featured Products</h2>
          </div>
          <Link to="/products">Shop all <ArrowRight size={17} /></Link>
        </div>

        <div className="product-grid">
          {products.map((product) => (
            <article className="product-card" key={product.id}>
              <Link to={`/products/${product.id}`}>
                <div className="product-image">
                  <img src={product.image} alt={product.name} />
                </div>
                <div className="product-info">
                  <span>{product.category}</span>
                  <h3>{product.name}</h3>
                  <strong>KSh {product.price.toLocaleString()}</strong>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="community-banner">
        <div>
          <span className="eyebrow">GROW WITH US</span>
          <h2>Every purchase makes a difference.</h2>
          <p>Join Community Cart and support the people and businesses around you.</p>
          <Link to="/register" className="primary-button">
            Become a Member <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
