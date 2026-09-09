const WEBHOOK_ENDPOINT =
  import.meta.env.VITE_MAKE_MARKETING_ENDPOINT || "/api/marketing-track";
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

  const fullName = user.name || user.fullName || user.username || "";
  const nameParts = String(fullName).trim().split(/\s+/).filter(Boolean);
  const firstName =
    user.firstName || user.first_name || nameParts[0] || "";
  const lastName =
    user.lastName || user.last_name || nameParts.slice(1).join(" ") || "";

  return cleanObject({
    userId: user.backendId || user.id || user.uuid || user.firebaseUid,
    firstName,
    lastName,
    name: fullName || [firstName, lastName].filter(Boolean).join(" "),
    email: user.email || user.emailAddress || user.email_address,
    phone:
      user.phone ||
      user.phoneNumber ||
      user.phone_number ||
      user.mobile ||
      user.telephone,
  });
}

function sendWebhook(payload) {
  if (!WEBHOOK_ENABLED || typeof window === "undefined") return;

  const body = JSON.stringify(payload);

  try {
    fetch(WEBHOOK_ENDPOINT, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
      },
      body,
    }).catch(() => {});
  } catch {
    // Marketing tracking must never interrupt authentication or booking.
  }
}

export function trackMarketingEvent(eventType, properties = {}, user = {}) {
  if (!eventType) return;

  const userPayload = getUserPayload(user);
  const payload = cleanObject({
    event_type: eventType,
    timestamp: new Date().toISOString(),
    source: "bedrock-web",
    ...userPayload,
    ...properties,
  });

  sendWebhook(payload);
}
