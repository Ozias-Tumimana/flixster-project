import "./Footer.css";

// Static attribution. TMDb attribution is required when using their data publicly.
const Footer = () => (
  <footer className="footer">
    <p className="footer__text">
      © {new Date().getFullYear()} Flixster · Movie data from{" "}
      <a
        className="footer__link"
        href="https://www.themoviedb.org/"
        target="_blank"
        rel="noopener noreferrer"
      >
        The Movie Database (TMDb)
      </a>
    </p>
  </footer>
);

export default Footer;
