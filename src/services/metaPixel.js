// Thin wrapper around the Meta Pixel (fbq) that is initialized once in
// index.html. Every call is guarded so it is a safe no-op when the Pixel
// script is blocked, still loading, or running during SSR/tests.
//
// Do NOT initialize fbq here. The single fbq("init", ...) lives in index.html.

function getFbq() {
  if (typeof window === "undefined") return null;

  return typeof window.fbq === "function" ? window.fbq : null;
}

// Standard Meta events (ViewContent, Search, InitiateCheckout, Purchase,
// CompleteRegistration, PageView, ...).
export function trackPixel(eventName, params) {
  const fbq = getFbq();

  if (!fbq || !eventName) return;

  try {
    if (params && Object.keys(params).length > 0) {
      fbq("track", eventName, params);
    } else {
      fbq("track", eventName);
    }
  } catch {
    // Never let analytics break the user flow.
  }
}
