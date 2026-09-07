const WEBHOOK_URL = import.meta.env.VITE_MAKE_MARKETING_WEBHOOK_URL || "";
const WEBHOOK_ENABLED = import.meta.env.VITE_ENABLE_MAKE_WEBHOOK !== "false";

function cleanObject(value = {}) {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, entry]) => entry !== undefined && entry !== null && entry !== "",
    ),
  );
}

function getUserPayload(user = {}) {
  if (!user || typeof user !== "object") return {};

  return cleanObject({
    id: user.backendId || user.id || user.uuid || user.firebaseUid,
    name:
      user.name ||
      user.fullName ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.username,
    email: user.email,
    phone: user.phone || user.phoneNumber || user.phone_number || user.mobile,
    isAgent: user.isAgent,
    agentStatus: user.agentStatus,
  });
}

function getPagePayload() {
  if (typeof window === "undefined") return {};

  return cleanObject({
    url: window.location.href,
    path: window.location.pathname,
    search: window.location.search,
    title: typeof document !== "undefined" ? document.title : "",
    referrer: typeof document !== "undefined" ? document.referrer : "",
    userAgent: window.navigator?.userAgent,
  });
}

function postWebhook(payload) {
  if (!WEBHOOK_ENABLED || !WEBHOOK_URL || typeof window === "undefined") {
    return;
  }

  const body = JSON.stringify(payload);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });

      if (navigator.sendBeacon(WEBHOOK_URL, blob)) return;
    }

    fetch(WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      keepalive: true,
      headers: {
        "Content-Type": "text/plain;charset=UTF-8",
      },
      body,
    }).catch(() => {});
  } catch {
    // Marketing tracking must never block the user experience.
  }
}

export function trackMarketingEvent(eventName, properties = {}, user = {}) {
  if (!eventName) return;

  postWebhook({
    source: "bedrock-web",
    event: eventName,
    timestamp: new Date().toISOString(),
    page: getPagePayload(),
    user: getUserPayload(user),
    properties: cleanObject(properties),
  });
}

export function trackMarketingUser(user = {}, properties = {}) {
  const userPayload = getUserPayload(user);

  if (!userPayload.id && !userPayload.email) return;

  trackMarketingEvent(
    "User Identified",
    cleanObject({
      ...properties,
      userId: userPayload.id,
      email: userPayload.email,
      name: userPayload.name,
    }),
    user,
  );
}
