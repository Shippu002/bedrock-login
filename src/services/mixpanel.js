// Mixpanel is disabled for now.
// To re-enable, restore the SDK import/initialization and have these helpers
// call mixpanel.track, mixpanel.identify, mixpanel.people.set, and mixpanel.reset.
//
// import mixpanel from "mixpanel-browser";
// const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN || "";
// const ANALYTICS_ENABLED =
//   import.meta.env.PROD || import.meta.env.VITE_ENABLE_ANALYTICS === "true";

export function track() {}

export function identify() {}

export function setUser() {}

export function reset() {}

export function trackPageView() {}
