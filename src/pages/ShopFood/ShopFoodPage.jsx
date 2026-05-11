import { useRef, useState } from "react";
import {
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiCreditCard,
  FiHeart,
  FiMinus,
  FiPlus,
  FiShare2,
  FiStar,
} from "react-icons/fi";
import { FaUniversity } from "react-icons/fa";
import { foodItems } from "../../data/foodItems";
import { serviceItems } from "../../data/serviceItems";
import { shopItems } from "../../data/shopItems";
import breakfastImage from "../../assets/bookings.jpg";
import foodHeroImage from "../../assets/food-1.jpg";
import foodImage from "../../assets/food.png";
import laundryImage from "../../assets/toiletries.jpg";
import massageImage from "../../assets/massage.jpg";
import ps5Image from "../../assets/ps5-rental.svg";
import requestImage from "../../assets/request.png";
import toiletriesOneImage from "../../assets/toiletries-1.jpg";
import toiletriesTwoImage from "../../assets/toiletries-2.jpg";
import AppImage from "../../components/AppImage";
import {
  calculateFoodOrderTotals,
  formatFoodDeliveryTime,
  getDefaultFoodDeliveryValue,
} from "../../utils/foodOrders";
import "./ShopFoodPage.css";

const foodCategoryFilters = [
  { id: "all", label: "All Menu", image: foodImage },
  { id: "breakfast", label: "Breakfast", image: breakfastImage },
  { id: "lunch", label: "Lunch", image: foodHeroImage },
  { id: "dinner", label: "Dinner", image: foodImage },
];

const shopCategoryFilters = [
  { id: "all", label: "All Items", image: toiletriesOneImage },
  { id: "toiletries", label: "Toiletries", image: toiletriesOneImage },
  { id: "personal-care", label: "Personal Care", image: toiletriesTwoImage },
  { id: "essentials", label: "Essentials", image: toiletriesTwoImage },
];

const serviceCategoryFilters = [
  { id: "all", label: "All Services", image: laundryImage },
  { id: "laundry", label: "Laundry", image: laundryImage },
  { id: "massage", label: "Massage", image: massageImage },
  { id: "ps5-rentals", label: "PS5 Rentals", image: ps5Image },
];

const requestCategoryFilters = [
  { id: "all", label: "All Requests", image: requestImage },
  { id: "request", label: "Request", image: requestImage },
];

const requestItems = serviceItems.filter((item) =>
  item.tags.includes("Request"),
);

const featuredServiceItems = ["laundry", "massage", "ps5-rentals"].flatMap(
  (filterId) =>
    serviceItems
      .filter((item) => item.tags.some((tag) => toFilterId(tag) === filterId))
      .slice(0, 2),
);

const serviceHeroImagesByFilter = {
  all: [
    { src: laundryImage, alt: "Laundry services" },
    { src: laundryImage, alt: "Laundry service setup" },
  ],
  laundry: [
    { src: laundryImage, alt: "Laundry services" },
    { src: laundryImage, alt: "Laundry service setup" },
  ],
  massage: [
    { src: massageImage, alt: "Massage service" },
    { src: massageImage, alt: "Massage therapy session" },
  ],
  "ps5-rentals": [
    { src: ps5Image, alt: "PS5 rental service" },
    { src: ps5Image, alt: "PS5 games rental" },
  ],
};

