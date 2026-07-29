import bedrockLogo from "../assets/bedrock-logo.svg";
import dunsRegistered from "../assets/duns-registered.png";
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

const fallbackResidenceLinks = [
  { label: "Bateye", type: "residence", value: "bateye" },
  { label: "Opebi Residence", type: "residence", value: "opebi-residence" },
  {
    label: "Community Residence",
    type: "residence",
    value: "community-residence",
  },
  {
    label: "Oduduwa Residence",
    type: "residence",
    value: "oduduwa-residence",
  },
  { label: "Obed's Court", type: "residence", value: "obeds-court" },
  { label: "Patrick's Court", type: "residence", value: "patricks-court" },
];
const residenceDisplayNames = [
  { key: "bateye", label: "Bateye" },
  { key: "opebi", label: "Opebi Residence" },
  { key: "community", label: "Community Residence" },
  { key: "oduduwa", label: "Oduduwa Residence" },
  { key: "obeds-court", label: "Obed's Court" },
  { key: "patricks-court", label: "Patrick's Court" },
  { key: "ikate", label: "Ikate Residence" },
];

const baseFooterColumns = [
  {
    title: "Residences",
    links: fallbackResidenceLinks,
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

function normalizeFooterResidenceKey(label, value) {
  const normalized = String(`${label} ${value}`).toLowerCase();

  if (normalized.includes("opebi")) return "opebi";

  return String(value || label || "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugifyFooterResidenceLabel(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getKnownFooterResidence(label, key) {
  return residenceDisplayNames.find((item) =>
    String(`${key} ${label}`).toLowerCase().includes(item.key),
  );
}

function getFooterResidenceLabel(label, key) {
  const knownResidence = getKnownFooterResidence(label, key);

  if (knownResidence) return knownResidence.label;

  return String(label || "")
    .replace(/\bResidence\b/gi, "")
    .replace(/\bApartments?\b/gi, "")
    .replace(/\bIkeja\b/gi, "")
    .replace(/\bGRA\b/gi, "")
    .replace(/\bYaba\b/gi, "")
    .replace(/\bIkoyi\b/gi, "")
    .replace(/\bLekki\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getFooterResidenceValue(label, key) {
  const knownResidence = getKnownFooterResidence(label, key);

  return knownResidence
    ? slugifyFooterResidenceLabel(knownResidence.label)
    : key;
}

function getFooterActionHref(link) {
  if (link.href) return link.href;

  if (link.type === "residence") {
    return `/residences/${slugifyFooterResidenceLabel(link.value || link.label)}`;
  }

  if (link.type === "profile") {
    return `/profile/${slugifyFooterResidenceLabel(link.value || link.label)}`;
  }

  if (link.type === "legal") {
    return `/legal/${slugifyFooterResidenceLabel(link.value || link.label)}`;
  }

  return "/";
}

function getFooterResidenceLinks(residences = []) {
  if (!Array.isArray(residences) || residences.length === 0) {
    return fallbackResidenceLinks;
  }

  const seen = new Set();
  const links = [];

  residences.forEach((residence) => {
    const label = residence.title || residence.name || residence.label;
    const value = residence.id || residence.slug || residence.value || label;
    const key = normalizeFooterResidenceKey(label, value);

    if (!label || !value || !key || seen.has(key)) return;

    seen.add(key);
    links.push({
      label: getFooterResidenceLabel(label, key),
      type: "residence",
      value: getFooterResidenceValue(label, key || value),
    });
  });

  return links.length ? links : fallbackResidenceLinks;
}

function Footer({
  helpInfo,
  legalDocuments = [],
  residences = [],
  onResidenceSelect,
  onProfileView,
  onLegalSelect,
}) {
  const footerColumns = baseFooterColumns.map((column) => {
    if (column.title === "Residences") {
      return { ...column, links: getFooterResidenceLinks(residences) };
    }

    if (column.title === "Social") {
      return { ...column, links: getFooterSocialLinks(helpInfo) };
    }

    if (column.title === "Legal") {
      return { ...column, links: getFooterLegalLinks(legalDocuments) };
    }

    return column;
  });

  function handleFooterAction(link) {
    if (link.type === "residence") {
      onResidenceSelect?.(link.value, "", link.label);
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

              {column.links.map((link) => {
                const href = getFooterActionHref(link);

                return link.href ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    key={link.label}
                  >
                    {link.label}
                  </a>
                ) : (
                  <a
                    href={href}
                    onClick={(event) => {
                      event.preventDefault();
                      handleFooterAction(link);
                    }}
                    key={link.label}
                  >
                    {link.label}
                  </a>
                );
              })}
            </div>
          ))}
        </div>

        <div className="site-footer__bottom">
          <img
            src={bedrockLogo}
            alt="Bedrock Residences"
            className="site-footer__logo"
          />
          <p>© 2026 Bedsoft. All rights reserved.</p>
          <img
            src={dunsRegistered}
            alt="Dun & Bradstreet D-U-N-S Registered"
            className="site-footer__badge"
            loading="lazy"
            width="220"
            height="155"
          />
        </div>
      </div>
    </footer>
  );
}

export default Footer;
