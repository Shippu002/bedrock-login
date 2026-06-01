import { useMemo, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiCreditCard,
  FiHeart,
  FiMapPin,
  FiMinus,
  FiPlus,
  FiShare2,
  FiStar,
  FiUsers,
  FiWifi,
} from "react-icons/fi";
import { FaUniversity } from "react-icons/fa";
import { LuBedSingle } from "react-icons/lu";
import AppImage from "../../components/AppImage";
import {
  addDays,
  calculateBookingTotals,
  formatDateRange,
  getGuestLabel,
  getNightLabel,
  getTodayDateValue,
} from "../../utils/bookings";
import "./ApartmentPage.css";

function ApartmentMetaPill({ icon, children }) {
  const Icon = icon;

  return (
    <span className="apartment-meta-pill">
      <Icon className="apartment-meta-pill__icon" />
      <span>{children}</span>
    </span>
  );
}

function formatBackendTime(value) {
  if (!value) return "";

  const [hour = "", minute = ""] = String(value).split(":");
  const hourNumber = Number(hour);

  if (Number.isNaN(hourNumber)) return value;

  const period = hourNumber >= 12 ? "PM" : "AM";
  const displayHour = hourNumber % 12 || 12;

  return `${displayHour}:${minute || "00"}${period}`;
}

function getAmenityItems(apartment) {
  const backendAmenities = Array.isArray(apartment?.amenities)
    ? apartment.amenities.filter(Boolean)
    : [];
  const roomCount = Number(apartment.rooms || apartment.bedrooms || 1);
  const defaultAmenities = [
    getGuestLabel(apartment.guests),
    `${roomCount} ${roomCount === 1 ? "Room" : "Rooms"}`,
  ].filter(Boolean);

  if (apartment.wifi && !backendAmenities.some((item) => /wi-?fi|internet/i.test(item))) {
    defaultAmenities.push("Wi-Fi");
  }

  return [...new Set([...defaultAmenities, ...backendAmenities])];
}

function getHouseRuleItems(apartment) {
  const rules = Array.isArray(apartment?.houseRules)
    ? apartment.houseRules.filter(Boolean)
    : [];
  const timedRules = [
    apartment?.checkInTime
      ? `Check-in after ${formatBackendTime(apartment.checkInTime)}`
      : "",
    apartment?.checkOutTime
      ? `Checkout before ${formatBackendTime(apartment.checkOutTime)}`
      : "",
    apartment?.guests ? `${getGuestLabel(apartment.guests)} maximum` : "",
    apartment?.minNights ? `${apartment.minNights} night minimum stay` : "",
    apartment?.maxNights ? `${apartment.maxNights} night maximum stay` : "",
  ].filter(Boolean);

  return [...new Set([...timedRules, ...rules])];
}

function getReviewStars(rating) {
  const ratingNumber = Math.round(Number(rating || 0));

  return Array.from({ length: Math.max(0, Math.min(5, ratingNumber)) });
}

function getPolicyText(value, emptyText) {
  return String(value || "").trim() || emptyText;
}

function BackButton({ label = "Back", onClick }) {
  return (
    <button type="button" className="apartment-back-button" onClick={onClick}>
      <FiArrowLeft />
      <span>{label}</span>
    </button>
  );
}

function Toggle({ checked, onClick }) {
  return (
    <button
      type="button"
      className={`apartment-toggle ${checked ? "apartment-toggle--on" : ""}`}
      onClick={onClick}
      aria-pressed={checked}
    >
      <span />
    </button>
  );
}

