import {
  BEDROCK_SITE_NAME,
  BEDROCK_SITE_URL,
  normalizeSeoPath,
  toAbsoluteSeoUrl,
} from "./seoRoutes";

const DEFAULT_TITLE = "Bedrock Residences";
const DEFAULT_DESCRIPTION =
  "Book luxury serviced apartments in Lagos with Bedrock Residences. Find secure short-stay apartments, flexible booking, support, and premium comfort.";
const DEFAULT_IMAGE = "/android-chrome-512x512.png";
const DEFAULT_KEYWORDS = [
  "Bedrock Residences",
  "luxury apartments in Lagos",
  "serviced apartments Lagos",
  "short stay apartments Lagos",
  "Ikeja GRA apartments",
  "Lagos apartment booking",
];
const PUBLIC_SEARCH_ROUTES = ["/", "/residences", "/shops", "/legal"];
const NOINDEX_PAGES = new Set([
  "payment",
  "pending",
  "confirmed",
  "paymentSuccess",
  "profile",
  "foodReview",
  "foodPayment",
  "foodStatus",
]);

function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function truncate(value, maxLength) {
  const text = cleanText(value);

  if (text.length <= maxLength) return text;

  return `${text.slice(0, maxLength - 1).trim()}...`;
}

function normalizeDescription(value = DEFAULT_DESCRIPTION) {
  const description = cleanText(value) || DEFAULT_DESCRIPTION;

  return truncate(description, 160);
}

function getOrCreateMeta(selector, createAttributes = {}) {
  let element = document.head.querySelector(selector);

  if (element) return element;

  element = document.createElement("meta");
  Object.entries(createAttributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  document.head.appendChild(element);

  return element;
}

function setMetaByName(name, content) {
  const element = getOrCreateMeta(`meta[name="${name}"]`, { name });

  element.setAttribute("content", content);
}

function setMetaByProperty(property, content) {
  const element = getOrCreateMeta(`meta[property="${property}"]`, {
    property,
  });

  element.setAttribute("content", content);
}

function setCanonical(url) {
  let element = document.head.querySelector('link[rel="canonical"]');

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }

  element.setAttribute("href", url);
}

function setJsonLd(id, payload) {
  let element = document.getElementById(id);

  if (!payload) {
    element?.remove();
    return;
  }

  if (!element) {
    element = document.createElement("script");
    element.id = id;
    element.type = "application/ld+json";
    document.head.appendChild(element);
  }

  element.textContent = JSON.stringify(payload);
}

function routeIsIndexable(path) {
  const normalizedPath = normalizeSeoPath(path);

  return PUBLIC_SEARCH_ROUTES.some(
    (publicPath) =>
      normalizedPath === publicPath || normalizedPath.startsWith(`${publicPath}/`),
  );
}

function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness", "LodgingBusiness"],
    name: BEDROCK_SITE_NAME,
    url: BEDROCK_SITE_URL,
    logo: toAbsoluteSeoUrl("/android-chrome-512x512.png"),
    image: toAbsoluteSeoUrl(DEFAULT_IMAGE),
    telephone: "+2349131209348",
    email: "reservations@bedrockresidences.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lagos",
      addressRegion: "Lagos",
      addressCountry: "NG",
    },
    sameAs: ["https://www.instagram.com/bedrockresidences/"],
  };
}

function getWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BEDROCK_SITE_NAME,
    url: BEDROCK_SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${BEDROCK_SITE_URL}/?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

function getBreadcrumbSchema(breadcrumbs = []) {
  if (!breadcrumbs.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toAbsoluteSeoUrl(item.path),
    })),
  };
}

function getApartmentSchema(apartment, url) {
  if (!apartment) return null;

  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: cleanText(
      `${apartment.title || "Apartment"} ${apartment.residenceName || ""}`,
    ),
    url,
    image: apartment.image ? toAbsoluteSeoUrl(apartment.image) : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: apartment.location || apartment.address || "",
      addressLocality: "Lagos",
      addressRegion: "Lagos",
      addressCountry: "NG",
    },
    amenityFeature: Array.isArray(apartment.amenities)
      ? apartment.amenities.map((amenity) => ({
          "@type": "LocationFeatureSpecification",
          name: amenity,
          value: true,
        }))
      : undefined,
    priceRange: apartment.price
      ? `NGN ${Number(apartment.price).toLocaleString()}`
      : undefined,
  };
}

function getFaqSchema(faqItems = []) {
  const questions = faqItems
    .filter((item) => item.question && item.answer)
    .slice(0, 12)
    .map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    }));

  if (!questions.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions,
  };
}

function getRouteTitle({
  activePage = "home",
  selectedApartment,
  selectedResidence,
  selectedLegalDocument,
  selectedFoodItem,
  shopVariant,
  profileInitialView,
  isAuthModalOpen,
  authEntry,
}) {
  if (isAuthModalOpen) {
    if (authEntry === "signup") return "Create Account | Bedrock Residences";
    if (authEntry === "agentSignup") return "Agent Signup | Bedrock Residences";
    if (authEntry === "agentPending") {
      return "Agent Verification | Bedrock Residences";
    }

    return "Login | Bedrock Residences";
  }

  if (activePage === "apartment" && selectedApartment?.title) {
    return `${selectedApartment.title} | Bedrock Residences`;
  }

  if (["payment", "pending", "confirmed"].includes(activePage)) {
    return "Secure Apartment Booking | Bedrock";
  }

  if (activePage === "paymentSuccess") {
    return "Booking Confirmed | Bedrock Residences";
  }

  if (activePage === "residence") {
    return `${selectedResidence?.title || "Lagos Residences"} | Bedrock Residences`;
  }

  if (activePage === "shopDirectory") return "Bedrock Shops | Bedrock Residences";

  if (["shopFood", "foodDetail", "foodReview", "foodPayment"].includes(activePage)) {
    if (selectedFoodItem?.title) return `${selectedFoodItem.title} | Bedrock Shops`;

    return `${cleanText(shopVariant || "Shop")} | Bedrock Shops`;
  }

  if (activePage === "legal") {
    return selectedLegalDocument?.title
      ? `${selectedLegalDocument.title} | Bedrock Residences`
      : "Legal Documents | Bedrock Residences";
  }

  if (activePage === "profile") {
    const viewTitle = cleanText(profileInitialView || "Profile")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

    return `${viewTitle || "My Profile"} | Bedrock`;
  }

  return DEFAULT_TITLE;
}

