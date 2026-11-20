
/*
  DEVELOPER: Olentiki

  RESPONSIBILITY:
  Main website footer.
*/

function Footer({ onNavigate }) {
  return (
    <footer className="site-footer">
      <a
        className="wordmark footer-wordmark"
        href="/"
        aria-label="LocalLoop home"
        onClick={(event) => {
          event.preventDefault();
          onNavigate("/");
        }}
      >
        <span className="wordmark-symbol">
          <span />
          <span />
        </span>

        <span>
          local<span className="wordmark-light">loop</span>
        </span>
      </a>

      <span>Good things go around. © 2025 LocalLoop</span>

      <a href="#finds">Back to the good stuff ↑</a>
    </footer>
  );
}

export default Footer;