function ApartmentPage({
  mode,
  apartment,
  bookingDetails,
  onBookingChange,
  onOpenPayment,
  onBackToListings,
  onPaymentContinue,
  onBackToApartment,
  onBackToPayment,
  onMoveToConfirmed,
  onFinishBooking,
  quote,
  isInitiallySaved = false,
  onToggleFavorite,
  backLabel,
}) {
  const [selectedGalleryImage, setSelectedGalleryImage] = useState({
    apartmentId: null,
    index: 0,
  });
  const [savedOverride, setSavedOverride] = useState(null);
  const [actionFeedback, setActionFeedback] = useState("");
  const [pendingAction, setPendingAction] = useState("");
  const checkInInputRef = useRef(null);
  const checkOutInputRef = useRef(null);

  const galleryImages =
    apartment?.galleryImages?.length > 0
      ? apartment.galleryImages
      : apartment?.image
        ? [apartment.image]
        : [];
  const activeImage =
    selectedGalleryImage.apartmentId === apartment?.id
      ? Math.min(selectedGalleryImage.index, galleryImages.length - 1)
      : 0;
  const previewImage = apartment?.paymentImage || galleryImages[0] || "";
  const statusImage = apartment?.statusImage || previewImage;
  const bookingDateRange = formatDateRange(
    bookingDetails.checkIn,
    bookingDetails.checkOut,
  );
  const checkInMin = getTodayDateValue();
  const checkOutMin = addDays(bookingDetails.checkIn || checkInMin, 1);
  const isApartmentAvailable = quote?.available !== false;
  const canContinueBooking = Boolean(
    bookingDetails.checkIn &&
      bookingDetails.checkOut &&
      bookingDetails.guests > 0 &&
      bookingDetails.agreedToPolicy &&
      isApartmentAvailable,
  );

  const localTotals = useMemo(
    () =>
      calculateBookingTotals(
        apartment?.price || 0,
        bookingDetails.checkIn,
        bookingDetails.checkOut,
        bookingDetails.useRockPoints,
      ),
    [
      apartment?.price,
      bookingDetails.checkIn,
      bookingDetails.checkOut,
      bookingDetails.useRockPoints,
    ],
  );

  const {
    nights,
    subtotal,
    taxesAndFees,
    cautionFee,
    rockPointValue,
    total,
    payable,
  } = quote?.pricing || localTotals;
  const isSaved = savedOverride ?? isInitiallySaved;

  if (!apartment) return null;

  const amenityItems = getAmenityItems(apartment);
  const houseRuleItems = getHouseRuleItems(apartment);
  const reviews = Array.isArray(apartment.reviews) ? apartment.reviews : [];
  const reviewSummary =
    apartment.reviewsCount > 0
      ? `${apartment.reviewsCount} ${apartment.reviewsCount === 1 ? "review" : "reviews"}`
      : "No reviews yet";

  function updateGuests(direction) {
    onBookingChange("guests", Math.max(1, bookingDetails.guests + direction));
  }

  function openDatePicker(inputRef) {
    if (!inputRef.current) return;

    if (typeof inputRef.current.showPicker === "function") {
      inputRef.current.showPicker();
      return;
    }

    inputRef.current.focus();
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

  async function handleShareApartment() {
    const shareUrl =
      typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: `${apartment.title} - Bedrock Residences`,
      text: `Check out ${apartment.title} at ${apartment.residenceName}.`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setActionFeedback("Apartment shared.");
        return;
      }

      if (navigator.clipboard && shareUrl) {
        await navigator.clipboard.writeText(shareUrl);
        setActionFeedback("Apartment link copied.");
        return;
      }

      setActionFeedback("Sharing is not available on this browser.");
    } catch (error) {
      if (error?.name === "AbortError") return;
      setActionFeedback("Could not share this apartment.");
    }
  }

  async function handleSaveApartment() {
    const result = await onToggleFavorite?.(apartment);
    const nextSavedState = result?.ok ? result.isSaved : !isSaved;

    setSavedOverride(nextSavedState);
    setActionFeedback(
      result?.message ||
        (nextSavedState ? "Apartment saved." : "Apartment removed from saved."),
    );
  }

  if (mode === "payment") {
    return (
      <section className="apartment-flow apartment-flow--payment">
        <div className="apartment-flow__panel">
          <BackButton label={backLabel || "Back to apartment"} onClick={onBackToApartment} />

          <div className="apartment-payment-layout">
            <div className="apartment-payment-methods">
              <h1 className="apartment-payment-methods__title">
                Choose a payment method
              </h1>

              <div className="apartment-payment-methods__list">
                <button
                  type="button"
                  className={`apartment-payment-option ${
                    bookingDetails.paymentMethod === "card"
                      ? "apartment-payment-option--active"
                      : ""
                  }`}
                  onClick={() => onBookingChange("paymentMethod", "card")}
                >
                  <span className="apartment-payment-option__left">
                    <FiCreditCard />
                    <span>Card or debit card</span>
                  </span>
                  <span className="apartment-payment-option__radio" />
                </button>

                <button
                  type="button"
                  className="apartment-payment-option apartment-payment-option--disabled"
                  disabled
                  aria-disabled="true"
                >
                  <span className="apartment-payment-option__left">
                    <FaUniversity />
                    <span>Bank Transfer <em>Coming soon</em></span>
                  </span>
                  <span className="apartment-payment-option__radio" />
                </button>
              </div>
            </div>

            <aside className="apartment-payment-card">
              <div className="apartment-payment-card__preview">
                <AppImage
                  src={previewImage}
                  fallbackSrc=""
                  alt={apartment.title}
                />

                <div className="apartment-payment-card__preview-copy">
                  <div>
                    <h3>{apartment.title}</h3>
                    <p>
                      <FiMapPin />
                      <span>{apartment.location}</span>
                    </p>
                  </div>

                  <span className="apartment-payment-card__rating">
                    <FiStar />
                    <span>{apartment.rating}</span>
                  </span>
                </div>

                <strong className="apartment-payment-card__night-price">
                  NGN{apartment.price.toLocaleString()}/per night
                </strong>
              </div>

              <div className="apartment-form-group">
                <label>Check-in-Date</label>
                <div
                  className="apartment-select apartment-select--compact"
                  onClick={() => openDatePicker(checkInInputRef)}
                >
                  <FiCalendar />
                  <input
                    ref={checkInInputRef}
                    type="date"
                    value={bookingDetails.checkIn}
                    min={checkInMin}
                    onChange={(event) =>
                      onBookingChange("checkIn", event.target.value)
                    }
                  />
                  <FiChevronDown />
                </div>
              </div>

              <div className="apartment-form-group">
                <label>Check-out-Date</label>
                <div
                  className="apartment-select apartment-select--compact"
                  onClick={() => openDatePicker(checkOutInputRef)}
                >
                  <FiCalendar />
                  <input
                    ref={checkOutInputRef}
                    type="date"
                    value={bookingDetails.checkOut}
                    min={checkOutMin}
                    onChange={(event) =>
                      onBookingChange("checkOut", event.target.value)
                    }
                  />
                  <FiChevronDown />
                </div>
              </div>

              <div className="apartment-form-group">
                <label>Number of Guests</label>
                <div className="apartment-guest-input apartment-guest-input--compact">
                  <span>Number of guests</span>

                  <div className="apartment-guest-input__actions">
                    <button type="button" onClick={() => updateGuests(-1)}>
                      <FiMinus />
                    </button>
                    <strong>{bookingDetails.guests}</strong>
                    <button type="button" onClick={() => updateGuests(1)}>
                      <FiPlus />
                    </button>
                  </div>
                </div>
              </div>

              <div className="apartment-form-group">
                <label>Enter Promo</label>
                <input
                  type="text"
                  className="apartment-text-input"
                  placeholder="Type promo code"
                  value={bookingDetails.promo}
                  onChange={(event) =>
                    onBookingChange("promo", event.target.value)
                  }
                />
              </div>

              <div className="apartment-payment-breakdown">
                <div>
                  <span>
                    NGN{apartment.price.toLocaleString()} *{" "}
                    {nights} {nights === 1 ? "night" : "nights"}
                  </span>
                  <strong>{subtotal.toLocaleString()}</strong>
                </div>
                <div>
                  <span>Taxes &amp; Fees (7.5%)</span>
                  <strong>{taxesAndFees.toLocaleString()}</strong>
                </div>
                <div>
                  <span>Refundable caution Fee</span>
                  <strong>{cautionFee.toLocaleString()}</strong>
                </div>
                <div className="apartment-payment-breakdown__row--toggle">
                  <span>Rock-point</span>
                  <strong>{rockPointValue.toLocaleString()}</strong>
                  <Toggle
                    checked={bookingDetails.useRockPoints}
                    onClick={() =>
                      onBookingChange(
                        "useRockPoints",
                        !bookingDetails.useRockPoints,
                      )
                    }
                  />
                </div>
                <div className="apartment-payment-breakdown__total">
                  <span>Total</span>
                  <strong>NGN{total.toLocaleString()}</strong>
                </div>
              </div>

              <button
                type="button"
                className="apartment-primary-button"
                onClick={() => runPendingAction("payment", onPaymentContinue)}
                disabled={!canContinueBooking || pendingAction === "payment"}
              >
                {pendingAction === "payment"
                  ? "Processing..."
                  : `Pay NGN ${payable.toLocaleString()}`}
              </button>

              <div className="apartment-policy-row apartment-policy-row--compact">
                <p>I agree to residence &amp; cancellation policy</p>
                <Toggle
                  checked={bookingDetails.agreedToPolicy}
                  onClick={() =>
                    onBookingChange(
                      "agreedToPolicy",
                      !bookingDetails.agreedToPolicy,
                    )
                  }
                />
              </div>
            </aside>
          </div>
        </div>
      </section>
    );
  }

  if (mode === "pending" || mode === "confirmed") {
    const isConfirmed = mode === "confirmed";

    return (
      <section className="apartment-flow apartment-flow--status">
        <div className="apartment-flow__panel">
          <BackButton label={backLabel || "Back to payment"} onClick={onBackToPayment} />

          <div className="apartment-status">
            <h1>
              {isConfirmed
                ? "Your stay has been confirm"
                : "Your stay is pending"}
            </h1>
            <p>we are confirming your payment, kindly check back</p>

            <article className="apartment-status-card">
              <AppImage
                src={statusImage}
                fallbackSrc=""
                alt={apartment.title}
              />

              <div className="apartment-status-card__body">
                <h3>{apartment.title}</h3>
                <p>
                  <FiMapPin />
                  <span>{apartment.location}</span>
                </p>

                <div className="apartment-status-card__summary">
                  <span>{bookingDateRange}</span>

                  <div className="apartment-status-card__price-group">
                    <strong>NGN{payable.toLocaleString()}</strong>
                    <span>{getGuestLabel(bookingDetails.guests)}</span>
                  </div>
                </div>

                <div className="apartment-status-card__footer">
                  <span
                    className={`apartment-status-badge ${
                      isConfirmed
                        ? "apartment-status-badge--complete"
                        : "apartment-status-badge--pending"
                    }`}
                  >
                    {isConfirmed ? "Complete" : "Pending"}
                  </span>
                </div>

                <button
                  type="button"
                  className="apartment-primary-button"
                  onClick={() =>
                    runPendingAction(
                      isConfirmed ? "finish" : "confirm",
                      isConfirmed ? onFinishBooking : onMoveToConfirmed,
                    )
                  }
                  disabled={Boolean(pendingAction)}
                >
                  {pendingAction ? "Please wait..." : "Got it"}
                </button>
              </div>
            </article>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="apartment-flow apartment-flow--details">
      <div className="apartment-flow__panel">
        {onBackToListings && (
          <BackButton label={backLabel || "Back to listings"} onClick={onBackToListings} />
        )}

        <div className="apartment-flow__heading">
          <h1>
            {apartment.title} ({apartment.residenceName})
          </h1>

          <div className="apartment-flow__actions">
            <button
              type="button"
              onClick={handleShareApartment}
              aria-label="Share apartment"
            >
              <FiShare2 />
            </button>
            <button
              type="button"
              className={isSaved ? "is-active" : ""}
              onClick={handleSaveApartment}
              aria-label={
                isSaved ? "Remove apartment from saved" : "Save apartment"
              }
              aria-pressed={isSaved}
            >
              <FiHeart />
            </button>
          </div>
        </div>

        {actionFeedback && (
          <p className="apartment-action-feedback">{actionFeedback}</p>
        )}

        {quote?.error && (
          <p className="apartment-action-feedback">{quote.error}</p>
        )}

        {!isApartmentAvailable && (
          <p className="apartment-action-feedback">
            This apartment is not available for the selected dates.
          </p>
        )}

        <div className="apartment-detail-layout">
          <div className="apartment-detail-main">
            <div className="apartment-gallery">
              <div className="apartment-gallery__hero">
                <AppImage
                  src={galleryImages[activeImage]}
                  fallbackSrc=""
                  alt={apartment.title}
                  loading="eager"
                />
              </div>

              <div className="apartment-gallery__grid">
                {galleryImages.slice(1, 5).map((image, index) => (
                  <button
                    type="button"
                    className={`apartment-gallery__thumb ${
                      activeImage === index + 1
                        ? "apartment-gallery__thumb--active"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedGalleryImage({
                        apartmentId: apartment.id,
                        index: index + 1,
                      })
                    }
                    key={image}
                  >
                    <AppImage
                      src={image}
                      fallbackSrc=""
                      alt={`${apartment.title} ${index + 2}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="apartment-copy">
              <section className="apartment-copy__section">
                <h2>About the apartment</h2>
                <p className="apartment-copy__lead">
                  {getPolicyText(
                    apartment.description,
                    "No apartment description was provided.",
                  )}
                </p>
              </section>

              <section className="apartment-copy__section">
                <h3>What this place offers</h3>
                <div className="apartment-meta-list">
                  {amenityItems.map((amenity) => (
                    <ApartmentMetaPill
                      icon={
                        /guest/i.test(amenity)
                          ? FiUsers
                          : /room|bed/i.test(amenity)
                            ? LuBedSingle
                            : /wi-?fi|internet/i.test(amenity)
                                ? FiWifi
                                : FiCheckCircle
                      }
                      key={amenity}
                    >
                      {amenity}
                    </ApartmentMetaPill>
                  ))}
                </div>
              </section>

              <section className="apartment-copy__section">
                <h3>Cancellation policy</h3>
                <p className="apartment-copy__preline">
                  {getPolicyText(
                    apartment.cancellationPolicy,
                    "No cancellation policy was provided.",
                  )}
                </p>
              </section>

              <section className="apartment-copy__section">
                <h3>House rules</h3>
                <ul className="apartment-copy__rules">
                  {houseRuleItems.length > 0 ? (
                    houseRuleItems.map((rule) => <li key={rule}>{rule}</li>)
                  ) : (
                    <li>No house rules were provided.</li>
                  )}
                </ul>
              </section>

              <section className="apartment-copy__section">
                <h3>Safety &amp; Property</h3>
                <p className="apartment-copy__preline">
                  {getPolicyText(
                    apartment.safetyNotes,
                    "No safety notes were provided for this apartment.",
                  )}
                </p>
              </section>

              <section className="apartment-copy__section">
                <h3>Reviews &amp; Rating</h3>
                <div className="apartment-rating-summary">
                  <span className="apartment-review__stars">
                    {getReviewStars(apartment.rating).map((_, index) => (
                      <FiStar key={`summary-star-${index}`} />
                    ))}
                  </span>
                  <strong>{Number(apartment.rating || 0).toFixed(1)}</strong>
                  <em>{reviewSummary}</em>
                </div>

                {reviews.length > 0 ? (
                  <div className="apartment-reviews">
                    {reviews.map((review) => (
                    <article className="apartment-review" key={review.id}>
                      <div className="apartment-review__meta">
                        <span className="apartment-review__stars">
                          {getReviewStars(review.rating).map((_, index) => (
                            <FiStar key={`${review.id}-star-${index}`} />
                          ))}
                        </span>
                        <span>{review.date}</span>
                      </div>

                      <p>{review.text}</p>

                      <div className="apartment-review__author">
                        <span className="apartment-review__avatar">
                          {review.author.charAt(0)}
                        </span>
                        <span>
                          <strong>{review.author}</strong>
                          <em>{review.location}</em>
                        </span>
                      </div>
                    </article>
                    ))}
                  </div>
                ) : (
                  <div className="apartment-review-empty">
                    Reviews from completed stays will appear here.
                  </div>
                )}
              </section>
            </div>
          </div>

          <aside className="apartment-booking-card">
            <div className="apartment-form-group">
              <label>Check-in-Date</label>
              <div
                className="apartment-select"
                onClick={() => openDatePicker(checkInInputRef)}
              >
                <FiCalendar />
                <input
                  ref={checkInInputRef}
                  type="date"
                  value={bookingDetails.checkIn}
                  min={checkInMin}
                  onChange={(event) =>
                    onBookingChange("checkIn", event.target.value)
                  }
                />
                <FiChevronDown />
              </div>
            </div>

            <div className="apartment-form-group">
              <label>Check-out-Date</label>
              <div
                className="apartment-select"
                onClick={() => openDatePicker(checkOutInputRef)}
              >
                <FiCalendar />
                <input
                  ref={checkOutInputRef}
                  type="date"
                  value={bookingDetails.checkOut}
                  min={checkOutMin}
                  onChange={(event) =>
                    onBookingChange("checkOut", event.target.value)
                  }
                />
                <FiChevronDown />
              </div>
            </div>

            <div className="apartment-form-group">
              <label>Number of Guests</label>
              <div className="apartment-guest-input">
                <span>Number of guests</span>

                <div className="apartment-guest-input__actions">
                  <button type="button" onClick={() => updateGuests(-1)}>
                    <FiMinus />
                  </button>
                  <strong>{bookingDetails.guests}</strong>
                  <button type="button" onClick={() => updateGuests(1)}>
                    <FiPlus />
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="apartment-primary-button"
              onClick={() => runPendingAction("book", onOpenPayment)}
              disabled={!canContinueBooking || pendingAction === "book"}
            >
              {quote?.loading || pendingAction === "book"
                ? "Checking..."
                : "Book Apartment"}
            </button>

            <div className="apartment-policy-row">
              <p>I agree to residence &amp; cancellation policy</p>
              <Toggle
                checked={bookingDetails.agreedToPolicy}
                onClick={() =>
                  onBookingChange(
                    "agreedToPolicy",
                    !bookingDetails.agreedToPolicy,
                  )
                }
              />
            </div>

            <div className="apartment-copy__section apartment-copy__section--summary">
              <h3>Current stay summary</h3>
              <p>
                {bookingDateRange} | {getNightLabel(nights)} | NGN
                {payable.toLocaleString()}
              </p>
            </div>
          </aside>
        </div>

        <div className="apartment-mobile-cta">
          <strong>
            NGN{apartment.price.toLocaleString()}
            <span>/per night</span>
          </strong>

          <button
            type="button"
            className="apartment-primary-button"
            onClick={() => runPendingAction("book", onOpenPayment)}
            disabled={!canContinueBooking || pendingAction === "book"}
          >
            {quote?.loading || pendingAction === "book"
              ? "Checking..."
              : "Book Apartments"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default ApartmentPage;
