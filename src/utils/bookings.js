const DAY_IN_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_CAUTION_FEE = 50000;

function toCurrencyNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const cleanedValue = value.replace(/,/g, "").replace(/[^\d.-]/g, "");
    const parsedValue = Number(cleanedValue);

    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function createDateFromValue(dateValue) {
  if (!dateValue) return null;

  if (dateValue instanceof Date) {
    if (Number.isNaN(dateValue.getTime())) return null;

    return new Date(
      dateValue.getFullYear(),
      dateValue.getMonth(),
      dateValue.getDate(),
    );
  }

  const value = String(dateValue).trim();
  const isoDateParts = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  const [year, month, day] = isoDateParts
    ? isoDateParts.slice(1).map(Number)
    : value.split("-").map(Number);

  if (!year || !month || !day) {
    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) return null;

    return new Date(
      parsedDate.getFullYear(),
      parsedDate.getMonth(),
      parsedDate.getDate(),
    );
  }

  return new Date(year, month - 1, day);
}

export function formatDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getTodayDateValue() {
  return formatDateValue(new Date());
}

export function addDays(dateValue, numberOfDays) {
  const baseDate = createDateFromValue(dateValue) || new Date();

  baseDate.setDate(baseDate.getDate() + numberOfDays);

  return formatDateValue(baseDate);
}

export function ensureCheckoutDate(checkIn, checkOut) {
  if (!checkIn) {
    return checkOut || addDays(getTodayDateValue(), 1);
  }

  const minimumCheckoutDate = addDays(checkIn, 1);

  if (!checkOut || checkOut <= checkIn) {
    return minimumCheckoutDate;
  }

  return checkOut;
}

export function calculateNights(checkIn, checkOut) {
  const startDate = createDateFromValue(checkIn);
  const endDate = createDateFromValue(checkOut);

  if (!startDate || !endDate) {
    return 0;
  }

  return Math.max(0, Math.round((endDate - startDate) / DAY_IN_MS));
}

export function calculateBookingTotals(
  nightlyRate,
  checkIn,
  checkOut,
  useRockPoints = false,
  adjustments = {},
) {
  const nights = Math.max(1, calculateNights(checkIn, checkOut) || 1);
  const safeNightlyRate = toCurrencyNumber(nightlyRate);
  const subtotal = safeNightlyRate * nights;
  const taxesAndFees = 0;
  const cautionFee = Math.max(
    0,
    toCurrencyNumber(
      adjustments.cautionFee ??
        adjustments.caution_fee ??
        adjustments.refundableCautionFee ??
        adjustments.refundable_caution_fee ??
        DEFAULT_CAUTION_FEE,
    ),
  );
  const total = subtotal + taxesAndFees + cautionFee;
  const availableRockPointValue = Math.max(
    0,
    toCurrencyNumber(
      adjustments.rockPointValue ??
        adjustments.availableRockPointValue ??
        adjustments.rockPointDiscountValue ??
        0,
    ),
  );
  const rockPointValue = useRockPoints
    ? Math.min(availableRockPointValue, total)
    : 0;
  const couponDiscount = Math.max(
    0,
    toCurrencyNumber(
      adjustments.couponDiscount ??
        adjustments.discountAmount ??
        adjustments.discount ??
        0,
    ),
  );
  const payable = Math.max(0, total - rockPointValue - couponDiscount);

  return {
    nights,
    subtotal,
    taxesAndFees,
    cautionFee,
    rockPointValue,
    couponDiscount,
    discountAmount: couponDiscount,
    total,
    payable,
  };
}

export function formatLongDate(dateValue) {
  const date = createDateFromValue(dateValue);

  if (!date) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatShortDate(dateValue) {
  const date = createDateFromValue(dateValue);

  if (!date) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDateRange(checkIn, checkOut) {
  const startDate = formatShortDate(checkIn);
  const endDate = formatShortDate(checkOut);

  if (!startDate && !endDate) return "";
  if (!endDate) return startDate;
  if (!startDate) return endDate;

  return `${startDate} - ${endDate}`;
}

export function createBookingId() {
  return `BK${Math.floor(1000000 + Math.random() * 9000000)}`;
}

export function isPastBooking(checkOut) {
  const checkoutDate = createDateFromValue(checkOut);
  const today = createDateFromValue(getTodayDateValue());

  return Boolean(checkoutDate && today && checkoutDate < today);
}

export function getGuestLabel(guestCount) {
  return `${guestCount} ${guestCount === 1 ? "Guest" : "Guests"}`;
}

export function getNightLabel(nightCount) {
  return `${nightCount} ${nightCount === 1 ? "Night" : "Nights"}`;
}
