export const BEDROCK_SITE_URL = "https://stay.bedrockgroup.ng";
export const BEDROCK_SITE_NAME = "Bedrock Residences";

export const BEDROCK_PUBLIC_ROUTES = [
  {
    path: "/",
    changefreq: "daily",
    priority: "1.0",
  },
  {
    path: "/residences",
    changefreq: "daily",
    priority: "0.9",
  },
  {
    path: "/residences/bateye",
    changefreq: "daily",
    priority: "0.9",
  },
  {
    path: "/residences/opebi-residence",
    changefreq: "daily",
    priority: "0.9",
  },
  {
    path: "/residences/community-residence",
    changefreq: "daily",
    priority: "0.9",
  },
  {
    path: "/residences/oduduwa-residence",
    changefreq: "daily",
    priority: "0.9",
  },
  {
    path: "/residences/obeds-court",
    changefreq: "weekly",
    priority: "0.8",
  },
  {
    path: "/residences/patricks-court",
    changefreq: "weekly",
    priority: "0.8",
  },
  {
    path: "/residences/ikate-residence",
    changefreq: "weekly",
    priority: "0.8",
  },
  {
    path: "/shops",
    changefreq: "weekly",
    priority: "0.7",
  },
  {
    path: "/shops/food",
    changefreq: "weekly",
    priority: "0.7",
  },
  {
    path: "/shops/toiletries",
    changefreq: "weekly",
    priority: "0.7",
  },
  {
    path: "/shops/services",
    changefreq: "weekly",
    priority: "0.7",
  },
  {
    path: "/shops/requests",
    changefreq: "weekly",
    priority: "0.6",
  },
  {
    path: "/legal",
    changefreq: "monthly",
    priority: "0.5",
  },
  {
    path: "/legal/terms",
    changefreq: "monthly",
    priority: "0.5",
  },
  {
    path: "/legal/cancellation",
    changefreq: "monthly",
    priority: "0.5",
  },
  {
    path: "/legal/refund",
    changefreq: "monthly",
    priority: "0.5",
  },
  {
    path: "/legal/privacy",
    changefreq: "monthly",
    priority: "0.5",
  },
];

export function normalizeSeoPath(path = "/") {
  const cleanPath = String(path || "/").split("?")[0].split("#")[0] || "/";

  return cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
}

export function toAbsoluteSeoUrl(path = "/", siteUrl = BEDROCK_SITE_URL) {
  const pathValue = String(path || "");

  if (/^https?:\/\//i.test(pathValue)) return pathValue;

  const normalizedPath = normalizeSeoPath(path);

  return `${String(siteUrl).replace(/\/+$/, "")}${normalizedPath}`;
}

export function getSitemapRoutes() {
  return BEDROCK_PUBLIC_ROUTES.map((route) => ({
    ...route,
    loc: toAbsoluteSeoUrl(route.path),
  }));
}