function getRouteDescription({
  activePage = "home",
  selectedApartment,
  selectedResidence,
  selectedLegalDocument,
  selectedFoodItem,
  shopVariant,
}) {
  if (activePage === "apartment" && selectedApartment) {
    return normalizeDescription(
      selectedApartment.description ||
        `Book ${selectedApartment.title} at ${selectedApartment.residenceName || "Bedrock Residences"} in Lagos with secure online payment and guest support.`,
    );
  }

  if (["payment", "pending", "confirmed"].includes(activePage)) {
    return "Complete your Bedrock apartment booking securely with verified stay details, guest information, payment review, and booking confirmation.";
  }

  if (activePage === "paymentSuccess") {
    return "Your Bedrock payment has been verified successfully. Review booking details, open your reservations, or return home to book another stay.";
  }

  if (activePage === "residence") {
    return normalizeDescription(
      `Explore ${selectedResidence?.title || "Bedrock residences"} in Lagos. Compare available serviced apartments, prices, amenities, and secure your stay online.`,
    );
  }

  if (activePage === "shopDirectory") {
    return "Browse Bedrock shops for food, toiletries, guest services, and stay requests while enjoying your serviced apartment in Lagos.";
  }

  if (["shopFood", "foodDetail", "foodReview", "foodPayment"].includes(activePage)) {
    return normalizeDescription(
      selectedFoodItem?.description ||
        `Order ${shopVariant || "guest essentials"} from Bedrock shops for your Lagos stay with convenient service during your apartment booking.`,
    );
  }

  if (activePage === "legal") {
    return normalizeDescription(
      selectedLegalDocument?.description ||
        "Read Bedrock Residences legal documents, guest policies, cancellation terms, refund rules, and privacy information before booking.",
    );
  }

  if (activePage === "profile") {
    return "Manage your Bedrock profile, bookings, messages, orders, saved apartments, support requests, and account settings securely.";
  }

  return DEFAULT_DESCRIPTION;
}

export function buildSeoMetadata(options = {}) {
  const path = normalizeSeoPath(options.path || "/");
  const activePage = options.activePage || "home";
  const title = truncate(getRouteTitle(options), 64);
  const description = getRouteDescription(options);
  const canonicalUrl = toAbsoluteSeoUrl(path);
  const image = String(
    options.selectedApartment?.image ||
      options.selectedFoodItem?.image ||
      DEFAULT_IMAGE,
  );
  const breadcrumbs = [
    { name: "Home", path: "/" },
    ...(path !== "/"
      ? [
          {
            name: title.replace(/\s*\|\s*Bedrock.*$/i, ""),
            path,
          },
        ]
      : []),
  ];
  const jsonLd = [
    getOrganizationSchema(),
    getWebsiteSchema(),
    getBreadcrumbSchema(breadcrumbs),
    getApartmentSchema(options.selectedApartment, canonicalUrl),
    options.faqItems?.length ? getFaqSchema(options.faqItems) : null,
  ].filter(Boolean);

  return {
    title,
    description,
    canonicalUrl,
    imageUrl: toAbsoluteSeoUrl(image),
    type: options.selectedApartment ? "place" : "website",
    noindex:
      NOINDEX_PAGES.has(activePage) ||
      (!routeIsIndexable(path) && activePage !== "apartment"),
    keywords: DEFAULT_KEYWORDS.join(", "),
    jsonLd,
  };
}

export function applySeoMetadata(metadata = {}) {
  if (typeof document === "undefined") return;

  const title = metadata.title || DEFAULT_TITLE;
  const description = normalizeDescription(metadata.description);
  const canonicalUrl = metadata.canonicalUrl || BEDROCK_SITE_URL;
  const imageUrl = metadata.imageUrl || toAbsoluteSeoUrl(DEFAULT_IMAGE);

  document.title = title;
  setMetaByName("description", description);
  setMetaByName("keywords", metadata.keywords || DEFAULT_KEYWORDS.join(", "));
  setMetaByName(
    "robots",
    metadata.noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large",
  );
  setCanonical(canonicalUrl);

  setMetaByProperty("og:site_name", BEDROCK_SITE_NAME);
  setMetaByProperty("og:title", title);
  setMetaByProperty("og:description", description);
  setMetaByProperty("og:image", imageUrl);
  setMetaByProperty("og:url", canonicalUrl);
  setMetaByProperty("og:type", metadata.type || "website");
  setMetaByProperty("og:locale", "en_NG");

  setMetaByName("twitter:card", "summary_large_image");
  setMetaByName("twitter:title", title);
  setMetaByName("twitter:description", description);
  setMetaByName("twitter:image", imageUrl);

  setJsonLd("bedrock-route-jsonld", metadata.jsonLd || []);
}
