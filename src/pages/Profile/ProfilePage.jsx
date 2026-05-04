import { useMemo, useState } from "react";
import {
  FiBell,
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
  FiMessageSquare,
  FiMoreVertical,
  FiPhone,
  FiPlus,
  FiSearch,
  FiSettings,
  FiShield,
  FiSliders,
  FiShoppingBag,
  FiStar,
  FiUsers,
} from "react-icons/fi";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";
import bedrockLogo from "../../assets/bedrock-logo.svg";
import bookingsImage from "../../assets/bookings.jpg";
import wishlistImage from "../../assets/wishlist.jpg";
import {
  countryOptions,
  findCountryByDialCode,
  findCountryByName,
  getDialCodeDigits,
  normalizeLocalPhoneNumber,
} from "../../utils/countries";
import { getUserMessageCount } from "../../utils/userMessages";
import "./ProfilePage.css";

const sidebarItems = [
  { id: "profile", label: "Home", icon: FiHome },
  { id: "wishlists", label: "Wishlists", icon: FiHeart },
  { id: "bookings", label: "Bookings", icon: FiCalendar },
  { id: "messages", label: "Messages", icon: FiMessageSquare },
  { id: "shop", label: "Shop", icon: FiShoppingBag },
  { id: "settings", label: "Account and Settings", icon: FiSettings },
  { id: "privacy", label: "Privacy", icon: FiGlobe },
  { id: "refer", label: "Refer and Earn", icon: FiHelpCircle },
  { id: "legal", label: "Legal", icon: FiHelpCircle },
  { id: "help", label: "Help Center", icon: FiHelpCircle },
];

const wishlistItems = Array.from({ length: 6 }, (_, index) => ({
  id: `wishlist-${index + 1}`,
  title: index % 2 === 0 ? "Mega chicken" : "Rice bowl",
  type: index % 2 === 0 ? "Vegetarian" : "Lunch",
  image: wishlistImage,
  price: index % 2 === 0 ? "NGN200,000" : "NGN225,000",
}));

const bookingItems = [
  {
    id: "BK1345689",
    title: "4 Bedroom apartment",
    image: bookingsImage,
    price: "NGN200,000",
  },
  {
    id: "BK1345690",
    title: "4 Bedroom apartment",
    image: bookingsImage,
    price: "NGN200,000",
  },
];

const messageRows = Array.from({ length: 10 }, (_, index) => ({
  id: `message-${index + 1}`,
  label: index % 3 === 0 ? "Booking" : "Label",
  title: index % 2 === 0 ? "Reservation update" : "Message title",
  body: index % 2 === 0 ? "Your stay request has been received." : "Message body",
}));

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
  messageCount,
  onChangeView,
  onGoHome,
  onLogout,
}) {
  return (
    <aside className="profile-sidebar">
      <button
        type="button"
        className="profile-sidebar__brand"
        onClick={onGoHome}
        aria-label="Go to homepage"
      >
        <img src={bedrockLogo} alt="Bedrock Residences" />
        <span aria-hidden="true">...</span>
      </button>

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
              onClick={() => onChangeView(item.id)}
              key={item.id}
            >
              <Icon />
              <span>{item.label}</span>
              {item.id === "messages" && messageCount > 0 && (
                <strong className="profile-sidebar__badge">
                  {messageCount}
                </strong>
              )}
            </button>
          );
        })}
      </nav>

      <button type="button" className="profile-sidebar__logout" onClick={onLogout}>
        <FiLogOut />
        <span>Log out</span>
      </button>
    </aside>
  );
}

