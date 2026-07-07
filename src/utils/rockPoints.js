function getPathValue(source, path) {
  return String(path || "")
    .split(".")
    .reduce((current, part) => current?.[part], source);
}

function toNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const numericValue = Number(value.replace(/,/g, "").replace(/[^\d.-]/g, ""));

    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function pickNumber(sources, paths) {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;

    for (const path of paths) {
      const value = getPathValue(source, path);
      const numericValue = toNumber(value);

      if (numericValue > 0) return numericValue;
    }
  }

  return 0;
}

const balancePaths = [
  "points",
  "balance",
  "available",
  "available_points",
  "availablePoints",
  "total_points",
  "totalPoints",
  "rock_points",
  "rockPoints",
  "rocks",
  "available_rocks",
  "availableRocks",
  "data.points",
  "data.balance",
  "data.available",
  "data.available_points",
  "data.availablePoints",
  "data.rock_points",
  "data.rockPoints",
  "data.available_rocks",
  "data.availableRocks",
  "summary.points",
  "summary.balance",
  "summary.available_points",
  "summary.available_rocks",
];

const discountValuePaths = [
  "discount_value",
  "discountValue",
  "available_discount_value",
  "availableDiscountValue",
  "redemption_value",
  "redemptionValue",
  "naira_value",
  "nairaValue",
  "cash_value",
  "cashValue",
  "data.discount_value",
  "data.discountValue",
  "data.available_discount_value",
  "data.availableDiscountValue",
  "data.redemption_value",
  "data.redemptionValue",
  "data.naira_value",
  "data.nairaValue",
  "data.cash_value",
  "data.cashValue",
  "summary.discount_value",
  "summary.discountValue",
  "summary.available_discount_value",
  "summary.availableDiscountValue",
  "summary.redemption_value",
  "summary.redemptionValue",
  "summary.naira_value",
  "summary.nairaValue",
  "summary.cash_value",
  "summary.cashValue",
];

export function getRockPointSummary(...sources) {
  const balance = Math.max(0, pickNumber(sources, balancePaths));
  const explicitDiscountValue = Math.max(
    0,
    pickNumber(sources, discountValuePaths),
  );
  const discountValue = explicitDiscountValue || balance;

  return {
    balance,
    discountValue,
    canUse: discountValue > 0,
  };
}

export function formatRockPoints(value) {
  return toNumber(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
