import { useMemo, useRef, useState } from "react";
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
import breakfastImage from "../../assets/bookings.jpg";
import foodHeroImage from "../../assets/food-1.png";
import foodImage from "../../assets/food.png";
import {
  calculateFoodOrderTotals,
  formatFoodDeliveryTime,
  getDefaultFoodDeliveryValue,
} from "../../utils/foodOrders";
import "./ShopFoodPage.css";

const categoryFilters = [
  { id: "all", label: "All Menu", image: foodImage },
  { id: "breakfast", label: "Breakfast", image: breakfastImage },
  { id: "lunch", label: "Lunch", image: foodHeroImage },
  { id: "dinner", label: "Dinner", image: foodImage },
];

function formatCurrency(value) {
  return `NGN${Number(value || 0).toLocaleString()}`;
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
      <span>Add number of guest</span>

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

function FoodCard({ item, onSelect }) {
  return (
    <article className="shop-food-card">
      <div className="shop-food-card__image-wrap">
        <img src={item.image} alt={item.title} />
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
            <span>Add meal</span>
          </button>

          <strong>
            {formatCurrency(item.price)}
            <span>/per plate</span>
          </strong>
        </div>
      </div>
    </article>
  );
}

function SummaryBreakdown({ food, orderDetails, onToggleRockPoints }) {
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
          {totals.guests === 1 ? "plate" : "plates"}
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

export default function ShopFoodPage({
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
  const [activeFilter, setActiveFilter] = useState("all");
  const deliveryInputRef = useRef(null);
  const selectedFood = foodItem || foodItems[0];
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
  const totals = useMemo(
    () =>
      calculateFoodOrderTotals(
        selectedFood.price,
        safeOrderDetails.guests,
        safeOrderDetails.useRockPoints,
      ),
    [
      selectedFood.price,
      safeOrderDetails.guests,
      safeOrderDetails.useRockPoints,
    ],
  );
  const canProceed = Boolean(
    safeOrderDetails.apartmentNumber.trim() &&
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
              <button type="button" aria-label="Share meal">
                <FiShare2 />
              </button>
              <button type="button" aria-label="Save meal">
                <FiHeart />
              </button>
            </div>
          </div>

          <div className="shop-food-detail__layout">
            <img
              className="shop-food-detail__image"
              src={selectedFoodDetailImage}
              alt={selectedFood.title}
            />

            <aside className="shop-food-order-card">
              <strong className="shop-food-order-card__price">
                {formatCurrency(selectedFood.price)}
                <span>/per plate</span>
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
                <span>/per plate</span>
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
                Proceed to payment
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

  if (mode === "review") {
    return (
      <section className="shop-food-flow">
        <div className="shop-food-panel shop-food-panel--review">
          <button
            type="button"
            className="shop-food-icon-back"
            onClick={onBackToFood}
            aria-label="Back to meal details"
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
              <button type="button" aria-label="Share meal">
                <FiShare2 />
              </button>
              <button type="button" aria-label="Save meal">
                <FiHeart />
              </button>
            </div>
          </div>

          <div className="shop-food-review__layout">
            <img src={selectedFoodDetailImage} alt={selectedFood.title} />

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
                  <span>Number of guess</span>
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

            <aside className="shop-food-payment-card">
              <div className="shop-food-payment-card__preview">
                <img src={selectedFoodDetailImage} alt={selectedFood.title} />
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
            <img src={selectedFoodDetailImage} alt={selectedFood.title} />

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
                {["Order Recieve", "Payment Recieve", "Order in process"].map(
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
        <h1 className="shop-food-title">Food</h1>

        <div className="shop-food-filters">
          {categoryFilters.map((filter) => (
            <button
              type="button"
              className={`shop-food-filter ${
                activeFilter === filter.id ? "shop-food-filter--active" : ""
              }`}
              onClick={() => setActiveFilter(filter.id)}
              key={filter.id}
            >
              <img src={filter.image} alt="" />
              <span>{filter.label}</span>
            </button>
          ))}
        </div>

        <div className="shop-food-hero-grid">
          <img src={foodHeroImage} alt="Jollof rice and chicken" />
          <img src={foodHeroImage} alt="Jollof rice plate" />
        </div>

        <div className="shop-food-grid">
          {foodItems.map((item) => (
            <FoodCard item={item} onSelect={onFoodSelect} key={item.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
