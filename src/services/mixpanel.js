import mixpanel from "mixpanel-browser";

const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN || "";
const ANALYTICS_ENABLED =
  import.meta.env.PROD || import.meta.env.VITE_ENABLE_ANALYTICS === "true";
const DEBUG_ANALYTICS =
  import.meta.env.PROD || import.meta.env.VITE_DEBUG_ANALYTICS === "true";

let isInitialized = false;
let hasAttemptedInit = false;

function cleanProperties(properties = {}) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined),
  );
}

function logAnalytics(message, details = {}) {
  if (!DEBUG_ANALYTICS) return;

  console.info(`[Mixpanel] ${message}`, details);
}

function initializeMixpanel() {
  if (isInitialized) return true;
  if (hasAttemptedInit) return false;

  hasAttemptedInit = true;

  if (!ANALYTICS_ENABLED || !MIXPANEL_TOKEN) {
    logAnalytics("init skipped", {
      analyticsEnabled: ANALYTICS_ENABLED,
      hasToken: Boolean(MIXPANEL_TOKEN),
    });
    return false;
  }

  mixpanel.init(MIXPANEL_TOKEN, {
    debug: import.meta.env.DEV,
    persistence: "localStorage",
    track_pageview: false,
  });
  isInitialized = true;
  logAnalytics("initialized", {
    analyticsEnabled: ANALYTICS_ENABLED,
    hasToken: Boolean(MIXPANEL_TOKEN),
  });

  return true;
}

function getMixpanelClient() {
  return initializeMixpanel() ? mixpanel : null;
}

// Track a user action or app event in Mixpanel.
export function track(event, properties = {}) {
  const client = getMixpanelClient();

  if (!client || !event) {
    logAnalytics("track skipped", {
      event,
      hasClient: Boolean(client),
    });
    return;
  }

  client.track(event, cleanProperties(properties));
  logAnalytics("track sent", { event });
}

// Identify the current logged-in user by their stable backend id.
export function identify(userId) {
  const client = getMixpanelClient();

  if (!client || !userId) {
    logAnalytics("identify skipped", {
      hasClient: Boolean(client),
      hasUserId: Boolean(userId),
    });
    return;
  }

  client.identify(String(userId));
  logAnalytics("identify sent", { userId: String(userId) });
}

// Set the current user's Mixpanel profile fields, such as $name and $email.
export function setUser(userProperties = {}) {
  const client = getMixpanelClient();
  const cleanedProperties = cleanProperties(userProperties);

  if (!client || Object.keys(cleanedProperties).length === 0) {
    logAnalytics("people.set skipped", {
      hasClient: Boolean(client),
      propertyKeys: Object.keys(cleanedProperties),
    });
    return;
  }

  if (typeof client.people?.set === "function") {
    client.people.set(cleanedProperties);
    logAnalytics("people.set sent", {
      propertyKeys: Object.keys(cleanedProperties),
    });
  } else {
    logAnalytics("people.set unavailable", {
      hasPeopleApi: Boolean(client.people),
    });
  }

  if (typeof client.people?.set_once === "function") {
    client.people.set_once({
      $created: new Date().toISOString(),
    });
    logAnalytics("people.set_once sent", { propertyKeys: ["$created"] });
  }
}

// Clear the current Mixpanel identity when a user logs out or the session expires.
export function reset() {
  const client = getMixpanelClient();

  if (!client) {
    logAnalytics("reset skipped", { hasClient: false });
    return;
  }

  client.reset();
  logAnalytics("reset sent");
}

// Track a page view from the app navigation state.
export function trackPageView(page, properties = {}) {
  track("Page View", {
    page,
    path: typeof window === "undefined" ? "" : window.location.pathname,
    ...properties,
  });
}
