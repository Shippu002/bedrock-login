import { useMemo, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiCalendar,
  FiChevronDown,
  FiCreditCard,
  FiHeart,
  FiMapPin,
  FiMinus,
  FiPlus,
  FiShare2,
  FiStar,
  FiTruck,
  FiUsers,
  FiWifi,
} from "react-icons/fi";
import { FaUniversity } from "react-icons/fa";
import { LuBedSingle } from "react-icons/lu";
import apartOne from "../../assets/apart-1.jpg";
import apartTwo from "../../assets/apart-2.jpg";
import apartThree from "../../assets/apart-3.jpg";
import apartFour from "../../assets/apart-4.jpg";
import apartFive from "../../assets/apart-5.jpg";
import {
  addDays,
  calculateBookingTotals,
  formatDateRange,
  getGuestLabel,
  getNightLabel,
  getTodayDateValue,
} from "../../utils/bookings";
import "./ApartmentPage.css";

const fallbackGalleryImages = [
  apartOne,
  apartTwo,
  apartThree,
  apartFour,
  apartFive,
];

const reviewItems = [
  {
    id: "review-1",
    date: "March 2025",
    text: "Find your perfect getaway home at bedrock, premium apartments, premium stay.",
    author: "Tola Anidugbe",
    location: "Ikeja, Lagos",
  },
  {
    id: "review-2",
    date: "March 2025",
    text: "Find your perfect getaway home at bedrock, premium apartments, premium stay.",
    author: "Fiyin Joseph",
    location: "Ikeja, Lagos",
  },
  {
    id: "review-3",
    date: "March 2025",
    text: "Find your perfect getaway home at bedrock, premium apartments, premium stay.",
    author: "Amina Yusuf",
    location: "Ikeja, Lagos",
  },
];

function ApartmentMetaPill({ icon, children }) {
  const Icon = icon;

  return (
    <span className="apartment-meta-pill">
      <Icon className="apartment-meta-pill__icon" />
      <span>{children}</span>
    </span>
  );
}

