/*
  DEVELOPER: Olentiki

  RESPONSIBILITY:
  Main website footer.
*/

function Footer({ onNavigate }) {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <a
          className="wordmark"
          href="/"
          aria-label="Community Cart home"
          onClick={(event) => {
            event.preventDefault();
            onNavigate("/");
          }}
        >
          <span className="wordmark-symbol" aria-hidden="true" />
          <span>Community Cart</span>
        </a>

        <span>Good things find new homes. © {year} Community Cart</span>

        <button
          className="footer-top"
          type="button"
          onClick={() =>
            window.scrollTo({ top: 0, behavior: "smooth" })
          }
        >
          Back to top ↑
        </button>
      </div>
    </footer>
  );
}

export default Footer;