import { useMemo, useState } from "react";
import {
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCopy,
  FiEdit2,
  FiGift,
  FiGlobe,
  FiHeart,
  FiHelpCircle,
  FiHome,
  FiLock,
  FiLogOut,
  FiMail,
  FiMapPin,
  FiMenu,
  FiPhone,
  FiPlus,
  FiSearch,
  FiShield,
  FiSliders,
  FiShoppingBag,
  FiStar,
  FiUsers,
  FiX,
} from "react-icons/fi";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";
import bedrockLogo from "../../assets/bedrock-logo.svg";
import defaultApartmentImage from "../../assets/apart-1.jpg";
import wishlistImage from "../../assets/wishlist.jpg";
import AppImage from "../../components/AppImage";
import { shopCategories } from "../../data/shopCategories";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import {
  countryOptions,
  findCountryByDialCode,
  findCountryByName,
  getDialCodeDigits,
  normalizeLocalPhoneNumber,
} from "../../utils/countries";
import {
  addDays,
  calculateBookingTotals,
  ensureCheckoutDate,
  formatShortDate,
  getGuestLabel,
  getNightLabel,
  isPastBooking,
} from "../../utils/bookings";
import "./ProfilePage.css";

const sidebarItems = [
  { id: "profile", label: "Home", icon: FiHome },
  { id: "wishlists", label: "Wishlists", icon: FiHeart },
  { id: "bookings", label: "Bookings", icon: FiCalendar },
  { id: "orders", label: "Orders", icon: FiShoppingBag },
  // Messages are hidden for now. Re-enable this item when the feature returns.
  { id: "shop", label: "Shop", icon: FiShoppingBag },
  { id: "settings", label: "Change password", icon: FiLock },
  { id: "privacy", label: "Privacy", icon: FiGlobe },
  { id: "refer", label: "Refer and Earn", icon: FiHelpCircle },
  { id: "legal", label: "Legal", icon: FiHelpCircle },
  { id: "help", label: "Help Center", icon: FiHelpCircle },
];

const earningRows = [
  { title: "Booking bonus for 2 bed @Bateye", amount: "+200", balance: "200.00" },
  { title: "Rock point used for booking", amount: "-150", balance: "350.00" },
  { title: "Stay length bonus (7 days)", amount: "+50", balance: "400.00" },
  { title: "Referral bonus - Friend signed up", amount: "+100", balance: "500.00" },
];

const earnRules = [
  {
    title: "Guests earn 1 Rock Coin per N1,000 of the apartment price",
    reward: "RK1 off",
  },
  {
    title: "Guests earn N3,000 for 3 days stay in the apartment",
    reward: "RK3 off",
  },
];

const legalItems = [
  { id: "terms", title: "Terms of service" },
  { id: "cancellation", title: "Cancellation policy" },
  { id: "refund", title: "Refund policy" },
];

const socials = [
  { label: "X (formerly twitter)", icon: FaXTwitter },
  { label: "Facebook", icon: FaFacebookF },
  { label: "Instagram", icon: FaInstagram },
  { label: "Linkedin", icon: FaLinkedinIn },
];

