import { useRef, useState } from "react";
import {
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiCreditCard,
  FiHeart,
  FiMinus,
  FiPackage,
  FiPlus,
  FiShare2,
  FiStar,
} from "react-icons/fi";
import { FaUniversity } from "react-icons/fa";
import AppImage from "../../components/AppImage";
import {
  calculateFoodOrderTotals,
  formatFoodDeliveryTime,
  getDefaultFoodDeliveryValue,
} from "../../utils/foodOrders";
import { formatRockPoints } from "../../utils/rockPoints";
import "./ShopFoodPage.css";

const foodCategoryFilters = [
  { id: "all", label: "All Menu" },
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
];

const shopCategoryFilters = [
  { id: "all", label: "All Items" },
  { id: "toiletries", label: "Toiletries" },
  { id: "personal-care", label: "Personal Care" },
  { id: "essentials", label: "Essentials" },
];

const serviceCategoryFilters = [
  { id: "all", label: "All Services" },
  { id: "laundry", label: "Laundry" },
  { id: "massage", label: "Massage" },
  { id: "ps5-rentals", label: "PS5 Rentals" },
];

const requestCategoryFilters = [
  { id: "all", label: "All Requests" },
  { id: "request", label: "Request" },
];

const pageContentByVariant = {
  food: {
    title: "Food",
    filters: foodCategoryFilters,
    items: [],
    heroImages: [],
    actionLabel: "Add meal",
    detailActionLabel: "Proceed to payment",
    itemLabel: "meal",
    unitLabel: "plate",
    orderCardTitle: "",
  },
  toiletries: {
    title: "Toiletries",
    filters: shopCategoryFilters,
    items: [],
    heroImages: [],
    actionLabel: "Add item",
    detailActionLabel: "Checkout",
    itemLabel: "item",
    unitLabel: "item",
    orderCardTitle: "Check out",
    checkoutStyle: "cart",
  },
  services: {
    title: "Services",
    filters: serviceCategoryFilters,
    items: [],
    heroImages: [],
    actionLabel: "Book service",
    detailActionLabel: "Checkout",
    itemLabel: "service",
    unitLabel: "service",
    orderCardTitle: "Check out",
  },
  requests: {
    title: "Request",
    filters: requestCategoryFilters,
    items: [],
    heroImages: [],
    actionLabel: "Make request",
    detailActionLabel: "Checkout",
    itemLabel: "request",
    unitLabel: "request",
    orderCardTitle: "Check out",
  },
};

function formatCurrency(value) {
  return `NGN${Number(value || 0).toLocaleString()}`;
}

function getPageContent(variant) {
  if (variant === "requests") {
    return pageContentByVariant.requests;
  }

  if (variant === "services") {
    return pageContentByVariant.services;
  }

  if (variant === "toiletries" || variant === "shop") {
    return pageContentByVariant.toiletries;
  }

  return pageContentByVariant.food;
}

function pluralizeUnit(unitLabel, amount) {
  return amount === 1 ? unitLabel : `${unitLabel}s`;
}

