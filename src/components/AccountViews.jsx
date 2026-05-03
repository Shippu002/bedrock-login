import {
  FiBell,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiEdit2,
  FiHeart,
  FiHelpCircle,
  FiHome,
  FiLogOut,
  FiMessageSquare,
  FiSettings,
  FiShield,
  FiShoppingBag,
} from "react-icons/fi";
import bedrockLogo from "../assets/bedrock-logo.svg";
import { getUserMessages } from "../utils/userMessages";
import "../styles/account-views.css";

const profileCountryOptions = [
  { code: "+234", name: "Nigeria" },
  { code: "+44", name: "United Kingdom" },
  { code: "+1", name: "United States" },
];

function getProfileCountry(user) {
  if (user?.country) return user.country;

  return (
    profileCountryOptions.find((country) => country.code === user?.countryCode)
      ?.name || "Nigeria"
  );
}

function getInitials(user) {
  const source = user?.name || user?.username || user?.email || "User";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatMessage(message, index) {
  if (typeof message === "string") {
    return {
      id: `message-${index}`,
      title: "New message",
      text: message,
      time: "Now",
    };
  }

  return {
    id: message.id || `message-${index}`,
    title: message.title || message.sender || "New message",
    text: message.text || message.body || "You have a new message.",
    time: message.time || message.createdAt || "Now",
  };
}

function AccountSidebar({
  activeView,
  messageCount,
  onHome,
  onMessages,
  onLogout,
}) {
  const navItems = [
    { label: "Home", icon: FiHome, active: activeView === "home", onClick: onHome },
    { label: "Wishlists", icon: FiHeart },
    { label: "Bookings", icon: FiCalendar },
    {
      label: "Messages",
      icon: FiMessageSquare,
      active: activeView === "messages",
      badge: messageCount,
      onClick: onMessages,
    },
    { label: "Shop", icon: FiShoppingBag },
    { label: "Account and Settings", icon: FiSettings },
    { label: "Privacy", icon: FiShield },
    { label: "Refer and Earn", icon: FiHelpCircle },
    { label: "Legal", icon: FiHelpCircle },
    { label: "Help Center", icon: FiHelpCircle },
  ];

  return (
    <aside className="account-sidebar" aria-label="Account navigation">
      <div className="account-sidebar__brand">
        <img src={bedrockLogo} alt="Bedrock Residences" />
        <span aria-hidden="true">...</span>
      </div>

      <nav className="account-sidebar__nav">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              type="button"
              className={`account-sidebar__item ${
                item.active ? "account-sidebar__item--active" : ""
              }`}
              onClick={item.onClick}
              key={item.label}
            >
              <Icon className="account-sidebar__icon" />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="account-sidebar__badge">{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        className="account-sidebar__item account-sidebar__logout"
        onClick={onLogout}
      >
        <FiLogOut className="account-sidebar__icon" />
        <span>Log out</span>
      </button>
    </aside>
  );
}

function AccountTopbar({ user, messageCount, onMessages, onProfile }) {
  return (
    <div className="account-topbar">
      <button
        type="button"
        className="account-topbar__bell"
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

      <button type="button" className="account-topbar__user" onClick={onProfile}>
        <span>{user?.username || user?.name || "Profile"}</span>
        <FiChevronDown />
      </button>
    </div>
  );
}

export function ProfileView({
  user,
  messageCount,
  onHome,
  onMessages,
  onProfile,
  onProfileSave,
  onLogout,
}) {
  function handleProfileSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const country = String(formData.get("country") || "");
    const selectedCountry = profileCountryOptions.find(
      (option) => option.name === country,
    );

    onProfileSave?.({
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      country,
      countryCode: selectedCountry?.code || user?.countryCode || "",
    });
  }

  return (
    <section className="account-view">
      <AccountSidebar
        activeView="profile"
        messageCount={messageCount}
        onHome={onHome}
        onMessages={onMessages}
        onLogout={onLogout}
      />

      <div className="account-content">
        <AccountTopbar
          user={user}
          messageCount={messageCount}
          onMessages={onMessages}
          onProfile={onProfile}
        />

        <div className="profile-panel">
          <div className="account-title-row">
            <button type="button" className="account-back" onClick={onHome}>
              <FiChevronLeft />
            </button>
            <h1>Edit Profile</h1>
          </div>

          <div className="profile-summary">
            <div className="profile-avatar">{getInitials(user)}</div>

            <div className="profile-summary__text">
              <strong>{user?.name || user?.username || "Bedrock User"}</strong>
              <span>Lagos NGN</span>
              <em>
                Verified
                <FiCheckCircle />
              </em>
            </div>

            <button type="button" className="profile-edit" aria-label="Edit photo">
              <FiEdit2 />
            </button>
          </div>

          <form className="profile-form" onSubmit={handleProfileSubmit}>
            <span className="profile-form__label">Personal info:</span>

            <label className="profile-field">
              <span>Full Name</span>
              <input name="name" defaultValue={user?.name || ""} />
            </label>

            <label className="profile-field">
              <span>Email</span>
              <input name="email" defaultValue={user?.email || ""} type="email" />
            </label>

            <label className="profile-field">
              <span>Phone Number</span>
              <input
                name="phone"
                defaultValue={user?.phone || ""}
                placeholder="Add phone number"
                type="tel"
              />
            </label>

            <label className="profile-field profile-field--select">
              <span>Select Country</span>
              <select name="country" defaultValue={getProfileCountry(user)}>
                {profileCountryOptions.map((country) => (
                  <option key={country.code}>{country.name}</option>
                ))}
              </select>
            </label>

            <button type="submit" className="profile-save">
              Save
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export function MessagesView({
  user,
  messageCount,
  onHome,
  onMessages,
  onProfile,
  onLogout,
}) {
  const messages = getUserMessages(user).map(formatMessage);
  const hasMessageCount = messageCount > 0;

  return (
    <section className="account-view">
      <AccountSidebar
        activeView="messages"
        messageCount={messageCount}
        onHome={onHome}
        onMessages={onMessages}
        onLogout={onLogout}
      />

      <div className="account-content">
        <AccountTopbar
          user={user}
          messageCount={messageCount}
          onMessages={onMessages}
          onProfile={onProfile}
        />

        <div className="messages-panel">
          <div className="account-title-row">
            <button type="button" className="account-back" onClick={onHome}>
              <FiChevronLeft />
            </button>
            <h1>Messages</h1>
          </div>

          {messages.length > 0 ? (
            <div className="messages-list">
              {messages.map((message) => (
                <article className="message-card" key={message.id}>
                  <div className="message-card__icon">
                    <FiMessageSquare />
                  </div>
                  <div>
                    <strong>{message.title}</strong>
                    <p>{message.text}</p>
                  </div>
                  <span>{message.time}</span>
                </article>
              ))}
            </div>
          ) : hasMessageCount ? (
            <div className="messages-list">
              <article className="message-card">
                <div className="message-card__icon">
                  <FiMessageSquare />
                </div>
                <div>
                  <strong>
                    {messageCount} unread{" "}
                    {messageCount === 1 ? "message" : "messages"}
                  </strong>
                  <p>Your message details will appear here once they load.</p>
                </div>
                <span>Now</span>
              </article>
            </div>
          ) : (
            <div className="messages-empty">
              <FiMessageSquare />
              <strong>No messages yet</strong>
              <p>Your booking and support messages will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
