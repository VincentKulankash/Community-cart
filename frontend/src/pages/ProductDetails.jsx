import { Link, useParams } from "react-router-dom";

function ProductDetails() {
  const { id } = useParams();

  return (
    <section className="section-container">
      <span className="eyebrow">PRODUCT DETAILS</span>
      <h2>Product Information</h2>
      <p>Product ID: {id}</p>
      <p>More product information will appear here.</p>

      <Link to="/products" className="primary-button">
        Back to Products
      </Link>
    </section>
  );
}

export default ProductDetails;
