import bedrockLogo from "../assets/bedrock-logo.svg";
import {
  getLegalDocumentKey,
  mergeLegalDocuments,
} from "../data/legalDocuments";
import "../styles/footer.css";

const BEDROCK_INSTAGRAM_URL = "https://www.instagram.com/bedrockresidences/";

const defaultSocialLinks = [
  { label: "Instagram", href: BEDROCK_INSTAGRAM_URL },
  { label: "Twitter", href: "https://x.com/" },
  { label: "Facebook", href: "https://www.facebook.com/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/" },
  { label: "Github", href: "https://github.com/" },
];

const defaultLegalLinks = [
  { label: "Terms of service", type: "legal", value: "terms" },
  { label: "Cancellation policy", type: "legal", value: "cancellation" },
  { label: "Refund policy", type: "legal", value: "refund" },
  { label: "Privacy policy", type: "legal", value: "privacy" },
];

const baseFooterColumns = [
  {
    title: "Residences",
    links: [
      { label: "Oduduwa's", type: "residence", value: "oduduwa" },
      { label: "Bateye's", type: "residence", value: "bateye" },
      { label: "Opebi's I", type: "residence", value: "opebi" },
      { label: "Opebi's II", type: "residence", value: "opebi" },
      { label: "Community", type: "residence", value: "community" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help centre", type: "profile", value: "help" },
      { label: "FAQ", type: "profile", value: "help" },
      { label: "Contact", type: "profile", value: "help" },
    ],
  },
  {
    title: "Social",
    links: defaultSocialLinks,
  },
  {
    title: "Legal",
    links: defaultLegalLinks,
  },
];

function normalizeLink(url) {
  const value = String(url || "").trim();

  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;

  return `https://${value}`;
}

function isInstagramLabel(label = "") {
  return String(label).toLowerCase().includes("instagram");
}

function normalizeSocialLink(label, url) {
  if (isInstagramLabel(label)) return BEDROCK_INSTAGRAM_URL;

  return normalizeLink(url);
}

function getFooterSocialLinks(helpInfo) {
  const rawSocials =
    helpInfo?.socials ||
    helpInfo?.social_links ||
    helpInfo?.socialLinks ||
    helpInfo?.contact?.socials ||
    helpInfo?.support?.socials;

  if (Array.isArray(rawSocials) && rawSocials.length > 0) {
    return rawSocials.map((social) => {
      const label = social.name || social.label || social.title || "Social";

      return {
        label,
        href: normalizeSocialLink(label, social.url || social.link || social.href),
      };
    });
  }

  if (rawSocials && typeof rawSocials === "object") {
    return Object.entries(rawSocials).map(([label, value]) => {
      const href = normalizeSocialLink(
        label,
        typeof value === "string" ? value : value?.url || value?.link || value?.href,
      );

      return { label, href };
    });
  }

  return defaultSocialLinks;
}

function getFooterLegalLinks(legalDocuments = []) {
  const documents = mergeLegalDocuments(legalDocuments);

  if (documents.length === 0) return defaultLegalLinks;

  return documents.map((document) => ({
    label: document.title || document.name || "Legal document",
    type: "legal",
    value: getLegalDocumentKey(document),
  }));
}

function Footer({
  helpInfo,
  legalDocuments = [],
  onResidenceSelect,
  onProfileView,
  onLegalSelect,
}) {
  const footerColumns = baseFooterColumns.map((column) => {
    if (column.title === "Social") {
      return { ...column, links: getFooterSocialLinks(helpInfo) };
    }

    if (column.title === "Legal") {
      return { ...column, links: getFooterLegalLinks(legalDocuments) };
    }

    return column;
  });

  function handleNewsletterSubmit(event) {
    event.preventDefault();
  }

  function handleFooterAction(link) {
    if (link.type === "residence") {
      onResidenceSelect?.(link.value);
      return;
    }

    if (link.type === "profile") {
      onProfileView?.(link.value);
      return;
    }

    if (link.type === "legal") {
      onLegalSelect?.(link.value);
    }
  }

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__links">
          {footerColumns.map((column) => (
            <div className="site-footer__column" key={column.title}>
              <h3>{column.title}</h3>

              {column.links.map((link) =>
                link.href ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    key={link.label}
                  >
                    {link.label}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleFooterAction(link)}
                    key={link.label}
                  >
                    {link.label}
                  </button>
                ),
              )}
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