function getInitials(value) {
  return String(value || "User")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getProfileCountry(user) {
  if (user?.country) return user.country;

  return findCountryByDialCode(user?.countryCode)?.name || "";
}

function getProfileState(user) {
  return String(user?.state || "").trim();
}

function getProfileCurrency(user) {
  return (
    user?.currency ||
    findCountryByName(getProfileCountry(user))?.currency ||
    findCountryByDialCode(user?.countryCode)?.currency ||
    ""
  );
}

function formatOrderDate(value) {
  if (!value) return "Pending";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function isImportantProfileComplete(user) {
  return Boolean(
    (user?.name || user?.username)?.trim?.() &&
      user?.email?.trim?.() &&
      user?.phone?.trim?.() &&
      getProfileCountry(user).trim() &&
      getProfileState(user).trim(),
  );
}

function ProfileSidebar({
  activeView,
  isMenuOpen,
  onChangeView,
  onCloseMenu,
  onGoHome,
  onLogout,
  onToggleMenu,
}) {
  return (
    <aside
      className={`profile-sidebar ${
        isMenuOpen ? "profile-sidebar--open" : ""
      }`}
    >
      <div className="profile-sidebar__head">
        <button
          type="button"
          className="profile-sidebar__brand"
          onClick={onGoHome}
          aria-label="Go to homepage"
        >
          <img
            src={bedrockLogo}
            alt="Bedrock Residences"
            loading="eager"
            decoding="async"
          />
        </button>

        <button
          type="button"
          className="profile-sidebar__menu-button"
          onClick={onToggleMenu}
          aria-label={isMenuOpen ? "Close sidebar menu" : "Open sidebar menu"}
          aria-expanded={isMenuOpen}
        >
          <FiMenu />
        </button>
      </div>

      <nav className="profile-sidebar__nav" aria-label="Profile navigation">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              type="button"
              className={`profile-sidebar__item ${
                isActive ? "profile-sidebar__item--active" : ""
              }`}
              onClick={() => {
                onChangeView(item.id);
                onCloseMenu?.();
              }}
              key={item.id}
            >
              <Icon />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        className="profile-sidebar__logout"
        onClick={() => {
          onCloseMenu?.();
          onLogout?.();
        }}
      >
        <FiLogOut />
        <span>Log out</span>
      </button>
    </aside>
  );
}

function ProfileTopbar({ user, onProfile }) {
  return (
    <header className="profile-topbar">
      <button
        type="button"
        className="profile-topbar__user"
        onClick={onProfile}
      >
        <span>{user?.username || user?.name || "Jason Obalonye"}</span>
        <FiChevronDown />
      </button>
    </header>
  );
}

function ProfileSearch() {
  return (
    <div className="profile-search-row">
      <label className="profile-search">
        <FiSearch />
        <input type="search" placeholder="Search..." />
      </label>

      <button type="button" className="profile-filter" aria-label="Filter">
        <FiSliders />
      </button>
    </div>
  );
}

function ViewHeading({ title, onBack }) {
  return (
    <div className="profile-view-heading">
      <button type="button" onClick={onBack} aria-label="Go back">
        <FiChevronLeft />
      </button>
      <h1>{title}</h1>
    </div>
  );
}

function EmptyState({ title, message, actionLabel, onAction }) {
  return (
    <div className="profile-empty-state">
      <strong>{title}</strong>
      <p>{message}</p>
      {actionLabel && onAction && (
        <button type="button" className="profile-outline-button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function EditProfileView({ user, onProfileSave, onChangePassword, onBack }) {
  const initialCountryName = getProfileCountry(user);
  const initialCountry =
    findCountryByName(initialCountryName) ||
    findCountryByDialCode(user?.countryCode);
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || "");
  const [failedProfilePhoto, setFailedProfilePhoto] = useState("");
  const [selectedCountryName, setSelectedCountryName] = useState(
    initialCountryName,
  );
  const [phoneNumber, setPhoneNumber] = useState(() =>
    normalizeLocalPhoneNumber(user?.phone, initialCountry),
  );
  const displayName = user?.name || user?.username || "Mark Audrey";
  const initials = useMemo(() => getInitials(displayName), [displayName]);
  const profileState = getProfileState(user);
  const profileCurrency = getProfileCurrency(user);
  const selectedCountry =
    findCountryByName(selectedCountryName) ||
    initialCountry;
  const selectedPhoneCode = getDialCodeDigits(selectedCountry);
  const isVerified = isImportantProfileComplete(user);
  const showProfilePhoto = profilePhoto && failedProfilePhoto !== profilePhoto;

  function handleProfilePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProfilePhoto(String(reader.result));
      setFailedProfilePhoto("");
    };
    reader.readAsDataURL(file);
  }

  function handleProfileSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const country = String(formData.get("country") || "");
    const selectedCountry = findCountryByName(country);

    onProfileSave?.({
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: normalizeLocalPhoneNumber(phoneNumber, selectedCountry),
      state: String(formData.get("state") || "").trim(),
      country,
      countryCode: selectedCountry?.dialCode || user?.countryCode || "",
      currency: selectedCountry?.currency || user?.currency || "",
      profilePhoto,
    });
  }

  function handleCountryChange(countryName) {
    const nextCountry = findCountryByName(countryName);

    setSelectedCountryName(countryName);
    setPhoneNumber((currentPhoneNumber) =>
      normalizeLocalPhoneNumber(currentPhoneNumber, nextCountry),
    );
  }

  return (
    <section className="profile-panel profile-panel--plain">
      <ViewHeading title="Edit Profile" onBack={onBack} />

      <div className="edit-profile-hero">
        <div className="edit-profile-avatar">
          {showProfilePhoto ? (
            <img
              src={profilePhoto}
              alt="Profile"
              loading="eager"
              decoding="async"
              onError={() => setFailedProfilePhoto(profilePhoto)}
            />
          ) : (
            initials
          )}
        </div>

        <div className="edit-profile-summary">
          <strong>{displayName}</strong>
          <span className={!profileState ? "is-placeholder" : ""}>
            {profileState
              ? `${profileState}${profileCurrency ? ` ${profileCurrency}` : ""}`
              : "State"}
          </span>
          <em className={isVerified ? "" : "is-unverified"}>
            {isVerified ? "Verified" : "Not verified"}
          </em>
        </div>

        <label className="edit-profile-photo-button">
          <input
            type="file"
            accept="image/*"
            onChange={handleProfilePhotoChange}
            hidden
          />
          <FiEdit2 />
        </label>
      </div>

      <form className="edit-profile-form" onSubmit={handleProfileSubmit}>
        <span className="edit-profile-form__label">Personal info:</span>

        <label className="profile-field">
          <span>Full Name</span>
          <input
            type="text"
            name="name"
            defaultValue={user?.name || user?.username || ""}
          />
        </label>

        <label className="profile-field">
          <span>Email</span>
          <input type="email" name="email" defaultValue={user?.email || ""} />
        </label>

        <label className="profile-field profile-field--phone">
          <span>Phone Number</span>
          <div className="profile-phone-input">
            {selectedPhoneCode && (
              <span className="profile-phone-code" aria-hidden="true">
                ({selectedPhoneCode})
              </span>
            )}
            <input
              type="tel"
              name="phone"
              value={phoneNumber}
              maxLength={selectedCountry?.localPhoneLength}
              placeholder="9128671676"
              onChange={(event) =>
                setPhoneNumber(
                  normalizeLocalPhoneNumber(event.target.value, selectedCountry),
                )
              }
            />
          </div>
        </label>

        <label className="profile-field">
          <span>State</span>
          <input
            type="text"
            name="state"
            defaultValue={profileState}
            placeholder="State"
          />
        </label>

        <label className="profile-field profile-field--select profile-field--country">
          <span>Select Country</span>
          <div className="profile-country-select">
            {selectedCountry?.flag && (
              <span className="profile-country-flag" aria-hidden="true">
                {selectedCountry.flag}
              </span>
            )}
            <select
              name="country"
              value={selectedCountryName}
              onChange={(event) => handleCountryChange(event.target.value)}
            >
              <option value="" disabled>
                Select country
              </option>
              {countryOptions.map((country) => (
                <option key={country.id}>{country.name}</option>
              ))}
            </select>
            <FiChevronDown />
          </div>
        </label>

        <button
          type="button"
          className="edit-profile-security-link"
          onClick={onChangePassword}
        >
          <FiLock />
          <span>
            <strong>Change password</strong>
            <em>Update the password used to access your account</em>
          </span>
          <FiChevronRight />
        </button>

        <button type="submit" className="profile-action-button">
          Save
        </button>
      </form>
    </section>
  );
}

function FoodCard({ item }) {
  return (
    <article className="profile-food-card">
      <div className="profile-food-card__image">
        <AppImage
          src={item.image}
          fallbackSrc={wishlistImage}
          alt={item.title}
        />
        <span>Available</span>
      </div>

      <div className="profile-food-card__body">
        <div className="profile-food-card__top">
          <div>
            <strong>{item.title}</strong>
            <span>{item.type}</span>
          </div>

          <em>
            <FiStar />
            4.8
          </em>
        </div>

        <p>(Eggs, toast, bacon sausage, fresh fruit) Preparation takes: 39 - 40 min</p>

        <div className="profile-food-card__bottom">
          <button type="button">
            <FiPlus />
            Add meal
          </button>

          <strong>
            {item.price}
            <span>/per plate</span>
          </strong>
        </div>
      </div>
    </article>
  );
}

function WishlistView({ user, onBack }) {
  const visibleWishlistItems = Array.isArray(user?.wishlists)
    ? user.wishlists
    : [];

  return (
    <section className="profile-panel">
      <ViewHeading title="Wishlist" onBack={onBack} />

      {visibleWishlistItems.length > 0 ? (
        <div className="profile-card-grid">
          {visibleWishlistItems.map((item) => (
            <FoodCard
              item={{
                ...item,
                type: item.type || item.residenceName || "Saved item",
                price:
                  typeof item.price === "number"
                    ? `NGN${item.price.toLocaleString()}`
                    : item.price || "Saved",
              }}
              key={item.id}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No saved items yet"
          message="Tap the heart on an apartment or shop item you like, and it will appear here."
        />
      )}
    </section>
  );
}

function ExtendStayModal({ booking, onClose, onExtendStay }) {
  const minimumCheckout = addDays(booking.checkOut, 1);
  const [nextCheckout, setNextCheckout] = useState(minimumCheckout);
  const [status, setStatus] = useState(null);
  const dialogRef = useDialogFocus(true, { onClose });
  const nightlyRate = Number(booking.nightlyRate || 0);
  const currentTotal = Number(booking.totalAmount || 0);
  const totals = calculateBookingTotals(
    nightlyRate,
    booking.checkIn,
    ensureCheckoutDate(booking.checkIn, nextCheckout),
    Number(booking.rockPointValue || 0) > 0,
  );
  const extraAmount = Math.max(0, totals.payable - currentTotal);

  function handleSubmit(event) {
    event.preventDefault();

    const safeCheckout = ensureCheckoutDate(booking.checkOut, nextCheckout);

    if (safeCheckout <= booking.checkOut) {
      setStatus({
        type: "error",
        text: "Choose a checkout date after your current checkout date.",
      });
      return;
    }

    const result = onExtendStay?.(booking.id, safeCheckout);

    if (!result?.ok) {
      setStatus({
        type: "error",
        text: result?.message || "Could not extend this booking.",
      });
      return;
    }

    setStatus({
      type: "success",
      text: result.message || "Stay extended successfully.",
    });
    onClose?.();
  }

  return (
    <div className="extend-stay-modal" role="dialog" aria-modal="true">
      <button
        type="button"
        className="extend-stay-modal__backdrop"
        onClick={onClose}
        aria-label="Close extend stay"
      />

      <form
        className="extend-stay-card"
        onSubmit={handleSubmit}
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="extend-stay-card__head">
          <span>Extend stay</span>
          <button type="button" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        <h2>{booking.title}</h2>
        <p>{booking.location}</p>

        <label className="extend-stay-field">
          <span>New checkout date</span>
          <input
            type="date"
            min={minimumCheckout}
            value={nextCheckout}
            onChange={(event) => setNextCheckout(event.target.value)}
          />
        </label>

        <div className="extend-stay-summary">
          <div>
            <span>Current checkout</span>
            <strong>{formatShortDate(booking.checkOut)}</strong>
          </div>
          <div>
            <span>New checkout</span>
            <strong>{formatShortDate(nextCheckout)}</strong>
          </div>
          <div>
            <span>Total nights</span>
            <strong>{getNightLabel(totals.nights)}</strong>
          </div>
          <div>
            <span>Extra amount</span>
            <strong>NGN{extraAmount.toLocaleString()}</strong>
          </div>
          <div>
            <span>New total</span>
            <strong>NGN{totals.payable.toLocaleString()}</strong>
          </div>
        </div>

        {status && (
          <p className={`extend-stay-message extend-stay-message--${status.type}`}>
            {status.text}
          </p>
        )}

        <button type="submit" className="profile-action-button">
          Confirm extension
        </button>
      </form>
    </div>
  );
}

function CancelBookingModal({ booking, onClose, onCancelBooking }) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [status, setStatus] = useState(null);
  const dialogRef = useDialogFocus(true, { onClose });

  function handleSubmit(event) {
    event.preventDefault();

    if (isCancelling) return;

    setIsCancelling(true);
    const result = onCancelBooking?.(booking.id) || {
      ok: false,
      message: "Booking cancellation is unavailable.",
    };

    if (!result.ok) {
      setStatus({
        type: "error",
        text: result.message || "Could not cancel this booking.",
      });
      setIsCancelling(false);
      return;
    }

    onClose?.();
  }

  return (
    <div className="extend-stay-modal" role="dialog" aria-modal="true">
      <button
        type="button"
        className="extend-stay-modal__backdrop"
        onClick={onClose}
        aria-label="Close cancellation dialog"
      />

      <form
        className="extend-stay-card extend-stay-card--cancel"
        onSubmit={handleSubmit}
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="extend-stay-card__head">
          <span>Cancel booking</span>
          <button type="button" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        <h2>{booking.title}</h2>
        <p>
          This will move the booking out of upcoming bookings and mark it as
          cancelled.
        </p>

        <div className="extend-stay-summary">
          <div>
            <span>Booking ID</span>
            <strong>{booking.id}</strong>
          </div>
          <div>
            <span>Check-in</span>
            <strong>{formatShortDate(booking.checkIn)}</strong>
          </div>
          <div>
            <span>Check-out</span>
            <strong>{formatShortDate(booking.checkOut)}</strong>
          </div>
        </div>

        {status && (
          <p className={`extend-stay-message extend-stay-message--${status.type}`}>
            {status.text}
          </p>
        )}

        <button
          type="submit"
          className="profile-action-button"
          disabled={isCancelling}
        >
          {isCancelling ? "Cancelling..." : "Cancel booking"}
        </button>
      </form>
    </div>
  );
}

function BookingCard({ booking, isPast, onExtendStay, onCancelBooking }) {
  const [isExtending, setIsExtending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const isCancelled = booking.status === "cancelled";

  return (
    <article className={`booking-row ${isCancelled ? "booking-row--cancelled" : ""}`}>
      <div className="booking-card__media">
        <AppImage
          src={booking.image}
          fallbackSrc={defaultApartmentImage}
          alt={booking.title}
        />
      </div>

      <div className="booking-card">
        <div className="booking-card__header">
          <strong>{booking.title}</strong>
          <span className="booking-card__id">
            <em>{isCancelled ? "Cancelled booking" : "Booking ID"}</em>
            <b>{booking.id}</b>
          </span>
        </div>

        <p className="booking-card__location">
          <FiMapPin />
          {booking.location}
        </p>

        <div className="booking-card__meta">
          <span>
            <FiUsers />
            {getGuestLabel(booking.guests)}
          </span>
          <span>
            <FiClock />
            {getNightLabel(booking.nights)}
          </span>
        </div>

        <div className="booking-card__dates">
          <span>
            <em>Check-in</em>
            <b>
              <FiCalendar />
              {formatShortDate(booking.checkIn)}
            </b>
          </span>
          <span>
            <em>Check-out</em>
            <b>
              <FiCalendar />
              {formatShortDate(booking.checkOut)}
            </b>
          </span>
        </div>

        <div className="booking-card__footer">
          <strong>
            Total Amount
            <b>NGN{Number(booking.totalAmount || 0).toLocaleString()}</b>
          </strong>

          {!isPast && !isCancelled && (
            <div className="booking-card__actions">
              <button
                type="button"
                className="profile-outline-button"
                onClick={() => setIsCancelling(true)}
              >
                Cancel booking
              </button>
              <button
                type="button"
                className="profile-action-button"
                onClick={() => setIsExtending(true)}
              >
                Extend stay
              </button>
            </div>
          )}
        </div>
      </div>

      {isExtending && (
        <ExtendStayModal
          booking={booking}
          onClose={() => setIsExtending(false)}
          onExtendStay={onExtendStay}
        />
      )}

      {isCancelling && (
        <CancelBookingModal
          booking={booking}
          onClose={() => setIsCancelling(false)}
          onCancelBooking={onCancelBooking}
        />
      )}
    </article>
  );
}

function BookingsView({ bookings, onBack, onExtendStay, onCancelBooking }) {
  const [bookingTab, setBookingTab] = useState("upcoming");
  const upcomingBookings = bookings.filter(
    (booking) =>
      booking.status !== "cancelled" && !isPastBooking(booking.checkOut),
  );
  const pastBookings = bookings.filter((booking) =>
    booking.status === "cancelled" || isPastBooking(booking.checkOut),
  );
  const visibleBookings =
    bookingTab === "upcoming" ? upcomingBookings : pastBookings;

  return (
    <section className="profile-panel profile-panel--soft">
      <ViewHeading
        title={bookingTab === "upcoming" ? "Upcoming Booking" : "Past Bookings"}
        onBack={onBack}
      />

      <div className="profile-tabs">
        <button
          type="button"
          className={bookingTab === "upcoming" ? "is-active" : ""}
          onClick={() => setBookingTab("upcoming")}
        >
          Upcoming Booking
        </button>
        <button
          type="button"
          className={bookingTab === "past" ? "is-active" : ""}
          onClick={() => setBookingTab("past")}
        >
          Past Bookings
        </button>
      </div>

      <div className="booking-list">
        {visibleBookings.length > 0 ? (
          visibleBookings.map((booking) => (
          <BookingCard
              booking={booking}
              isPast={bookingTab === "past"}
              onExtendStay={onExtendStay}
              onCancelBooking={onCancelBooking}
              key={booking.id}
            />
          ))
        ) : (
          <EmptyState
            title="No bookings yet"
            message={
              bookingTab === "upcoming"
                ? "Booked apartments will show up here once you complete a booking."
                : "Past and cancelled bookings will appear here after your stays."
            }
          />
        )}
      </div>
    </section>
  );
}

function OrderCard({ order }) {
  return (
    <article className="order-card">
      <AppImage
        src={order.image}
        fallbackSrc={wishlistImage}
        alt={order.title}
      />

      <div className="order-card__body">
        <div className="order-card__head">
          <span>{order.category || "Order"}</span>
          <strong>NGN{Number(order.totalAmount || 0).toLocaleString()}</strong>
        </div>

        <h2>{order.title}</h2>

        <p>
          {order.apartmentNumber
            ? `Delivery to ${order.apartmentNumber}`
            : "Delivery details pending"}
        </p>

        <div className="order-card__meta">
          <span>{formatOrderDate(order.createdAt)}</span>
          <b>{order.id}</b>
        </div>
      </div>
    </article>
  );
}

function OrdersView({ orders, onBack }) {
  return (
    <section className="profile-panel profile-panel--soft">
      <ViewHeading title="Orders" onBack={onBack} />

      {orders.length > 0 ? (
        <div className="order-list">
          {orders.map((order) => (
            <OrderCard order={order} key={order.id} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No orders yet"
          message="Food, toiletries, service, and request orders will appear here after checkout."
        />
      )}
    </section>
  );
}

function ShopView({ onBack, onShopSelect }) {
  return (
    <section className="profile-panel profile-panel--soft profile-shop-panel">
      <ViewHeading title="Shops" onBack={onBack} />

      {shopCategories.length > 0 ? (
        <div className="profile-shop-card">
          {shopCategories.map((item) => (
            <button
              type="button"
              className="profile-shop-card__item"
              onClick={() => onShopSelect?.(item.id)}
              key={item.id}
            >
              <AppImage src={item.image} alt="" />
              <span>
                <strong>{item.title}</strong>
                <em>{item.location}</em>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No shop categories yet"
          message="Available shop categories will appear here when they are added."
        />
      )}
    </section>
  );
}

function ChangePasswordView({ onBack, onPasswordChange }) {
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    nextPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState(null);

  const passwordChecks = {
    uppercase: /[A-Z]/.test(passwordData.nextPassword),
    lowercase: /[a-z]/.test(passwordData.nextPassword),
    number: /\d/.test(passwordData.nextPassword),
    length: passwordData.nextPassword.length >= 8,
    special: /[^A-Za-z0-9]/.test(passwordData.nextPassword),
  };
  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);

  function handlePasswordFieldChange(field, value) {
    setPasswordData((currentData) => ({
      ...currentData,
      [field]: value,
    }));
    setPasswordMessage(null);
  }

  function handlePasswordSubmit(event) {
    event.preventDefault();

    if (!passwordData.currentPassword) {
      setPasswordMessage({
        type: "error",
        text: "Enter your current password.",
      });
      return;
    }

    if (!isPasswordStrong) {
      setPasswordMessage({
        type: "error",
        text: "New password must include uppercase, lowercase, number, symbol, and at least 8 characters.",
      });
      return;
    }

    if (passwordData.nextPassword !== passwordData.confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "New passwords do not match.",
      });
      return;
    }

    if (passwordData.currentPassword === passwordData.nextPassword) {
      setPasswordMessage({
        type: "error",
        text: "New password must be different from the current password.",
      });
      return;
    }

    const result = onPasswordChange?.({
      currentPassword: passwordData.currentPassword,
      nextPassword: passwordData.nextPassword,
    }) || {
      ok: false,
      message: "Password update is unavailable.",
    };

    setPasswordMessage({
      type: result.ok ? "success" : "error",
      text: result.message,
    });

    if (result.ok) {
      setPasswordData({
        currentPassword: "",
        nextPassword: "",
        confirmPassword: "",
      });
    }
  }

  return (
    <section className="profile-panel profile-panel--soft">
      <ViewHeading title="Change password" onBack={onBack} />

      <form className="password-card" onSubmit={handlePasswordSubmit}>
        <label className="profile-field">
          <span>Current password</span>
          <input
            type="password"
            value={passwordData.currentPassword}
            placeholder="Enter current password"
            autoComplete="current-password"
            onChange={(event) =>
              handlePasswordFieldChange("currentPassword", event.target.value)
            }
          />
        </label>

        <label className="profile-field profile-field--with-icon">
          <span>New password</span>
          <FiLock />
          <input
            type="password"
            value={passwordData.nextPassword}
            placeholder="Enter new password"
            autoComplete="new-password"
            onChange={(event) =>
              handlePasswordFieldChange("nextPassword", event.target.value)
            }
          />
        </label>

        <label className="profile-field profile-field--with-icon">
          <span>Confirm password</span>
          <FiLock />
          <input
            type="password"
            value={passwordData.confirmPassword}
            placeholder="Confirm new password"
            autoComplete="new-password"
            onChange={(event) =>
              handlePasswordFieldChange("confirmPassword", event.target.value)
            }
          />
        </label>

        {passwordMessage && (
          <p
            className={`password-message password-message--${passwordMessage.type}`}
            role="status"
          >
            {passwordMessage.text}
          </p>
        )}

        <button type="submit" className="profile-action-button password-save">
          Update password
        </button>
      </form>

      <p className="password-login-text">
        Already have an account? <strong>Log in</strong>
      </p>
    </section>
  );
}

function PolicyDetail({ title, onBack }) {
  return (
    <section className="profile-panel profile-panel--plain policy-detail">
      <ViewHeading title="" onBack={onBack} />

      <div className="policy-icon">
        <FiShield />
        <FiCheck />
      </div>

      <h1>{title}</h1>

      <p>
        At Rockverse, we use cookies to make your experience better. These small
        data files help us remember your preferences, understand how you use our
        platform, and improve performance and security.
      </p>
      <p>
        Some cookies are essential for the app to function properly, while others
        help us personalize your experience and show relevant content.
      </p>
      <p>
        By continuing to use our platform, you agree to the use of cookies as
        described. You can update your cookie preferences at any time in your
        settings.
      </p>

      <div className="policy-actions">
        <button type="button" className="profile-outline-button">
          Reject All
        </button>
        <button type="button" className="profile-action-button">
          Accept All
        </button>
      </div>
    </section>
  );
}

function LegalView({ onBack }) {
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  if (selectedPolicy) {
    return (
      <PolicyDetail
        title={legalItems.find((item) => item.id === selectedPolicy)?.title}
        onBack={() => setSelectedPolicy(null)}
      />
    );
  }

  return (
    <section className="profile-panel legal-list">
      <ViewHeading title="Legal" onBack={onBack} />

      <div className="legal-list__card">
        {legalItems.map((item) => (
          <button
            type="button"
            onClick={() => setSelectedPolicy(item.id)}
            key={item.id}
          >
            <span>{item.title}</span>
            <FiChevronRight />
          </button>
        ))}
      </div>
    </section>
  );
}

function ReferEarnView({ user, onBack }) {
  const [tab, setTab] = useState("history");
  const referralCode = user?.username || "Markekpobiyere";

  return (
    <section className="profile-panel refer-panel">
      <ViewHeading title="Refer and Earn" onBack={onBack} />

      <div className="rocks-banner">
        <span>Available Rocks</span>
        <strong>
          RK <b>5.00</b>
        </strong>
        <em>= N12,500 discount value</em>
      </div>

      <div className="referral-card">
        <span>Your referral code:</span>
        <strong>
          {referralCode}
          <button type="button" aria-label="Copy referral code">
            <FiCopy />
          </button>
        </strong>
        <em>Share this with friends to earn rewards!</em>
      </div>

      <div className="profile-tabs profile-tabs--wide">
        <button
          type="button"
          className={tab === "history" ? "is-active" : ""}
          onClick={() => setTab("history")}
        >
          Transaction History
        </button>
        <button
          type="button"
          className={tab === "earn" ? "is-active" : ""}
          onClick={() => setTab("earn")}
        >
          How to Earn
        </button>
      </div>

      <div className="earn-card">
        {tab === "history"
          ? earningRows.map((item) => (
              <article className="earning-row" key={item.title}>
                <span>
                  <FiGift />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <em>29 Aug, 2025 5:44PM</em>
                </div>
                <b className={item.amount.startsWith("-") ? "is-negative" : ""}>
                  {item.amount}
                </b>
                <small>Bal after: {item.balance}</small>
              </article>
            ))
          : earnRules.map((rule) => (
              <article className="earn-rule" key={rule.title}>
                <span>
                  <FiGift />
                </span>
                <strong>{rule.title}</strong>
                <em>{rule.reward}</em>
              </article>
            ))}
      </div>
    </section>
  );
}

function HelpCenterView({ onBack }) {
  return (
    <section className="profile-panel profile-panel--soft help-panel">
      <ViewHeading title="Get help" onBack={onBack} />

      <div className="help-card">
        <p>
          <FiPhone />
          (415) 555-0132
        </p>
        <p>
          <FiMail />
          Support@bedrockresidencies.com
        </p>
      </div>

      <div className="help-card help-card--socials">
        <strong>Our Socials</strong>
        {socials.map((social) => {
          const Icon = social.icon;

          return (
            <button type="button" key={social.label}>
              <Icon />
              <span>{social.label}</span>
              <FiChevronRight />
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function ProfilePage({
  user,
  bookings = [],
  orders = [],
  initialView = "profile",
  onGoHome,
  onProfileSave,
  onPasswordChange,
  onExtendStay,
  onCancelBooking,
  onShopSelect,
  onLogout,
}) {
  const [activeView, setActiveView] = useState(() => initialView);
  const [viewHistory, setViewHistory] = useState([]);
  const [isSidebarMenuOpen, setIsSidebarMenuOpen] = useState(false);

  function navigateToView(nextView) {
    if (nextView === activeView) return;

    setViewHistory((currentHistory) => [...currentHistory, activeView]);
    setActiveView(nextView);
  }

  function goBack() {
    const previousView = viewHistory.at(-1);

    if (!previousView) {
      onGoHome?.();
      return;
    }

    setViewHistory((currentHistory) => currentHistory.slice(0, -1));
    setActiveView(previousView);
  }

  function renderView() {
    switch (activeView) {
      case "wishlists":
        return <WishlistView user={user} onBack={goBack} />;
      case "bookings":
        return (
          <BookingsView
            bookings={bookings}
            onBack={goBack}
            onExtendStay={onExtendStay}
            onCancelBooking={onCancelBooking}
          />
        );
      case "orders":
        return <OrdersView orders={orders} onBack={goBack} />;
      case "shop":
        return <ShopView onBack={goBack} onShopSelect={onShopSelect} />;
      case "settings":
        return (
          <ChangePasswordView
            onBack={goBack}
            onPasswordChange={onPasswordChange}
          />
        );
      case "privacy":
        return <PolicyDetail title="Terms of service" onBack={goBack} />;
      case "refer":
        return <ReferEarnView user={user} onBack={goBack} />;
      case "legal":
        return <LegalView onBack={goBack} />;
      case "help":
        return <HelpCenterView onBack={goBack} />;
      case "profile":
      default:
        return (
          <EditProfileView
            user={user}
            onProfileSave={onProfileSave}
            onChangePassword={() => navigateToView("settings")}
            onBack={goBack}
          />
        );
    }
  }

  return (
    <div className="profile-page">
      <ProfileSidebar
        activeView={activeView}
        isMenuOpen={isSidebarMenuOpen}
        onChangeView={navigateToView}
        onCloseMenu={() => setIsSidebarMenuOpen(false)}
        onGoHome={onGoHome}
        onLogout={onLogout}
        onToggleMenu={() => setIsSidebarMenuOpen((current) => !current)}
      />

      <main className="profile-main">
        <ProfileTopbar
          user={user}
          onProfile={() => navigateToView("profile")}
        />

        {activeView !== "profile" && <ProfileSearch />}

        {renderView()}
      </main>
    </div>
  );
}
