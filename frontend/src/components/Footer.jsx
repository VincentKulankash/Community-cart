
/*
  DEVELOPER: Olentiki

  RESPONSIBILITY:
  Main website footer.
*/

function Footer({ onNavigate, isMarketplace = false }) {
  function handleBackToGoodStuff(event) {
    event.preventDefault();

    if (isMarketplace) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    document.getElementById("finds")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

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

      <a
        href={isMarketplace ? "#top" : "#finds"}
        onClick={handleBackToGoodStuff}
      >
        Back to the good stuff ↑
      </a>
    </footer>
  );
}

export default Footer;