function toFilterId(value) {
  return value
    ? String(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    : "";
}

function toTitleCase(value) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getItemFilterValues(item) {
  return [
    item.category,
    ...(Array.isArray(item.tags) ? item.tags : []),
  ].filter(Boolean);
}

function buildFilters(defaultFilters, items) {
  const normalizedDefaults = defaultFilters
    .map((filter) => {
      const label = filter.label || filter.name || filter.title || "All";
      const rawId = filter.id || filter.value || filter.slug || label;
      const id = /^all\b/i.test(String(label)) ? "all" : toFilterId(rawId);

      return { id, label };
    })
    .filter((filter) => filter.id && filter.label);
  const nextFilters = [];
  const seen = new Set();

  normalizedDefaults.forEach((filter) => {
    if (seen.has(filter.id)) return;

    seen.add(filter.id);
    nextFilters.push(filter);
  });

  if (!seen.has("all")) {
    seen.add("all");
    nextFilters.unshift({ id: "all", label: "All" });
  }

  items.forEach((item) => {
    getItemFilterValues(item).forEach((value) => {
      const id = toFilterId(value);

      if (!id || seen.has(id)) return;

      seen.add(id);
      nextFilters.push({
        id,
        label: toTitleCase(value),
      });
    });
  });

  return nextFilters;
}

function itemMatchesFilter(item, activeFilter) {
  if (activeFilter === "all") return true;

  return getItemFilterValues(item).some(
    (value) => toFilterId(value) === activeFilter,
  );
}

function BackButton({ onClick }) {
  return (
    <button type="button" className="shop-food-back" onClick={onClick}>
      <FiArrowLeft />
      <span>Back</span>
    </button>
  );
}

function Toggle({ checked, onClick, disabled = false }) {
  return (
    <button
      type="button"
      className={`shop-food-toggle ${checked ? "shop-food-toggle--on" : ""}`}
      onClick={onClick}
      aria-pressed={checked}
      disabled={disabled}
    >
      <span />
    </button>
  );
}

function PolicyAgreementText({ onOpenPolicy }) {
  if (!onOpenPolicy) {
    return <p>I agree to residence &amp; cancellation policy</p>;
  }

  return (
    <button
      type="button"
      className="shop-food-policy-link"
      onClick={onOpenPolicy}
    >
      I agree to residence &amp; cancellation policy
    </button>
  );
}

function Rating({ value }) {
  return (
    <span className="shop-food-rating">
      <FiStar />
      <span>{value}</span>
    </span>
  );
}

function FoodTags({ tags }) {
  return (
    <span className="shop-food-tags">
      {tags.map((tag) => (
        <span key={tag}>{tag}</span>
      ))}
    </span>
  );
}

function GuestCounter({ value, onChange }) {
  return (
    <div className="shop-food-counter">
      <span>Number of guests</span>

      <div className="shop-food-counter__actions">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, value - 1))}
          aria-label="Reduce guests"
        >
          <FiMinus />
        </button>
        <strong>{value}</strong>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          aria-label="Increase guests"
        >
          <FiPlus />
        </button>
      </div>
    </div>
  );
}

function FoodCard({ item, onSelect, actionLabel, unitLabel }) {
  const isAvailable = item.isAvailable !== false;
  const itemImage = item.image || "";

  return (
    <article
      className={`shop-food-card ${
        isAvailable ? "" : "shop-food-card--unavailable"
      }`}
    >
      <div className="shop-food-card__image-wrap">
        <ShopItemImage src={itemImage} alt={item.title} />
        <span className="shop-food-card__badge">
          {isAvailable ? "Available" : "Unavailable"}
        </span>
      </div>

      <div className="shop-food-card__body">
        <div className="shop-food-card__top">
          <div>
            <h3>{item.title}</h3>
            <FoodTags tags={item.tags} />
          </div>

          <Rating value={item.rating} />
        </div>

        <p>{item.description}</p>
        <small>{item.preparationTime}</small>

        <div className="shop-food-card__bottom">
          <button
            type="button"
            onClick={() => onSelect(item)}
            disabled={!isAvailable}
          >
            <FiPlus />
            <span>{isAvailable ? actionLabel : "Unavailable"}</span>
          </button>

          <strong>
            {formatCurrency(item.price)}
            <span>/per {unitLabel}</span>
          </strong>
        </div>
      </div>
    </article>
  );
}

function ShopItemImage({ src, alt, className = "" }) {
  const [failedSrc, setFailedSrc] = useState("");

  if (src && failedSrc !== src) {
    return (
      <AppImage
        className={className}
        src={src}
        fallbackSrc=""
        alt={alt}
        onError={() => setFailedSrc(src)}
      />
    );
  }

  return (
    <div
      className={`${className} shop-food-image-placeholder`.trim()}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : "true"}
    >
      <FiPackage aria-hidden="true" />
      {alt ? <span>{alt}</span> : null}
    </div>
  );
}

function SummaryBreakdown({
  food,
  orderDetails,
  onToggleRockPoints,
  unitLabel,
  rockPointSummary = {},
}) {
  const availableRockPointBalance = Number(rockPointSummary.balance || 0);
  const availableRockPointValue = Number(rockPointSummary.discountValue || 0);
  const canApplyRockPoints = availableRockPointValue > 0;
  const isUsingRockPoints = Boolean(
    orderDetails.useRockPoints && canApplyRockPoints,
  );
  const rockPointBalanceLabel = formatRockPoints(availableRockPointBalance);
  const totals = calculateFoodOrderTotals(
    food.price,
    orderDetails.guests,
    isUsingRockPoints,
    availableRockPointValue,
  );

  return (
    <div className="shop-food-breakdown">
      <div>
        <span>
          {formatCurrency(food.price)} * {totals.guests}{" "}
          {pluralizeUnit(unitLabel, totals.guests)}
        </span>
        <strong>{totals.subtotal.toLocaleString()}</strong>
      </div>

      <div>
        <span>Refundable caution Fee</span>
        <strong>{totals.cautionFee.toLocaleString()}</strong>
      </div>

      <div>
        <span className="shop-food-rock-point-label">
          Rock-point
          <small>RK {rockPointBalanceLabel} available</small>
        </span>
        <strong>{totals.rockPointValue.toLocaleString()}</strong>
        <Toggle
          checked={isUsingRockPoints}
          disabled={!canApplyRockPoints}
          onClick={onToggleRockPoints}
        />
      </div>

      <div className="shop-food-breakdown__total">
        <span>Total</span>
        <strong>NGN{totals.total.toLocaleString()}</strong>
      </div>
    </div>
  );
}

