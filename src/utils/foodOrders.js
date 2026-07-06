const CAUTION_FEE = 100000;
const ROCK_POINT_VALUE = 12500;

function toLocalDateTimeValue(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

export function getDefaultFoodDeliveryValue() {
  const nextHour = new Date();
  nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
  return toLocalDateTimeValue(nextHour);
}

export function createDefaultFoodOrderDetails() {
  return {
    apartmentNumber: "",
    deliveryTime: getDefaultFoodDeliveryValue(),
    guests: 1,
    note: "",
    paymentMethod: "card",
    agreedToPolicy: false,
    useRockPoints: true,
  };
}

export function calculateFoodOrderTotals(
  price,
  guests,
  useRockPoints = true,
) {
  const safePrice = Number(price) || 0;
  const safeGuests = Math.max(1, Number(guests) || 1);
  const subtotal = safePrice * safeGuests;
  const taxesAndFees = 0;
  const cautionFee = CAUTION_FEE;
  const rockPointValue = ROCK_POINT_VALUE;
  const total = subtotal + taxesAndFees + cautionFee;
  const payable = Math.max(0, total - (useRockPoints ? rockPointValue : 0));

  return {
    guests: safeGuests,
    subtotal,
    taxesAndFees,
    cautionFee,
    rockPointValue,
    total,
    payable,
  };
}

export function formatFoodDeliveryTime(value) {
  if (!value) return "Choose delivery time";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Choose delivery time";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
