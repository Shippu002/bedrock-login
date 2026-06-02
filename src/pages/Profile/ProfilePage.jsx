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
  FiExternalLink,
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
  FiSearch,
  FiShield,
  FiSliders,
  FiShoppingBag,
  FiStar,
  FiUser,
  FiUsers,
  FiWifi,
  FiX,
} from "react-icons/fi";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";
import bedrockLogo from "../../assets/bedrock-logo.svg";
import AppImage from "../../components/AppImage";
import { mergeLegalDocuments } from "../../data/legalDocuments";
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
  { id: "home", label: "Home", icon: FiHome },
  { id: "profile", label: "Profile", icon: FiUser },
  { id: "wishlists", label: "Wishlists", icon: FiHeart },
  { id: "bookings", label: "Bookings", icon: FiCalendar },
  { id: "orders", label: "Orders", icon: FiShoppingBag },
  { id: "notifications", label: "Messages", icon: FiMail },
  { id: "shop", label: "Shop", icon: FiShoppingBag },
  { id: "settings", label: "Change password", icon: FiLock },
  { id: "account", label: "Account", icon: FiShield },
  { id: "privacy", label: "Privacy", icon: FiGlobe },
  { id: "refer", label: "Refer and Earn", icon: FiHelpCircle },
  { id: "legal", label: "Legal", icon: FiHelpCircle },
  { id: "help", label: "Help Center", icon: FiHelpCircle },
];

const fallbackEarnRules = [
  {
    id: "rock-coin-apartment-price",
    title: "Guests earn 1 Rock Coin per ₦1,000 of the apartment price",
    reward: "RK1 off",
  },
  {
    id: "three-day-stay-bonus",
    title: "Guests earn ₦3,000 for 3 days stay in the apartment",
    reward: "RK3 off",
  },
];

const socials = [
  { label: "X (formerly twitter)", icon: FaXTwitter },
  { label: "Facebook", icon: FaFacebookF },
  { label: "Instagram", icon: FaInstagram },
  { label: "Linkedin", icon: FaLinkedinIn },
];

// Production currently returns 404 for the documented order-cancel route.
// Restore this action only after the backend confirms a deployed contract.
const ORDER_CANCELLATION_AVAILABLE = false;

function getPathValue(source, path) {
  return String(path || "")
    .split(".")
    .reduce((current, part) => current?.[part], source);
}

function formatBackendKeyTitle(key) {
  return String(key || "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeBackendListValue(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const trimmedValue = value.trim();

    if (
      (trimmedValue.startsWith("[") && trimmedValue.endsWith("]")) ||
      (trimmedValue.startsWith("{") && trimmedValue.endsWith("}"))
    ) {
      try {
        const parsedValue = JSON.parse(trimmedValue);
        const parsedItems = normalizeBackendListValue(parsedValue);

        if (parsedItems.length > 0) return parsedItems;
      } catch {
        // Keep plain backend text visible if it is not valid JSON.
      }
    }

    const textLines = trimmedValue
      .split(/\r?\n/)
      .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
      .filter(Boolean);

    return textLines.length > 1 ? textLines : [trimmedValue];
  }

  if (!value || typeof value !== "object") return [];

  const nestedListKeys = [
    "data",
    "items",
    "results",
    "records",
    "list",
    "rows",
    "history",
    "transactions",
    "transaction_history",
    "activities",
    "steps",
    "rules",
    "instructions",
    "how_to_earn",
    "howToEarn",
    "how_it_works",
    "howItWorks",
    "ways_to_earn",
    "waysToEarn",
    "earning_rules",
    "earningRules",
    "earn_rules",
    "earnRules",
    "earning_instructions",
    "earningInstructions",
    "reward_rules",
    "rewardRules",
    "rewards",
    "referral_rewards",
    "referralRewards",
    "referral_program",
    "referralProgram",
  ];

  for (const key of nestedListKeys) {
    const nestedValue = value[key];

    if (Array.isArray(nestedValue)) return nestedValue;
    if (typeof nestedValue === "string" && nestedValue.trim()) return [nestedValue];
    if (nestedValue && typeof nestedValue === "object") {
      const nestedItems = normalizeBackendListValue(nestedValue);

      if (nestedItems.length > 0) return nestedItems;
    }
  }

  if (
    value.title ||
    value.name ||
    value.label ||
    value.description ||
    value.message ||
    value.body ||
    value.content
  ) {
    return [value];
  }

  return Object.entries(value)
    .map(([key, item]) => {
      if (Array.isArray(item)) return item;
      if (item && typeof item === "object") {
        return {
          id: item.id || key,
          title: item.title || item.name || formatBackendKeyTitle(key),
          ...item,
        };
      }
      if (item === undefined || item === null || item === "") return null;

      return {
        id: key,
        title: formatBackendKeyTitle(key),
        description: String(item),
      };
    })
    .flat()
    .filter(Boolean);
}

function getBackendArray(source, keys = []) {
  for (const key of keys) {
    const value = getPathValue(source, key);
    const items = normalizeBackendListValue(value);

    if (items.length > 0) return items;
  }

  return [];
}

