const WEBHOOK_ENDPOINT = "/api/marketing-track";
const WEBHOOK_ENABLED = import.meta.env.VITE_ENABLE_MAKE_WEBHOOK !== "false";

function cleanObject(value = {}) {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, entry]) => entry !== undefined && entry !== null && entry !== "",
    ),
  );
}

function pickNonEmpty(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && String(value).trim() !== "",
  );
}

function getUserPayload(user = {}) {
  if (!user || typeof user !== "object") return {};

  const nestedUser = user.user || user.data?.user || user.data || {};
  const profile = user.profile || nestedUser.profile || {};
  const customer = user.customer || nestedUser.customer || {};
  const metadata = user.metadata || nestedUser.metadata || {};
  const firstName = pickNonEmpty(
    user.firstName,
    user.first_name,
    nestedUser.firstName,
    nestedUser.first_name,
    profile.firstName,
    profile.first_name,
    customer.firstName,
    customer.first_name,
  );
  const lastName = pickNonEmpty(
    user.lastName,
    user.last_name,
    nestedUser.lastName,
    nestedUser.last_name,
    profile.lastName,
    profile.last_name,
    customer.lastName,
    customer.last_name,
  );
  const email = pickNonEmpty(
    user.email,
    user.emailAddress,
    user.email_address,
    nestedUser.email,
    nestedUser.emailAddress,
    nestedUser.email_address,
    profile.email,
    profile.emailAddress,
    customer.email,
    customer.emailAddress,
    metadata.email,
  );
  const phone = pickNonEmpty(
    user.phone,
    user.phoneNumber,
    user.phone_number,
    user.mobile,
    user.telephone,
    user.whatsapp,
    nestedUser.phone,
    nestedUser.phoneNumber,
    nestedUser.phone_number,
    nestedUser.mobile,
    nestedUser.telephone,
    profile.phone,
    profile.phoneNumber,
    profile.phone_number,
    profile.mobile,
    customer.phone,
    customer.phoneNumber,
    customer.phone_number,
    customer.mobile,
    metadata.phone,
    metadata.phoneNumber,
    metadata.phone_number,
  );
  const name =
    pickNonEmpty(
      user.name,
      user.fullName,
      user.full_name,
      user.displayName,
      nestedUser.name,
      nestedUser.fullName,
      nestedUser.full_name,
      nestedUser.displayName,
      profile.name,
      profile.fullName,
      customer.name,
      customer.fullName,
    ) ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    pickNonEmpty(user.username, nestedUser.username, profile.username);

  return cleanObject({
    id:
      user.backendId ||
      user.id ||
      user.uuid ||
      user.firebaseUid ||
      nestedUser.backendId ||
      nestedUser.id ||
      nestedUser.uuid,
    name,
    email,
    phone,
    phoneNumber: phone,
    phone_number: phone,
    isAgent: user.isAgent ?? user.is_agent ?? nestedUser.isAgent ?? nestedUser.is_agent,
    agentStatus:
      user.agentStatus ||
      user.agent_status ||
      nestedUser.agentStatus ||
      nestedUser.agent_status,
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
  if (!WEBHOOK_ENABLED || typeof window === "undefined") {
    return;
  }

  const body = JSON.stringify(payload);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });

      if (navigator.sendBeacon(WEBHOOK_ENDPOINT, blob)) return;
    }

    fetch(WEBHOOK_ENDPOINT, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
      },
      body,
    }).catch(() => {});
  } catch {
    // Marketing tracking must never block the user experience.
  }
}

export function trackMarketingEvent(eventName, properties = {}, user = {}) {
  if (!eventName) return;

  const userPayload = getUserPayload(user);
  const eventProperties = cleanObject({
    email: userPayload.email,
    phone: userPayload.phone,
    phoneNumber: userPayload.phone,
    phone_number: userPayload.phone,
    ...properties,
  });

  postWebhook({
    source: "bedrock-web",
    event: eventName,
    timestamp: new Date().toISOString(),
    page: getPagePayload(),
    user: userPayload,
    properties: eventProperties,
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
      phone: userPayload.phone,
      phoneNumber: userPayload.phone,
      phone_number: userPayload.phone,
      name: userPayload.name,
    }),
    user,
  );
}