function PaymentOption({ active, disabled = false, icon, label, helper, onClick }) {
  const Icon = icon;

  return (
    <button
      type="button"
      className={`shop-food-payment-option ${
        active ? "shop-food-payment-option--active" : ""
      } ${disabled ? "shop-food-payment-option--disabled" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
    >
      <span>
        <Icon />
        <strong>
          {label}
          {helper && <em>{helper}</em>}
        </strong>
      </span>
      <i />
    </button>
  );
}

function ShopCheckoutCard({
  food,
  orderDetails,
  totals,
  unitLabel,
  primaryLabel,
  onPrimary,
  onCancel,
  onQuantityChange,
  onTogglePolicy,
  onOpenPolicy,
  primaryDisabled = false,
  showCancel = false,
  showPolicy = false,
}) {
  const quantity = Math.max(1, Number(orderDetails.guests) || 1);

  return (
    <aside className="shop-checkout-card">
      <h2>Check out</h2>

      <div className="shop-checkout-cart">
        <div className="shop-checkout-cart__head">
          <span>Your cart</span>
          <strong>{String(quantity).padStart(2, "0")}</strong>
        </div>

        <div className="shop-checkout-cart__row">
          <span>{food.title}</span>
          <div className="shop-checkout-cart__quantity">
            <button
              type="button"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              aria-label={`Reduce ${food.title} quantity`}
            >
              <FiMinus />
            </button>
            <strong>{String(quantity).padStart(2, "0")}</strong>
            <button
              type="button"
              onClick={() => onQuantityChange(quantity + 1)}
              aria-label={`Increase ${food.title} quantity`}
            >
              <FiPlus />
            </button>
          </div>
        </div>
      </div>

      <div className="shop-checkout-summary">
        <div>
          <span>
            {formatCurrency(food.price)} * {quantity}{" "}
            {pluralizeUnit(unitLabel, quantity)}
          </span>
          <strong>{totals.subtotal.toLocaleString()}</strong>
        </div>
        <div>
          <span>Refundable caution Fee</span>
          <strong>{totals.cautionFee.toLocaleString()}</strong>
        </div>
        <div className="shop-checkout-summary__total">
          <span>Total</span>
          <strong>NGN{totals.total.toLocaleString()}</strong>
        </div>
      </div>

      {showPolicy && (
        <div className="shop-food-policy">
          <PolicyAgreementText onOpenPolicy={onOpenPolicy} />
          <Toggle
            checked={orderDetails.agreedToPolicy}
            onClick={onTogglePolicy}
          />
        </div>
      )}

      <button
        type="button"
        className="shop-food-primary-button"
        onClick={onPrimary}
        disabled={primaryDisabled || (showPolicy && !orderDetails.agreedToPolicy)}
      >
        {primaryLabel}
      </button>

      {showCancel && (
        <button
          type="button"
          className="shop-checkout-card__cancel"
          onClick={onCancel}
        >
          Cancel
        </button>
      )}
    </aside>
  );
}

export default function ShopFoodPage({
  variant = "food",
  mode = "list",
  foodItem,
  items,
  filters,
  orderDetails,
  onFoodSelect,
  onOrderChange,
  isLoading = false,
  loadError = "",
  onBackToFood,
  onProceedToReview,
  onProceedToPayment,
  onBackToReview,
  onPaymentContinue,
  onFinishOrder,
  onOpenPolicy,
  rockPointSummary = {},
}) {
  const [filterState, setFilterState] = useState({
    variant: "food",
    activeFilter: "all",
  });
  const [pendingAction, setPendingAction] = useState("");
  const deliveryInputRef = useRef(null);
  const hasBackendItems = Array.isArray(items);
  const pageContent = {
    ...getPageContent(variant),
    ...(hasBackendItems ? { items, featuredItems: items } : {}),
  };
  const filterOptions =
    Array.isArray(filters) && filters.length ? filters : pageContent.filters;
  const usesCartCheckout = pageContent.checkoutStyle === "cart";
  const categoryFilters = buildFilters(filterOptions, pageContent.items);
  const activeFilter =
    filterState.variant === variant ? filterState.activeFilter : "all";
  const visibleItems =
    activeFilter === "all"
      ? pageContent.featuredItems || pageContent.items
      : pageContent.items.filter((item) => itemMatchesFilter(item, activeFilter));
  const backendHeroImages = pageContent.items
    .filter((item) => item.image)
    .slice(0, 2)
    .map((item) => ({
      src: item.image,
      alt: item.title,
    }));
  const heroImages = hasBackendItems
    ? backendHeroImages
    : pageContent.heroImages;
  const selectedFood = foodItem || pageContent.items[0] || null;
  const selectedFoodDetailImage =
    selectedFood?.detailImage ||
    selectedFood?.image ||
    "";
  const safeOrderDetails = {
    apartmentNumber: "",
    deliveryTime: getDefaultFoodDeliveryValue(),
    guests: 1,
    note: "",
    paymentMethod: "card",
    agreedToPolicy: false,
    useRockPoints: false,
    ...orderDetails,
  };
  const availableRockPointValue = Number(rockPointSummary.discountValue || 0);
  const isUsingRockPoints = Boolean(
    safeOrderDetails.useRockPoints && availableRockPointValue > 0,
  );
  const totals = calculateFoodOrderTotals(
    selectedFood?.price || 0,
    safeOrderDetails.guests,
    isUsingRockPoints,
    availableRockPointValue,
  );
  const canProceed = Boolean(
    usesCartCheckout
      ? safeOrderDetails.guests > 0 && safeOrderDetails.agreedToPolicy
      : safeOrderDetails.apartmentNumber.trim() &&
          safeOrderDetails.deliveryTime &&
          safeOrderDetails.guests > 0 &&
          safeOrderDetails.agreedToPolicy,
  );

  function updateOrder(field, value) {
    onOrderChange?.(field, value);
  }

  function toggleRockPoints() {
    updateOrder("useRockPoints", !isUsingRockPoints);
  }

  function openDateTimePicker() {
    if (!deliveryInputRef.current) return;

    if (typeof deliveryInputRef.current.showPicker === "function") {
      deliveryInputRef.current.showPicker();
      return;
    }

    deliveryInputRef.current.focus();
  }

  async function runPendingAction(actionId, action) {
    if (pendingAction) return;

    setPendingAction(actionId);

    try {
      await action?.();
    } finally {
      setPendingAction("");
    }
  }

  if (mode !== "list" && !selectedFood) {
    return (
      <section className="shop-food-flow">
        <div className="shop-food-panel">
          <div className="shop-food-empty">
            <strong>{isLoading ? "Loading item" : "Item unavailable"}</strong>
            <p>
              {isLoading
                ? "Getting the latest item details from Bedrock."
                : loadError || "Please go back and choose an available item."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (mode === "detail") {
    return (
      <section className="shop-food-flow">
        <div className="shop-food-panel shop-food-panel--detail">
          <div className="shop-food-detail__heading">
            <div>
              <h1>{selectedFood.title}</h1>
              <div className="shop-food-detail__meta">
                <FoodTags tags={selectedFood.tags} />
                <Rating value={selectedFood.rating} />
              </div>
              <p>{selectedFood.description}</p>
            </div>

            <div className="shop-food-detail__actions">
              <button type="button" aria-label={`Share ${pageContent.itemLabel}`}>
                <FiShare2 />
              </button>
              <button type="button" aria-label={`Save ${pageContent.itemLabel}`}>
                <FiHeart />
              </button>
            </div>
          </div>

          <div className="shop-food-detail__layout">
            <ShopItemImage
              className="shop-food-detail__image"
              src={selectedFoodDetailImage}
              alt={selectedFood.title}
            />

            {usesCartCheckout ? (
              <ShopCheckoutCard
                food={selectedFood}
                orderDetails={safeOrderDetails}
                totals={totals}
                unitLabel={pageContent.unitLabel}
                primaryLabel={
                  pendingAction === "detail"
                    ? "Please wait..."
                    : pageContent.detailActionLabel
                }
                onPrimary={() => runPendingAction("detail", onProceedToReview)}
                onCancel={onBackToFood}
                onQuantityChange={(value) => updateOrder("guests", value)}
                primaryDisabled={pendingAction === "detail"}
                showCancel
              />
            ) : (
              <aside className="shop-food-order-card">
                {pageContent.orderCardTitle && (
                  <h2 className="shop-food-order-card__title">
                    {pageContent.orderCardTitle}
                  </h2>
                )}

                <strong className="shop-food-order-card__price">
                  {formatCurrency(selectedFood.price)}
                  <span>/per {pageContent.unitLabel}</span>
                </strong>

                <label className="shop-food-field">
                  <span>Apartment Number</span>
                  <input
                    type="text"
                    placeholder="e.g Joe doe"
                    value={safeOrderDetails.apartmentNumber}
                    onChange={(event) =>
                      updateOrder("apartmentNumber", event.target.value)
                    }
                  />
                </label>

                <label className="shop-food-field">
                  <span>(Order) Delivery time</span>
                  <div
                    className="shop-food-date-input"
                    onClick={openDateTimePicker}
                  >
                    <FiCalendar />
                    <input
                      ref={deliveryInputRef}
                      type="datetime-local"
                      min={getDefaultFoodDeliveryValue()}
                      value={safeOrderDetails.deliveryTime}
                      onChange={(event) =>
                        updateOrder("deliveryTime", event.target.value)
                      }
                    />
                  </div>
                </label>

                <div className="shop-food-field">
                  <span>Number of Guests</span>
                  <GuestCounter
                    value={safeOrderDetails.guests}
                    onChange={(value) => updateOrder("guests", value)}
                  />
                </div>

                <label className="shop-food-field">
                  <span>Add note</span>
                  <textarea
                    placeholder="e.g Joe doe"
                    value={safeOrderDetails.note}
                    onChange={(event) => updateOrder("note", event.target.value)}
                  />
                </label>

                <div className="shop-food-order-card__total-line">
                  <strong>{formatCurrency(selectedFood.price)}</strong>
                  <span>/per {pageContent.unitLabel}</span>
                </div>

                <span className="shop-food-order-card__pill">
                  Free cancellation
                </span>

                <div className="shop-food-policy">
                  <PolicyAgreementText onOpenPolicy={onOpenPolicy} />
                  <Toggle
                    checked={safeOrderDetails.agreedToPolicy}
                    onClick={() =>
                      updateOrder("agreedToPolicy", !safeOrderDetails.agreedToPolicy)
                    }
                  />
                </div>

                <button
                  type="button"
                  className="shop-food-primary-button"
                  onClick={() => runPendingAction("detail", onProceedToReview)}
                  disabled={!canProceed || pendingAction === "detail"}
                >
                  {pendingAction === "detail"
                    ? "Please wait..."
                    : pageContent.detailActionLabel}
                </button>
              </aside>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (mode === "review") {
    return (
      <section className="shop-food-flow">
        <div className="shop-food-panel shop-food-panel--review">
          <button
            type="button"
            className="shop-food-icon-back"
            onClick={onBackToFood}
            aria-label={`Back to ${pageContent.itemLabel} details`}
          >
            <FiArrowLeft />
          </button>

          <h1 className="shop-food-review-title">Booking review and summary</h1>

          <div className="shop-food-review__heading">
            <div>
              <h2>{selectedFood.title}</h2>
              <div className="shop-food-detail__meta">
                <FoodTags tags={selectedFood.tags} />
                <Rating value={selectedFood.rating} />
              </div>
              <p>{selectedFood.description}</p>
            </div>

            <div className="shop-food-detail__actions">
              <button type="button" aria-label={`Share ${pageContent.itemLabel}`}>
                <FiShare2 />
              </button>
              <button type="button" aria-label={`Save ${pageContent.itemLabel}`}>
                <FiHeart />
              </button>
            </div>
          </div>

          <div className="shop-food-review__layout">
            <ShopItemImage
              className="shop-food-review__image"
              src={selectedFoodDetailImage}
              alt={selectedFood.title}
            />

            <aside className="shop-food-summary-card">
              <div className="shop-food-summary-box">
                <div>
                  <span>Apartment Number</span>
                  <strong>{safeOrderDetails.apartmentNumber || "Not set"}</strong>
                </div>
                <div>
                  <span>Order Delivery time</span>
                  <strong>
                    {formatFoodDeliveryTime(safeOrderDetails.deliveryTime)}
                  </strong>
                </div>
                <div>
                  <span>Number of guests</span>
                  <strong>
                    {String(safeOrderDetails.guests).padStart(2, "0")}
                  </strong>
                </div>
                <div>
                  <span>Note</span>
                  <strong>{safeOrderDetails.note || "No note"}</strong>
                </div>
              </div>

              <SummaryBreakdown
                food={selectedFood}
                orderDetails={safeOrderDetails}
                onToggleRockPoints={toggleRockPoints}
                unitLabel={pageContent.unitLabel}
                rockPointSummary={rockPointSummary}
              />

              <div className="shop-food-policy">
                <PolicyAgreementText onOpenPolicy={onOpenPolicy} />
                <Toggle
                  checked={safeOrderDetails.agreedToPolicy}
                  onClick={() =>
                    updateOrder("agreedToPolicy", !safeOrderDetails.agreedToPolicy)
                  }
                />
              </div>

              <button
                type="button"
                className="shop-food-primary-button"
                onClick={() => runPendingAction("review", onProceedToPayment)}
                disabled={!safeOrderDetails.agreedToPolicy || pendingAction === "review"}
              >
                {pendingAction === "review" ? "Please wait..." : "Continue"}
              </button>
            </aside>
          </div>
        </div>
      </section>
    );
  }

  if (mode === "payment") {
    return (
      <section className="shop-food-flow shop-food-flow--payment">
        <div className="shop-food-panel shop-food-panel--payment">
          <BackButton onClick={onBackToReview} />

          <div className="shop-food-payment-layout">
            <div className="shop-food-payment-methods">
              <h1>Choose a payment method</h1>

              <div className="shop-food-payment-list">
                <PaymentOption
                  icon={FiCreditCard}
                  label="Card or debit card"
                  active={safeOrderDetails.paymentMethod === "card"}
                  onClick={() => updateOrder("paymentMethod", "card")}
                />
                <PaymentOption
                  icon={FaUniversity}
                  label="Bank Transfer"
                  helper="Coming soon"
                  disabled
                  active={false}
                  onClick={() => {}}
                />
              </div>
            </div>

            {usesCartCheckout ? (
              <ShopCheckoutCard
                food={selectedFood}
                orderDetails={safeOrderDetails}
                totals={totals}
                unitLabel={pageContent.unitLabel}
                primaryLabel={
                  pendingAction === "payment"
                    ? "Processing..."
                    : `Pay NGN ${totals.payable.toLocaleString()}`
                }
                onPrimary={() => runPendingAction("payment", onPaymentContinue)}
                onQuantityChange={(value) => updateOrder("guests", value)}
                onTogglePolicy={() =>
                  updateOrder("agreedToPolicy", !safeOrderDetails.agreedToPolicy)
                }
                onOpenPolicy={onOpenPolicy}
                primaryDisabled={pendingAction === "payment"}
                showPolicy
              />
            ) : (
              <aside className="shop-food-payment-card">
                <div className="shop-food-payment-card__preview">
                  <ShopItemImage
                    className="shop-food-payment-card__image"
                    src={selectedFoodDetailImage}
                    alt={selectedFood.title}
                  />
                  <div>
                    <h3>{selectedFood.title}</h3>
                    <p>Delivery to {safeOrderDetails.apartmentNumber}</p>
                    <Rating value={selectedFood.rating} />
                  </div>
                </div>

                <label className="shop-food-field">
                  <span>Apartment Number</span>
                  <input
                    type="text"
                    value={safeOrderDetails.apartmentNumber}
                    onChange={(event) =>
                      updateOrder("apartmentNumber", event.target.value)
                    }
                  />
                </label>

                <label className="shop-food-field">
                  <span>Order Delivery time</span>
                  <div
                    className="shop-food-date-input"
                    onClick={openDateTimePicker}
                  >
                    <FiCalendar />
                    <input
                      ref={deliveryInputRef}
                      type="datetime-local"
                      min={getDefaultFoodDeliveryValue()}
                      value={safeOrderDetails.deliveryTime}
                      onChange={(event) =>
                        updateOrder("deliveryTime", event.target.value)
                      }
                    />
                  </div>
                </label>

                <div className="shop-food-field">
                  <span>Number of Guests</span>
                  <GuestCounter
                    value={safeOrderDetails.guests}
                    onChange={(value) => updateOrder("guests", value)}
                  />
                </div>

                <label className="shop-food-field">
                  <span>Enter Promo</span>
                  <input type="text" placeholder="Type promo code" />
                </label>

                <SummaryBreakdown
                  food={selectedFood}
                  orderDetails={safeOrderDetails}
                  onToggleRockPoints={toggleRockPoints}
                  unitLabel={pageContent.unitLabel}
                  rockPointSummary={rockPointSummary}
                />

                <div className="shop-food-policy">
                  <PolicyAgreementText onOpenPolicy={onOpenPolicy} />
                  <Toggle
                    checked={safeOrderDetails.agreedToPolicy}
                    onClick={() =>
                      updateOrder("agreedToPolicy", !safeOrderDetails.agreedToPolicy)
                    }
                  />
                </div>

                <button
                  type="button"
                  className="shop-food-primary-button"
                  onClick={() => runPendingAction("payment", onPaymentContinue)}
                  disabled={!canProceed || pendingAction === "payment"}
                >
                  {pendingAction === "payment"
                    ? "Processing..."
                    : `Pay NGN ${totals.payable.toLocaleString()}`}
                </button>
              </aside>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (mode === "status") {
    return (
      <section className="shop-food-flow shop-food-flow--status">
        <div className="shop-food-panel shop-food-panel--status">
          <article className="shop-food-status-card">
            <ShopItemImage
              className="shop-food-status-card__image"
              src={selectedFoodDetailImage}
              alt={selectedFood.title}
            />

            <div className="shop-food-status-card__body">
              <div className="shop-food-status-card__top">
                <div>
                  <h2>{selectedFood.title}</h2>
                  <FoodTags tags={selectedFood.tags} />
                </div>
                <Rating value={selectedFood.rating} />
              </div>

              <p>{selectedFood.description}</p>
              <small>{selectedFood.preparationTime}</small>

              <div className="shop-food-timeline">
                {["Order Received", "Payment Received", "Order in process"].map(
                  (item) => (
                    <div className="shop-food-timeline__item" key={item}>
                      <FiCheckCircle />
                      <span>
                        <strong>{item}</strong>
                        <em>{formatFoodDeliveryTime(safeOrderDetails.deliveryTime)}</em>
                      </span>
                    </div>
                  ),
                )}
              </div>

              <button
                type="button"
                className="shop-food-primary-button"
                onClick={() => runPendingAction("finish", onFinishOrder)}
                disabled={pendingAction === "finish"}
              >
                {pendingAction === "finish"
                  ? "Please wait..."
                  : "Let's create an experience"}
              </button>
            </div>
          </article>
        </div>
      </section>
    );
  }

  return (
    <section className="shop-food-flow">
      <div className="shop-food-panel">
        <h1 className="shop-food-title">{pageContent.title}</h1>

        {!isLoading && pageContent.items.length > 0 && (
          <>
            <div className="shop-food-filters">
              {categoryFilters.map((filter) => (
                <button
                  type="button"
                  className={`shop-food-filter ${
                    activeFilter === filter.id ? "shop-food-filter--active" : ""
                  }`}
                  onClick={() =>
                    setFilterState({
                      variant,
                      activeFilter: filter.id,
                    })
                  }
                  key={filter.id}
                >
                  <span>{filter.label}</span>
                </button>
              ))}
            </div>

            {heroImages.length > 0 && (
              <div className="shop-food-hero-grid">
                {heroImages.map((image) => (
                  <ShopItemImage
                    className="shop-food-hero-image"
                    src={image.src}
                    alt={image.alt}
                    key={image.alt}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {isLoading ? (
          <div className="shop-food-empty">
            <strong>Loading {pageContent.title.toLowerCase()}</strong>
            <p>Getting the latest items from Bedrock.</p>
          </div>
        ) : visibleItems.length > 0 ? (
          <div className="shop-food-grid">
            {visibleItems.map((item) => (
              <FoodCard
                item={item}
                onSelect={onFoodSelect}
                actionLabel={pageContent.actionLabel}
                unitLabel={pageContent.unitLabel}
                key={item.id}
              />
            ))}
          </div>
        ) : (
          <div className="shop-food-empty">
            <strong>No items found</strong>
            <p>
              {loadError || "This category does not have available items yet."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