function BackButton({ onClick }) {
  return (
    <button type="button" className="apartment-back-button" onClick={onClick}>
      <FiArrowLeft />
      <span>Back</span>
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
  onPaymentContinue,
  onBackToApartment,
  onBackToPayment,
  onMoveToConfirmed,
  onFinishBooking,
}) {
  const [selectedGalleryImage, setSelectedGalleryImage] = useState({
    apartmentId: null,
    index: 0,
  });
  const checkInInputRef = useRef(null);
  const checkOutInputRef = useRef(null);

  const galleryImages =
    apartment?.galleryImages?.length > 0
      ? apartment.galleryImages
      : fallbackGalleryImages;
  const activeImage =
    selectedGalleryImage.apartmentId === apartment?.id
      ? Math.min(selectedGalleryImage.index, galleryImages.length - 1)
      : 0;
  const previewImage = apartment?.paymentImage || galleryImages[0];
  const statusImage = apartment?.statusImage || previewImage;
  const bookingDateRange = formatDateRange(
    bookingDetails.checkIn,
    bookingDetails.checkOut,
  );
  const checkInMin = getTodayDateValue();
  const checkOutMin = addDays(bookingDetails.checkIn || checkInMin, 1);
  const canContinueBooking = Boolean(
    bookingDetails.checkIn &&
      bookingDetails.checkOut &&
      bookingDetails.guests > 0 &&
      bookingDetails.agreedToPolicy,
  );

  const {
    nights,
    subtotal,
    taxesAndFees,
    cautionFee,
    rockPointValue,
    total,
    payable,
  } = useMemo(
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

  if (!apartment) return null;

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

  if (mode === "payment") {
    return (
      <section className="apartment-flow apartment-flow--payment">
        <div className="apartment-flow__panel">
          <BackButton onClick={onBackToApartment} />

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
                  className={`apartment-payment-option ${
                    bookingDetails.paymentMethod === "bank"
                      ? "apartment-payment-option--active"
                      : ""
                  }`}
                  onClick={() => onBookingChange("paymentMethod", "bank")}
                >
                  <span className="apartment-payment-option__left">
                    <FaUniversity />
                    <span>Bank Transfer</span>
                  </span>
                  <span className="apartment-payment-option__radio" />
                </button>
              </div>
            </div>

            <aside className="apartment-payment-card">
              <div className="apartment-payment-card__preview">
                <img src={previewImage} alt={apartment.title} />

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
                  <span>Add number of guest</span>

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
                <div>
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
                onClick={onPaymentContinue}
                disabled={!canContinueBooking}
              >
                Pay NGN {payable.toLocaleString()}
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
          <BackButton onClick={onBackToPayment} />

          <div className="apartment-status">
            <h1>
              {isConfirmed
                ? "Your stay has been confirm"
                : "Your stay is pending"}
            </h1>
            <p>we are confirming your payment, kindly check back</p>

            <article className="apartment-status-card">
              <img src={statusImage} alt={apartment.title} />

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
                  onClick={isConfirmed ? onFinishBooking : onMoveToConfirmed}
                >
                  Got it
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
        <div className="apartment-flow__heading">
          <h1>
            {apartment.title} ({apartment.residenceName})
          </h1>

          <div className="apartment-flow__actions">
            <button type="button" aria-label="Share apartment">
              <FiShare2 />
            </button>
            <button type="button" aria-label="Save apartment">
              <FiHeart />
            </button>
          </div>
        </div>

        <div className="apartment-detail-layout">
          <div className="apartment-detail-main">
            <div className="apartment-gallery">
              <div className="apartment-gallery__hero">
                <img src={galleryImages[activeImage]} alt={apartment.title} />
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
                    <img src={image} alt={`${apartment.title} ${index + 2}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="apartment-copy">
              <section className="apartment-copy__section">
                <h2>About the apartment</h2>
                <p className="apartment-copy__lead">
                  Find your perfect getaway home at bedrock, premium
                  apartments, premium stay
                </p>
              </section>

              <section className="apartment-copy__section">
                <h3>What this place offers</h3>
                <div className="apartment-meta-list">
                  <ApartmentMetaPill icon={FiUsers}>
                    {getGuestLabel(apartment.guests)}
                  </ApartmentMetaPill>
                  <ApartmentMetaPill icon={LuBedSingle}>
                    {apartment.rooms} Room
                  </ApartmentMetaPill>
                  <ApartmentMetaPill icon={FiTruck}>
                    {apartment.cars} cars
                  </ApartmentMetaPill>
                  <ApartmentMetaPill icon={FiWifi}>Wi-Fi</ApartmentMetaPill>
                  <ApartmentMetaPill icon={FiWifi}>Wi-Fi</ApartmentMetaPill>
                </div>
              </section>

              <section className="apartment-copy__section">
                <h3>Cancellation policy</h3>
                <p>
                  Find your perfect getaway home at bedrock, premium
                  apartments, premium stay....
                  <button type="button">Read More</button>
                </p>
              </section>

              <section className="apartment-copy__section">
                <h3>House rules</h3>
                <ul className="apartment-copy__rules">
                  <li>Check-in after 2PM</li>
                  <li>Checkout before 1:00PM</li>
                  <li>2 guests maximum</li>
                </ul>
              </section>

              <section className="apartment-copy__section">
                <h3>Safety &amp; Property</h3>
                <p>
                  Find your perfect getaway home at bedrock, premium
                  apartments, premium stay....
                  <button type="button">Read More</button>
                </p>
              </section>

              <section className="apartment-copy__section">
                <h3>Reviews &amp; Rating</h3>
                <div className="apartment-reviews">
                  {reviewItems.map((review) => (
                    <article className="apartment-review" key={review.id}>
                      <div className="apartment-review__meta">
                        <span className="apartment-review__stars">
                          <FiStar />
                          <FiStar />
                          <FiStar />
                          <FiStar />
                          <FiStar />
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
                <span>Add number of guest</span>

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
              onClick={onOpenPayment}
              disabled={!canContinueBooking}
            >
              Book Apartment
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
      </div>
    </section>
  );
}

export default ApartmentPage;
