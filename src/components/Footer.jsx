import "../styles/footer.css";
import bedrockLogo from "../assets/bedrock-logo.svg";

const footerColumns = [
  {
    title: "Residences",
    links: ["Oduduwa's", "Bateye's", "Opebi's I", "Opebi's II", "Community"],
  },
  {
    title: "Support",
    links: ["Help centre", "FAQ", "Contact", "Press", "Status"],
  },
  {
    title: "Social",
    links: ["Instagram", "Twitter", "Facebook", "LinkedIn", "Github"],
  },
  {
    title: "Legal",
    links: ["Legal Notice", "Privacy Policy", "Terms of Use"],
  },
];

function Footer() {
  function handleNewsletterSubmit(event) {
    event.preventDefault();
  }

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__links">
          {footerColumns.map((column) => (
            <div className="site-footer__column" key={column.title}>
              <h3>{column.title}</h3>

              {column.links.map((link) => (
                <a href="#0" key={link}>
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>

        <div className="site-footer__newsletter">
          <div className="site-footer__newsletter-copy">
            <p className="site-footer__newsletter-label">
              SUBSCRIBE TO OUR NEWSLETTER
            </p>
            <p className="site-footer__newsletter-text">
              A monthly digest of the latest news, articles, and resources.
            </p>
          </div>

          <form
            className="site-footer__newsletter-form"
            onSubmit={handleNewsletterSubmit}
          >
            <input
              type="email"
              placeholder="Email address"
              aria-label="Email address"
            />
            <button type="submit">Subscribe</button>
          </form>
        </div>

        <div className="site-footer__bottom">
          <img
            src={bedrockLogo}
            alt="Bedrock Residences"
            className="site-footer__logo"
          />
          <p>© 2023 Rayna. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
