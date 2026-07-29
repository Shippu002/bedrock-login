import { useCallback, useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiMapPin, FiShoppingBag } from "react-icons/fi";
import Header from "../../components/Header";
import SearchBar from "../../components/SearchBar";
import ListingSection from "../../components/ListingSection";
import AppImage from "../../components/AppImage";
import BrandLoader from "../../components/BrandLoader";
import PromoBanner from "../../components/PromoBanner";
import ToastHost from "../../components/ToastHost";
import { bedrockFaqItems } from "../../data/bedrockFaq";
import {
  getLegalDocumentKey,
  mergeLegalDocuments,
} from "../../data/legalDocuments";
import { shopCategories } from "../../data/shopCategories";
import { homePromotions } from "../../data/promotions";
import Footer from "../../components/Footer";
import AuthModal from "../../components/AuthModal";
import ProfilePage from "../Profile/ProfilePage";
import ResidencePage from "../Residence/ResidencePage";
import ApartmentPage from "../Apartment/ApartmentPage";
import LegalPage from "../Legal/LegalPage";
import PaymentSuccessPage from "../Payment/PaymentSuccessPage";
import ShopFoodPage from "../ShopFood/ShopFoodPage";
import { decorateApartmentWithMedia } from "../../utils/apartmentMedia";
import {
  addDays,
  calculateBookingTotals,
  createBookingId,
  ensureCheckoutDate,
  formatShortDate,
  getTodayDateValue,
} from "../../utils/bookings";
import {
  calculateFoodOrderTotals,
  createDefaultFoodOrderDetails,
} from "../../utils/foodOrders";
import { getRockPointSummary } from "../../utils/rockPoints";
import {
  defaultApartmentFilters,
  filterListingSections,
  hasActiveApartmentFilters,
} from "../../utils/apartmentFilters";
import {
  apartmentsApi,
  authApi,
  bookingsApi,
  clearAuthToken,
  favoritesApi,
  foodApi,
  getAuthToken,
  ordersApi,
  paymentsApi,
  profileApi,
  requestsApi,
  servicesApi,
  shopApi,
} from "../../api";
import {
  buildListingSectionsFromApartments,
  extractObject,
  extractCollection,
  extractLegalDocuments,
  normalizeBackendAvailability,
  normalizeBackendApartment,
  normalizeBackendApartmentCategory,
  normalizeBackendBooking,
  normalizeBackendCatalogItem,
  normalizeBackendDocument,
  normalizeBackendFavorite,
  normalizeBackendLegalItem,
  normalizeBackendNotification,
  normalizeBackendOrder,
  normalizeBackendPayment,
  normalizeBackendPricing,
  normalizeBackendResidence,
  normalizeBackendReview,
} from "../../utils/backendCollections";
import {
  isAgentPendingVerification,
  isAgentUser,
  mergeAgentVerificationStatus,
  normalizeBackendUser,
} from "../../utils/backendUser";
import {
  identify,
  reset as resetMixpanel,
  setUser,
  track,
  trackPageView,
} from "../../services/mixpanel";
import { trackPixel } from "../../services/metaPixel";
import { applySeoMetadata, buildSeoMetadata } from "../../services/seo";

const ACCOUNT_STORAGE_KEY = "bedrockRegisteredUser";
const CANCELLED_ORDERS_STORAGE_KEY = "bedrockCancelledOrders";
const PAYMENT_CONTEXT_STORAGE_KEY = "bedrockPendingPaymentContext";
const PAYMENT_CONFIRMATION_STORAGE_KEY = "bedrockPaymentConfirmation";
const TRACKED_PURCHASE_REFERENCES_STORAGE_KEY =
  "bedrockTrackedPurchaseReferences";
const PAYMENT_SUCCESS_PATH = "/payment-success";
const DATE_UNAVAILABLE_MESSAGE =
  "This date is not available for booking. Please choose another check-in or check-out date.";
const PAYMENT_REFERENCE_QUERY_KEYS = [
  "reference",
  "trxref",
  "payment_reference",
  "paymentReference",
];
const DEBUG_FRONTEND_ERRORS = import.meta.env.VITE_DEBUG_AUTH === "true";
const APARTMENT_STAGE_BY_PAGE = {
  payment: "payment",
  pending: "pending",
  confirmed: "confirmed",
};
const PAGE_BY_APARTMENT_STAGE = {
  payment: "payment",
  pending: "pending",
  confirmed: "confirmed",
};
const SHOP_STAGE_BY_PAGE = {
  foodReview: "review",
  foodPayment: "payment",
  foodStatus: "status",
};
const PAGE_BY_SHOP_STAGE = {
  review: "foodReview",
  payment: "foodPayment",
  status: "foodStatus",
};
const SHOP_VARIANT_ALIASES = {
  foods: "food",
  meals: "food",
  food: "food",
  shop: "toiletries",
  toiletries: "toiletries",
  products: "toiletries",
  services: "services",
  service: "services",
  requests: "requests",
  request: "requests",
};
const RESIDENCE_ROUTE_NAMES = [
  { key: "bateye", label: "Bateye" },
  { key: "opebi", label: "Opebi Residence" },
  { key: "community", label: "Community Residence" },
  { key: "oduduwa", label: "Oduduwa Residence" },
  { key: "obeds-court", label: "Obed's Court" },
  { key: "patricks-court", label: "Patrick's Court" },
  { key: "ikate", label: "Ikate Residence" },
];
const AUTH_ROUTE_BY_ENTRY = {
  login: "/login",
  signup: "/signup",
  agentSignup: "/agent-signup",
  agentPending: "/agent-verification",
};
const AUTH_ENTRY_BY_ROUTE = {
  login: "login",
  signin: "login",
  "sign-in": "login",
  signup: "signup",
  "sign-up": "signup",
  register: "signup",
  "agent-signup": "agentSignup",
  "agent-sign-up": "agentSignup",
  "become-agent": "agentSignup",
  "agent-verification": "agentPending",
  "verification-pending": "agentPending",
};

function logFrontendError(...args) {
  if (DEBUG_FRONTEND_ERRORS) {
    console.error(...args);
  }
}

function safeDecodeRouteSegment(value = "") {
  try {
    return decodeURIComponent(String(value || ""));
  } catch {
    return String(value || "");
  }
}

function slugifyRouteSegment(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function encodeRouteSegment(value = "") {
  return encodeURIComponent(String(value || "").trim());
}

function getUniqueRouteParts(parts = []) {
  const seen = new Set();

  return parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .filter((part) => {
      const key = normalizeRouteLookup(part);

      if (!key || seen.has(key)) return false;

      seen.add(key);
      return true;
    });
}

function getReadableRouteKey(parts = [], fallbackParts = []) {
  const readableParts = getUniqueRouteParts(parts).filter((part) =>
    /[a-z]/i.test(part),
  );
  const readableSlug = slugifyRouteSegment(readableParts.join(" "));

  if (readableSlug) return readableSlug;

  const fallbackSlug = getUniqueRouteParts(fallbackParts)
    .map(slugifyRouteSegment)
    .find(Boolean);

  return fallbackSlug || "item";
}

function getKnownResidenceRouteLabel(...values) {
  const normalizedText = values
    .filter(Boolean)
    .map((value) => slugifyRouteSegment(value))
    .join("-");

  if (!normalizedText) return "";

  return (
    RESIDENCE_ROUTE_NAMES.find((item) => normalizedText.includes(item.key))
      ?.label || ""
  );
}

function getResidenceRouteKey(residence, fallbackId = "") {
  const knownLabel = getKnownResidenceRouteLabel(
    fallbackId,
    residence?.id,
    residence?.slug,
    residence?.title,
    residence?.name,
    residence?.raw?.title,
    residence?.raw?.name,
  );

  if (knownLabel) return slugifyRouteSegment(knownLabel);

  return getReadableRouteKey(
    [
      residence?.title,
      residence?.name,
      residence?.raw?.title,
      residence?.raw?.name,
    ],
    [
      residence?.slug,
      residence?.raw?.slug,
      fallbackId,
      residence?.id,
      residence?.backendId,
      "residence",
    ],
  );
}

function getResidenceRouteSegment(residence, fallbackId = "") {
  return encodeRouteSegment(getResidenceRouteKey(residence, fallbackId));
}

function getApartmentRouteKey(apartment) {
  return getReadableRouteKey(
    [
      apartment?.title,
      apartment?.name,
      apartment?.raw?.title,
      apartment?.raw?.name,
      apartment?.residenceName,
      apartment?.residenceTitle,
      apartment?.sectionTitle,
      apartment?.location,
      apartment?.address,
      apartment?.sectionLocation,
    ],
    [
      apartment?.slug,
      apartment?.raw?.slug,
      apartment?.backendId,
      apartment?.id,
      apartment?.uuid,
      "apartment",
    ],
  );
}

function getApartmentRouteSegment(apartment) {
  return encodeRouteSegment(getApartmentRouteKey(apartment));
}

function getShopItemRouteKey(item) {
  return getReadableRouteKey(
    [
      item?.title,
      item?.name,
      item?.raw?.title,
      item?.raw?.name,
      item?.category,
    ],
    [
      item?.slug,
      item?.raw?.slug,
      item?.backendId,
      item?.id,
      item?.uuid,
      "item",
    ],
  );
}

function getShopItemRouteSegment(item) {
  return encodeRouteSegment(getShopItemRouteKey(item));
}

function normalizeRouteLookup(value = "") {
  return safeDecodeRouteSegment(value).trim().toLowerCase();
}

function getRouteMatchKeys(record, extraValues = []) {
  const rawValues = [
    record?.backendId,
    record?.id,
    record?.uuid,
    record?.slug,
    record?.raw?.id,
    record?.raw?.uuid,
    record?.raw?.slug,
    record?.title,
    record?.name,
    record?.raw?.title,
    record?.raw?.name,
    ...extraValues,
  ];
  const keys = new Set();

  rawValues.filter(Boolean).forEach((value) => {
    const normalized = normalizeRouteLookup(value);
    const slug = slugifyRouteSegment(value);

    if (normalized) keys.add(normalized);
    if (slug) keys.add(slug);
  });

  return keys;
}

function recordMatchesRouteKey(record, routeKey, extraValues = []) {
  const normalizedRouteKey = normalizeRouteLookup(routeKey);
  const sluggedRouteKey = slugifyRouteSegment(routeKey);
  const candidateKeys = getRouteMatchKeys(record, extraValues);

  return (
    candidateKeys.has(normalizedRouteKey) ||
    candidateKeys.has(sluggedRouteKey)
  );
}

function normalizeShopRouteVariant(value = "") {
  const key = slugifyRouteSegment(value);

  return SHOP_VARIANT_ALIASES[key] || key || "food";
}

function parseAppRoute(pathname = "/") {
  const segments = String(pathname || "/")
    .split("/")
    .filter(Boolean)
    .map(safeDecodeRouteSegment);
  const root = slugifyRouteSegment(segments[0]);

  if (!root) return { page: "home" };

  if (
    root === "payment-success" ||
    root === "booking-success" ||
    root === "thank-you"
  ) {
    return { page: "paymentSuccess" };
  }

  if (AUTH_ENTRY_BY_ROUTE[root]) {
    return {
      page: "auth",
      authEntry: AUTH_ENTRY_BY_ROUTE[root],
    };
  }

  if (root === "residence" || root === "residences") {
    return {
      page: "residence",
      residenceId: segments[1] || "",
    };
  }

  if (root === "apartment" || root === "apartments") {
    const stage = slugifyRouteSegment(segments[2]);

    return {
      page: PAGE_BY_APARTMENT_STAGE[stage] || "apartment",
      apartmentKey: segments[1] || "",
    };
  }

  if (root === "shop" || root === "shops") {
    const shopVariant = normalizeShopRouteVariant(segments[1]);
    const itemKey = segments[2] || "";
    const stage = slugifyRouteSegment(segments[3]);

    if (!segments[1]) {
      return { page: "shopDirectory" };
    }

    if (!itemKey) {
      return { page: "shopFood", shopVariant };
    }

    return {
      page: PAGE_BY_SHOP_STAGE[stage] || "foodDetail",
      shopVariant,
      itemKey,
    };
  }

  if (root === "profile" || root === "account") {
    return {
      page: "profile",
      profileView: slugifyRouteSegment(segments[1]) || "profile",
    };
  }

  if (root === "legal" || root === "policy" || root === "policies") {
    return {
      page: "legal",
      documentId: slugifyRouteSegment(segments[1]) || "",
    };
  }

  return { page: "home" };
}

function buildAppPath({
  activePage,
  isAuthModalOpen,
  authEntry,
  selectedResidence,
  selectedResidenceId,
  selectedApartment,
  profileInitialView,
  selectedLegalDocumentId,
  shopVariant,
  selectedFoodItem,
}) {
  if (isAuthModalOpen) {
    return AUTH_ROUTE_BY_ENTRY[authEntry] || "/login";
  }

  if (activePage === "residence") {
    return selectedResidence || selectedResidenceId
      ? `/residences/${getResidenceRouteSegment(
          selectedResidence,
          selectedResidenceId,
        )}`
      : "/residences";
  }

  if (["apartment", "payment", "pending", "confirmed"].includes(activePage)) {
    const apartmentSegment = getApartmentRouteSegment(selectedApartment);
    const stage = APARTMENT_STAGE_BY_PAGE[activePage];

    return stage
      ? `/apartments/${apartmentSegment}/${stage}`
      : `/apartments/${apartmentSegment}`;
  }

  if (activePage === "paymentSuccess") {
    return PAYMENT_SUCCESS_PATH;
  }

  if (activePage === "shopDirectory") {
    return "/shops";
  }

  if (activePage === "shopFood") {
    return `/shops/${encodeRouteSegment(shopVariant || "food")}`;
  }

  if (
    ["foodDetail", "foodReview", "foodPayment", "foodStatus"].includes(
      activePage,
    )
  ) {
    const itemSegment = getShopItemRouteSegment(selectedFoodItem);
    const stage = SHOP_STAGE_BY_PAGE[activePage];
    const basePath = `/shops/${encodeRouteSegment(
      shopVariant || "food",
    )}/${itemSegment}`;

    return stage ? `${basePath}/${stage}` : basePath;
  }

  if (activePage === "profile") {
    return `/profile/${encodeRouteSegment(profileInitialView || "profile")}`;
  }

  if (activePage === "legal") {
    return selectedLegalDocumentId
      ? `/legal/${encodeRouteSegment(selectedLegalDocumentId)}`
      : "/legal";
  }

  return "/";
}

function getCurrentPathname() {
  if (typeof window === "undefined") return "/";

  return window.location.pathname || "/";
}

function hasPaymentReturnQuery() {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.search);

  return PAYMENT_REFERENCE_QUERY_KEYS.some((key) => params.has(key));
}

function writeBrowserRoute(path, { replace = false } = {}) {
  if (typeof window === "undefined" || hasPaymentReturnQuery()) return;

  const nextPath = path || "/";

  if (getCurrentPathname() === nextPath) return;

  const method = replace ? "replaceState" : "pushState";
  window.history[method]({ bedrockRoute: true }, "", nextPath);
}

function getAnalyticsUserId(user) {
  if (!user) return "";

  return String(
    user.backendId ||
      user.id ||
      user.uuid ||
      user.firebaseUid ||
      "",
  ).trim();
}

function getAnalyticsUserName(user) {
  if (!user) return "";

  return (
    user.name ||
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    ""
  );
}

function getAnalyticsUserEmail(user) {
  if (!user) return "";

  return user.email || "";
}

const fallbackRequestItems = [
  {
    id: "quick-request",
    title: "Quick Request",
    description: "Send a quick service request to Bedrock support.",
    category: "request",
    tags: ["Request"],
    price: 0,
    isAvailable: true,
  },
  {
    id: "chauffeur-service",
    title: "Chauffeur Service",
    description: "Request a chauffeur for pickup, drop-off, or movement.",
    category: "chauffeur",
    tags: ["Chauffeur"],
    price: 0,
    isAvailable: true,
  },
  {
    id: "bureau-de-change",
    title: "Bureau De Change",
    description: "Request exchange support and view current rates.",
    category: "exchange",
    tags: ["Exchange"],
    price: 0,
    isAvailable: true,
  },
];

function sanitizeStoredAccount(account) {
  if (!account) return null;

  const safeAccount = { ...account };
  delete safeAccount.password;

  return safeAccount;
}

function readStoredAccount() {
  try {
    const storedAccount = sanitizeStoredAccount(
      JSON.parse(localStorage.getItem(ACCOUNT_STORAGE_KEY) || "null"),
    );

    if (!storedAccount || !Array.isArray(storedAccount.orders)) {
      return storedAccount;
    }

    return {
      ...storedAccount,
      orders: applyCancelledOrderOverrides(
        storedAccount.orders,
        storedAccount,
      ),
    };
  } catch {
    return null;
  }
}

function saveStoredAccount(nextUser) {
  const safeUser = sanitizeStoredAccount(nextUser);

  if (!safeUser) return;

  localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(safeUser));
}

function clearStoredSession() {
  clearAuthToken();
  localStorage.removeItem(ACCOUNT_STORAGE_KEY);
  resetMixpanel();
}

function getUserOrderScope(user = {}) {
  return String(
    user.backendId || user.id || user.email || user.firebaseUid || "anonymous",
  )
    .trim()
    .toLowerCase();
}

function readCancelledOrderStore() {
  if (typeof window === "undefined") return {};

  try {
    const parsedStore = JSON.parse(
      window.localStorage.getItem(CANCELLED_ORDERS_STORAGE_KEY) || "{}",
    );

    return parsedStore && typeof parsedStore === "object" ? parsedStore : {};
  } catch {
    return {};
  }
}

function writeCancelledOrderStore(store) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    CANCELLED_ORDERS_STORAGE_KEY,
    JSON.stringify(store),
  );
}

function getOrderCancellationKeys(order = {}) {
  const raw = order.raw || {};

  return [
    order.backendId,
    order.id,
    order.reference,
    order.orderReference,
    order.orderNo,
    order.paymentReference,
    raw.id,
    raw.uuid,
    raw.reference,
    raw.order_reference,
    raw.orderReference,
    raw.order_no,
    raw.orderNo,
    raw.order_number,
    raw.orderNumber,
    raw.payment_reference,
    raw.paymentReference,
  ]
    .filter(Boolean)
    .map((value) => String(value));
}

