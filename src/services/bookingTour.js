const DRIVER_SCRIPT_ID = "bedrock-driver-js";
const DRIVER_STYLE_ID = "bedrock-driver-css";
const DRIVER_JS_URL =
  "https://cdn.jsdelivr.net/npm/driver.js@latest/dist/driver.js.iife.js";
const DRIVER_CSS_URL =
  "https://cdn.jsdelivr.net/npm/driver.js@latest/dist/driver.css";
const BOOKING_TOUR_STORAGE_KEY = "bedrockBookingTourSeen";
export const BOOKING_TOUR_EVENT = "bedrock:start-booking-tour";
export const BOOKING_TOUR_CLOSE_CHAT_EVENT = "bedrock:close-chat";
export const BOOKING_TOUR_ACTIVE_EVENT = "bedrock:booking-tour-active";
export const BOOKING_TOUR_INACTIVE_EVENT = "bedrock:booking-tour-inactive";

const TOUR_SELECTORS = {
  checkIn: '[data-booking-tour="check-in"]',
  checkOut: '[data-booking-tour="check-out"]',
  guests: '[data-booking-tour="guests"]',
  policy: '[data-booking-tour="policy"]',
  book: '[data-booking-tour="book-button"]',
};

let driverLoadPromise = null;
let activeDriver = null;

function hasWindow() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function getDriverFactory() {
  return window.driver?.js?.driver || window.driver?.driver || null;
}

function injectDriverStylesheet() {
  if (document.getElementById(DRIVER_STYLE_ID)) return;

  const link = document.createElement("link");
  link.id = DRIVER_STYLE_ID;
  link.rel = "stylesheet";
  link.href = DRIVER_CSS_URL;
  document.head.appendChild(link);
}

function loadDriver() {
  if (!hasWindow()) return Promise.resolve(null);

  const existingDriver = getDriverFactory();
  if (existingDriver) return Promise.resolve(existingDriver);
  if (driverLoadPromise) return driverLoadPromise;

  injectDriverStylesheet();

  driverLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(DRIVER_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(getDriverFactory()));
      existingScript.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = DRIVER_SCRIPT_ID;
    script.src = DRIVER_JS_URL;
    script.async = true;
    script.onload = () => resolve(getDriverFactory());
    script.onerror = reject;
    document.body.appendChild(script);
  });

  return driverLoadPromise;
}

function hasSeenBookingTour() {
  if (!hasWindow()) return true;

  return localStorage.getItem(BOOKING_TOUR_STORAGE_KEY) === "true";
}

function markBookingTourSeen() {
  if (!hasWindow()) return;

  localStorage.setItem(BOOKING_TOUR_STORAGE_KEY, "true");
}

function dispatchTourUiEvent(eventName) {
  if (!hasWindow()) return;

  window.dispatchEvent(new CustomEvent(eventName));
}

function waitForUiFrame() {
  if (!hasWindow()) return Promise.resolve();

  return new Promise((resolve) => {
    window.setTimeout(resolve, 80);
  });
}

function getResponsiveSide(preferred = "left") {
  if (!hasWindow()) return preferred;

  return window.matchMedia("(max-width: 720px)").matches ? "bottom" : preferred;
}

function getAvailableElement(selector) {
  const element = document.querySelector(selector);

  if (!(element instanceof HTMLElement)) return null;

  const styles = window.getComputedStyle(element);
  const isVisible =
    styles.display !== "none" &&
    styles.visibility !== "hidden" &&
    element.getClientRects().length > 0;

  return isVisible ? element : null;
}

async function waitForBookingTargets() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const hasAnyTarget = Object.values(TOUR_SELECTORS).some(getAvailableElement);

    if (hasAnyTarget) return true;

    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  return false;
}

function buildBookingTourSteps() {
  const steps = [
    {
      popover: {
        title: "Welcome",
        description:
          "Welcome to Bedrock! I'll guide you through booking your apartment.",
      },
    },
  ];

  const targetSteps = [
    {
      selector: TOUR_SELECTORS.checkIn,
      title: "Check-in Date",
      description: "Select the date you want to check in.",
      side: "left",
    },
    {
      selector: TOUR_SELECTORS.checkOut,
      title: "Check-out Date",
      description: "Select the date you want to check out.",
      side: "left",
    },
    {
      selector: TOUR_SELECTORS.guests,
      title: "Number of Guests",
      description: "Choose the number of guests staying.",
      side: "left",
    },
    {
      selector: TOUR_SELECTORS.policy,
      title: "Terms and Cancellation",
      description:
        "Please read and accept the residence and cancellation policy.",
      side: "left",
    },
    {
      selector: TOUR_SELECTORS.book,
      title: "Book Button",
      description: "Everything is ready. Click here to continue.",
      side: "top",
    },
  ];

  targetSteps.forEach((step) => {
    const element = getAvailableElement(step.selector);

    if (!element) return;

    steps.push({
      element,
      popover: {
        title: step.title,
        description: step.description,
        side: getResponsiveSide(step.side),
        align: "center",
      },
    });
  });

  return steps;
}

export function requestBookingTour({ force = true } = {}) {
  if (!hasWindow()) return;

  dispatchTourUiEvent(BOOKING_TOUR_CLOSE_CHAT_EVENT);
  window.dispatchEvent(
    new CustomEvent(BOOKING_TOUR_EVENT, {
      detail: { force },
    }),
  );
}

export async function startBookingTour({ force = false } = {}) {
  if (!hasWindow()) return false;
  if (!force && hasSeenBookingTour()) return false;

  dispatchTourUiEvent(BOOKING_TOUR_CLOSE_CHAT_EVENT);
  await waitForUiFrame();
  await waitForBookingTargets();

  let driverFactory;

  try {
    driverFactory = await loadDriver();
  } catch {
    return false;
  }

  const steps = buildBookingTourSteps();

  if (!driverFactory || steps.length <= 1) return false;

  activeDriver?.destroy?.();
  markBookingTourSeen();

  activeDriver = driverFactory({
    showProgress: true,
    animate: true,
    allowClose: true,
    overlayOpacity: 0.58,
    stagePadding: 8,
    popoverClass: "bedrock-driver-popover",
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: "Done",
    onDestroyed: () => {
      dispatchTourUiEvent(BOOKING_TOUR_INACTIVE_EVENT);
      activeDriver = null;
    },
    steps,
  });
  dispatchTourUiEvent(BOOKING_TOUR_ACTIVE_EVENT);
  activeDriver.drive();

  return true;
}