function ProfileTopbar({ user, messageCount, onMessages, onProfile }) {
  return (
    <header className="profile-topbar">
      <button
        type="button"
        className="profile-topbar__bell"
        onClick={onMessages}
        aria-label={
          messageCount > 0
            ? `Open messages, ${messageCount} unread`
            : "Open messages"
        }
      >
        {messageCount > 0 && <span />}
        <FiBell />
      </button>

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

function EditProfileView({ user, onProfileSave, onBack }) {
  const initialCountryName = getProfileCountry(user);
  const initialCountry =
    findCountryByName(initialCountryName) ||
    findCountryByDialCode(user?.countryCode);
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || "");
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

  function handleProfilePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProfilePhoto(String(reader.result));
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
          {profilePhoto ? <img src={profilePhoto} alt="Profile" /> : initials}
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
        <img src={item.image} alt={item.title} />
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

function WishlistView({ onBack }) {
  return (
    <section className="profile-panel">
      <ViewHeading title="Wishlist" onBack={onBack} />

      <div className="profile-card-grid">
        {wishlistItems.map((item) => (
          <FoodCard item={item} key={item.id} />
        ))}
      </div>
    </section>
  );
}

function BookingCard({ booking, isPast }) {
  return (
    <article className="booking-card">
      <div className="booking-card__media">
        <img src={booking.image} alt={booking.title} />
      </div>

      <div className="booking-card__content">
        <div className="booking-card__header">
          <strong>{booking.title}</strong>
          <span className="booking-card__id">
            <em>Booking ID</em>
            <b>{booking.id}</b>
          </span>
        </div>

        <p className="booking-card__location">
          <FiMapPin />
          Oduduwa, Ikeja GRA
        </p>

        <div className="booking-card__meta">
          <span>
            <FiUsers />8 Guest
          </span>
          <span>
            <FiClock />3 Night
          </span>
        </div>

        <div className="booking-card__dates">
          <span>
            <em>Check-in</em>
            <b>
              <FiCalendar />
              Oct 24, 2025
            </b>
          </span>
          <span>
            <em>Check-out</em>
            <b>
              <FiCalendar />
              Oct 24, 2025
            </b>
          </span>
        </div>

        <div className="booking-card__footer">
          <strong>
            Total Amount
            <b>{booking.price}</b>
          </strong>

          {!isPast && (
            <div className="booking-card__actions">
              <button type="button" className="profile-outline-button">
                Cancel booking
              </button>
              <button type="button" className="profile-action-button">
                Extend stay
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function BookingsView({ onBack }) {
  const [bookingTab, setBookingTab] = useState("upcoming");

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
        {bookingItems.map((booking) => (
          <BookingCard
            booking={booking}
            isPast={bookingTab === "past"}
            key={booking.id}
          />
        ))}
      </div>
    </section>
  );
}

function MessagesView() {
  return (
    <section className="messages-board">
      <div className="messages-board__search">
        <FiSearch />
        <input type="search" placeholder="Search all emails..." />
      </div>

      <div className="messages-board__tabs">
        <button type="button" className="is-active">
          All messages
        </button>
        <button type="button">Unread</button>
        <button type="button">Starred</button>

        <button type="button" className="messages-board__new">
          New message
        </button>
      </div>

      <div className="messages-table">
        {messageRows.map((message) => (
          <article className="messages-table__row" key={message.id}>
            <input type="checkbox" aria-label={`Select ${message.title}`} />
            <strong>Sender</strong>
            <span>{message.label}</span>
            <div>
              <b>{message.title}</b>
              <p>{message.body}</p>
            </div>
            <button type="button" aria-label="More message options">
              <FiMoreVertical />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ShopView({ onBack }) {
  return (
    <section className="profile-panel">
      <ViewHeading title="Shop" onBack={onBack} />

      <div className="profile-card-grid">
        {wishlistItems.map((item) => (
          <FoodCard item={item} key={`shop-${item.id}`} />
        ))}
      </div>
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
  initialView = "profile",
  onGoHome,
  onProfileSave,
  onPasswordChange,
  onLogout,
}) {
  const [activeView, setActiveView] = useState(() => initialView);
  const [viewHistory, setViewHistory] = useState([]);
  const messageCount = getUserMessageCount(user);

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
        return <WishlistView onBack={goBack} />;
      case "bookings":
        return <BookingsView onBack={goBack} />;
      case "messages":
        return <MessagesView />;
      case "shop":
        return <ShopView onBack={goBack} />;
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
            onBack={goBack}
          />
        );
    }
  }

  return (
    <div className="profile-page">
      <ProfileSidebar
        activeView={activeView}
        messageCount={messageCount}
        onChangeView={navigateToView}
        onGoHome={onGoHome}
        onLogout={onLogout}
      />

      <main className="profile-main">
        <ProfileTopbar
          user={user}
          messageCount={messageCount}
          onMessages={() => navigateToView("messages")}
          onProfile={() => navigateToView("profile")}
        />

        {activeView !== "profile" && <ProfileSearch />}

        {renderView()}
      </main>
    </div>
  );
}
