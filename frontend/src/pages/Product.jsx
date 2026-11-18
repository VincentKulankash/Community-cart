import { Link } from "react-router-dom";

function Product() {
  return (
    <section className="section-container">
      <span className="eyebrow">COMMUNITY MARKETPLACE</span>
      <h2>Explore Products</h2>
      <p>Discover products from local sellers.</p>

      <div className="product-grid">
        <article className="product-card">
          <Link to="/products/1">
            <div className="product-info">
              <h3>Fresh Organic Avocados</h3>
              <strong>KSh 250</strong>
            </div>
          </Link>
        </article>
      </div>
    </section>
  );
}

export default Product;