function normalizeBackendKey(key) {
  return String(key || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function isEarnRuleKey(key) {
  const normalizedKey = normalizeBackendKey(key);
  const exactMatches = new Set([
    "howtoearn",
    "howitworks",
    "waystoearn",
    "earninginstructions",
    "earningrules",
    "earnrules",
    "rewardrules",
    "referralrewards",
    "referralprogram",
  ]);

  return (
    exactMatches.has(normalizedKey) ||
    normalizedKey.endsWith("howtoearn") ||
    normalizedKey.endsWith("howitworks") ||
    normalizedKey.endsWith("waystoearn") ||
    normalizedKey.endsWith("earningrules") ||
    normalizedKey.endsWith("earnrules") ||
    normalizedKey.endsWith("rewardrules") ||
    normalizedKey.endsWith("referralrewards")
  );
}

function collectBackendListsByKey(source, keyMatcher, depth = 0, visited = new Set()) {
  if (!source || depth > 8) return [];
  if (typeof source !== "object") return [];

  if (visited.has(source)) return [];
  visited.add(source);

  if (Array.isArray(source)) {
    return source.flatMap((item) =>
      collectBackendListsByKey(item, keyMatcher, depth + 1, visited),
    );
  }

  return Object.entries(source).flatMap(([key, value]) => {
    const directItems = keyMatcher(key) ? normalizeBackendListValue(value) : [];
    const nestedItems = collectBackendListsByKey(
      value,
      keyMatcher,
      depth + 1,
      visited,
    );

    return [...directItems, ...nestedItems];
  });
}

function getBackendValue(source, keys = [], fallback = "") {
  for (const key of keys) {
    const value = getPathValue(source, key);

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return fallback;
}

function getReferralImage(item = {}) {
  const user = item.user || item.referee || item.referred_user || item.guest || {};
  const image =
    item.image ||
    item.image_url ||
    item.avatar ||
    item.avatar_url ||
    item.profile_photo ||
    item.profile_photo_url ||
    user.image ||
    user.image_url ||
    user.avatar ||
    user.avatar_url ||
    user.profile_photo ||
    user.profile_photo_url ||
    "";

  return typeof image === "string" ? image : image?.url || "";
}

function getReferralTitle(item = {}) {
  const user = item.user || item.referee || item.referred_user || item.guest || {};
  const userName =
    item.referee_name ||
    item.referred_user_name ||
    item.referred_name ||
    user.name ||
    [user.first_name, user.last_name].filter(Boolean).join(" ");

  return (
    item.title ||
    item.description ||
    item.message ||
    item.reason ||
    item.type_label ||
    (userName ? `${userName} joined with your referral` : "") ||
    "Referral activity"
  );
}

function getReferralAmount(item = {}) {
  const amount =
    item.amount ??
    item.points ??
    item.rock_points ??
    item.rocks ??
    item.value ??
    item.reward ??
    item.reward_points ??
    "";

  if (amount === "") return "";

  const prefix =
    Number(amount) > 0 && !String(amount).startsWith("+") ? "+" : "";

  return `${prefix}${amount}`;
}

function normalizeEarnRule(rule = {}, index = 0) {
  if (typeof rule === "string") {
    return {
      id: `earn-rule-${index + 1}`,
      title: rule,
      description: "",
      reward: "",
    };
  }

  if (typeof rule === "number") {
    return {
      id: `earn-rule-${index + 1}`,
      title: String(rule),
      description: "",
      reward: "",
    };
  }

  const title =
    rule.title ||
    rule.name ||
    rule.heading ||
    rule.step ||
    rule.action ||
    rule.label ||
    rule.message ||
    rule.description ||
    rule.body ||
    rule.content ||
    "Earn reward";
  const description =
    [
      rule.subtitle,
      rule.summary,
      rule.details,
      rule.detail,
      rule.note,
      rule.instruction,
      rule.body,
      rule.content,
      rule.description,
    ].find((item) => item && item !== title) || "";

  return {
    id: rule.id || rule.slug || rule.title || `earn-rule-${index + 1}`,
    title,
    description,
    reward:
      rule.reward ||
      rule.reward_text ||
      rule.reward_description ||
      rule.value ||
      rule.points ||
      rule.rock_points ||
      rule.amount ||
      rule.discount ||
      rule.reward_points ||
      rule.bonus ||
      "",
  };
}

function normalizeLink(url) {
  const value = String(url || "").trim();

  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (/^mailto:|^tel:/i.test(value)) return value;
  if (value.startsWith("/")) return `https://www.bedrockresidences.com${value}`;

  return `https://${value}`;
}

function getLegalDocumentByType(documents = [], keywords = []) {
  return documents.find((document) => {
    const haystack = [
      document.id,
      document.type,
      document.title,
      document.raw?.slug,
      document.raw?.type,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return keywords.some((keyword) => haystack.includes(keyword));
  });
}

function getSocialIcon(name = "") {
  const label = String(name).toLowerCase();

  if (label.includes("facebook")) return FaFacebookF;
  if (label.includes("instagram")) return FaInstagram;
  if (label.includes("linkedin")) return FaLinkedinIn;

  return FaXTwitter;
}

function getHelpSocials(helpInfo = {}) {
  const rawSocials =
    helpInfo.socials ||
    helpInfo.social_links ||
    helpInfo.socialLinks ||
    helpInfo.contact?.socials ||
    helpInfo.support?.socials;

  if (Array.isArray(rawSocials) && rawSocials.length > 0) {
    return rawSocials.map((social) => ({
      label: social.name || social.label || social.title || "Social link",
      url: normalizeLink(social.url || social.link || social.href),
      icon: getSocialIcon(social.name || social.label || social.title),
    }));
  }

  if (rawSocials && typeof rawSocials === "object") {
    return Object.entries(rawSocials).map(([key, value]) => ({
      label: key,
      url: normalizeLink(
        typeof value === "string" ? value : value?.url || value?.link || value?.href,
      ),
      icon: getSocialIcon(key),
    }));
  }

  return socials.map((social) => ({ ...social, url: "" }));
}

function formatRockValue(value, fallback = "0.00") {
  if (value === undefined || value === null || value === "") return fallback;

  const normalizedValue = String(value).replace(/[^\d.-]/g, "");
  const numericValue = Number(normalizedValue);

  if (Number.isFinite(numericValue)) {
    return numericValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return String(value);
}

function formatDiscountValue(value) {
  if (value === undefined || value === null || value === "") {
    return "₦0.0";
  }

  const normalizedValue = String(value).replace(/[^\d.-]/g, "");
  const numericValue = Number(normalizedValue);

  if (Number.isFinite(numericValue)) {
    return `₦${numericValue.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}`;
  }

  return String(value);
}

function formatReferralDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

function normalizeOrderStatus(status) {
  return String(status || "pending").trim().toLowerCase();
}

function formatOrderStatus(status) {
  return normalizeOrderStatus(status)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isOrderCancelable(order) {
  const status = normalizeOrderStatus(order?.status);

  return !["cancelled", "canceled", "completed", "delivered", "refunded"].includes(
    status,
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
  user,
  unreadCount = 0,
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
          className="profile-sidebar__account"
          onClick={() => {
            onChangeView("profile");
            onCloseMenu?.();
          }}
        >
          <span>{getInitials(user?.name || user?.username)}</span>
          <strong>{user?.username || user?.name || "Profile"}</strong>
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
          const isHomeAction = item.id === "home";
          const isActive = !isHomeAction && activeView === item.id;
          const badge = item.id === "notifications" ? unreadCount : 0;

          return (
            <button
              type="button"
              className={`profile-sidebar__item ${
                isActive ? "profile-sidebar__item--active" : ""
              }`}
              onClick={() => {
                if (isHomeAction) {
                  onGoHome?.();
                } else {
                  onChangeView(item.id);
                }
                onCloseMenu?.();
              }}
              key={item.id}
            >
              <Icon />
              <span>{item.label}</span>
              {badge > 0 && (
                <b className="profile-sidebar__badge">{Math.min(badge, 99)}</b>
              )}
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

function ProfileTopbar({ unreadCount = 0, onNotifications }) {
  return (
    <header className="profile-topbar">
      <button
        type="button"
        className="profile-topbar__bell"
        onClick={onNotifications}
        aria-label="Open notifications"
      >
        {unreadCount > 0 && <span />}
        <FiBell />
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
        <span>Back</span>
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

function ReferEmptyState({ title, message }) {
  return (
    <div className="refer-empty-state">
      <span>
        <FiGift />
      </span>
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}

function EditProfileView({
  user,
  onProfileSave,
  onChangePassword,
  onAvatarUpload,
  onBack,
}) {
  const initialCountryName = getProfileCountry(user);
  const initialCountry =
    findCountryByName(initialCountryName) ||
    findCountryByDialCode(user?.countryCode);
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || "");
  const [failedProfilePhoto, setFailedProfilePhoto] = useState("");
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
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
  const isProfileComplete = isImportantProfileComplete(user);
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
    onAvatarUpload?.(file);
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const country = String(formData.get("country") || "");
    const selectedCountry = findCountryByName(country);
    const localPhone = normalizeLocalPhoneNumber(phoneNumber, selectedCountry);

    setIsProfileSaving(true);
    setProfileMessage(null);

    try {
      const result = (await onProfileSave?.({
        name: String(formData.get("name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        phone: selectedCountry?.dialCode
          ? `${selectedCountry.dialCode} ${localPhone}`
          : localPhone,
        state: String(formData.get("state") || "").trim(),
        country,
        countryCode: selectedCountry?.id || initialCountry?.id || user?.countryCode || "",
        currency: selectedCountry?.currency || user?.currency || "",
        profilePhoto,
      })) || {
        ok: false,
        message: "Profile update is unavailable.",
      };

      setProfileMessage({
        type: result.ok ? "success" : "error",
        text: result.message,
      });
    } finally {
      setIsProfileSaving(false);
    }
  }

  function handleCountryChange(countryName) {
    const nextCountry = findCountryByName(countryName);

    setSelectedCountryName(countryName);
    setProfileMessage(null);
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
          <em className={isProfileComplete ? "" : "is-unverified"}>
            {isProfileComplete ? "Profile complete" : "Complete your profile"}
          </em>
          {!isProfileComplete && (
            <small>
              Add your name, email, phone number, country, and state.
            </small>
          )}
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
              onChange={(event) => {
                setProfileMessage(null);
                setPhoneNumber(
                  normalizeLocalPhoneNumber(event.target.value, selectedCountry),
                );
              }}
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

        {profileMessage && (
          <p
            className={`password-message password-message--${profileMessage.type}`}
            role="status"
          >
            {profileMessage.text}
          </p>
        )}

        <button
          type="submit"
          className="profile-action-button"
          disabled={isProfileSaving}
        >
          {isProfileSaving ? "Saving..." : "Save"}
        </button>
      </form>
    </section>
  );
}

function WishlistCard({ item }) {
  const isApartment =
    item.sourceType === "apartment" ||
    item.residenceName ||
    item.location ||
    item.nightlyRate ||
    item.rooms ||
    item.bedrooms;
  const location =
    item.location || item.residenceName || item.type || "Bedrock Residences";
  const guestLabel =
    item.guests || item.guestCount
      ? `${Number(item.guests || item.guestCount)} Guest${
          Number(item.guests || item.guestCount) === 1 ? "" : "s"
        }`
      : "Guests";
  const roomCount = item.rooms || item.roomCount || item.bedrooms;
  const roomLabel = roomCount
    ? `${Number(roomCount)} Room${Number(roomCount) === 1 ? "" : "s"}`
    : "Room";
  const price =
    typeof item.price === "number"
      ? `NGN${item.price.toLocaleString()}`
      : item.price || item.priceLabel || "Saved";

  return (
    <article className="profile-wishlist-card">
      <div className="profile-wishlist-card__image">
        <AppImage
          className="profile-wishlist-card__photo"
          src={item.image}
          fallbackSrc=""
          alt={item.title}
        />
        <span>Available</span>
      </div>

      <div className="profile-wishlist-card__body">
        <div className="profile-wishlist-card__top">
          <div>
            <strong>{item.title}</strong>
            <span>
              <FiMapPin />
              {location}
            </span>
          </div>

          <em>
            <FiStar />
            {Number(item.rating || item.averageRating || 0).toFixed(1)}
          </em>
        </div>

        {isApartment ? (
          <div className="profile-wishlist-card__meta">
            <span>
              <FiUsers />
              {guestLabel}
            </span>
            <span>
              <FiHome />
              {roomLabel}
            </span>
            <span>
              <FiWifi />
              Wi-Fi
            </span>
          </div>
        ) : (
          <p>{item.description || "Saved item from Bedrock."}</p>
        )}

        <div className="profile-wishlist-card__bottom">
          <button type="button">
            {isApartment ? "Saved apartment" : "Saved item"}
          </button>

          <strong>
            {price}
            {isApartment && <span>/per night</span>}
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
            <WishlistCard
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

  async function handleSubmit(event) {
    event.preventDefault();

    const safeCheckout = ensureCheckoutDate(booking.checkOut, nextCheckout);

    if (safeCheckout <= booking.checkOut) {
      setStatus({
        type: "error",
        text: "Choose a checkout date after your current checkout date.",
      });
      return;
    }

    const result = await onExtendStay?.(booking.id, safeCheckout);

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

  async function handleSubmit(event) {
    event.preventDefault();

    if (isCancelling) return;

    setIsCancelling(true);
    const result = (await onCancelBooking?.(booking.id)) || {
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

function BookingCard({
  booking,
  isPast,
  onExtendStay,
  onCancelBooking,
  onDownloadInvoice,
  onLoadTimeline,
  onSubmitReview,
}) {
  const [isExtending, setIsExtending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: "5",
    comment: "",
  });
  const [actionMessage, setActionMessage] = useState(null);
  const isCancelled = booking.status === "cancelled";
  const hasSubmittedReview = Boolean(booking.reviewed || booking.review);

  async function runBookingAction(action) {
    const result = await action?.(booking);

    if (result?.message) {
      setActionMessage({
        type: result.ok ? "success" : "error",
        text: result.message,
      });
    }
  }

  async function handleReviewSubmit(event) {
    event.preventDefault();

    if (!reviewData.comment.trim()) {
      setActionMessage({
        type: "error",
        text: "Please add a short review before submitting.",
      });
      return;
    }

    setIsReviewSubmitting(true);

    const result = await onSubmitReview?.(booking, {
      rating: Number(reviewData.rating),
      comment: reviewData.comment.trim(),
    });

    if (result?.message) {
      setActionMessage({
        type: result.ok ? "success" : "error",
        text: result.message,
      });
    }

    if (result?.ok) {
      setIsReviewing(false);
      setReviewData({ rating: "5", comment: "" });
    }

    setIsReviewSubmitting(false);
  }

  return (
    <article className={`booking-row ${isCancelled ? "booking-row--cancelled" : ""}`}>
      <div className="booking-card__media">
        <AppImage
          className="booking-card__image"
          src={booking.image}
          fallbackSrc=""
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

          <div className="booking-card__actions">
            <button
              type="button"
              className="profile-outline-button"
              onClick={() => runBookingAction(onDownloadInvoice)}
            >
              Invoice
            </button>
            <button
              type="button"
              className="profile-outline-button"
              onClick={() => runBookingAction(onLoadTimeline)}
            >
              Timeline
            </button>
            {isPast && !isCancelled && !hasSubmittedReview && (
              <button
                type="button"
                className="profile-outline-button"
                onClick={() => setIsReviewing((current) => !current)}
              >
                Review stay
              </button>
            )}

            {isPast && hasSubmittedReview && (
              <span className="booking-card__reviewed">
                <FiCheck />
                Reviewed
              </span>
            )}

            {!isPast && !isCancelled && (
              <>
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
              </>
            )}
          </div>
        </div>

        {booking.timeline?.length > 0 && (
          <div className="extend-stay-summary">
            {booking.timeline.slice(0, 3).map((item, index) => (
              <div key={item.id || item.title || index}>
                <span>{item.title || item.status || "Timeline update"}</span>
                <strong>{formatOrderDate(item.createdAt || item.created_at)}</strong>
              </div>
            ))}
          </div>
        )}

        {isReviewing && (
          <form className="booking-review-form" onSubmit={handleReviewSubmit}>
            <label className="extend-stay-field">
              <span>Rating</span>
              <select
                value={reviewData.rating}
                onChange={(event) =>
                  setReviewData((current) => ({
                    ...current,
                    rating: event.target.value,
                  }))
                }
              >
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </select>
            </label>

            <label className="extend-stay-field">
              <span>Review</span>
              <textarea
                value={reviewData.comment}
                onChange={(event) =>
                  setReviewData((current) => ({
                    ...current,
                    comment: event.target.value,
                  }))
                }
                placeholder="Tell us how your stay went"
                rows={3}
              />
            </label>

            <button
              type="submit"
              className="profile-action-button"
              disabled={isReviewSubmitting}
            >
              {isReviewSubmitting ? "Submitting..." : "Submit review"}
            </button>
          </form>
        )}

        {actionMessage && (
          <p
            className={`extend-stay-message extend-stay-message--${actionMessage.type}`}
          >
            {actionMessage.text}
          </p>
        )}
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

function BookingsView({
  bookings,
  onBack,
  onExtendStay,
  onCancelBooking,
  onDownloadInvoice,
  onLoadTimeline,
  onSubmitReview,
}) {
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
              onDownloadInvoice={onDownloadInvoice}
              onLoadTimeline={onLoadTimeline}
              onSubmitReview={onSubmitReview}
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

function OrderCard({ order, onCancelOrder }) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const status = normalizeOrderStatus(order.status);
  const canCancel = isOrderCancelable(order);

  async function handleCancelOrder() {
    setIsCancelling(true);
    setActionMessage(null);

    const result = await onCancelOrder?.(order);

    if (result?.message) {
      setActionMessage({
        type: result.ok ? "success" : "error",
        text: result.message,
      });
    }

    setIsCancelling(false);
  }

  return (
    <article
      className={`order-card ${
        status === "cancelled" || status === "canceled"
          ? "order-card--cancelled"
          : ""
      }`}
    >
      <AppImage
        className="order-card__image"
        src={order.image}
        fallbackSrc=""
        alt={order.title}
      />

      <div className="order-card__body">
        <div className="order-card__head">
          <span>{order.category || "Order"}</span>
          <strong>NGN{Number(order.totalAmount || 0).toLocaleString()}</strong>
        </div>

        <h2>{order.title}</h2>

        <span className={`order-card__status order-card__status--${status}`}>
          {formatOrderStatus(order.status)}
        </span>

        <p>
          {order.apartmentNumber
            ? `Delivery to ${order.apartmentNumber}`
            : "Delivery details pending"}
        </p>

        <div className="order-card__meta">
          <span>{formatOrderDate(order.createdAt)}</span>
          <b>{order.id}</b>
        </div>

        {ORDER_CANCELLATION_AVAILABLE && (
          <div className="order-card__actions">
            {canCancel ? (
              <button
                type="button"
                className="profile-outline-button order-card__cancel"
                onClick={handleCancelOrder}
                disabled={isCancelling}
              >
                {isCancelling ? "Cancelling..." : "Cancel order"}
              </button>
            ) : (
              <button
                type="button"
                className="profile-outline-button order-card__cancel"
                disabled
              >
                {status === "cancelled" || status === "canceled"
                  ? "Order cancelled"
                  : "Cannot cancel"}
              </button>
            )}
          </div>
        )}

        {actionMessage && (
          <p
            className={`extend-stay-message extend-stay-message--${actionMessage.type}`}
          >
            {actionMessage.text}
          </p>
        )}
      </div>
    </article>
  );
}

function OrdersView({ orders, onBack, onCancelOrder }) {
  return (
    <section className="profile-panel profile-panel--soft">
      <ViewHeading title="Orders" onBack={onBack} />

      {orders.length > 0 ? (
        <div className="order-list">
          {orders.map((order) => (
            <OrderCard
              order={order}
              onCancelOrder={onCancelOrder}
              key={order.id}
            />
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
              <AppImage
                className="profile-shop-card__image"
                src={item.image}
                fallbackSrc=""
                alt=""
              />
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
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

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

  async function handlePasswordSubmit(event) {
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

    setIsPasswordSaving(true);

    try {
      const result = (await onPasswordChange?.({
        currentPassword: passwordData.currentPassword,
        nextPassword: passwordData.nextPassword,
      })) || {
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
    } finally {
      setIsPasswordSaving(false);
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

        <button
          type="submit"
          className="profile-action-button password-save"
          disabled={isPasswordSaving}
        >
          {isPasswordSaving ? "Updating..." : "Update password"}
        </button>
      </form>

      <p className="password-login-text">
        Already have an account? <strong>Log in</strong>
      </p>
    </section>
  );
}

function PolicyDetail({ title, body, description, sections = [], onBack }) {
  const paragraphs = body
    ? String(body)
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
    : [];

  return (
    <section className="profile-panel profile-panel--plain policy-detail">
      <ViewHeading title="" onBack={onBack} />

      <div className="policy-icon">
        <FiShield />
        <FiCheck />
      </div>

      <h1>{title}</h1>

      {description && <p className="policy-detail__intro">{description}</p>}

      {paragraphs.map((paragraph, index) => (
        <p key={`${title}-${index}`}>{paragraph}</p>
      ))}

      {sections.map((section) => (
        <section className="policy-detail__section" key={section.title}>
          <h2>{section.title}</h2>
          {section.body && <p>{section.body}</p>}
          {Array.isArray(section.items) && section.items.length > 0 && (
            <ul>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {!description && paragraphs.length === 0 && sections.length === 0 && (
        <p>
          This legal information is being prepared. Please contact Bedrock
          support if you need assistance.
        </p>
      )}
    </section>
  );
}

function LegalView({ onBack, legalDocuments = [] }) {
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const visibleLegalItems = mergeLegalDocuments(legalDocuments);

  if (selectedPolicy) {
    const activePolicy = visibleLegalItems.find(
      (item) => item.id === selectedPolicy,
    );

    return (
      <PolicyDetail
        title={activePolicy?.title}
        body={activePolicy?.body}
        description={activePolicy?.description}
        sections={activePolicy?.sections}
        onBack={() => setSelectedPolicy(null)}
      />
    );
  }

  return (
    <section className="profile-panel legal-list">
      <ViewHeading title="Legal" onBack={onBack} />

      <div className="legal-list__card">
        {visibleLegalItems.map((item) => (
          <button
            type="button"
            onClick={() => setSelectedPolicy(item.id)}
            key={item.id}
          >
            <span>
              <strong>{item.title}</strong>
              <em>Read policy</em>
            </span>
            <FiChevronRight />
          </button>
        ))}
      </div>
    </section>
  );
}

function ReferEarnView({ user, onBack, onToast, referralInfo, rockPoints }) {
  const [tab, setTab] = useState("history");
  const [copyStatus, setCopyStatus] = useState("");
  const referralCode =
    getBackendValue(referralInfo, [
      "code",
      "referral_code",
      "referralCode",
      "invite_code",
      "inviteCode",
      "data.code",
      "data.referral_code",
      "data.referralCode",
      "profile.referral_code",
      "referral.code",
      "referral.referral_code",
      "user.referral_code",
      "user.referralCode",
    ]) ||
    user?.referralCode ||
    user?.referral_code ||
    "";
  const referralLink = normalizeLink(
    getBackendValue(referralInfo, [
      "url",
      "link",
      "referral_url",
      "referral_link",
      "invite_link",
      "share_link",
      "data.url",
      "data.link",
      "data.referral_url",
      "data.referral_link",
      "referral.url",
      "referral.link",
    ]),
  );
  const availableRocks = formatRockValue(
    getBackendValue(rockPoints, [
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
      "data.rock_points",
      "data.available_rocks",
      "summary.points",
      "summary.balance",
    ]) ||
      getBackendValue(referralInfo, [
        "points",
        "balance",
        "available_rocks",
        "availableRocks",
        "rock_points",
        "rockPoints",
        "data.available_rocks",
        "data.rock_points",
        "summary.points",
        "summary.balance",
      ]),
  );
  const discountValue = formatDiscountValue(
    getBackendValue(rockPoints, [
      "discount_value",
      "discountValue",
      "naira_value",
      "nairaValue",
      "cash_value",
      "cashValue",
      "data.discount_value",
      "data.naira_value",
      "data.cash_value",
      "summary.discount_value",
    ]) ||
      getBackendValue(referralInfo, [
        "discount_value",
        "discountValue",
        "reward_value",
        "rewardValue",
        "bonus",
        "data.discount_value",
      ]),
  );
  const referralStats = [
    {
      label: "Total referrals",
      value: getBackendValue(referralInfo, [
        "total_referrals",
        "totalReferrals",
        "referrals_count",
        "referralsCount",
        "referral_count",
        "referralCount",
        "data.total_referrals",
        "data.referrals_count",
        "stats.total_referrals",
      ]),
    },
    {
      label: "Successful",
      value: getBackendValue(referralInfo, [
        "successful_referrals",
        "completed_referrals",
        "data.successful_referrals",
        "data.completed_referrals",
        "stats.successful_referrals",
      ]),
    },
    {
      label: "Pending rewards",
      value: getBackendValue(referralInfo, [
        "pending_rewards",
        "pending_points",
        "data.pending_rewards",
        "data.pending_points",
        "stats.pending_rewards",
      ]),
    },
  ].filter((item) => item.value !== "" && Number(item.value) !== 0);
  const historyItems = [
    ...getBackendArray(referralInfo, [
      "history",
      "transactions",
      "transactions.data",
      "transaction_history",
      "earnings",
      "referrals",
      "referred_users",
      "referredUsers",
      "referral_history",
      "referral_transactions",
      "data.history",
      "data.transactions",
      "data.transactions.data",
      "data.transaction_history",
      "data.referral_history",
    ]),
    ...getBackendArray(rockPoints, [
      "history",
      "transactions",
      "transactions.data",
      "activities",
      "points_history",
      "rock_points_history",
      "data.history",
      "data.transactions",
      "data.transactions.data",
      "data.points_history",
      "data.rock_points_history",
    ]),
  ];
  const earnItemKeys = [
    "how_to_earn",
    "howToEarn",
    "how_it_works",
    "howItWorks",
    "ways_to_earn",
    "waysToEarn",
    "how_to_earn.steps",
    "howToEarn.steps",
    "how_it_works.steps",
    "howItWorks.steps",
    "ways_to_earn.steps",
    "waysToEarn.steps",
    "instructions",
    "earning_instructions",
    "earningInstructions",
    "steps",
    "rules",
    "earn_rules",
    "earnRules",
    "earning_rules",
    "earningRules",
    "rewards",
    "reward_rules",
    "rewardRules",
    "referral_rewards",
    "referralRewards",
    "referral_program",
    "referralProgram",
    "referral_program.steps",
    "referralProgram.steps",
    "referral.how_to_earn",
    "referral.howToEarn",
    "referral.how_it_works",
    "referral.howItWorks",
    "referral.rules",
    "referral.steps",
    "referral_program.how_to_earn",
    "referralProgram.howToEarn",
    "program.how_to_earn",
    "program.howToEarn",
    "data.how_to_earn",
    "data.howToEarn",
    "data.how_it_works",
    "data.howItWorks",
    "data.referral.how_to_earn",
    "data.referral.howToEarn",
  ];
  const earnItems = [
    ...getBackendArray(referralInfo, earnItemKeys),
    ...getBackendArray(rockPoints, earnItemKeys),
    ...collectBackendListsByKey(referralInfo, isEarnRuleKey),
    ...collectBackendListsByKey(rockPoints, isEarnRuleKey),
  ]
    .map(normalizeEarnRule)
    .filter((rule, index, rules) => {
      const ruleKey = `${rule.title}-${rule.description}-${rule.reward}`;

      return (
        rule.title &&
        rules.findIndex(
          (item) => `${item.title}-${item.description}-${item.reward}` === ruleKey,
        ) === index
      );
    });
  const displayedEarnItems = earnItems.length > 0 ? earnItems : fallbackEarnRules;
  const copyValue = referralLink || referralCode;

  async function handleCopyReferral() {
    if (!copyValue) {
      setCopyStatus("No code available yet");
      onToast?.("No referral code available yet.", "error");
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(copyValue);
      } else {
        const textarea = document.createElement("textarea");

        textarea.value = copyValue;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopyStatus("Copied");
      onToast?.("Referral code copied.", "success");
      window.setTimeout(() => setCopyStatus(""), 1800);
    } catch {
      setCopyStatus("Copy failed");
      onToast?.("Unable to copy referral code.", "error");
    }
  }

  return (
    <section className="profile-panel refer-panel">
      <ViewHeading title="Refer and Earn" onBack={onBack} />

      <div className="refer-dashboard">
        <div className="rocks-banner">
          <span>Available Rocks</span>
          <strong>
            RK <b>{availableRocks}</b>
          </strong>
          <em>= {discountValue} discount value</em>
        </div>

        <div className="referral-card">
          <span>Your referral code:</span>
          <strong>
            {referralCode || "Not available yet"}
            <button
              type="button"
              aria-label="Copy referral code"
              onClick={handleCopyReferral}
              disabled={!copyValue}
            >
              <FiCopy />
            </button>
          </strong>
          {referralLink && (
            <a
              className="referral-card__link"
              href={referralLink}
              target="_blank"
              rel="noreferrer"
            >
              {referralLink}
            </a>
          )}
          <em
            className={
              copyStatus === "Copied" ? "is-success" : copyStatus ? "is-error" : ""
            }
          >
            {copyStatus || "Share this with friends to earn rewards!"}
          </em>
        </div>

        {referralStats.length > 0 && (
          <div className="referral-stats">
            {referralStats.map((item) => (
              <article key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
        )}

        <div className="profile-tabs profile-tabs--wide refer-tabs">
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
      </div>

      <div
        className={`earn-card ${
          tab === "history" ? "earn-card--history" : "earn-card--rules"
        }`}
      >
        {tab === "history" ? (
          historyItems.length > 0 ? (
            historyItems.map((item, index) => {
              const title = getReferralTitle(item);
              const image = getReferralImage(item);
              const amount = getReferralAmount(item);
              const balance =
                item.balance_after ||
                item.balance ||
                item.current_balance ||
                item.available_points ||
                "";

              return (
                <article className="earning-row" key={item.id || title || index}>
                  <span>
                    {image ? (
                      <AppImage src={image} fallbackSrc="" alt="" />
                    ) : (
                      <FiGift />
                    )}
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <em>
                      {formatReferralDate(item.created_at || item.createdAt)}
                    </em>
                  </div>
                  <b className={amount.startsWith("-") ? "is-negative" : ""}>
                    {amount}
                  </b>
                  {balance && <small>Bal after: {balance}</small>}
                </article>
              );
            })
          ) : (
            <ReferEmptyState
              title="No transactions yet"
              message="Your activity will appear here"
            />
          )
        ) : (
          displayedEarnItems.map((rule) => (
            <article
              className={`earn-rule ${earnItems.length === 0 ? "is-fallback" : ""}`}
              key={rule.id}
            >
              <span>
                <FiCheck />
              </span>
              <div>
                <strong>{rule.title}</strong>
                {rule.description && <small>{rule.description}</small>}
              </div>
              {rule.reward && (
                <p>
                  <small>Reward:</small>
                  <em>{rule.reward}</em>
                </p>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function HelpCenterView({ onBack, helpInfo }) {
  const contactInfo = helpInfo?.contact || helpInfo?.support || {};
  const helpSocials = getHelpSocials(helpInfo);
  const supportPhone =
    helpInfo?.phone ||
    helpInfo?.support_phone ||
    contactInfo.phone ||
    contactInfo.support_phone ||
    "Support phone not available yet";
  const supportEmail =
    helpInfo?.email ||
    helpInfo?.support_email ||
    contactInfo.email ||
    contactInfo.support_email ||
    "support@bedrockresidences.com";
  const faqItems =
    helpInfo?.faqs ||
    helpInfo?.faq ||
    helpInfo?.questions ||
    helpInfo?.items ||
    [];

  return (
    <section className="profile-panel profile-panel--soft help-panel">
      <ViewHeading title="Get help" onBack={onBack} />

      <div className="help-card">
        <p>
          <FiPhone />
          {supportPhone}
        </p>
        <p>
          <FiMail />
          {supportEmail}
        </p>
      </div>

      <div className="help-card help-card--socials">
        <strong>Our Socials</strong>
        {helpSocials.map((social) => {
          const Icon = social.icon;

          return (
            <a
              href={social.url || undefined}
              target={social.url ? "_blank" : undefined}
              rel={social.url ? "noreferrer" : undefined}
              aria-disabled={!social.url}
              key={social.label}
            >
              <Icon />
              <span>{social.label}</span>
              {social.url ? <FiExternalLink /> : <FiChevronRight />}
            </a>
          );
        })}
      </div>

      {Array.isArray(faqItems) && faqItems.length > 0 && (
        <div className="help-card help-card--faqs">
          <strong>FAQs</strong>
          {faqItems.map((item, index) => (
            <article key={item.id || item.question || index}>
              <b>{item.question || item.title || "Question"}</b>
              <p>{item.answer || item.body || item.description || ""}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function NotificationsView({
  notifications = [],
  onBack,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
}) {
  return (
    <section className="profile-panel profile-panel--soft">
      <ViewHeading title="Messages" onBack={onBack} />

      {notifications.length > 0 && (
        <button
          type="button"
          className="profile-outline-button"
          onClick={onMarkAllNotificationsRead}
        >
          Mark all as read
        </button>
      )}

      {notifications.length > 0 ? (
        <div className="legal-list__card">
          {notifications.map((notification) => (
            <button
              type="button"
              key={notification.id}
              onClick={() => onMarkNotificationRead?.(notification.id)}
            >
              <span>
                <strong>{notification.title}</strong>
                <em>{notification.message}</em>
              </span>
              <FiChevronRight />
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No messages yet"
          message="Booking, payment, service, and account updates will appear here."
        />
      )}
    </section>
  );
}

function DocumentsView({ documents = [], onBack, onUploadDocument, onSubmitKyc }) {
  return (
    <section className="profile-panel profile-panel--soft">
      <ViewHeading title="Documents/KYC" onBack={onBack} />

      {documents.length > 0 ? (
        <div className="legal-list__card">
          {documents.map((document) => (
            <button type="button" key={document.id}>
              <span>
                <strong>{document.name}</strong>
                <em>{document.status}</em>
              </span>
              <FiChevronRight />
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No documents uploaded"
          message="Uploaded KYC documents will appear here after submission."
        />
      )}

      <label className="profile-action-button">
        Upload document
        <input
          type="file"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUploadDocument?.(file);
            event.target.value = "";
          }}
        />
      </label>

      <button
        type="button"
        className="profile-action-button"
        onClick={onSubmitKyc}
      >
        Submit KYC
      </button>
    </section>
  );
}

function AccountView({ onBack, onDeleteAccount }) {
  return (
    <section className="profile-panel profile-panel--soft">
      <ViewHeading title="Account" onBack={onBack} />

      <EmptyState
        title="Delete account"
        message="This permanently deletes your Bedrock account from the backend."
        actionLabel="Delete account"
        onAction={onDeleteAccount}
      />
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
  onAvatarUpload,
  onExtendStay,
  onCancelBooking,
  onCancelOrder,
  onDownloadInvoice,
  onLoadTimeline,
  onSubmitReview,
  onShopSelect,
  profileResources = {},
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onUploadDocument,
  onSubmitKyc,
  onDeleteAccount,
  onLogout,
  onToast,
}) {
  const [activeView, setActiveView] = useState(() => initialView);
  const [viewHistory, setViewHistory] = useState([]);
  const [isSidebarMenuOpen, setIsSidebarMenuOpen] = useState(false);
  const unreadMessageCount = (profileResources.notifications || []).filter(
    (notification) => !notification.read,
  ).length;

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
            onDownloadInvoice={onDownloadInvoice}
            onLoadTimeline={onLoadTimeline}
            onSubmitReview={onSubmitReview}
          />
        );
      case "orders":
        return (
          <OrdersView
            orders={orders}
            onBack={goBack}
            onCancelOrder={onCancelOrder}
          />
        );
      case "notifications":
        return (
          <NotificationsView
            notifications={profileResources.notifications}
            onBack={goBack}
            onMarkNotificationRead={onMarkNotificationRead}
            onMarkAllNotificationsRead={onMarkAllNotificationsRead}
          />
        );
      case "shop":
        return <ShopView onBack={goBack} onShopSelect={onShopSelect} />;
      case "settings":
        return (
          <ChangePasswordView
            onBack={goBack}
            onPasswordChange={onPasswordChange}
          />
        );
      case "privacy": {
        const privacyDocument = getLegalDocumentByType(
          mergeLegalDocuments(profileResources.legalDocuments),
          ["privacy"],
        );

        return (
          <PolicyDetail
            title={privacyDocument?.title || "Privacy Policy"}
            body={privacyDocument?.body}
            description={privacyDocument?.description}
            sections={privacyDocument?.sections}
            onBack={goBack}
          />
        );
      }
      case "documents":
        return (
          <DocumentsView
            documents={profileResources.documents}
            onBack={goBack}
            onUploadDocument={onUploadDocument}
            onSubmitKyc={onSubmitKyc}
          />
        );
      case "account":
        return <AccountView onBack={goBack} onDeleteAccount={onDeleteAccount} />;
      case "refer":
        return (
          <ReferEarnView
            user={user}
            onBack={goBack}
            onToast={onToast}
            referralInfo={profileResources.referralInfo}
            rockPoints={profileResources.rockPoints}
          />
        );
      case "legal":
        return (
          <LegalView
            onBack={goBack}
            legalDocuments={profileResources.legalDocuments}
          />
        );
      case "help":
        return (
          <HelpCenterView
            onBack={goBack}
            helpInfo={profileResources.helpInfo}
          />
        );
      case "profile":
      default:
        return (
          <EditProfileView
            user={user}
            onProfileSave={onProfileSave}
            onChangePassword={() => navigateToView("settings")}
            onAvatarUpload={onAvatarUpload}
            onBack={goBack}
          />
        );
    }
  }

  return (
    <div className={`profile-page profile-page--${activeView}`}>
      <ProfileSidebar
        activeView={activeView}
        user={user}
        unreadCount={unreadMessageCount}
        isMenuOpen={isSidebarMenuOpen}
        onChangeView={navigateToView}
        onCloseMenu={() => setIsSidebarMenuOpen(false)}
        onGoHome={onGoHome}
        onLogout={onLogout}
        onToggleMenu={() => setIsSidebarMenuOpen((current) => !current)}
      />

      <main className="profile-main">
        <ProfileTopbar
          unreadCount={unreadMessageCount}
          onNotifications={() => navigateToView("notifications")}
        />

        {activeView !== "profile" && activeView !== "refer" && <ProfileSearch />}

        {renderView()}
      </main>
    </div>
  );
}