const pageContentByVariant = {
  food: {
    title: "Food",
    filters: foodCategoryFilters,
    items: foodItems,
    heroImages: [
      { src: foodHeroImage, alt: "Jollof rice and chicken" },
      { src: foodHeroImage, alt: "Jollof rice plate" },
    ],
    actionLabel: "Add meal",
    detailActionLabel: "Proceed to payment",
    itemLabel: "meal",
    unitLabel: "plate",
    orderCardTitle: "",
  },
  toiletries: {
    title: "Toiletries",
    filters: shopCategoryFilters,
    items: shopItems,
    heroImages: [
      { src: toiletriesOneImage, alt: "Toiletries display" },
      { src: toiletriesTwoImage, alt: "Toiletries products" },
    ],
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
    items: serviceItems,
    featuredItems: featuredServiceItems,
    heroImages: [
      { src: laundryImage, alt: "Laundry services" },
      { src: laundryImage, alt: "Laundry service setup" },
    ],
    heroImagesByFilter: serviceHeroImagesByFilter,
    actionLabel: "Book service",
    detailActionLabel: "Checkout",
    itemLabel: "service",
    unitLabel: "service",
    orderCardTitle: "Check out",
  },
  requests: {
    title: "Request",
    filters: requestCategoryFilters,
    items: requestItems,
    heroImages: [
      { src: requestImage, alt: "Request essentials" },
      { src: massageImage, alt: "Service request" },
    ],
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
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function BackButton({ onClick }) {
  return (
    <button type="button" className="shop-food-back" onClick={onClick}>
      <FiArrowLeft />
      <span>Back</span>
    </button>
  );
}

function Toggle({ checked, onClick }) {
  return (
    <button
      type="button"
      className={`shop-food-toggle ${checked ? "shop-food-toggle--on" : ""}`}
      onClick={onClick}
      aria-pressed={checked}
    >
      <span />
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
  return (
    <article className="shop-food-card">
      <div className="shop-food-card__image-wrap">
        <AppImage src={item.image} fallbackSrc={foodImage} alt={item.title} />
        <span className="shop-food-card__badge">Available</span>
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
          <button type="button" onClick={() => onSelect(item)}>
            <FiPlus />
            <span>{actionLabel}</span>
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

function SummaryBreakdown({
  food,
  orderDetails,
  onToggleRockPoints,
  unitLabel,
}) {
  const totals = calculateFoodOrderTotals(
    food.price,
    orderDetails.guests,
    orderDetails.useRockPoints,
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
        <span>Taxes &amp; Fees (7.5%)</span>
        <strong>{totals.taxesAndFees.toLocaleString()}</strong>
      </div>

      <div>
        <span>Refundable caution Fee</span>
        <strong>{totals.cautionFee.toLocaleString()}</strong>
      </div>

      <div>
        <span>Rock-point</span>
        <strong>{totals.rockPointValue.toLocaleString()}</strong>
        <Toggle checked={orderDetails.useRockPoints} onClick={onToggleRockPoints} />
      </div>

      <div className="shop-food-breakdown__total">
        <span>Total</span>
        <strong>NGN{totals.total.toLocaleString()}</strong>
      </div>
    </div>
  );
}

function PaymentOption({ active, icon, label, onClick }) {
  const Icon = icon;

  return (
    <button
      type="button"
      className={`shop-food-payment-option ${
        active ? "shop-food-payment-option--active" : ""
      }`}
      onClick={onClick}
    >
      <span>
        <Icon />
        <strong>{label}</strong>
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
          <span>Taxes &amp; Fees (7.5%)</span>
          <strong>{totals.taxesAndFees.toLocaleString()}</strong>
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

      <button
        type="button"
        className="shop-food-primary-button"
        onClick={onPrimary}
        disabled={showPolicy && !orderDetails.agreedToPolicy}
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

      {showPolicy && (
        <div className="shop-food-policy">
          <p>I agree to residence &amp; cancellation policy</p>
          <Toggle
            checked={orderDetails.agreedToPolicy}
            onClick={onTogglePolicy}
          />
        </div>
      )}
    </aside>
  );
}

export default function ShopFoodPage({
  variant = "food",
  mode = "list",
  foodItem,
  orderDetails,
  onFoodSelect,
  onOrderChange,
  onBackToFood,
  onProceedToReview,
  onProceedToPayment,
  onBackToReview,
  onPaymentContinue,
  onFinishOrder,
}) {
  const [filterState, setFilterState] = useState({
    variant: "food",
    activeFilter: "all",
  });
  const deliveryInputRef = useRef(null);
  const pageContent = getPageContent(variant);
  const usesCartCheckout = pageContent.checkoutStyle === "cart";
  const activeFilter =
    filterState.variant === variant ? filterState.activeFilter : "all";
  const visibleItems =
    activeFilter === "all"
      ? pageContent.featuredItems || pageContent.items
      : pageContent.items.filter((item) =>
          item.tags.some((tag) => toFilterId(tag) === activeFilter),
        );
  const heroImages =
    pageContent.heroImagesByFilter?.[activeFilter] || pageContent.heroImages;
  const selectedFood = foodItem || pageContent.items[0] || foodItems[0];
  const selectedFoodDetailImage = selectedFood.detailImage || selectedFood.image;
  const safeOrderDetails = {
    apartmentNumber: "",
    deliveryTime: getDefaultFoodDeliveryValue(),
    guests: 1,
    note: "",
    paymentMethod: "card",
    agreedToPolicy: true,
    useRockPoints: true,
    ...orderDetails,
  };
  const totals = calculateFoodOrderTotals(
    selectedFood.price,
    safeOrderDetails.guests,
    safeOrderDetails.useRockPoints,
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
    updateOrder("useRockPoints", !safeOrderDetails.useRockPoints);
  }

  function openDateTimePicker() {
    if (!deliveryInputRef.current) return;

    if (typeof deliveryInputRef.current.showPicker === "function") {
      deliveryInputRef.current.showPicker();
      return;
    }

    deliveryInputRef.current.focus();
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
            <AppImage
              className="shop-food-detail__image"
              src={selectedFoodDetailImage}
              fallbackSrc={selectedFood.image || foodImage}
              alt={selectedFood.title}
            />

            {usesCartCheckout ? (
              <ShopCheckoutCard
                food={selectedFood}
                orderDetails={safeOrderDetails}
                totals={totals}
                unitLabel={pageContent.unitLabel}
                primaryLabel={pageContent.detailActionLabel}
                onPrimary={onProceedToReview}
                onCancel={onBackToFood}
                onQuantityChange={(value) => updateOrder("guests", value)}
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

                <button
                  type="button"
                  className="shop-food-primary-button"
                  onClick={onProceedToReview}
                  disabled={!canProceed}
                >
                  {pageContent.detailActionLabel}
                </button>

                <div className="shop-food-policy">
                  <p>I agree to residence &amp; cancellation policy</p>
                  <Toggle
                    checked={safeOrderDetails.agreedToPolicy}
                    onClick={() =>
                      updateOrder("agreedToPolicy", !safeOrderDetails.agreedToPolicy)
                    }
                  />
                </div>
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
            <AppImage
              src={selectedFoodDetailImage}
              fallbackSrc={selectedFood.image || foodImage}
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
              />

              <button
                type="button"
                className="shop-food-primary-button"
                onClick={onProceedToPayment}
              >
                Continue
              </button>

              <div className="shop-food-policy">
                <p>I agree to residence &amp; cancellation policy</p>
                <Toggle
                  checked={safeOrderDetails.agreedToPolicy}
                  onClick={() =>
                    updateOrder("agreedToPolicy", !safeOrderDetails.agreedToPolicy)
                  }
                />
              </div>
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
                  active={safeOrderDetails.paymentMethod === "bank"}
                  onClick={() => updateOrder("paymentMethod", "bank")}
                />
              </div>
            </div>

            {usesCartCheckout ? (
              <ShopCheckoutCard
                food={selectedFood}
                orderDetails={safeOrderDetails}
                totals={totals}
                unitLabel={pageContent.unitLabel}
                primaryLabel={`Pay NGN ${totals.payable.toLocaleString()}`}
                onPrimary={onPaymentContinue}
                onQuantityChange={(value) => updateOrder("guests", value)}
                onTogglePolicy={() =>
                  updateOrder("agreedToPolicy", !safeOrderDetails.agreedToPolicy)
                }
                showPolicy
              />
            ) : (
              <aside className="shop-food-payment-card">
                <div className="shop-food-payment-card__preview">
                  <AppImage
                    src={selectedFoodDetailImage}
                    fallbackSrc={selectedFood.image || foodImage}
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
                />

                <button
                  type="button"
                  className="shop-food-primary-button"
                  onClick={onPaymentContinue}
                  disabled={!canProceed}
                >
                  Pay NGN {totals.payable.toLocaleString()}
                </button>

                <div className="shop-food-policy">
                  <p>I agree to residence &amp; cancellation policy</p>
                  <Toggle
                    checked={safeOrderDetails.agreedToPolicy}
                    onClick={() =>
                      updateOrder("agreedToPolicy", !safeOrderDetails.agreedToPolicy)
                    }
                  />
                </div>
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
            <AppImage
              src={selectedFoodDetailImage}
              fallbackSrc={selectedFood.image || foodImage}
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
                onClick={onFinishOrder}
              >
                Let&apos;s create an experience
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

        <div className="shop-food-filters">
          {pageContent.filters.map((filter) => (
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
              <AppImage src={filter.image} fallbackSrc={foodImage} alt="" />
              <span>{filter.label}</span>
            </button>
          ))}
        </div>

        <div className="shop-food-hero-grid">
          {heroImages.map((image) => (
            <AppImage
              src={image.src}
              fallbackSrc={foodImage}
              alt={image.alt}
              key={image.alt}
            />
          ))}
        </div>

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
      </div>
    </section>
  );
}