function saveCancelledOrderOverride(user, order) {
  const keys = getOrderCancellationKeys(order);

  if (!keys.length) return;

  const store = readCancelledOrderStore();
  const scope = getUserOrderScope(user);
  const scopedStore = store[scope] || {};
  const override = {
    id: order.id,
    backendId: order.backendId,
    orderType: order.orderType,
    paymentReference: order.paymentReference,
    raw: order.raw,
    status: "cancelled",
    cancelledAt: order.cancelledAt || new Date().toISOString(),
  };

  keys.forEach((key) => {
    scopedStore[key] = override;
  });

  store[scope] = scopedStore;
  writeCancelledOrderStore(store);
}

function applyCancelledOrderOverrides(orders = [], user = {}) {
  if (!Array.isArray(orders) || orders.length === 0) return orders;

  const store = readCancelledOrderStore();
  const scopedStore = store[getUserOrderScope(user)] || {};

  return orders.map((order) => {
    const override = getOrderCancellationKeys(order)
      .map((key) => scopedStore[key])
      .find(Boolean);

    return override
      ? {
          ...order,
          ...override,
          status: "cancelled",
        }
      : order;
  });
}

function readPendingPaymentContext() {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(
      window.localStorage.getItem(PAYMENT_CONTEXT_STORAGE_KEY) || "null",
    );
  } catch {
    return null;
  }
}

function savePendingPaymentContext(context) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    PAYMENT_CONTEXT_STORAGE_KEY,
    JSON.stringify({
      ...context,
      createdAt: new Date().toISOString(),
    }),
  );
}

function clearPendingPaymentContext() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(PAYMENT_CONTEXT_STORAGE_KEY);
}

function readPaymentConfirmation() {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(
      window.sessionStorage.getItem(PAYMENT_CONFIRMATION_STORAGE_KEY) ||
        "null",
    );
  } catch {
    return null;
  }
}

function savePaymentConfirmation(confirmation) {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(
    PAYMENT_CONFIRMATION_STORAGE_KEY,
    JSON.stringify({
      ...confirmation,
      createdAt: new Date().toISOString(),
    }),
  );
}

function clearPaymentConfirmation() {
  if (typeof window === "undefined") return;

  window.sessionStorage.removeItem(PAYMENT_CONFIRMATION_STORAGE_KEY);
}

function getTrackedPurchaseReferences() {
  if (typeof window === "undefined") return [];

  try {
    const references = JSON.parse(
      window.localStorage.getItem(TRACKED_PURCHASE_REFERENCES_STORAGE_KEY) ||
        "[]",
    );

    return Array.isArray(references) ? references.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function hasTrackedPurchaseReference(reference) {
  if (!reference) return false;

  return getTrackedPurchaseReferences().includes(reference);
}

function rememberTrackedPurchaseReference(reference) {
  if (typeof window === "undefined" || !reference) return;

  const references = [
    reference,
    ...getTrackedPurchaseReferences().filter((item) => item !== reference),
  ].slice(0, 50);

  window.localStorage.setItem(
    TRACKED_PURCHASE_REFERENCES_STORAGE_KEY,
    JSON.stringify(references),
  );
}

function trackPurchaseOnce(reference, amountPaid) {
  if (!reference || hasTrackedPurchaseReference(reference)) return false;

  trackPixel("Purchase", {
    value: Number(amountPaid || 0),
    currency: "NGN",
    transaction_id: reference,
  });
  rememberTrackedPurchaseReference(reference);

  return true;
}

function getReturnedPaymentReference() {
  if (typeof window === "undefined") return "";

  const params = new URLSearchParams(window.location.search);

  return (
    PAYMENT_REFERENCE_QUERY_KEYS.map((key) => params.get(key)).find(Boolean) ||
    ""
  );
}

function clearPaymentReturnParams() {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);

  PAYMENT_REFERENCE_QUERY_KEYS.forEach((key) => url.searchParams.delete(key));
  url.searchParams.delete("status");
  url.searchParams.delete("transaction_id");

  window.history.replaceState(
    {},
    document.title,
    `${url.pathname}${url.search}${url.hash}`,
  );
}

// Pull the amount the backend/Paystack actually charged out of the verify
// response so the Meta Pixel Purchase value reflects reality (e.g. after a
// server-side coupon or fee recalculation) instead of the price the frontend
// estimated. Falls back to the frontend total when the response has no usable
// amount, so this can never regress the previous behaviour.
function resolveVerifiedChargeAmount(verifyResponse, fallbackAmount) {
  const raw = extractObject(verifyResponse);
  const nested =
    raw.data ||
    raw.payment ||
    raw.transaction ||
    raw.paystack ||
    raw.data?.payment ||
    {};
  const fallback = Number(fallbackAmount) || 0;

  const candidates = [
    raw.amount_paid,
    raw.amountPaid,
    raw.total_amount,
    raw.totalAmount,
    raw.payable_amount,
    raw.amount,
    nested.amount_paid,
    nested.amountPaid,
    nested.total_amount,
    nested.amount,
  ]
    .map(Number)
    .filter((value) => Number.isFinite(value) && value > 0);

  if (candidates.length === 0) {
    return fallback;
  }

  const value = candidates[0];

  // Paystack returns amounts in kobo (naira * 100). When we have the frontend
  // estimate, decide kobo vs naira by whichever interpretation is closer to it.
  if (fallback > 0) {
    const looksLikeKobo =
      Math.abs(value - fallback * 100) < Math.abs(value - fallback);

    return looksLikeKobo ? value / 100 : value;
  }

  // No estimate to compare against: Paystack always settles in kobo, so treat a
  // whole-number value as kobo.
  return Number.isInteger(value) ? value / 100 : value;
}

async function verifyPaymentReference(context, reference) {
  const orderType = getPaymentOrderType(context?.type);

  if (context?.recordId && orderType !== "booking") {
    let lastError;

    try {
      if (orderType === "food") {
        return await foodApi.verifyFoodPayment(context.recordId, reference);
      }

      if (orderType === "shop") {
        return await shopApi.verifyShopPayment(context.recordId, reference);
      }

      if (orderType === "service") {
        return await servicesApi.verifyServicePayment(
          context.recordId,
          reference,
        );
      }
    } catch (error) {
      lastError = error;
      logFrontendError("Order-specific payment verification failed", error);
    }

    try {
      return await paymentsApi.verifyPayment(reference);
    } catch (error) {
      logFrontendError("Shared payment verification failed", error);
      throw lastError || error;
    }
  }

  return bookingsApi.verifyPayment(reference);
}

function getShopVariant(shopId) {
  if (shopId === "foods") return "food";
  if (shopId === "shop" || shopId === "toiletries") return "toiletries";
  if (shopId === "services") return "services";
  if (shopId === "request" || shopId === "requests") return "requests";
  return null;
}

function getPaymentOrderType(variant) {
  if (variant === "food") return "food";
  if (variant === "toiletries" || variant === "shop") return "shop";
  if (variant === "services" || variant === "service") return "service";
  if (variant === "booking") return "booking";
  return variant || "order";
}

function getPaymentPrefixForOrderType(orderType) {
  const prefixes = {
    food: "TXN_FOOD",
    shop: "TXN_SHOP",
    service: "TXN_SVC",
    booking: "TXN_BOOKING",
  };

  return prefixes[orderType] || "TXN_ORDER";
}

function isMissingRouteError(error) {
  const message = String(error?.message || "").toLowerCase();

  return message.includes("route") || message.includes("could not be found");
}

function toBackendFilterId(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeBackendFilterItem(item = {}, index = 0, fallbackLabel = "All") {
  const label =
    item.name ||
    item.title ||
    item.label ||
    item.slug ||
    item.id ||
    `${fallbackLabel} ${index + 1}`;
  const rawValue = item.value ?? item.slug ?? item.id ?? label;
  const isAllFilter =
    String(item.id || "").toLowerCase() === "all" ||
    String(rawValue || "").toLowerCase() === "all" ||
    /^all\b/i.test(String(label));
  const id = isAllFilter ? "all" : toBackendFilterId(rawValue || label);

  return {
    id,
    label: isAllFilter ? fallbackLabel : label,
  };
}

function normalizeBackendFilters(response, fallbackLabel = "All") {
  const filters = extractCollection(response)
    .map((item, index) => normalizeBackendFilterItem(item, index, fallbackLabel))
    .filter((filter) => filter.id && filter.label);
  const seen = new Set();
  const uniqueFilters = filters.filter((filter) => {
    if (seen.has(filter.id)) return false;

    seen.add(filter.id);
    return true;
  });

  if (!uniqueFilters.some((filter) => filter.id === "all")) {
    uniqueFilters.unshift({ id: "all", label: fallbackLabel });
  }

  return [
    ...uniqueFilters.filter((filter) => filter.id === "all"),
    ...uniqueFilters.filter((filter) => filter.id !== "all"),
  ];
}

function buildShopCategoriesWithBackendImages(
  categories,
  backendItemsByVariant = {},
) {
  return categories.map((category) => {
    const variant = getShopVariant(category.id);
    const image =
      backendItemsByVariant[variant]?.find((item) => item.image)?.image || "";

    return {
      ...category,
      image,
    };
  });
}

function getPaymentMethodForBackend(paymentMethod) {
  // The current Postman collection documents Paystack for booking/shop payments.
  // Keep the backend payload on the supported value until bank transfer is exposed.
  const supportedPaymentMethods = {
    card: "paystack",
    bank: "paystack",
  };

  return supportedPaymentMethods[paymentMethod] || "paystack";
}

function makePaymentReference(prefix = "TXN") {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `${prefix}_${Date.now()}_${suffix}`;
}

async function initializeOrderPayment({
  payOrder,
  orderId,
  orderType,
  paymentMethod,
  reference,
}) {
  try {
    return await payOrder(orderId, { paymentMethod, reference });
  } catch (error) {
    if (!isMissingRouteError(error)) {
      throw error;
    }

    return paymentsApi.initializePayment({
      orderType,
      orderId,
      paymentMethod,
    });
  }
}

function getBackendRecordId(record) {
  return record?.backendId || record?.id || "";
}

function getApartmentGuestCapacity(apartment) {
  return Number(
    apartment?.guests ||
      apartment?.maxGuests ||
      apartment?.max_guests ||
      apartment?.guestCapacity ||
      apartment?.guest_capacity ||
      0,
  );
}

function getBookingIdentity(booking = {}) {
  return (
    booking.backendId ||
    booking.id ||
    booking.paymentReference ||
    booking.reference ||
    ""
  );
}

function upsertBooking(bookings = [], nextBooking = {}) {
  const nextIdentity = getBookingIdentity(nextBooking);

  if (!nextIdentity) {
    return [nextBooking, ...bookings];
  }

  const existingIndex = bookings.findIndex(
    (booking) => getBookingIdentity(booking) === nextIdentity,
  );

  if (existingIndex === -1) {
    return [nextBooking, ...bookings];
  }

  return bookings.map((booking, index) =>
    index === existingIndex ? { ...booking, ...nextBooking } : booking,
  );
}

function getOrderTypeForBackend(order = {}) {
  const value = String(
    order.orderType || order.type || order.category || order.variant || "",
  ).toLowerCase();

  if (value.includes("food")) return "food";
  if (
    value.includes("shop") ||
    value.includes("toiletr") ||
    value.includes("product")
  ) {
    return "shop";
  }
  if (value.includes("service")) return "service";

  return getPaymentOrderType(value);
}

function getActiveBackendBookingId(user) {
  const bookings = Array.isArray(user?.bookings) ? user.bookings : [];
  const activeBooking =
    bookings.find(
      (booking) => booking.backendId && booking.status !== "cancelled",
    ) || bookings.find((booking) => booking.backendId);

  return getBackendRecordId(activeBooking);
}

function getApartmentTypeLabel(apartment) {
  const bedrooms = Number(apartment?.bedrooms || 0);

  if (bedrooms > 0) {
    return `${bedrooms} Bedroom Apartment`;
  }

  return apartment?.title || "Apartment";
}

function getBedroomCountFromText(value) {
  const text = String(value || "").toLowerCase();
  const numericMatch = text.match(/(\d+)\s*(bed|bedroom)/);

  if (numericMatch) return Number(numericMatch[1]);

  const wordMatch = text.match(
    /\b(one|two|three|four|five|six)\s*(bed|bedroom)\b/,
  );
  const wordToNumber = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
  };

  return wordMatch ? wordToNumber[wordMatch[1]] : null;
}

function attachApartmentTypesToResidences(residences = [], sections = []) {
  return residences.map((residence) => {
    const matchingSection = sections.find(
      (section) => section.residenceId === residence.id,
    );
    const apartmentTypes =
      matchingSection?.items?.map(getApartmentTypeLabel).filter(Boolean) || [];

    return {
      ...residence,
      apartments: [...new Set(apartmentTypes)],
    };
  });
}

function splitProfileName(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ");

  return { firstName, lastName };
}

function getProfileGuestName(user = {}) {
  return String(
    user?.fullName ||
      user?.name ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      user?.username ||
      "",
  ).trim();
}

function getProfileGuestPhone(user = {}) {
  return String(
    user?.phone ||
      user?.phoneNumber ||
      user?.phone_number ||
      user?.mobile ||
      "",
  ).trim();
}

function getPhoneDigitCount(value) {
  return String(value || "").replace(/\D/g, "").length;
}

function isUnauthenticatedError(error) {
  const message = String(error?.message || "").toLowerCase();
  const dataMessage =
    typeof error?.data === "string"
      ? error.data.toLowerCase()
      : JSON.stringify(error?.data || {}).toLowerCase();

  return (
    error?.status === 401 ||
    message.includes("unauthenticated") ||
    message.includes("unauthorized") ||
    dataMessage.includes("unauthenticated") ||
    dataMessage.includes("unauthorized")
  );
}

function isServerError(error) {
  return error?.status >= 500;
}

async function fetchBackendUserCollections(baseUser) {
  if (!baseUser || !getAuthToken()) {
    return baseUser;
  }

  const [bookingsResult, ordersResult, favoritesResult] =
    await Promise.allSettled([
      bookingsApi.getBookings({ perPage: 30 }),
      ordersApi.getAllOrders({ perPage: 30 }),
      favoritesApi.getFavorites(),
    ]);
  const nextUser = { ...baseUser };

  if (bookingsResult.status === "fulfilled") {
    nextUser.bookings = extractCollection(bookingsResult.value).map((booking) =>
      normalizeBackendBooking(booking),
    );
  }

  if (ordersResult.status === "fulfilled") {
    const backendOrders = extractCollection(ordersResult.value).map((order) =>
      normalizeBackendOrder(order),
    );

    nextUser.orders = applyCancelledOrderOverrides(backendOrders, nextUser);
  }

  if (favoritesResult.status === "fulfilled") {
    nextUser.wishlists = extractCollection(favoritesResult.value)
      .filter((favorite) => {
        const item = extractObject(favorite);

        return Boolean(
          item.apartment ||
            item.apartment_details ||
            item.apartment_id ||
            item.apartmentId ||
            item.property ||
            item.residence ||
            item.residence_name ||
            item.price_per_night ||
            item.nightly_rate ||
            item.bedrooms,
        );
      })
      .map((favorite, index) => normalizeBackendFavorite(favorite, index));
  }

  return nextUser;
}

async function resolveBackendAgentVerification(baseUser) {
  if (!baseUser || !getAuthToken() || !isAgentUser(baseUser)) {
    return baseUser;
  }

  try {
    const statusResponse = await authApi.getOnboardingStatus();

    return mergeAgentVerificationStatus(baseUser, statusResponse);
  } catch (error) {
    logFrontendError("Unable to confirm agent verification status", error);

    if (!isAgentPendingVerification(baseUser)) {
      return baseUser;
    }

    return {
      ...baseUser,
      isAgent: true,
      agentStatus: baseUser.agentStatus || "pending",
      isAgentVerified: false,
    };
  }
}

function createDefaultBookingDetails() {
  return {
    guestName: "",
    guestPhone: "",
    useProfileAsGuest: false,
    checkIn: "",
    checkOut: "",
    guests: 0,
    promo: "",
    paymentMethod: "card",
    agreedToPolicy: false,
    useRockPoints: false,
  };
}

function createBookingDetailsFromFilters(filters) {
  const defaultDetails = createDefaultBookingDetails();
  const checkIn = filters.checkIn || "";
  const checkOut = filters.checkOut
    ? ensureCheckoutDate(checkIn, filters.checkOut)
    : "";

  return {
    ...defaultDetails,
    checkIn,
    checkOut,
    guests: filters.guests > 0 ? filters.guests : defaultDetails.guests,
  };
}

function ShopDirectoryPage({ categories = [], onBack, onShopSelect }) {
  const directoryCategories = categories.length ? categories : shopCategories;

  return (
    <section className="shop-directory-page">
      <div className="shop-directory-page__top">
        <button
          type="button"
          className="shop-directory-page__back"
          onClick={onBack}
          aria-label="Go back"
        >
          <FiChevronLeft />
          <span>Back</span>
        </button>

        <span className="shop-directory-page__icon" aria-hidden="true">
          <FiShoppingBag />
        </span>
      </div>

      <div className="shop-directory-page__heading">
        <h1>Shop</h1>
        <p>Choose what you need for your stay.</p>
      </div>

      <div className="shop-directory-page__list">
        {directoryCategories.length > 0 ? (
          directoryCategories.map((item) => (
            <button
              type="button"
              className="shop-directory-card"
              onClick={() => onShopSelect?.(item.id)}
              key={item.id}
            >
              <AppImage
                className="shop-directory-card__image"
                src={item.image}
                fallbackSrc=""
                alt={`${item.title} shop category`}
              />

              <span>
                <strong>{item.title}</strong>
                <em>
                  <FiMapPin />
                  {item.location}
                </em>
              </span>
            </button>
          ))
        ) : (
          <div className="shop-directory-empty">
            <strong>No shop categories yet</strong>
            <p>Available shops will appear here when they are added.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function HomePage() {
  const lastIdentifiedAnalyticsIdRef = useRef("");
  const trackedPurchaseReferenceRef = useRef("");
  const routeSyncReadyRef = useRef(false);
  const isApplyingBrowserRouteRef = useRef(false);
  const pendingBrowserRouteRef = useRef(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authEntry, setAuthEntry] = useState("login");
  const [authModalKey, setAuthModalKey] = useState(0);
  const [currentUser, setCurrentUser] = useState(() => {
    const storedAccount = getAuthToken() ? readStoredAccount() : null;

    return storedAccount && isAgentPendingVerification(storedAccount)
      ? null
      : storedAccount;
  });
  const [activePage, setActivePage] = useState("home");
  const [selectedLegalDocumentId, setSelectedLegalDocumentId] = useState("");
  const [legalReturnPage, setLegalReturnPage] = useState("home");
  const [profileInitialView, setProfileInitialView] = useState("profile");
  const [paymentConfirmation, setPaymentConfirmation] = useState(() =>
    readPaymentConfirmation(),
  );
  const [selectedResidenceId, setSelectedResidenceId] = useState("opebi");
  const [apartmentFilters, setApartmentFilters] = useState(
    defaultApartmentFilters,
  );
  const [searchResetKey, setSearchResetKey] = useState(0);
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [apartmentReturnPage, setApartmentReturnPage] = useState("home");
  const [bookingDetails, setBookingDetails] = useState(() =>
    createDefaultBookingDetails(),
  );
  const [selectedFoodItem, setSelectedFoodItem] = useState(null);
  const [shopVariant, setShopVariant] = useState("food");
  const [foodOrderDetails, setFoodOrderDetails] = useState(() =>
    createDefaultFoodOrderDetails(),
  );
  const [backendListingSections, setBackendListingSections] = useState([]);
  const [defaultListingSections, setDefaultListingSections] = useState([]);
  const [backendResidenceOptions, setBackendResidenceOptions] = useState([]);
  const [backendApartmentCategories, setBackendApartmentCategories] = useState(
    [],
  );
  const [isApartmentsLoading, setIsApartmentsLoading] = useState(true);
  const [apartmentLoadError, setApartmentLoadError] = useState("");
  const [backendShopItems, setBackendShopItems] = useState({});
  const [backendShopFilters, setBackendShopFilters] = useState({});
  const [isShopLoading, setIsShopLoading] = useState(true);
  const [shopLoadError, setShopLoadError] = useState("");
  const [shopLoadErrors, setShopLoadErrors] = useState({});
  const [apartmentQuote, setApartmentQuote] = useState(null);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [profileResources, setProfileResources] = useState({
    notifications: [],
    documents: [],
    legalDocuments: [],
    helpInfo: null,
    referralInfo: null,
    rockPoints: null,
    notificationCount: null,
    orderCounts: null,
  });
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [toasts, setToasts] = useState([]);
  const filteredListingSections = filterListingSections(
    backendListingSections,
    apartmentFilters,
  );
  const selectedApartmentPrice = selectedApartment?.price || 0;
  const selectedApartmentCautionFee = selectedApartment?.cautionFee;
  const shopDirectoryCategories = buildShopCategoriesWithBackendImages(
    shopCategories,
    backendShopItems,
  );
  const hasApartmentFilters = hasActiveApartmentFilters(apartmentFilters);
  const shouldShowSearchBar = ["home", "residence", "shopFood"].includes(
    activePage,
  );
  const profileResourceKey = currentUser?.backendId || currentUser?.email || "";
  const unreadMessageCount = (profileResources.notifications || []).filter(
    (notification) => !notification.read,
  ).length ||
    Number(
      profileResources.notificationCount?.unread ||
        profileResources.notificationCount?.unread_count ||
        profileResources.notificationCount?.count ||
        0,
    );
  const rockPointSummary = getRockPointSummary(profileResources.rockPoints);
  const availableRockPointValue = rockPointSummary.discountValue;
  const canUseRockPoints = availableRockPointValue > 0;
  const shouldUseBookingRockPoints = Boolean(
    bookingDetails.useRockPoints && canUseRockPoints,
  );
  const shouldUseFoodRockPoints = Boolean(
    foodOrderDetails.useRockPoints && canUseRockPoints,
  );
  const currentUserAnalyticsId = getAnalyticsUserId(currentUser);
  const currentUserAnalyticsName = getAnalyticsUserName(currentUser);
  const currentUserAnalyticsEmail = getAnalyticsUserEmail(currentUser);
  const selectedApartmentAnalyticsId =
    selectedApartment?.backendId || selectedApartment?.id || "";
  const selectedApartmentAnalyticsName =
    selectedApartment?.title || selectedApartment?.name || "";
  const selectedResidenceForRoute =
    backendResidenceOptions.find(
      (residence) => residence.id === selectedResidenceId,
    ) ||
    backendListingSections.find(
      (section) => section.residenceId === selectedResidenceId,
    ) ||
    null;

  const identifyAnalyticsUser = useCallback((user, source = "current_user") => {
    const userId = getAnalyticsUserId(user);

    if (!userId) {
      track("User Identify Skipped", {
        reason: "missing_user_id",
        source,
      });
      return;
    }

    const userName = getAnalyticsUserName(user);
    const userEmail = getAnalyticsUserEmail(user);

    identify(userId);
    setUser({
      $name: userName,
      $email: userEmail,
      email: userEmail,
      name: userName,
      userId,
    });

    if (lastIdentifiedAnalyticsIdRef.current !== userId) {
      track("User Identified", {
        email: userEmail,
        name: userName,
        source,
        userId,
      });
      lastIdentifiedAnalyticsIdRef.current = userId;
    }
  }, []);

  useEffect(() => {
    if (!currentUserAnalyticsId) return;

    identifyAnalyticsUser(currentUser, "current_user_effect");
  }, [
    currentUser,
    currentUserAnalyticsEmail,
    currentUserAnalyticsId,
    currentUserAnalyticsName,
    identifyAnalyticsUser,
  ]);

  useEffect(() => {
    trackPageView(activePage, {
      residenceId: activePage === "residence" ? selectedResidenceId : undefined,
      apartmentId:
        activePage === "apartment" ? selectedApartmentAnalyticsId : undefined,
      apartmentName:
        activePage === "apartment" ? selectedApartmentAnalyticsName : undefined,
      legalDocumentId:
        activePage === "legal" ? selectedLegalDocumentId : undefined,
      profileView: activePage === "profile" ? profileInitialView : undefined,
      shopVariant: activePage === "shopFood" ? shopVariant : undefined,
    });
  }, [
    activePage,
    profileInitialView,
    selectedApartmentAnalyticsId,
    selectedApartmentAnalyticsName,
    selectedLegalDocumentId,
    selectedResidenceId,
    shopVariant,
  ]);

  useEffect(() => {
    const legalDocuments = mergeLegalDocuments(profileResources.legalDocuments);
    const selectedLegalDocument = legalDocuments.find(
      (document) => getLegalDocumentKey(document) === selectedLegalDocumentId,
    );
    const path = buildAppPath({
      activePage,
      isAuthModalOpen,
      authEntry,
      selectedResidence: selectedResidenceForRoute,
      selectedResidenceId,
      selectedApartment,
      profileInitialView,
      selectedLegalDocumentId,
      shopVariant,
      selectedFoodItem,
    });

    applySeoMetadata(
      buildSeoMetadata({
        path,
        activePage,
        isAuthModalOpen,
        authEntry,
        selectedApartment,
        selectedResidence: selectedResidenceForRoute,
        selectedLegalDocument,
        selectedFoodItem,
        shopVariant,
        profileInitialView,
        paymentConfirmation,
        faqItems:
          activePage === "home" ||
          (activePage === "profile" && profileInitialView === "help")
            ? bedrockFaqItems
            : [],
      }),
    );
  }, [
    activePage,
    authEntry,
    isAuthModalOpen,
    paymentConfirmation,
    profileInitialView,
    profileResources.legalDocuments,
    selectedApartment,
    selectedFoodItem,
    selectedLegalDocumentId,
    selectedResidenceForRoute,
    selectedResidenceId,
    shopVariant,
  ]);

  useEffect(() => {
    let ignoreProfileResponse = false;
    const hasBackendSession = Boolean(getAuthToken());
    const savedAccount = hasBackendSession ? readStoredAccount() : null;

    if (!hasBackendSession) {
      clearStoredSession();
      return () => {
        ignoreProfileResponse = true;
      };
    }

    if (savedAccount) {
      saveStoredAccount(savedAccount);
    }

    authApi
      .getCurrentUser()
      .then(async (response) => {
        if (ignoreProfileResponse) return;

        const nextUser = normalizeBackendUser(response, savedAccount || {});
        const serverCheckedUser =
          await resolveBackendAgentVerification(nextUser);

        if (ignoreProfileResponse) return;

        if (isAgentPendingVerification(serverCheckedUser)) {
          saveStoredAccount(serverCheckedUser);
          setCurrentUser(null);
          setActivePage("home");
          setProfileInitialView("profile");
          setAuthEntry("agentPending");
          setAuthModalKey((current) => current + 1);
          setIsAuthModalOpen(true);
          return;
        }

        const hydratedUser =
          await fetchBackendUserCollections(serverCheckedUser);

        if (ignoreProfileResponse) return;

        setCurrentUser(hydratedUser);
        saveStoredAccount(hydratedUser);
      })
      .catch((error) => {
        if (ignoreProfileResponse) return;

        if (isUnauthenticatedError(error)) {
          clearStoredSession();
          setCurrentUser(null);
          setActivePage("home");
          setProfileInitialView("profile");
          return;
        }

        logFrontendError("Unable to load current user profile", error);
      });

    return () => {
      ignoreProfileResponse = true;
    };
  }, []);

  useEffect(() => {
    let ignoreApartmentResponse = false;

    async function loadApartments() {
      setIsApartmentsLoading(true);
      setApartmentLoadError("");

      try {
        const [apartmentsResponse, residencesResponse, categoriesResponse] =
          await Promise.all([
            apartmentsApi.getApartments({ perPage: 100 }),
            apartmentsApi.getResidences(),
            apartmentsApi.getBedroomCategories(),
          ]);

        if (ignoreApartmentResponse) return;

        const sections = buildListingSectionsFromApartments(
          extractCollection(apartmentsResponse),
        );
        const residences = extractCollection(residencesResponse).map(
          normalizeBackendResidence,
        );
        const categories = extractCollection(categoriesResponse).map(
          normalizeBackendApartmentCategory,
        );

        setBackendListingSections(sections);
        setDefaultListingSections(sections);
        setBackendResidenceOptions(
          attachApartmentTypesToResidences(residences, sections),
        );
        setBackendApartmentCategories(categories);
      } catch (error) {
        if (ignoreApartmentResponse) return;

        logFrontendError("Unable to load backend apartments", error);
        setBackendListingSections([]);
        setBackendResidenceOptions([]);
        setBackendApartmentCategories([]);
        setApartmentLoadError(
          error.message || "Unable to load apartments from the backend.",
        );
      } finally {
        if (!ignoreApartmentResponse) {
          setIsApartmentsLoading(false);
        }
      }
    }

    loadApartments();

    return () => {
      ignoreApartmentResponse = true;
    };
  }, []);

  useEffect(() => {
    let ignoreShopResponse = false;

    Promise.allSettled([
      foodApi.getMenu(),
      foodApi.getMealTypes(),
      shopApi.getProducts(),
      shopApi.getCategories(),
      servicesApi.getServices(),
      servicesApi.getServiceCategories(),
      requestsApi.getQuickRequestTypes(),
    ]).then(
      ([
        foodResult,
        mealTypesResult,
        shopResult,
        shopCategoriesResult,
        servicesResult,
        serviceCategoriesResult,
        requestsResult,
      ]) => {
        if (ignoreShopResponse) return;

        const nextShopItems = {};
        const nextShopErrors = {};
        const nextShopFilters = {};

        if (foodResult.status === "fulfilled") {
          const items = extractCollection(foodResult.value).map((item, index) =>
            normalizeBackendCatalogItem(item, "food", index),
          );

          if (items.length) nextShopItems.food = items;
          else
            nextShopErrors.food =
              "No food items were returned from the backend.";
        } else {
          nextShopErrors.food =
            foodResult.reason?.message || "Unable to load food menu.";
        }

        if (mealTypesResult.status === "fulfilled") {
          nextShopFilters.food = normalizeBackendFilters(
            mealTypesResult.value,
            "All Menu",
          );
        }

        if (shopResult.status === "fulfilled") {
          const items = extractCollection(shopResult.value).map((item, index) =>
            normalizeBackendCatalogItem(item, "toiletries", index),
          );

          if (items.length) nextShopItems.toiletries = items;
          else nextShopErrors.toiletries = "No shop products were returned.";
        } else {
          nextShopErrors.toiletries =
            shopResult.reason?.message || "Unable to load shop products.";
        }

        if (shopCategoriesResult.status === "fulfilled") {
          nextShopFilters.toiletries = normalizeBackendFilters(
            shopCategoriesResult.value,
            "All Items",
          );
        }

        if (servicesResult.status === "fulfilled") {
          const items = extractCollection(servicesResult.value).map(
            (item, index) =>
              normalizeBackendCatalogItem(item, "services", index),
          );

          if (items.length) nextShopItems.services = items;
          else nextShopErrors.services = "No services were returned.";
        } else {
          nextShopErrors.services =
            servicesResult.reason?.message || "Unable to load services.";
        }

        if (serviceCategoriesResult.status === "fulfilled") {
          nextShopFilters.services = normalizeBackendFilters(
            serviceCategoriesResult.value,
            "All Services",
          );
        }

        if (requestsResult.status === "fulfilled") {
          const items = extractCollection(requestsResult.value).map(
            (item, index) =>
              normalizeBackendCatalogItem(item, "requests", index),
          );

          nextShopItems.requests = items.length
            ? items
            : fallbackRequestItems.map((item, index) =>
                normalizeBackendCatalogItem(item, "requests", index),
              );

          if (!items.length) {
            nextShopErrors.requests =
              "Request types were not returned, so the available request actions are shown from the documented API flows.";
          }
        } else {
          nextShopItems.requests = fallbackRequestItems.map((item, index) =>
            normalizeBackendCatalogItem(item, "requests", index),
          );
          nextShopErrors.requests =
            requestsResult.reason?.message ||
            "Unable to load request types, so the available request actions are shown from the documented API flows.";
        }

        if (Object.keys(nextShopItems).length) {
          setBackendShopItems(nextShopItems);
          setShopLoadError("");
        } else {
          setBackendShopItems({});
          setShopLoadError("No shop items were returned from the backend.");
        }

        setBackendShopFilters(nextShopFilters);
        setShopLoadErrors(nextShopErrors);
        setIsShopLoading(false);
      },
    )
      .catch((error) => {
        if (ignoreShopResponse) return;

        logFrontendError("Unable to load backend shop items", error);
        setBackendShopItems({});
        setBackendShopFilters({});
        setShopLoadError(
          error.message || "Unable to load shop items from the backend.",
        );
        setShopLoadErrors({});
        setIsShopLoading(false);
      });

    return () => {
      ignoreShopResponse = true;
    };
  }, []);

  useEffect(() => {
    let ignorePublicResourceResponse = false;

    Promise.allSettled([
      profileApi.getLegalDocuments(),
      profileApi.getHelpInfo(),
    ]).then(([legalResult, helpResult]) => {
      if (ignorePublicResourceResponse) return;

      setProfileResources((current) => ({
        ...current,
        legalDocuments:
          legalResult.status === "fulfilled"
            ? extractLegalDocuments(legalResult.value).map(
                normalizeBackendLegalItem,
              )
            : current.legalDocuments,
        helpInfo:
          helpResult.status === "fulfilled"
            ? extractObject(helpResult.value)
            : current.helpInfo,
      }));
    });

    return () => {
      ignorePublicResourceResponse = true;
    };
  }, []);

  useEffect(() => {
    if (!profileResourceKey || !getAuthToken()) return undefined;

    let ignoreResourceResponse = false;

    Promise.allSettled([
      profileApi.getNotifications({ perPage: 20 }),
      profileApi.getNotificationsCount(),
      profileApi.getDocuments(),
      profileApi.getLegalDocuments(),
      profileApi.getHelpInfo(),
      profileApi.getReferralInfo(),
      profileApi.getRockPoints(),
      ordersApi.getOrderCounts(),
    ]).then(
      ([
        notificationsResult,
        notificationsCountResult,
        documentsResult,
        legalResult,
        helpResult,
        referralResult,
        rockPointsResult,
        orderCountsResult,
      ]) => {
        if (ignoreResourceResponse) return;

        setProfileResources((current) => ({
          ...current,
          notifications:
            notificationsResult.status === "fulfilled"
              ? extractCollection(notificationsResult.value).map(
                  normalizeBackendNotification,
                )
              : current.notifications,
          notificationCount:
            notificationsCountResult.status === "fulfilled"
              ? extractObject(notificationsCountResult.value)
              : current.notificationCount,
          documents:
            documentsResult.status === "fulfilled"
              ? extractCollection(documentsResult.value).map(
                  normalizeBackendDocument,
                )
              : current.documents,
          legalDocuments:
            legalResult.status === "fulfilled"
              ? extractLegalDocuments(legalResult.value).map(
                  normalizeBackendLegalItem,
                )
              : current.legalDocuments,
          helpInfo:
            helpResult.status === "fulfilled"
              ? extractObject(helpResult.value)
              : current.helpInfo,
          referralInfo:
            referralResult.status === "fulfilled"
              ? extractObject(referralResult.value)
              : current.referralInfo,
          rockPoints:
            rockPointsResult.status === "fulfilled"
              ? extractObject(rockPointsResult.value)
              : current.rockPoints,
          orderCounts:
            orderCountsResult.status === "fulfilled"
              ? extractObject(orderCountsResult.value)
              : current.orderCounts,
        }));
      },
    );

    return () => {
      ignoreResourceResponse = true;
    };
  }, [profileResourceKey]);

  useEffect(() => {
    if (
      !selectedApartment?.backendId ||
      !bookingDetails.checkIn ||
      !bookingDetails.checkOut
    ) {
      return undefined;
    }

    let ignoreQuoteResponse = false;
    const couponCode = String(bookingDetails.promo || "").trim();

    // Debounce so typing a promo code (or nudging guests) fires a single
    // calculate-pricing request once input settles instead of one per keystroke.
    const quoteTimerId = setTimeout(() => {
      Promise.allSettled([
        apartmentsApi.checkAvailability({
          apartmentId: selectedApartment.backendId,
          checkIn: bookingDetails.checkIn,
          checkOut: bookingDetails.checkOut,
        }),
        apartmentsApi.calculatePricing({
          apartmentId: selectedApartment.backendId,
          checkIn: bookingDetails.checkIn,
          checkOut: bookingDetails.checkOut,
          guests: bookingDetails.guests,
          couponCode,
        }),
      ]).then(([availabilityResult, pricingResult]) => {
        if (ignoreQuoteResponse) return;

        const fallbackPricing = calculateBookingTotals(
          selectedApartmentPrice,
          bookingDetails.checkIn,
          bookingDetails.checkOut,
          shouldUseBookingRockPoints,
          {
            cautionFee: selectedApartmentCautionFee,
            availableRockPointValue,
            rockPointValue: availableRockPointValue,
            useRockPoints: shouldUseBookingRockPoints,
          },
        );

        setApartmentQuote({
          loading: false,
          available:
            availabilityResult.status === "fulfilled"
              ? normalizeBackendAvailability(availabilityResult.value)
              : true,
          pricing:
            pricingResult.status === "fulfilled"
              ? normalizeBackendPricing(pricingResult.value, fallbackPricing)
              : fallbackPricing,
          error:
            pricingResult.status === "rejected" && couponCode
              ? "This coupon could not be applied. Please check the code or continue without it."
              : availabilityResult.status === "rejected" &&
                  pricingResult.status === "rejected"
              ? "Could not refresh live availability and pricing."
              : "",
        });
      });
    }, 450);

    return () => {
      ignoreQuoteResponse = true;
      clearTimeout(quoteTimerId);
    };
  }, [
    selectedApartment?.backendId,
    selectedApartmentPrice,
    selectedApartmentCautionFee,
    bookingDetails.checkIn,
    bookingDetails.checkOut,
    bookingDetails.guests,
    bookingDetails.promo,
    shouldUseBookingRockPoints,
    availableRockPointValue,
  ]);

  async function refreshProfileResources({ silent = false, ignore } = {}) {
    if (!getAuthToken()) return;

    const [
      notificationsResult,
      notificationsCountResult,
      documentsResult,
      legalResult,
      helpResult,
      referralResult,
      rockPointsResult,
      orderCountsResult,
    ] = await Promise.allSettled([
      profileApi.getNotifications({ perPage: 20 }),
      profileApi.getNotificationsCount(),
      profileApi.getDocuments(),
      profileApi.getLegalDocuments(),
      profileApi.getHelpInfo(),
      profileApi.getReferralInfo(),
      profileApi.getRockPoints(),
      ordersApi.getOrderCounts(),
    ]);

    if (ignore?.()) return;

    setProfileResources((current) => ({
      ...current,
      notifications:
        notificationsResult.status === "fulfilled"
          ? extractCollection(notificationsResult.value).map(
              normalizeBackendNotification,
            )
          : current.notifications,
      notificationCount:
        notificationsCountResult.status === "fulfilled"
          ? extractObject(notificationsCountResult.value)
          : current.notificationCount,
      documents:
        documentsResult.status === "fulfilled"
          ? extractCollection(documentsResult.value).map(
              normalizeBackendDocument,
            )
          : current.documents,
      legalDocuments:
        legalResult.status === "fulfilled"
          ? extractLegalDocuments(legalResult.value).map(
              normalizeBackendLegalItem,
            )
          : current.legalDocuments,
      helpInfo:
        helpResult.status === "fulfilled"
          ? extractObject(helpResult.value)
          : current.helpInfo,
      referralInfo:
        referralResult.status === "fulfilled"
          ? extractObject(referralResult.value)
          : current.referralInfo,
      rockPoints:
        rockPointsResult.status === "fulfilled"
          ? extractObject(rockPointsResult.value)
          : current.rockPoints,
      orderCounts:
        orderCountsResult.status === "fulfilled"
          ? extractObject(orderCountsResult.value)
          : current.orderCounts,
    }));

    if (!silent) {
      showToast("Profile data refreshed.", "success");
    }
  }

  function showToast(message, type = "success") {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setToasts((currentToasts) => [
      ...currentToasts.slice(-2),
      { id, message, type },
    ]);
  }

  function dismissToast(toastId) {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== toastId),
    );
  }

  const updateCurrentUser = useCallback((nextUserOrUpdater) => {
    setCurrentUser((currentUserValue) => {
      const nextUser =
        typeof nextUserOrUpdater === "function"
          ? nextUserOrUpdater(currentUserValue)
          : nextUserOrUpdater;

      if (nextUser) {
        const savedAccount = readStoredAccount();
        const nextUserWithOverrides = Array.isArray(nextUser.orders)
          ? {
              ...nextUser,
              orders: applyCancelledOrderOverrides(nextUser.orders, nextUser),
            }
          : nextUser;

        saveStoredAccount({
          ...(savedAccount || {}),
          ...nextUserWithOverrides,
        });

        return nextUserWithOverrides;
      }

      return nextUser;
    });
  }, []);

  const addActivityMessage = useCallback(
    (title, message) => {
      const nextMessage = {
        id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title,
        message,
        read: false,
        createdAt: new Date().toISOString(),
      };

      setProfileResources((current) => ({
        ...current,
        notifications: [nextMessage, ...(current.notifications || [])],
      }));

      updateCurrentUser((current) => {
        if (!current) return current;

        return {
          ...current,
          messages: [nextMessage, ...(current.messages || [])],
          messageCount: Number(current.messageCount || 0) + 1,
        };
      });
    },
    [updateCurrentUser],
  );

  useEffect(() => {
    const returnedReference = getReturnedPaymentReference();

    if (!returnedReference || !getAuthToken() || !currentUser) {
      return undefined;
    }

    let ignorePaymentResponse = false;

    async function verifyReturnedPayment() {
      const paymentContext = readPendingPaymentContext();

      try {
        const verifyResponse = await verifyPaymentReference(
          paymentContext,
          returnedReference,
        );

        if (ignorePaymentResponse) return;

        // Prefer the amount the backend actually charged; fall back to the
        // frontend estimate stored in the payment context.
        const amountPaid = resolveVerifiedChargeAmount(
          verifyResponse,
          paymentContext?.amount,
        );
        const isBooking = paymentContext?.type === "booking";

        // Fire Purchase exactly once, only after backend verification has
        // succeeded. The ref guard blocks React StrictMode double-invoke and
        // localStorage blocks duplicate Paystack callbacks for the same
        // reference after a refresh or copied return link.
        if (trackedPurchaseReferenceRef.current !== returnedReference) {
          trackedPurchaseReferenceRef.current = returnedReference;
          trackPurchaseOnce(returnedReference, amountPaid);
        }

        clearPendingPaymentContext();
        clearPaymentReturnParams();

        const hydratedUser = await fetchBackendUserCollections(currentUser);
        const paidBookingOverride =
          isBooking && paymentContext?.recordId
            ? {
                backendId: paymentContext.recordId,
                id: paymentContext.reference || returnedReference,
                paymentReference: returnedReference,
                title: paymentContext?.title || "",
                image: paymentContext?.image || "",
                location: paymentContext?.location || "",
                checkIn: paymentContext?.checkIn || "",
                checkOut: paymentContext?.checkOut || "",
                guests: Number(paymentContext?.guests || 0) || 1,
                totalAmount: amountPaid,
                status: "confirmed",
                bookingStatus: "confirmed",
                paymentStatus: "paid",
                paidAt: new Date().toISOString(),
                confirmedAt: new Date().toISOString(),
                isIncomplete: false,
              }
            : null;

        if (ignorePaymentResponse) return;

        updateCurrentUser(
          paidBookingOverride
            ? {
                ...hydratedUser,
                bookings: upsertBooking(
                  hydratedUser.bookings || currentUser.bookings || [],
                  paidBookingOverride,
                ),
              }
            : hydratedUser,
        );
        addActivityMessage(
          "Payment verified",
          "Your payment was verified successfully and your profile has been refreshed.",
        );
        setProfileInitialView(isBooking ? "bookings" : "orders");
        showToast("Payment verified successfully.", "success");

        // Bookings land on a dedicated success screen (built from the payment
        // context, since the Paystack return is a full reload). Orders keep the
        // existing profile-list behaviour.
        if (isBooking) {
          const confirmation = {
            amount: amountPaid,
            reference: returnedReference,
            title: paymentContext?.title || "",
            image: paymentContext?.image || "",
            location: paymentContext?.location || "",
            checkIn: paymentContext?.checkIn || "",
            checkOut: paymentContext?.checkOut || "",
            guests: Number(paymentContext?.guests || 0),
          };

          savePaymentConfirmation(confirmation);
          setPaymentConfirmation(confirmation);
          setActivePage("paymentSuccess");
          writeBrowserRoute(PAYMENT_SUCCESS_PATH, { replace: true });
        } else {
          setActivePage("profile");
        }
      } catch (error) {
        if (ignorePaymentResponse) return;

        logFrontendError("Payment verification failed", error);
        clearPaymentReturnParams();
        showToast(
          error.message ||
            "Payment returned, but verification failed. Please check your profile shortly.",
          "error",
        );
      }
    }

    verifyReturnedPayment();

    return () => {
      ignorePaymentResponse = true;
    };
  }, [addActivityMessage, currentUser, updateCurrentUser]);

  function openLogin() {
    setAuthEntry("login");
    setAuthModalKey((current) => current + 1);
    setIsAuthModalOpen(true);
  }

  function openSignup() {
    setAuthEntry("signup");
    setAuthModalKey((current) => current + 1);
    setIsAuthModalOpen(true);
  }

  function openAgentSignup() {
    setAuthEntry("agentSignup");
    setAuthModalKey((current) => current + 1);
    setIsAuthModalOpen(true);
  }

  function closeAuthModal() {
    setIsAuthModalOpen(false);
  }

  async function handleAuthComplete(authenticatedUser, options = {}) {
    const serverCheckedUser =
      await resolveBackendAgentVerification(authenticatedUser);

    if (isAgentPendingVerification(serverCheckedUser)) {
      saveStoredAccount(serverCheckedUser);
      setCurrentUser(null);
      setActivePage("home");
      setProfileInitialView("profile");
      setAuthEntry("agentPending");
      setAuthModalKey((current) => current + 1);
      setIsAuthModalOpen(true);
      return;
    }

    identifyAnalyticsUser(serverCheckedUser, "auth_complete");

    if (options.isRegistration) {
      trackPixel("CompleteRegistration", { status: true });
    }

    updateCurrentUser(serverCheckedUser);
    setActivePage("home");
    setIsAuthModalOpen(false);
    showToast("You are signed in.", "success");
    addActivityMessage(
      "Welcome to Bedrock",
      "You are signed in. Booking, order, and service updates will appear here.",
    );

    const hydratedUser = await fetchBackendUserCollections(serverCheckedUser);

    if (hydratedUser !== serverCheckedUser) {
      updateCurrentUser(hydratedUser);
    }
  }

  function getShopItemsForVariant(variant) {
    const backendItems = backendShopItems[variant];

    return Array.isArray(backendItems) ? backendItems : [];
  }

  function getShopFiltersForVariant(variant) {
    const backendFilters = backendShopFilters[variant];

    return Array.isArray(backendFilters) ? backendFilters : [];
  }

  function getShopLoadErrorForVariant(variant) {
    return shopLoadErrors[variant] || shopLoadError;
  }

  function normalizeSearchValue(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function matchesSearchTerms(fields, query) {
    const normalizedQuery = normalizeSearchValue(query);

    if (!normalizedQuery) return false;

    const searchableText = normalizeSearchValue(fields.filter(Boolean).join(" "));
    const queryTerms = normalizedQuery.split(" ").filter(Boolean);

    return queryTerms.every((term) => searchableText.includes(term));
  }

  function findResidenceSearchMatch(query) {
    const normalizedQuery = normalizeSearchValue(query);

    if (!normalizedQuery) return null;

    const sectionMatch = backendListingSections.find((section) =>
      matchesSearchTerms(
        [
          section.residenceId,
          section.id,
          section.title,
          section.location,
          ...(section.items || []).map((item) => item.residenceName),
        ],
        normalizedQuery,
      ),
    );

    if (sectionMatch) {
      return {
        ...sectionMatch,
        id: sectionMatch.residenceId || sectionMatch.id,
      };
    }

    return (
      backendResidenceOptions.find((residence) =>
        matchesSearchTerms(
          [
            residence.id,
            residence.title,
            residence.name,
            residence.location,
            residence.address,
          ],
          normalizedQuery,
        ),
      ) || null
    );
  }

  function resolveResidenceNavigationId(residenceId, residenceLabel = "") {
    const requestedId = String(residenceId || "").trim();
    const requestedLabel = String(residenceLabel || "").trim();

    if (!requestedId && !requestedLabel) return "";

    const hasMatchingSection = backendListingSections.some(
      (section) => section.residenceId === requestedId,
    );
    const hasMatchingResidence = backendResidenceOptions.some(
      (residence) => residence.id === requestedId,
    );

    if (requestedId && hasMatchingSection) {
      return requestedId;
    }

    const matchQueries = [requestedLabel, requestedId]
      .filter(Boolean)
      .filter((value, index, values) => values.indexOf(value) === index);

    for (const query of matchQueries) {
      const residenceMatch = findResidenceSearchMatch(query);

      if (residenceMatch?.id) {
        return residenceMatch.id;
      }
    }

    if (requestedId.startsWith("opebi-")) {
      const hasGenericOpebi =
        backendResidenceOptions.some((residence) => residence.id === "opebi") ||
        backendListingSections.some((section) => section.residenceId === "opebi");

      if (hasGenericOpebi) return "opebi";
    }

    if (requestedId && hasMatchingResidence) {
      return requestedId;
    }

    return requestedId;
  }

  function removeBedroomTermsFromQuery(query) {
    return normalizeSearchValue(query)
      .replace(/\b\d+\s*(bed|bedroom|bedrooms)\b/g, " ")
      .replace(
        /\b(one|two|three|four|five|six)\s*(bed|bedroom|bedrooms)\b/g,
        " ",
      )
      .replace(/\b(apartment|apartments|flat|flats|room|rooms)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getShopIdFromVariant(variant) {
    if (variant === "food") return "foods";
    if (variant === "toiletries") return "shop";
    if (variant === "services") return "services";
    if (variant === "requests") return "request";

    return variant;
  }

  function findShopSearchMatch(query) {
    const normalizedQuery = normalizeSearchValue(query);

    if (!normalizedQuery) return "";

    const categoryMatch = shopDirectoryCategories.find((category) =>
      matchesSearchTerms(
        [category.id, category.title],
        normalizedQuery,
      ),
    );

    if (categoryMatch) return categoryMatch.id;

    const itemMatch = Object.entries(backendShopItems).find(
      ([, items]) =>
        Array.isArray(items) &&
        items.some((item) =>
          matchesSearchTerms(
            [
              item.title,
              item.name,
              item.description,
              item.category,
              ...(Array.isArray(item.tags) ? item.tags : []),
            ],
            normalizedQuery,
          ),
        ),
    );

    return itemMatch ? getShopIdFromVariant(itemMatch[0]) : "";
  }

  function getSearchableApartments() {
    return backendListingSections.flatMap((section) =>
      (section.items || []).map((item) => ({
        ...item,
        sectionTitle: section.title,
        sectionLocation: section.location,
      })),
    );
  }

  function findApartmentSearchMatch(query) {
    const normalizedQuery = normalizeSearchValue(query);

    if (!normalizedQuery || getBedroomCountFromText(normalizedQuery)) {
      return null;
    }

    const apartments = getSearchableApartments();

    return (
      apartments.find((apartment) =>
        [
          apartment.title,
          apartment.name,
          apartment.slug,
          apartment.raw?.name,
          apartment.raw?.title,
        ]
          .map(normalizeSearchValue)
          .filter(Boolean)
          .includes(normalizedQuery),
      ) ||
      apartments.find(
        (apartment) =>
          normalizedQuery.length >= 3 &&
          matchesSearchTerms(
            [
              apartment.title,
              apartment.name,
              apartment.slug,
              apartment.residenceName,
              apartment.sectionTitle,
            ],
            normalizedQuery,
          ),
      ) ||
      null
    );
  }

  function findResidenceRouteMatch(routeKey) {
    if (!routeKey) return null;

    const residenceMatch = backendResidenceOptions.find((residence) =>
      recordMatchesRouteKey(residence, routeKey, [
        getResidenceRouteKey(residence, residence.id),
        getKnownResidenceRouteLabel(
          residence.id,
          residence.slug,
          residence.title,
          residence.name,
        ),
        residence.location,
        residence.address,
      ]),
    );

    if (residenceMatch) return residenceMatch;

    const sectionMatch = backendListingSections.find((section) =>
      recordMatchesRouteKey(section, routeKey, [
        getResidenceRouteKey(section, section.residenceId || section.id),
        getKnownResidenceRouteLabel(
          section.residenceId,
          section.id,
          section.title,
        ),
        section.residenceId,
        section.title,
        section.location,
      ]),
    );

    return sectionMatch
      ? {
          ...sectionMatch,
          id: sectionMatch.residenceId || sectionMatch.id,
        }
      : null;
  }

  function findApartmentRouteMatch(routeKey) {
    if (!routeKey) return null;

    return getSearchableApartments().find((apartment) =>
      recordMatchesRouteKey(apartment, routeKey, [
        getApartmentRouteKey(apartment),
        apartment.sectionTitle,
        apartment.residenceName,
      ]),
    );
  }

  function findShopRouteMatch(variant, routeKey) {
    if (!routeKey) return null;

    return getShopItemsForVariant(variant).find((item) =>
      recordMatchesRouteKey(item, routeKey, [
        getShopItemRouteKey(item),
        item.category,
        ...(Array.isArray(item.tags) ? item.tags : []),
      ]),
    );
  }

  async function showHome() {
    const cachedHomeSections = defaultListingSections.length
      ? defaultListingSections
      : backendListingSections;

    setActivePage("home");
    setProfileInitialView("profile");
    setSelectedApartment(null);
    setApartmentReturnPage("home");
    setApartmentQuote(null);
    setPendingBooking(null);
    setPendingOrder(null);
    setSelectedResidenceId("");
    setFoodOrderDetails(createDefaultFoodOrderDetails());
    setApartmentFilters(defaultApartmentFilters);
    setSearchResetKey((currentKey) => currentKey + 1);
    setApartmentLoadError("");

    if (cachedHomeSections.length) {
      setBackendListingSections(cachedHomeSections);
      setIsApartmentsLoading(false);
    }

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    await refreshApartmentListings(defaultApartmentFilters);
  }

  async function showAllApartments() {
    await showHome();
  }

  async function showResidence(
    residenceId,
    apartmentTitle = "",
    residenceLabel = "",
  ) {
    const resolvedResidenceId = resolveResidenceNavigationId(
      residenceId,
      residenceLabel,
    );
    const normalizedApartmentTitle = String(apartmentTitle || "").trim();
    const nextFilters = {
      ...defaultApartmentFilters,
      residenceId: resolvedResidenceId,
      apartmentTitle: normalizedApartmentTitle,
    };

    setSelectedResidenceId(resolvedResidenceId);
    setApartmentFilters(nextFilters);
    setActivePage("residence");
    setProfileInitialView("profile");

    if (defaultListingSections.length) {
      setBackendListingSections(defaultListingSections);
      setApartmentLoadError("");
    }

    await refreshApartmentListings(nextFilters);
  }

  function showShop(shopId) {
    const nextShopVariant = getShopVariant(shopId);

    if (!nextShopVariant) {
      return;
    }

    setShopVariant(nextShopVariant);
    setSelectedFoodItem(getShopItemsForVariant(nextShopVariant)[0] || null);
    setFoodOrderDetails(createDefaultFoodOrderDetails());
    setActivePage("shopFood");
    setProfileInitialView("profile");
  }

  function showShopDirectory() {
    if (currentUser && getAuthToken()) {
      setProfileInitialView("shop");
      setActivePage("profile");
      return;
    }

    setActivePage("shopDirectory");
    setProfileInitialView("profile");
  }

  async function showApartment(apartment) {
    setApartmentReturnPage(activePage === "residence" ? "residence" : "home");
    const fallbackApartment = decorateApartmentWithMedia(apartment);
    const guestCapacity = getApartmentGuestCapacity(fallbackApartment);
    const nextBookingDetails = createBookingDetailsFromFilters(apartmentFilters);

    setSelectedApartment(fallbackApartment);
    setApartmentQuote(
      fallbackApartment.backendId &&
        nextBookingDetails.checkIn &&
        nextBookingDetails.checkOut &&
        nextBookingDetails.guests > 0
        ? {
            loading: true,
            available: undefined,
            error: "",
          }
        : null,
    );
    setPendingBooking(null);
    setBookingDetails({
      ...nextBookingDetails,
      guests: Math.min(
        guestCapacity || Infinity,
        Math.max(1, Number(nextBookingDetails.guests) || 1),
      ),
    });
    setActivePage("apartment");
    setProfileInitialView("profile");

    trackPixel("ViewContent", {
      content_type: "product",
      content_ids: [String(fallbackApartment.backendId || fallbackApartment.id || "")],
      content_name: fallbackApartment.title || "",
      value: Number(fallbackApartment.price || 0),
      currency: "NGN",
    });

    if (!apartment.backendId) {
      return;
    }

    try {
      const [detailsResult, reviewsResult] = await Promise.allSettled([
        apartmentsApi.getApartmentDetails(apartment.backendId),
        apartmentsApi.getApartmentReviews(apartment.backendId, { perPage: 10 }),
      ]);
      let nextApartment = fallbackApartment;

      if (detailsResult.status === "fulfilled") {
        nextApartment = decorateApartmentWithMedia({
          ...fallbackApartment,
          ...normalizeBackendApartment(extractObject(detailsResult.value), 0),
        });
      }

      if (reviewsResult.status === "fulfilled") {
        nextApartment = {
          ...nextApartment,
          reviews: extractCollection(reviewsResult.value).map(
            normalizeBackendReview,
          ),
        };
      }

      setSelectedApartment(nextApartment);
    } catch (error) {
      logFrontendError("Unable to load apartment details", error);
    }
  }

  function showApartmentReturnPage() {
    setActivePage(apartmentReturnPage);
  }

  async function refreshApartmentListings(
    nextFilters = defaultApartmentFilters,
  ) {
    const isDefaultListingRequest = !hasActiveApartmentFilters(nextFilters);
    const isResidenceOnlyRequest = Boolean(nextFilters.residenceId) &&
      !nextFilters.apartmentTitle &&
      !nextFilters.query &&
      !nextFilters.checkIn &&
      !nextFilters.checkOut &&
      Number(nextFilters.guests || 0) <= 0;
    const fallbackSections = defaultListingSections.length
      ? defaultListingSections
      : backendListingSections;
    const selectedResidence = backendResidenceOptions.find(
      (residence) => residence.id === nextFilters.residenceId,
    );
    const selectedBedrooms = getBedroomCountFromText(
      nextFilters.apartmentTitle,
    );
    const selectedCategory = backendApartmentCategories.find(
      (category) => category.bedrooms === selectedBedrooms,
    );

    setIsApartmentsLoading(true);
    setApartmentLoadError("");

    try {
      const response = await apartmentsApi.getApartments({
        perPage: 100,
        residenceId: selectedResidence?.backendId,
        categoryId: selectedCategory?.id,
        checkIn: nextFilters.checkIn,
        checkOut: nextFilters.checkOut,
        guests:
          Number(nextFilters.guests || 0) > 0 ? nextFilters.guests : undefined,
        search: nextFilters.query,
      });

      const sections = buildListingSectionsFromApartments(
        extractCollection(response),
      );

      if (isDefaultListingRequest && sections.length) {
        setDefaultListingSections(sections);
      }

      if (
        (isDefaultListingRequest || isResidenceOnlyRequest) &&
        !sections.length &&
        fallbackSections.length
      ) {
        setBackendListingSections(fallbackSections);
      } else {
        setBackendListingSections(sections);
      }
    } catch (error) {
      logFrontendError("Unable to filter backend apartments", error);
      if (
        (isDefaultListingRequest || isResidenceOnlyRequest) &&
        fallbackSections.length
      ) {
        setBackendListingSections(fallbackSections);
        setApartmentLoadError("");
      } else {
        setBackendListingSections([]);
        setApartmentLoadError(
          error.message || "Unable to filter apartments from the backend.",
        );
      }
    } finally {
      setIsApartmentsLoading(false);
    }
  }

  async function handleApartmentSearch(nextFilters) {
    const query = String(nextFilters.query || "").trim();

    trackPixel("Search", {
      search_string: query || nextFilters.apartmentTitle || "",
    });
    const bedroomCount = getBedroomCountFromText(query);
    const apartmentTitle = bedroomCount
      ? `${bedroomCount} Bedroom Apartment`
      : nextFilters.apartmentTitle || "";

    if (query) {
      const residenceMatch = findResidenceSearchMatch(
        bedroomCount ? removeBedroomTermsFromQuery(query) : query,
      );

      if (residenceMatch) {
        await showResidence(residenceMatch.id, apartmentTitle);
        return;
      }

      const shopMatch = findShopSearchMatch(query);

      if (shopMatch) {
        showShop(shopMatch);
        return;
      }

      const apartmentMatch = findApartmentSearchMatch(query);

      if (apartmentMatch) {
        await showApartment(apartmentMatch);
        return;
      }

      if (bedroomCount) {
        const bedroomFilters = {
          ...nextFilters,
          apartmentTitle,
          query: "",
        };

        setApartmentFilters(bedroomFilters);

        if (bedroomFilters.residenceId) {
          setSelectedResidenceId(bedroomFilters.residenceId);
        }

        setActivePage("home");
        setProfileInitialView("profile");
        await refreshApartmentListings(bedroomFilters);
        return;
      }
    }

    const normalizedFilters = {
      ...nextFilters,
      query,
    };

    setApartmentFilters(normalizedFilters);

    if (normalizedFilters.residenceId) {
      setSelectedResidenceId(normalizedFilters.residenceId);
    } else {
      setSelectedResidenceId("");
    }

    setActivePage("home");
    setProfileInitialView("profile");
    await refreshApartmentListings(normalizedFilters);
  }

  async function clearApartmentSearch() {
    setApartmentFilters(defaultApartmentFilters);
    setSearchResetKey((currentKey) => currentKey + 1);

    if (defaultListingSections.length) {
      setBackendListingSections(defaultListingSections);
      setApartmentLoadError("");
      setIsApartmentsLoading(false);
    }

    await refreshApartmentListings(defaultApartmentFilters);
  }

  function showProfile(profileView = "profile") {
    if (!currentUser || !getAuthToken()) {
      if (currentUser && !getAuthToken()) {
        clearStoredSession();
        setCurrentUser(null);
      }

      openLogin();
      return;
    }

    setProfileInitialView(profileView);
    setActivePage("profile");
  }

  function getLegalReturnLabel() {
    if (
      ["apartment", "payment", "pending", "confirmed"].includes(
        legalReturnPage,
      )
    ) {
      return "Back to booking";
    }

    if (
      ["foodDetail", "foodReview", "foodPayment", "foodStatus"].includes(
        legalReturnPage,
      )
    ) {
      return "Back to order";
    }

    if (legalReturnPage === "residence") return "Back to residence";
    if (["shopDirectory", "shopFood"].includes(legalReturnPage)) {
      return "Back to shop";
    }
    if (legalReturnPage === "profile") return "Back to account";

    return "Back to home";
  }

  function returnFromLegal() {
    const returnPage =
      legalReturnPage && legalReturnPage !== "legal" ? legalReturnPage : "home";

    setSelectedLegalDocumentId("");
    setActivePage(returnPage);

    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      });
    }
  }

  function showLegal(documentId = "", returnPage = activePage) {
    const nextReturnPage =
      returnPage && returnPage !== "legal" ? returnPage : "home";

    setLegalReturnPage(nextReturnPage);
    setSelectedLegalDocumentId(documentId);
    setActivePage("legal");

    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      });
    }
  }

  function showFoodDetail(foodItem) {
    setSelectedFoodItem(foodItem);
    setFoodOrderDetails(createDefaultFoodOrderDetails());
    setActivePage("foodDetail");
    setProfileInitialView("profile");
  }

  async function applyBrowserRoute(route) {
    if (!route) return false;

    isApplyingBrowserRouteRef.current = true;
    pendingBrowserRouteRef.current = null;

    if (route.page === "home") {
      setActivePage("home");
      setProfileInitialView("profile");
      setSelectedApartment(null);
      setSelectedFoodItem(null);
      setSelectedResidenceId("");
      setApartmentReturnPage("home");
      setIsAuthModalOpen(false);
      return true;
    }

    if (route.page === "auth") {
      setAuthEntry(route.authEntry || "login");
      setAuthModalKey((current) => current + 1);
      setIsAuthModalOpen(true);
      return true;
    }

    if (route.page !== "profile") {
      setIsAuthModalOpen(false);
    }

    if (route.page === "residence") {
      const residenceMatch = findResidenceRouteMatch(route.residenceId);
      const residenceId = residenceMatch?.id || route.residenceId || "";

      if (!residenceId && isApartmentsLoading) {
        pendingBrowserRouteRef.current = route;
        return false;
      }

      setSelectedResidenceId(residenceId);
      setApartmentFilters({
        ...defaultApartmentFilters,
        residenceId,
      });
      setActivePage("residence");
      setProfileInitialView("profile");
      return true;
    }

    if (["apartment", "payment", "pending", "confirmed"].includes(route.page)) {
      const apartmentMatch = findApartmentRouteMatch(route.apartmentKey);

      if (!apartmentMatch && isApartmentsLoading) {
        pendingBrowserRouteRef.current = route;
        return false;
      }

      if (!apartmentMatch) {
        setActivePage("home");
        setSelectedApartment(null);
        return true;
      }

      const fallbackApartment = decorateApartmentWithMedia(apartmentMatch);
      const guestCapacity = getApartmentGuestCapacity(fallbackApartment);
      const nextBookingDetails = createBookingDetailsFromFilters({
        ...defaultApartmentFilters,
        residenceId: fallbackApartment.residenceId || "",
      });

      setApartmentReturnPage(
        fallbackApartment.residenceId ? "residence" : "home",
      );
      setSelectedResidenceId(fallbackApartment.residenceId || "");
      setApartmentFilters({
        ...defaultApartmentFilters,
        residenceId: fallbackApartment.residenceId || "",
      });
      setSelectedApartment(fallbackApartment);
      setBookingDetails({
        ...nextBookingDetails,
        guests: Math.min(
          guestCapacity || Infinity,
          Math.max(1, Number(nextBookingDetails.guests) || 1),
        ),
      });
      setPendingBooking(null);
      setApartmentQuote(null);
      setActivePage(route.page);
      setProfileInitialView("profile");
      return true;
    }

    if (route.page === "shopDirectory") {
      setActivePage("shopDirectory");
      setProfileInitialView("profile");
      return true;
    }

    if (route.page === "shopFood") {
      setShopVariant(route.shopVariant || "food");
      setSelectedFoodItem(getShopItemsForVariant(route.shopVariant)[0] || null);
      setFoodOrderDetails(createDefaultFoodOrderDetails());
      setActivePage("shopFood");
      setProfileInitialView("profile");
      return true;
    }

    if (
      ["foodDetail", "foodReview", "foodPayment", "foodStatus"].includes(
        route.page,
      )
    ) {
      const routeShopVariant = route.shopVariant || "food";
      const foodItemMatch = findShopRouteMatch(
        routeShopVariant,
        route.itemKey,
      );

      if (!foodItemMatch && isShopLoading) {
        pendingBrowserRouteRef.current = route;
        return false;
      }

      if (!foodItemMatch) {
        setShopVariant(routeShopVariant);
        setActivePage("shopFood");
        return true;
      }

      setShopVariant(routeShopVariant);
      setSelectedFoodItem(foodItemMatch);
      setFoodOrderDetails(createDefaultFoodOrderDetails());
      setActivePage(route.page);
      setProfileInitialView("profile");
      return true;
    }

    if (route.page === "profile") {
      setProfileInitialView(route.profileView || "profile");

      if (currentUser && getAuthToken()) {
        setIsAuthModalOpen(false);
        setActivePage("profile");
      } else {
        openLogin();
      }

      return true;
    }

    if (route.page === "legal") {
      setLegalReturnPage("home");
      setSelectedLegalDocumentId(route.documentId || "");
      setActivePage("legal");
      return true;
    }

    if (route.page === "paymentSuccess") {
      setPaymentConfirmation(readPaymentConfirmation());
      setActivePage("paymentSuccess");
      setProfileInitialView("bookings");
      return true;
    }

    setActivePage("home");
    return true;
  }

  useEffect(() => {
    if (routeSyncReadyRef.current) return undefined;

    let ignoreRoute = false;

    async function applyInitialRoute() {
      const route = pendingBrowserRouteRef.current ||
        parseAppRoute(getCurrentPathname());
      const wasApplied = await applyBrowserRoute(route);

      if (ignoreRoute || !wasApplied) {
        isApplyingBrowserRouteRef.current = false;
        return;
      }

      routeSyncReadyRef.current = true;
      window.requestAnimationFrame(() => {
        isApplyingBrowserRouteRef.current = false;
      });
    }

    applyInitialRoute();

    return () => {
      ignoreRoute = true;
    };
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    async function handlePopState() {
      const route = parseAppRoute(getCurrentPathname());
      const wasApplied = await applyBrowserRoute(route);

      if (!wasApplied) {
        isApplyingBrowserRouteRef.current = false;
        return;
      }

      routeSyncReadyRef.current = true;
      window.requestAnimationFrame(() => {
        isApplyingBrowserRouteRef.current = false;
      });
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  });

  useEffect(() => {
    if (
      !routeSyncReadyRef.current ||
      isApplyingBrowserRouteRef.current ||
      hasPaymentReturnQuery()
    ) {
      return;
    }

    writeBrowserRoute(
      buildAppPath({
        activePage,
        isAuthModalOpen,
        authEntry,
        selectedResidence: selectedResidenceForRoute,
        selectedResidenceId,
        selectedApartment,
        profileInitialView,
        selectedLegalDocumentId,
        shopVariant,
        selectedFoodItem,
      }),
    );
  }, [
    activePage,
    authEntry,
    profileInitialView,
    isAuthModalOpen,
    selectedApartment,
    selectedFoodItem,
    selectedLegalDocumentId,
    selectedResidenceForRoute,
    selectedResidenceId,
    shopVariant,
  ]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const selectedLegalDocument =
      activePage === "legal" && selectedLegalDocumentId
        ? mergeLegalDocuments(profileResources.legalDocuments).find(
            (legalDocument) => legalDocument.id === selectedLegalDocumentId,
          ) || null
        : null;

    const seoPath = buildAppPath({
      activePage,
      isAuthModalOpen,
      authEntry,
      selectedResidence: selectedResidenceForRoute,
      selectedResidenceId,
      selectedApartment,
      profileInitialView,
      selectedLegalDocumentId,
      shopVariant,
      selectedFoodItem,
    });

    applySeoMetadata(
      buildSeoMetadata({
        path: seoPath,
        activePage,
        isAuthModalOpen,
        authEntry,
        selectedApartment,
        selectedResidence: selectedResidenceForRoute,
        selectedResidenceId,
        selectedLegalDocument,
        selectedFoodItem,
        shopVariant,
        profileInitialView,
        faqItems: activePage === "home" ? bedrockFaqItems : undefined,
      }),
    );
  }, [
    activePage,
    authEntry,
    isAuthModalOpen,
    profileInitialView,
    profileResources.legalDocuments,
    selectedApartment,
    selectedFoodItem,
    selectedLegalDocumentId,
    selectedResidenceForRoute,
    selectedResidenceId,
    shopVariant,
  ]);

  function isApartmentSaved(apartment) {
    if (!apartment || !Array.isArray(currentUser?.wishlists)) return false;

    return currentUser.wishlists.some(
      (item) =>
        item.id === apartment.id ||
        item.backendId === apartment.backendId ||
        item.id === String(apartment.backendId),
    );
  }

  async function handleFavoriteToggle(apartment) {
    if (!currentUser) {
      openLogin();
      return {
        ok: false,
        isSaved: false,
        message: "Please log in to save apartments.",
      };
    }

    const currentWishlists = Array.isArray(currentUser.wishlists)
      ? currentUser.wishlists
      : [];
    const isAlreadySaved = currentWishlists.some(
      (item) =>
        item.id === apartment.id ||
        item.backendId === apartment.backendId ||
        item.id === String(apartment.backendId),
    );
    let nextIsSaved = !isAlreadySaved;
    let favoriteApartment = apartment;

    if (getAuthToken() && apartment.backendId) {
      try {
        const response = await favoritesApi.toggleFavorite(apartment.backendId);
        const responsePayload = extractObject(response);

        nextIsSaved =
          responsePayload.is_favorite ??
          responsePayload.isFavorite ??
          responsePayload.favorited ??
          nextIsSaved;
        const favoriteSource =
          responsePayload.apartment ||
          responsePayload.favorite?.apartment ||
          responsePayload.favorite?.apartment_details ||
          responsePayload.favorite ||
          apartment;
        favoriteApartment = normalizeBackendFavorite(
          favoriteSource,
          0,
          apartment,
        );
        favoriteApartment = {
          ...apartment,
          ...favoriteApartment,
          id: String(apartment.id),
          backendId: apartment.backendId || favoriteApartment.backendId,
          title: favoriteApartment.title || apartment.title,
          image: favoriteApartment.image || apartment.image,
          sourceType: "apartment",
        };
      } catch (error) {
        const message = error.message || "Could not update wishlist.";
        showToast(message, "error");
        return { ok: false, isSaved: isAlreadySaved, message };
      }
    } else {
      favoriteApartment = {
        ...apartment,
        sourceType: "apartment",
      };
    }

    updateCurrentUser((current) => {
      if (!current) return current;

      const wishlists = Array.isArray(current.wishlists)
        ? current.wishlists
        : [];
      const withoutApartment = wishlists.filter(
        (item) =>
          item.id !== apartment.id &&
          item.backendId !== apartment.backendId &&
          item.id !== String(apartment.backendId),
      );

      return {
        ...current,
        wishlists: nextIsSaved
          ? [favoriteApartment, ...withoutApartment]
          : withoutApartment,
      };
    });

    const message = nextIsSaved
      ? "Apartment saved to wishlist."
      : "Apartment removed from wishlist.";

    showToast(message, "success");
    addActivityMessage("Wishlist updated", message);

    return { ok: true, isSaved: nextIsSaved, message };
  }

  async function handleProfileSave(profileUpdates) {
    if (!currentUser) {
      const result = {
        ok: false,
        message: "Please log in before updating your profile.",
      };
      showToast(result.message, "error");
      return result;
    }

    const { firstName, lastName } = splitProfileName(profileUpdates.name);
    const fallbackProfile = {
      ...currentUser,
      ...profileUpdates,
    };

    try {
      const response = await profileApi.updateProfile({
        ...profileUpdates,
        firstName,
        lastName,
      });
      const nextProfile = normalizeBackendUser(response, fallbackProfile);
      const result = {
        ok: true,
        message: "Profile updated successfully.",
      };

      updateCurrentUser(nextProfile);
      showToast(result.message, "success");
      addActivityMessage(
        "Profile updated",
        "Your profile details were updated successfully.",
      );

      return result;
    } catch (error) {
      const result = {
        ok: false,
        message: error.message || "Unable to update your profile.",
      };

      showToast(result.message, "error");

      return result;
    }
  }

  async function handleAvatarUpload(file) {
    if (!file || !getAuthToken()) return;

    try {
      const response = await profileApi.updateAvatar(file);
      const nextUser = normalizeBackendUser(response, currentUser || {});

      updateCurrentUser(nextUser);
      showToast("Profile photo updated.", "success");
      addActivityMessage(
        "Profile photo updated",
        "Your profile picture was updated successfully.",
      );
    } catch (error) {
      showToast(error.message || "Unable to upload profile photo.", "error");
    }
  }

  async function handlePasswordChange({ currentPassword, nextPassword }) {
    try {
      await profileApi.changePassword({
        currentPassword,
        newPassword: nextPassword,
        newPasswordConfirmation: nextPassword,
      });

      const result = {
        ok: true,
        message: "Password updated successfully.",
      };

      showToast(result.message, "success");
      addActivityMessage(
        "Password changed",
        "Your account password was updated successfully.",
      );

      return result;
    } catch (error) {
      const result = {
        ok: false,
        message: error.message || "Unable to update your password.",
      };

      showToast(result.message, "error");

      return result;
    }
  }

  async function handleSubmitKyc() {
    try {
      await profileApi.submitKyc();
      await refreshProfileResources({ silent: true });
      showToast("KYC submitted successfully.", "success");
    } catch (error) {
      showToast(error.message || "Unable to submit KYC.", "error");
    }
  }

  async function handleUploadDocument(file) {
    try {
      await profileApi.uploadDocument({
        file,
        type: "kyc",
        name: file.name,
      });
      await refreshProfileResources({ silent: true });
      showToast("Document uploaded successfully.", "success");
    } catch (error) {
      showToast(error.message || "Unable to upload document.", "error");
    }
  }

  async function handleMarkNotificationRead(notificationId) {
    const isLocalNotification = String(notificationId || "").startsWith(
      "local-",
    );

    try {
      if (!isLocalNotification) {
        await profileApi.markNotificationAsRead(notificationId);
      }

      setProfileResources((current) => ({
        ...current,
        notifications: current.notifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification,
        ),
      }));
      showToast("Notification marked as read.", "success");
    } catch (error) {
      showToast(error.message || "Unable to update notification.", "error");
    }
  }

  async function handleMarkAllNotificationsRead() {
    try {
      if (getAuthToken()) {
        await profileApi.markAllNotificationsAsRead();
      }

      setProfileResources((current) => ({
        ...current,
        notifications: current.notifications.map((notification) => ({
          ...notification,
          read: true,
        })),
      }));
      showToast("All notifications marked as read.", "success");
    } catch (error) {
      showToast(error.message || "Unable to update notifications.", "error");
    }
  }

  async function handleDeleteAccount(password) {
    if (isDeletingAccount) return;

    if (!getAuthToken()) {
      clearStoredSession();
      setCurrentUser(null);
      setActivePage("home");
      showToast("You are already logged out.", "success");
      return;
    }

    const deletePassword = String(password || "");

    if (!deletePassword.trim()) {
      showToast("Enter your password to delete your account.", "error");
      return;
    }

    const shouldDelete =
      typeof window !== "undefined" &&
      window.confirm("Delete your Bedrock account permanently?");

    if (!shouldDelete) return;

    setIsDeletingAccount(true);

    try {
      try {
        await authApi.deleteAccount(deletePassword);
      } catch (error) {
        if (!isUnauthenticatedError(error) || !currentUser?.email) {
          throw error;
        }

        await authApi.login({
          email: currentUser.email,
          password: deletePassword,
        });
        await authApi.deleteAccount(deletePassword);
      }

      clearStoredSession();
      setCurrentUser(null);
      setActivePage("home");
      setProfileInitialView("profile");
      showToast("Account deleted successfully.", "success");
    } catch (error) {
      if (isUnauthenticatedError(error)) {
        clearStoredSession();
        setCurrentUser(null);
        setActivePage("home");
        setProfileInitialView("profile");
        showToast(
          "Your session expired. Please log in again, then delete your account.",
          "error",
        );
      } else if (isServerError(error)) {
        showToast(
          "The backend returned a server error while deleting this account.",
          "error",
        );
      } else {
        showToast(error.message || "Unable to delete account.", "error");
      }
    } finally {
      setIsDeletingAccount(false);
    }
  }

  async function handleDownloadInvoice(booking) {
    const bookingId = getBackendRecordId(booking);

    if (!bookingId || !getAuthToken()) {
      return {
        ok: false,
        message: "Invoice is only available for backend bookings.",
      };
    }

    try {
      const response = await bookingsApi.getInvoice(bookingId);
      const invoice = extractObject(response);
      const invoiceUrl =
        invoice.url ||
        invoice.invoice_url ||
        invoice.invoiceUrl ||
        invoice.download_url ||
        invoice.downloadUrl;

      if (invoiceUrl && typeof window !== "undefined") {
        window.open(invoiceUrl, "_blank", "noopener,noreferrer");
      }

      return {
        ok: true,
        message: invoiceUrl
          ? "Invoice opened."
          : "Invoice loaded, but no download URL was returned.",
      };
    } catch (error) {
      return {
        ok: false,
        message: error.message || "Unable to load invoice.",
      };
    }
  }

  async function handleLoadTimeline(booking) {
    const bookingId = getBackendRecordId(booking);

    if (!bookingId || !getAuthToken()) {
      return {
        ok: false,
        message: "Timeline is only available for backend bookings.",
      };
    }

    try {
      const response = await ordersApi.getOrderTimeline(bookingId);
      const timeline = extractCollection(response);

      updateCurrentUser((current) => {
        if (!current) return current;

        return {
          ...current,
          bookings: (current.bookings || []).map((currentBooking) =>
            currentBooking.id === booking.id
              ? { ...currentBooking, timeline }
              : currentBooking,
          ),
        };
      });

      return {
        ok: true,
        message: timeline.length
          ? "Timeline loaded."
          : "No timeline updates yet.",
      };
    } catch (error) {
      return {
        ok: false,
        message: error.message || "Unable to load timeline.",
      };
    }
  }

  async function handleSubmitReview(booking, reviewPayload = {}) {
    const bookingId = getBackendRecordId(booking);

    if (!bookingId || !getAuthToken()) {
      return {
        ok: false,
        message: "Reviews are only available for backend bookings.",
      };
    }

    const rating = Math.max(1, Math.min(5, Number(reviewPayload.rating) || 5));
    const comment = String(reviewPayload.comment || "").trim();

    if (comment.length < 3) {
      return {
        ok: false,
        message: "Please add a short review before submitting.",
      };
    }

    try {
      await bookingsApi.submitReview(bookingId, {
        rating,
        comment,
      });
      const createdAt = new Date().toISOString();
      const review = {
        id: `local-review-${bookingId}`,
        rating,
        comment,
        text: comment,
        createdAt,
        date: "Recent",
        author:
          currentUser?.fullName ||
          currentUser?.name ||
          [currentUser?.firstName, currentUser?.lastName]
            .filter(Boolean)
            .join(" ") ||
          "You",
        location: booking.location || "Bedrock Guest",
      };

      updateCurrentUser((current) => {
        if (!current) return current;

        return {
          ...current,
          bookings: (current.bookings || []).map((currentBooking) =>
            currentBooking.id === booking.id ||
            String(currentBooking.backendId || "") === String(bookingId)
              ? {
                  ...currentBooking,
                  reviewed: true,
                  review,
                }
              : currentBooking,
          ),
        };
      });

      setSelectedApartment((currentApartment) => {
        if (!currentApartment) return currentApartment;

        const bookingApartmentId = String(
          booking.apartmentBackendId || booking.apartmentId || "",
        );
        const currentApartmentId = String(
          currentApartment.backendId || currentApartment.id || "",
        );

        if (
          bookingApartmentId &&
          currentApartmentId &&
          bookingApartmentId !== currentApartmentId
        ) {
          return currentApartment;
        }

        const existingReviews = Array.isArray(currentApartment.reviews)
          ? currentApartment.reviews
          : [];
        const previousCount = Number(
          currentApartment.reviewsCount || existingReviews.length || 0,
        );
        const previousRating = Number(currentApartment.rating || 0);
        const nextCount = previousCount + 1;
        const nextRating =
          nextCount > 0
            ? (previousRating * previousCount + rating) / nextCount
            : rating;

        return {
          ...currentApartment,
          rating: nextRating,
          reviews: [review, ...existingReviews],
          reviewsCount: nextCount,
        };
      });

      showToast("Review submitted successfully.", "success");
      addActivityMessage(
        "Review submitted",
        `Your review for ${booking.title || "your stay"} has been sent.`,
      );

      return {
        ok: true,
        message: "Review submitted successfully.",
      };
    } catch (error) {
      showToast(error.message || "Unable to submit review.", "error");

      return {
        ok: false,
        message: error.message || "Unable to submit review.",
      };
    }
  }

  async function handleBookingExtension(bookingId, nextCheckout) {
    if (!currentUser) {
      const result = {
        ok: false,
        message: "Please log in to extend this booking.",
      };
      showToast(result.message, "error");
      return result;
    }

    const booking = (currentUser.bookings || []).find(
      (currentBooking) => currentBooking.id === bookingId,
    );

    if (!booking) {
      const result = {
        ok: false,
        message: "Booking not found.",
      };
      showToast(result.message, "error");
      return result;
    }

    if (!nextCheckout || nextCheckout <= booking.checkOut) {
      const result = {
        ok: false,
        message: "Choose a checkout date after your current checkout date.",
      };
      showToast(result.message, "error");
      return result;
    }

    const nightlyRate =
      Number(booking.nightlyRate || 0) ||
      (booking.subtotal && booking.nights
        ? Math.round(Number(booking.subtotal) / Number(booking.nights))
        : 0);

    if (!nightlyRate) {
      const result = {
        ok: false,
        message: "This booking is missing a nightly rate.",
      };
      showToast(result.message, "error");
      return result;
    }

    const totals = calculateBookingTotals(
      nightlyRate,
      booking.checkIn,
      nextCheckout,
      Number(booking.rockPointValue || 0) > 0,
      {
        cautionFee: Number(booking.cautionFee || 0) || undefined,
        rockPointValue: Number(booking.rockPointValue || 0),
      },
    );
    const extendedAt = new Date().toISOString();
    let nextBooking = {
      ...booking,
      checkOut: nextCheckout,
      nights: totals.nights,
      nightlyRate,
      subtotal: totals.subtotal,
      taxesAndFees: totals.taxesAndFees,
      cautionFee: totals.cautionFee,
      rockPointValue: totals.rockPointValue,
      totalAmount: totals.payable,
      extendedAt,
      extensionHistory: [
        ...(booking.extensionHistory || []),
        {
          previousCheckOut: booking.checkOut,
          nextCheckOut: nextCheckout,
          extraAmount: Math.max(
            0,
            totals.payable - Number(booking.totalAmount || 0),
          ),
          createdAt: extendedAt,
        },
      ],
    };

    if (getAuthToken() && booking.backendId) {
      try {
        const response = await bookingsApi.extendBooking(booking.backendId, {
          newCheckOutDate: nextCheckout,
          agreeToPolicies: true,
        });

        nextBooking = normalizeBackendBooking(response, nextBooking);
      } catch (error) {
        const result = {
          ok: false,
          message: error.message || "Could not extend this booking.",
        };

        showToast(result.message, "error");
        return result;
      }
    }

    updateCurrentUser((current) => {
      if (!current) return current;

      return {
        ...current,
        bookings: (current.bookings || []).map((currentBooking) =>
          currentBooking.id === bookingId ? nextBooking : currentBooking,
        ),
      };
    });

    const result = {
      ok: true,
      message: "Stay extended successfully.",
    };
    showToast(result.message, "success");
    addActivityMessage(
      "Stay extended",
      `${nextBooking.title || booking.title} now checks out on ${formatShortDate(nextCheckout)}.`,
    );
    return result;
  }

  async function handleBookingCancellation(bookingOrId) {
    if (!currentUser) {
      showToast("Please log in to cancel this booking.", "error");
      return {
        ok: false,
        message: "Please log in to cancel this booking.",
      };
    }

    const requestedBooking =
      bookingOrId && typeof bookingOrId === "object" ? bookingOrId : null;
    const bookingId = requestedBooking?.id || bookingOrId;
    const requestedBackendId = getBackendRecordId(requestedBooking);
    const booking =
      requestedBooking ||
      (currentUser.bookings || []).find((currentBooking) => {
        const currentBackendId = getBackendRecordId(currentBooking);

        return (
          currentBooking.id === bookingId ||
          String(currentBackendId || "") === String(bookingId || "") ||
          (requestedBackendId &&
            String(currentBackendId || "") === String(requestedBackendId))
        );
      });

    if (!booking) {
      showToast("Booking not found.", "error");
      return {
        ok: false,
        message: "Booking not found.",
      };
    }

    const bookingStatus = String(booking.status || "").toLowerCase();

    if (bookingStatus === "cancelled" || bookingStatus === "canceled") {
      showToast("This booking is already cancelled.", "error");
      return {
        ok: false,
        message: "This booking is already cancelled.",
      };
    }

    const cancelledAt = new Date().toISOString();
    let cancelledBooking = {
      ...booking,
      status: "cancelled",
      cancelledAt,
    };

    const backendBookingId = getBackendRecordId(booking);

    if (getAuthToken() && backendBookingId) {
      try {
        const response = await bookingsApi.cancelBooking(
          backendBookingId,
          "Cancelled by guest",
        );

        cancelledBooking = normalizeBackendBooking(response, cancelledBooking);
      } catch (error) {
        const backendMessage = error.message || "Could not cancel this booking.";
        const message = /cannot be cancelled|cannot be canceled/i.test(
          backendMessage,
        )
          ? `The backend refused cancellation for booking ${backendBookingId}. Please confirm this booking status can be cancelled, or contact support.`
          : backendMessage;

        showToast(message, "error");
        return {
          ok: false,
          message,
        };
      }
    }

    updateCurrentUser({
      ...currentUser,
      bookings: (currentUser.bookings || []).map((currentBooking) => {
        const currentBackendId = getBackendRecordId(currentBooking);
        const matchesLocalId = currentBooking.id === booking.id;
        const matchesBackendId =
          backendBookingId &&
          currentBackendId &&
          String(currentBackendId) === String(backendBookingId);

        return matchesLocalId || matchesBackendId
          ? cancelledBooking
          : currentBooking;
      }),
    });

    showToast(`${booking.title} booking cancelled.`, "success");
    addActivityMessage(
      "Booking cancelled",
      `${booking.title} was cancelled successfully.`,
    );

    return {
      ok: true,
      message: "Booking cancelled successfully.",
    };
  }

  async function handleOrderCancellation(order) {
    if (!currentUser) {
      const message = "Please log in to cancel this order.";

      showToast(message, "error");
      return { ok: false, message };
    }

    const orderId = order?.id;
    const existingOrder = (currentUser.orders || []).find(
      (currentOrder) => currentOrder.id === orderId,
    );

    if (!existingOrder) {
      const message = "Order not found.";

      showToast(message, "error");
      return { ok: false, message };
    }

    const status = String(existingOrder.status || "").toLowerCase();

    if (status === "cancelled" || status === "canceled") {
      const message = "This order is already cancelled.";

      showToast(message, "error");
      return { ok: false, message };
    }

    const backendOrderType = getOrderTypeForBackend(existingOrder);
    const backendOrderId = getBackendRecordId(existingOrder);
    let cancelledOrder = {
      ...existingOrder,
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
    };
    let resultMessage = "Order cancelled successfully.";

    if (
      getAuthToken() &&
      backendOrderId &&
      (backendOrderType === "food" || backendOrderType === "shop")
    ) {
      try {
        const response =
          backendOrderType === "food"
            ? await foodApi.cancelFoodOrder(backendOrderId)
            : await shopApi.cancelShopOrder(backendOrderId);

        cancelledOrder = {
          ...normalizeBackendOrder(response, cancelledOrder),
          status: "cancelled",
          cancelledAt: cancelledOrder.cancelledAt,
        };
      } catch (error) {
        if (error.status === 404) {
          resultMessage =
            "Order cancellation is saved locally for now because the backend cancel endpoint is not deployed yet.";
        } else {
          const message = error.message || "Could not cancel this order.";

          showToast(message, "error");
          return { ok: false, message };
        }
      }
    } else if (getAuthToken() && backendOrderId && backendOrderType === "service") {
      resultMessage =
        "Service cancellation is saved locally for now because the backend cancel endpoint is not documented yet.";
    } else if (getAuthToken() && backendOrderId) {
      resultMessage =
        "Order cancellation is saved locally for now because this order type does not expose a cancel endpoint yet.";
    }

    const persistedCancelledOrder = {
      ...existingOrder,
      ...cancelledOrder,
      id: existingOrder.id,
      backendId: cancelledOrder.backendId || existingOrder.backendId,
      paymentReference:
        cancelledOrder.paymentReference || existingOrder.paymentReference,
      orderType: cancelledOrder.orderType || existingOrder.orderType,
      raw: {
        ...(existingOrder.raw || {}),
        ...(cancelledOrder.raw || {}),
      },
      status: "cancelled",
      cancelledAt: cancelledOrder.cancelledAt || new Date().toISOString(),
    };

    saveCancelledOrderOverride(currentUser, persistedCancelledOrder);

    updateCurrentUser((current) => {
      if (!current) return current;

      return {
        ...current,
        orders: (current.orders || []).map((currentOrder) =>
          currentOrder.id === orderId ? persistedCancelledOrder : currentOrder,
        ),
      };
    });

    showToast(`${existingOrder.title || "Order"} cancelled.`, "success");
    addActivityMessage(
      "Order cancelled",
      `${existingOrder.title || "Your order"} was cancelled successfully.`,
    );

    return {
      ok: true,
      message: resultMessage,
    };
  }

  function handleBecomeAgent() {
    showToast("Create an agent account to continue.", "success");
    openAgentSignup();
  }

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch (error) {
      logFrontendError("Logout failed", error);
    }

    clearStoredSession();
    setCurrentUser(null);
    setActivePage("home");
    setProfileInitialView("profile");
  }

  function handleBookingChange(field, value) {
    if (field === "useRockPoints" && value && !canUseRockPoints) {
      showToast("You do not have rock points available yet.", "error");
      value = false;
    }

    if (field === "useProfileAsGuest") {
      const shouldUseProfile = Boolean(value);
      const profileGuestName = getProfileGuestName(currentUser);
      const profileGuestPhone = getProfileGuestPhone(currentUser);

      if (shouldUseProfile && (!profileGuestName || !profileGuestPhone)) {
        showToast(
          "Your profile is missing a name or phone number. Please enter the guest details manually.",
          "error",
        );
        setBookingDetails((current) => ({
          ...current,
          useProfileAsGuest: false,
        }));
        return;
      }

      setBookingDetails((current) => ({
        ...current,
        useProfileAsGuest: shouldUseProfile,
        ...(shouldUseProfile
          ? {
              guestName: profileGuestName,
              guestPhone: profileGuestPhone,
            }
          : {}),
      }));
      return;
    }

    const nextBookingDetails = {
      ...bookingDetails,
      ...(field === "checkIn"
        ? {
            checkIn: value,
            checkOut: bookingDetails.checkOut
              ? ensureCheckoutDate(value, bookingDetails.checkOut)
              : "",
          }
        : field === "checkOut"
          ? {
              checkOut: ensureCheckoutDate(bookingDetails.checkIn, value),
            }
          : field === "guests"
            ? {
                guests: Math.min(
                  getApartmentGuestCapacity(selectedApartment) || Infinity,
                  Math.max(1, Number(value) || 1),
                ),
              }
            : field === "guestName" || field === "guestPhone"
              ? {
                  [field]: value,
                  useProfileAsGuest: false,
                }
            : {
                [field]: value,
              }),
    };
    const shouldRefreshQuote = Boolean(
      selectedApartment?.backendId &&
        nextBookingDetails.checkIn &&
        nextBookingDetails.checkOut &&
        nextBookingDetails.guests > 0 &&
        ["checkIn", "checkOut", "guests", "promo"].includes(field),
    );

    if (shouldRefreshQuote) {
      setApartmentQuote((currentQuote) => ({
        ...(currentQuote || {}),
        loading: true,
        available: undefined,
        error: "",
      }));
    } else if (["checkIn", "checkOut", "guests"].includes(field)) {
      setApartmentQuote(null);
    }

    // A coupon-applied booking captures the totals at apply time. If the stay
    // details or the code change, drop that draft so payment re-creates it with
    // the fresh coupon and dates instead of charging a stale discounted total.
    if (
      ["checkIn", "checkOut", "guests", "promo"].includes(field) &&
      pendingBooking?.isIncomplete
    ) {
      setPendingBooking(null);
    }

    setBookingDetails(nextBookingDetails);
  }

  function handleFoodOrderChange(field, value) {
    if (field === "useRockPoints" && value && !canUseRockPoints) {
      showToast("You do not have rock points available yet.", "error");
      value = false;
    }

    setFoodOrderDetails((current) => ({
      ...current,
      ...(field === "guests"
        ? {
            guests: Math.max(1, Number(value) || 1),
          }
        : {
            [field]: value,
          }),
    }));
  }

  function openPaymentStep() {
    trackPixel("InitiateCheckout", {
      content_type: "product",
      content_ids: [String(selectedApartment?.backendId || selectedApartment?.id || "")],
      content_name: selectedApartment?.title || "",
      value: Number(apartmentQuote?.pricing?.payable ?? selectedApartment?.price ?? 0),
      currency: "NGN",
    });
    setActivePage("payment");
  }

  function createBookingFromCurrentSelection(overrides = {}) {
    const fallbackTotals = calculateBookingTotals(
      selectedApartment?.price,
      bookingDetails.checkIn,
      bookingDetails.checkOut,
      shouldUseBookingRockPoints,
      {
        cautionFee: selectedApartment?.cautionFee,
        availableRockPointValue,
        rockPointValue: availableRockPointValue,
      },
    );
    const totals = apartmentQuote?.pricing || fallbackTotals;

    return {
      id: overrides.id || createBookingId(),
      title: selectedApartment?.title || "Apartment booking",
      residenceName: selectedApartment?.residenceName || "",
      location: selectedApartment?.location || "",
      image:
        selectedApartment?.statusImage ||
        selectedApartment?.paymentImage ||
        selectedApartment?.previewImage ||
        selectedApartment?.image ||
        "",
      apartmentBackendId: selectedApartment?.backendId || "",
      apartmentId: selectedApartment?.backendId || selectedApartment?.id || "",
      checkIn: bookingDetails.checkIn,
      checkOut: bookingDetails.checkOut,
      guests: bookingDetails.guests,
      guestName: String(bookingDetails.guestName || "").trim(),
      guestPhone: String(bookingDetails.guestPhone || "").trim(),
      nights: totals.nights,
      nightlyRate: Number(selectedApartment?.price || 0),
      subtotal: totals.subtotal,
      taxesAndFees: totals.taxesAndFees,
      cautionFee: totals.cautionFee,
      rockPointValue: totals.rockPointValue,
      couponCode: String(bookingDetails.promo || "").trim(),
      couponDiscount: totals.couponDiscount || totals.discountAmount || 0,
      totalAmount: totals.payable,
      status: "payment_pending",
      isIncomplete: true,
      createdAt: new Date().toISOString(),
      ...overrides,
    };
  }

  function saveBookingToProfile(booking) {
    updateCurrentUser((current) => {
      if (!current) return current;

      return {
        ...current,
        bookings: upsertBooking(current.bookings || [], booking),
      };
    });
  }

  async function openPendingStep() {
    if (!selectedApartment || !currentUser) {
      showToast("Please log in before paying for your booking.", "error");
      openLogin();
      return;
    }

    if (!bookingDetails.checkIn || !bookingDetails.checkOut) {
      showToast("Choose your check-in and check-out dates before paying.", "error");
      return;
    }

    if (bookingDetails.guests <= 0) {
      showToast("Add the number of guests before paying.", "error");
      return;
    }

    if (!String(bookingDetails.guestName || "").trim()) {
      showToast("Add the guest name before paying.", "error");
      return;
    }

    if (getPhoneDigitCount(bookingDetails.guestPhone) < 7) {
      showToast("Add a valid guest phone number before paying.", "error");
      return;
    }

    if (!bookingDetails.agreedToPolicy) {
      showToast("Agree to the residence and cancellation policy to continue.", "error");
      return;
    }

    if (apartmentQuote?.loading) {
      showToast(
        "Please wait while we confirm availability for these dates.",
        "error",
      );
      return;
    }

    if (apartmentQuote?.available === false) {
      showToast(DATE_UNAVAILABLE_MESSAGE, "error");
      setActivePage("apartment");
      return;
    }

    if (
      String(bookingDetails.promo || "").trim() &&
      (apartmentQuote?.loading ||
        apartmentQuote?.error ||
        apartmentQuote?.pricing?.isCouponValid === false)
    ) {
      showToast("Please wait for the coupon check to finish or remove the coupon code.", "error");
      return;
    }

    if (!getAuthToken()) {
      showToast("Your secure session has expired. Please log in again before paying.", "error");
      openLogin();
      return;
    }

    if (selectedApartment.backendId) {
      let booking = pendingBooking || null;
      let bookingId = getBackendRecordId(booking);

      try {
        if (!bookingId) {
          const localDraft = createBookingFromCurrentSelection();
          const createResponse = await bookingsApi.createBooking({
            apartmentId: selectedApartment.backendId,
            checkIn: bookingDetails.checkIn,
            checkOut: bookingDetails.checkOut,
            guests: bookingDetails.guests,
            guestName: bookingDetails.guestName,
            guestPhone: bookingDetails.guestPhone,
            couponCode: String(bookingDetails.promo || "").trim(),
            useRockPoints: shouldUseBookingRockPoints,
            agreeToPolicies: bookingDetails.agreedToPolicy,
          });

          booking = {
            ...normalizeBackendBooking(createResponse, localDraft),
            status: "payment_pending",
            isIncomplete: true,
          };
          bookingId = getBackendRecordId(booking);

          if (!bookingId) {
            throw new Error(
              "Booking ID missing from createBooking response. Backend may be returning a wrapped payload.",
            );
          }

          setPendingBooking(booking);
          saveBookingToProfile(booking);
        }

        const paymentResponse = await bookingsApi.initiatePayment(
          bookingId,
          getPaymentMethodForBackend(bookingDetails.paymentMethod),
        );
        const payment = normalizeBackendPayment(paymentResponse);
        const nextPendingBooking = {
          ...booking,
          status: "payment_pending",
          isIncomplete: true,
          paymentReference: payment.reference || booking.paymentReference,
          paymentUrl: payment.authorizationUrl || booking.paymentUrl || "",
        };

        setPendingBooking(nextPendingBooking);
        saveBookingToProfile(nextPendingBooking);
        addActivityMessage(
          "Booking payment started",
          `${nextPendingBooking.title || selectedApartment.title} is waiting for payment confirmation.`,
        );

        savePendingPaymentContext({
          type: "booking",
          recordId: bookingId,
          reference: nextPendingBooking.paymentReference || "",
          amount: Number(nextPendingBooking.totalAmount || 0),
          // Display fields for the post-payment success screen. The Paystack
          // return is a full page reload, so component state (selectedApartment,
          // bookingDetails) is gone by then — the screen renders from here.
          title: nextPendingBooking.title || selectedApartment?.title || "",
          image: nextPendingBooking.image || selectedApartment?.image || "",
          location:
            selectedApartment?.location || selectedApartment?.address || "",
          checkIn: bookingDetails.checkIn || "",
          checkOut: bookingDetails.checkOut || "",
          guests: Number(bookingDetails.guests || 0),
        });

        if (payment.authorizationUrl && typeof window !== "undefined") {
          showToast("Opening secure payment page.", "success");
          window.location.assign(payment.authorizationUrl);
          return;
        }

        if (!payment.reference) {
          showToast(
            "Payment was created, but the backend did not return a payment link or reference.",
            "error",
          );
        }
      } catch (error) {
        const message = error.message || "Could not start booking payment.";
        showToast(message, "error");
        return;
      }
    }

    setActivePage("pending");
  }

  function openConfirmedStep() {
    setActivePage("confirmed");
  }

  function findApartmentForBooking(booking = {}) {
    const bookingApartmentId = String(
      booking.apartmentBackendId || booking.apartmentId || "",
    );
    const allApartments = backendListingSections.flatMap(
      (section) => section.items || [],
    );

    return (
      allApartments.find(
        (apartment) =>
          bookingApartmentId &&
          String(apartment.backendId || apartment.id) === bookingApartmentId,
      ) ||
      allApartments.find(
        (apartment) =>
          apartment.title === booking.title &&
          apartment.residenceName === booking.residenceName,
      ) ||
      null
    );
  }

  function handleContinueBooking(booking) {
    const status = String(booking?.status || "").toLowerCase();
    const canContinue =
      booking?.isIncomplete ||
      ["payment_pending", "pending_payment", "pending", "unpaid", "draft"].some(
        (value) => status.includes(value),
      );

    if (!canContinue) {
      showToast("Only unpaid or incomplete bookings can be continued.", "error");
      return;
    }

    const matchedApartment = findApartmentForBooking(booking);
    const nextApartment = decorateApartmentWithMedia(
      matchedApartment || {
        id: booking.apartmentId || booking.id,
        backendId: booking.apartmentBackendId || booking.apartmentId || "",
        title: booking.title,
        residenceName: booking.residenceName,
        location: booking.location,
        price: booking.nightlyRate,
        image: booking.image,
        previewImage: booking.image,
        paymentImage: booking.image,
        statusImage: booking.image,
      },
    );
    const checkIn = booking.checkIn || getTodayDateValue();
    const checkOut = ensureCheckoutDate(
      checkIn,
      booking.checkOut || addDays(checkIn, 1),
    );

    setSelectedApartment(nextApartment);
    setPendingBooking(booking);
    setBookingDetails((current) => ({
      ...current,
      checkIn,
      checkOut,
      guests: Math.max(1, Number(booking.guests || current.guests || 1)),
      guestName: booking.guestName || current.guestName || "",
      guestPhone: booking.guestPhone || current.guestPhone || "",
      useProfileAsGuest: false,
      agreedToPolicy: true,
      paymentMethod: current.paymentMethod || "card",
      useRockPoints: Number(booking.rockPointValue || 0) > 0 && canUseRockPoints,
    }));
    setApartmentReturnPage("profile");
    setProfileInitialView("bookings");
    setActivePage("payment");
    showToast("Continue your booking payment.", "success");
  }

  async function openFoodStatusStep() {
    if (!selectedFoodItem) {
      showToast(
        "This item is still loading. Please choose an available item.",
        "error",
      );
      return;
    }

    if (!currentUser) {
      showToast("Please log in before completing your order.", "error");
      openLogin();
      return;
    }

    if (!foodOrderDetails.agreedToPolicy) {
      showToast("Agree to the residence and cancellation policy to continue.", "error");
      return;
    }

    if (!getAuthToken()) {
      showToast("Your secure session has expired. Please log in again before ordering.", "error");
      openLogin();
      return;
    }

    if (selectedFoodItem?.backendId || shopVariant === "requests") {
      try {
        let createResponse;
        let payOrder;
        const orderType = getPaymentOrderType(shopVariant);
        const paymentPrefix = getPaymentPrefixForOrderType(orderType);
        const bookingId = getActiveBackendBookingId(currentUser) || null;

        const basePayload = {
          bookingId,
          apartmentNumber: foodOrderDetails.apartmentNumber || "Pending",
          deliveryTime: foodOrderDetails.deliveryTime,
          guests: foodOrderDetails.guests,
          note: foodOrderDetails.note,
          useRockPoints: shouldUseFoodRockPoints,
        };

        if (shopVariant === "food") {
          createResponse = await foodApi.createFoodOrder({
            ...basePayload,
            items: [
              {
                food_item_id: selectedFoodItem.backendId,
                quantity: foodOrderDetails.guests,
              },
            ],
          });
          payOrder = foodApi.payFoodOrder;
        } else if (shopVariant === "toiletries") {
          createResponse = await shopApi.createShopOrder({
            ...basePayload,
            items: [
              {
                shop_product_id: selectedFoodItem.backendId,
                quantity: foodOrderDetails.guests,
              },
            ],
          });
          payOrder = shopApi.payShopOrder;
        } else if (shopVariant === "services") {
          createResponse = await servicesApi.createServiceOrder({
            ...basePayload,
            serviceId: selectedFoodItem.backendId,
            scheduledAt: foodOrderDetails.deliveryTime,
            duration: 60,
          });
          payOrder = servicesApi.payServiceOrder;
        } else {
          const requestLabel =
            `${selectedFoodItem.title} ${selectedFoodItem.category}`.toLowerCase();

          if (requestLabel.includes("chauffeur")) {
            createResponse = await requestsApi.createChauffeurRequest({
              bookingId,
              destination: foodOrderDetails.note || "Destination pending",
              pickupTime: foodOrderDetails.deliveryTime,
              notes: selectedFoodItem.description,
              agreeTerms: foodOrderDetails.agreedToPolicy,
            });
          } else if (
            requestLabel.includes("bureau") ||
            requestLabel.includes("exchange")
          ) {
            createResponse = await requestsApi.createBureauDeChangeRequest({
              bookingId,
              currencyFrom: "USD",
              currencyTo: "NGN",
              amount: selectedFoodItem.price || 1,
              notes: foodOrderDetails.note || selectedFoodItem.description,
              agreeTerms: foodOrderDetails.agreedToPolicy,
            });
          } else {
            createResponse = await requestsApi.createQuickRequest({
              bookingId,
              requestType: selectedFoodItem.title,
              description:
                foodOrderDetails.note || selectedFoodItem.description,
              agreeTerms: foodOrderDetails.agreedToPolicy,
            });
          }
        }

        let order = normalizeBackendOrder(createResponse, {
          title: selectedFoodItem.title,
          category: shopVariant,
          orderType,
          image: selectedFoodItem.image,
          totalAmount: selectedFoodItem.price,
        });

        if (payOrder) {
          const orderId = getBackendRecordId(order);

          if (!orderId) {
            showToast(
              "Order was created, but the backend did not return an order ID for payment.",
              "error",
            );
            return;
          }

          const requestedReference = makePaymentReference(paymentPrefix);
          const paymentMethod = getPaymentMethodForBackend(
            foodOrderDetails.paymentMethod,
          );
          const paymentResponse = await initializeOrderPayment({
            payOrder,
            orderId,
            orderType,
            paymentMethod,
            reference: requestedReference,
          });
          const payment = normalizeBackendPayment(paymentResponse);
          const paymentReference = payment.reference || requestedReference;

          order = {
            ...order,
            paymentReference,
          };

          setPendingOrder(order);
          addActivityMessage(
            "Order payment started",
            `${order.title || selectedFoodItem.title} is waiting for payment confirmation.`,
          );
          savePendingPaymentContext({
            type: orderType,
            recordId: orderId,
            reference: paymentReference,
            amount: Number(order.totalAmount || 0),
          });

          if (payment.authorizationUrl && typeof window !== "undefined") {
            showToast("Opening secure payment page.", "success");
            window.location.assign(payment.authorizationUrl);
            return;
          }

          showToast(
            "Order payment was created, but the backend did not return a Paystack payment link.",
            "error",
          );
          return;
        }

        setPendingOrder(order);
        addActivityMessage(
          shopVariant === "services"
            ? "Service order created"
            : "Order created",
          `${order.title || selectedFoodItem.title} has been sent to Bedrock.`,
        );
      } catch (error) {
        const message = error.message || "Could not start order payment.";
        showToast(message, "error");
        return;
      }
    } else {
      showToast(
        "This item is not available from the backend yet. Please choose another item.",
        "error",
      );
      return;
    }

    setActivePage("foodStatus");
  }

  async function finishApartmentFlow() {
    if (!selectedApartment || !currentUser) {
      if (!currentUser) {
        showToast("Please log in before completing your booking.", "error");
      }
      setActivePage("home");
      return;
    }

    const nextBooking = createBookingFromCurrentSelection({
      status: "upcoming",
      isIncomplete: false,
    });
    let bookingToStore = pendingBooking
      ? {
          ...pendingBooking,
          status: "upcoming",
          isIncomplete: false,
        }
      : nextBooking;

    if (selectedApartment.backendId && !pendingBooking && !getAuthToken()) {
      showToast("Your secure session has expired. Please log in again before confirming.", "error");
      openLogin();
      return;
    }

    if (!pendingBooking && getAuthToken() && selectedApartment.backendId) {
      try {
        const response = await bookingsApi.createBooking({
          apartmentId: selectedApartment.backendId,
          checkIn: bookingDetails.checkIn,
          checkOut: bookingDetails.checkOut,
          guests: bookingDetails.guests,
          guestName: bookingDetails.guestName,
          guestPhone: bookingDetails.guestPhone,
          couponCode: String(bookingDetails.promo || "").trim(),
          useRockPoints: shouldUseBookingRockPoints,
          agreeToPolicies: bookingDetails.agreedToPolicy,
        });

        bookingToStore = normalizeBackendBooking(response, nextBooking);
      } catch (error) {
        logFrontendError("Backend booking creation failed", error);
        showToast(
          error.message || "Could not create your booking. Please try again.",
          "error",
        );
        return;
      }
    }

    saveBookingToProfile(bookingToStore);
    await refreshProfileResources({ silent: true });

    setProfileInitialView("bookings");
    setPendingBooking(null);
    setActivePage("profile");
    showToast("Booking confirmed and added to your profile.", "success");
    addActivityMessage(
      "Booking confirmed",
      `${bookingToStore.title || selectedApartment.title} has been added to your bookings.`,
    );
  }

  function finishFoodOrderFlow() {
    if (!currentUser) {
      showToast("Please log in before completing your order.", "error");
      setActivePage("home");
      return;
    }

    if (!pendingOrder) {
      showToast(
        "Your order has not been confirmed by the backend yet. Please try again.",
        "error",
      );
      return;
    }

    if (selectedFoodItem) {
      const totals = calculateFoodOrderTotals(
        selectedFoodItem.price,
        foodOrderDetails.guests,
        shouldUseFoodRockPoints,
        availableRockPointValue,
      );

      const nextOrder = {
        ...pendingOrder,
        subtotal: pendingOrder.subtotal ?? totals.subtotal,
        taxesAndFees: pendingOrder.taxesAndFees ?? totals.taxesAndFees,
        cautionFee: pendingOrder.cautionFee ?? totals.cautionFee,
        rockPointValue: pendingOrder.rockPointValue ?? totals.rockPointValue,
        totalAmount: pendingOrder.totalAmount ?? totals.payable,
      };

      updateCurrentUser((current) => {
        if (!current) return current;

        return {
          ...current,
          orders: [nextOrder, ...(current.orders || [])],
        };
      });
    }

    setPendingOrder(null);
    setActivePage("home");
    showToast("Order placed successfully.", "success");
    addActivityMessage(
      "Order placed",
      `${selectedFoodItem?.title || "Your order"} has been placed successfully.`,
    );
  }

  return (
    <div
      className={`home-page ${
        activePage === "profile" ? "home-page--profile" : ""
      } ${activePage === "residence" ? "home-page--residence" : ""} ${
        activePage === "shopDirectory" ? "home-page--shop-directory" : ""
      }`}
    >
      {activePage === "profile" && currentUser ? (
        <ProfilePage
          user={currentUser}
          bookings={currentUser?.bookings || []}
          initialView={profileInitialView}
          onGoHome={showHome}
          onProfileSave={handleProfileSave}
          onAvatarUpload={handleAvatarUpload}
          onPasswordChange={handlePasswordChange}
          onExtendStay={handleBookingExtension}
          onCancelBooking={handleBookingCancellation}
          onContinueBooking={handleContinueBooking}
          onCancelOrder={handleOrderCancellation}
          onDownloadInvoice={handleDownloadInvoice}
          onLoadTimeline={handleLoadTimeline}
          onSubmitReview={handleSubmitReview}
          onShopSelect={showShop}
          profileResources={profileResources}
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onUploadDocument={handleUploadDocument}
          onSubmitKyc={handleSubmitKyc}
          onDeleteAccount={handleDeleteAccount}
          isDeletingAccount={isDeletingAccount}
          orders={currentUser?.orders || []}
          onLogout={handleLogout}
          onToast={showToast}
          onApartmentSelect={showApartment}
        />
      ) : (
        <>
          <Header
            user={currentUser}
            activeView="home"
            residences={backendResidenceOptions}
            apartmentCategories={backendApartmentCategories}
            isResidencesLoading={isApartmentsLoading}
            shopCategories={shopDirectoryCategories}
            onHome={showHome}
            onLogin={openLogin}
            onSignup={openSignup}
            onProfile={() => showProfile("profile")}
            onProfileView={showProfile}
            onResidenceSelect={showResidence}
            onShopSelect={showShop}
            onShopDirectory={showShopDirectory}
            onBecomeAgent={handleBecomeAgent}
            onLogout={handleLogout}
            unreadCount={unreadMessageCount}
          />

          <main className="home-page__main">
            {activePage === "home" && (
              <section className="home-mobile-intro">
                <h1>Book premium stays</h1>
              </section>
            )}

            {shouldShowSearchBar && (
              <SearchBar
                key={searchResetKey}
                residences={backendResidenceOptions}
                apartmentCategories={backendApartmentCategories}
                shopCategories={shopDirectoryCategories}
                isLoading={isApartmentsLoading}
                onSearch={handleApartmentSearch}
                onResidenceSelect={showResidence}
              />
            )}

            {activePage === "home" && (
              <PromoBanner promotions={homePromotions} />
            )}

            {activePage === "paymentSuccess" ? (
              <PaymentSuccessPage
                confirmation={paymentConfirmation}
                onViewBooking={() => {
                  clearPaymentConfirmation();
                  setPaymentConfirmation(null);
                  showProfile("bookings");
                }}
                onGoHome={() => {
                  clearPaymentConfirmation();
                  setPaymentConfirmation(null);
                  showHome();
                }}
              />
            ) : activePage === "legal" ? (
              <LegalPage
                key={selectedLegalDocumentId || "legal-index"}
                legalDocuments={profileResources.legalDocuments}
                initialDocumentId={selectedLegalDocumentId}
                onBack={legalReturnPage === "home" ? showHome : returnFromLegal}
                backLabel={getLegalReturnLabel()}
                returnToSourceOnDetail={legalReturnPage !== "home"}
              />
            ) : activePage === "residence" ? (
              <ResidencePage
                residenceId={selectedResidenceId}
                filters={apartmentFilters}
                sections={backendListingSections}
                isLoading={isApartmentsLoading}
                loadError={apartmentLoadError}
                onBack={showAllApartments}
                onApartmentSelect={showApartment}
              />
            ) : activePage === "apartment" ? (
              <ApartmentPage
                mode="details"
                apartment={selectedApartment}
                bookingDetails={bookingDetails}
                quote={apartmentQuote}
                rockPointSummary={rockPointSummary}
                isInitiallySaved={isApartmentSaved(selectedApartment)}
                onToggleFavorite={handleFavoriteToggle}
                onBookingChange={handleBookingChange}
                onOpenPayment={openPaymentStep}
                onBackToListings={showApartmentReturnPage}
                onOpenPolicy={() => showLegal("cancellation")}
                backLabel={
                  apartmentReturnPage === "residence"
                    ? "Back to residence"
                    : "Back to listings"
                }
              />
            ) : activePage === "payment" ? (
              <ApartmentPage
                mode="payment"
                apartment={selectedApartment}
                bookingDetails={bookingDetails}
                quote={apartmentQuote}
                rockPointSummary={rockPointSummary}
                isInitiallySaved={isApartmentSaved(selectedApartment)}
                onToggleFavorite={handleFavoriteToggle}
                onBookingChange={handleBookingChange}
                onPaymentContinue={openPendingStep}
                onBackToApartment={() => setActivePage("apartment")}
                onOpenPolicy={() => showLegal("cancellation")}
                backLabel="Back to apartment"
              />
            ) : activePage === "pending" ? (
              <ApartmentPage
                mode="pending"
                apartment={selectedApartment}
                bookingDetails={bookingDetails}
                quote={apartmentQuote}
                rockPointSummary={rockPointSummary}
                onBackToPayment={() => setActivePage("payment")}
                onMoveToConfirmed={openConfirmedStep}
                backLabel="Back to payment"
              />
            ) : activePage === "confirmed" ? (
              <ApartmentPage
                mode="confirmed"
                apartment={selectedApartment}
                bookingDetails={bookingDetails}
                quote={apartmentQuote}
                rockPointSummary={rockPointSummary}
                onBackToPayment={() => setActivePage("pending")}
                onFinishBooking={finishApartmentFlow}
              />
            ) : activePage === "shopDirectory" ? (
              <ShopDirectoryPage
                categories={shopDirectoryCategories}
                onBack={showHome}
                onShopSelect={showShop}
              />
            ) : activePage === "shopFood" ? (
              <ShopFoodPage
                mode="list"
                variant={shopVariant}
                items={getShopItemsForVariant(shopVariant)}
                filters={getShopFiltersForVariant(shopVariant)}
                isLoading={isShopLoading}
                loadError={getShopLoadErrorForVariant(shopVariant)}
                rockPointSummary={rockPointSummary}
                onFoodSelect={showFoodDetail}
              />
            ) : activePage === "foodDetail" ? (
              <ShopFoodPage
                mode="detail"
                variant={shopVariant}
                items={getShopItemsForVariant(shopVariant)}
                filters={getShopFiltersForVariant(shopVariant)}
                isLoading={isShopLoading}
                loadError={getShopLoadErrorForVariant(shopVariant)}
                foodItem={selectedFoodItem}
                orderDetails={foodOrderDetails}
                rockPointSummary={rockPointSummary}
                onOrderChange={handleFoodOrderChange}
                onBackToFood={() => setActivePage("shopFood")}
                onProceedToReview={() =>
                  setActivePage(
                    shopVariant === "food" ? "foodReview" : "foodPayment",
                  )
                }
                onOpenPolicy={() => showLegal("cancellation")}
              />
            ) : activePage === "foodReview" ? (
              <ShopFoodPage
                mode="review"
                variant={shopVariant}
                items={getShopItemsForVariant(shopVariant)}
                filters={getShopFiltersForVariant(shopVariant)}
                isLoading={isShopLoading}
                loadError={getShopLoadErrorForVariant(shopVariant)}
                foodItem={selectedFoodItem}
                orderDetails={foodOrderDetails}
                rockPointSummary={rockPointSummary}
                onOrderChange={handleFoodOrderChange}
                onBackToFood={() => setActivePage("foodDetail")}
                onProceedToPayment={() => setActivePage("foodPayment")}
                onOpenPolicy={() => showLegal("cancellation")}
              />
            ) : activePage === "foodPayment" ? (
              <ShopFoodPage
                mode="payment"
                variant={shopVariant}
                items={getShopItemsForVariant(shopVariant)}
                filters={getShopFiltersForVariant(shopVariant)}
                isLoading={isShopLoading}
                loadError={getShopLoadErrorForVariant(shopVariant)}
                foodItem={selectedFoodItem}
                orderDetails={foodOrderDetails}
                rockPointSummary={rockPointSummary}
                onOrderChange={handleFoodOrderChange}
                onBackToReview={() =>
                  setActivePage(
                    shopVariant === "food" ? "foodReview" : "foodDetail",
                  )
                }
                onPaymentContinue={openFoodStatusStep}
                onOpenPolicy={() => showLegal("cancellation")}
              />
            ) : activePage === "foodStatus" ? (
              <ShopFoodPage
                mode="status"
                variant={shopVariant}
                items={getShopItemsForVariant(shopVariant)}
                filters={getShopFiltersForVariant(shopVariant)}
                isLoading={isShopLoading}
                loadError={getShopLoadErrorForVariant(shopVariant)}
                foodItem={selectedFoodItem}
                orderDetails={foodOrderDetails}
                rockPointSummary={rockPointSummary}
                onFinishOrder={finishFoodOrderFlow}
              />
            ) : (
              <section
                className={`home-page__listings ${
                  isApartmentsLoading ? "home-page__listings--loading" : ""
                }`.trim()}
              >
                {isApartmentsLoading ? (
                  <div className="home-page__empty home-page__empty--loading">
                    <BrandLoader
                      title="Loading apartments"
                      message="Getting the latest apartments from Bedrock."
                    />
                  </div>
                ) : filteredListingSections.length > 0 ? (
                  filteredListingSections.map((section) => (
                    <ListingSection
                      key={section.id}
                      section={section}
                      onApartmentSelect={showApartment}
                    />
                  ))
                ) : (
                  <div className="home-page__empty">
                    <h2>No apartments match your search</h2>
                    <p>
                      {apartmentLoadError ||
                        "Try changing the residence, dates, or number of guests."}
                    </p>
                    {hasApartmentFilters && (
                      <button type="button" onClick={clearApartmentSearch}>
                        Clear filters
                      </button>
                    )}
                  </div>
                )}
              </section>
            )}
          </main>

          <Footer
            helpInfo={profileResources.helpInfo}
            legalDocuments={profileResources.legalDocuments}
            residences={backendResidenceOptions}
            onResidenceSelect={showResidence}
            onProfileView={showProfile}
            onLegalSelect={showLegal}
          />
        </>
      )}

      <AuthModal
        key={authModalKey}
        isOpen={isAuthModalOpen}
        entryPoint={authEntry}
        onClose={closeAuthModal}
        onSwitchToLogin={openLogin}
        onSwitchToSignup={openSignup}
        onAuthComplete={handleAuthComplete}
      />
      <ToastHost toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default HomePage;
