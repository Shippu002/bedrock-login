import { useState } from "react";
import { FiBell, FiChevronDown, FiMenu } from "react-icons/fi";
import bedrockLogo from "../assets/bedrock-logo.svg";
import AppImage from "./AppImage";
import ProfileMenu from "./ProfileMenu";
import { shopCategories as defaultShopCategories } from "../data/shopCategories";
import "../styles/header.css";

function Dropdown({
  label,
  type,
  isOpen,
  onToggle,
  onClose,
  onResidenceSelect,
  onShopSelect,
  onShopDirectory,
  residences = [],
  apartmentCategories = [],
  isResidencesLoading = false,
  shopCategories = defaultShopCategories,
}) {
  const [selectedResidenceId, setSelectedResidenceId] = useState("opebi");
  const [selectedApartment, setSelectedApartment] = useState(null);
  const residenceOptions = residences;
  const selectedResidence = residenceOptions.find(
    (item) => item.id === selectedResidenceId,
  ) || residenceOptions[0];
  const selectedApartmentOptions =
    selectedResidence?.apartments?.length > 0
      ? selectedResidence.apartments
      : apartmentCategories
          .filter((category) => category.bedrooms)
          .map((category) => `${category.bedrooms} Bedroom Apartment`);

  function shouldOpenResidencePage() {
    return (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 910px)").matches
    );
  }

  function handleDropdownToggle() {
    if (type === "shops" && shouldOpenResidencePage()) {
      onShopDirectory?.();
      onClose?.();
      return;
    }

    onToggle?.();
  }

  function handleResidenceClick(residenceId) {
    setSelectedResidenceId(residenceId);
    setSelectedApartment(null);

    if (shouldOpenResidencePage()) {
      onResidenceSelect?.(residenceId, "");
      onClose?.();
      return;
    }

    onResidenceSelect?.(residenceId, "");
    onClose?.();
  }

  function handleResidencePreview(residenceId) {
    setSelectedResidenceId(residenceId);
    setSelectedApartment(null);
  }

  function handleApartmentClick(apartment) {
    setSelectedApartment(apartment);
    onResidenceSelect?.(selectedResidenceId, apartment);
    onClose?.();
  }

  function handleShopClick(shopId) {
    onShopSelect?.(shopId);
    onClose?.();
  }

  return (
    <div className="nav-dropdown">
      <button
        className="nav-link"
        type="button"
        onClick={handleDropdownToggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span className="nav-link-label">{label}</span>
        <span className="nav-link-icon-wrap">
          <FiChevronDown className="nav-icon" />
        </span>
      </button>

      {isOpen && type === "residences" && (
        <div className="nav-mega nav-mega--residences">
          <div className="nav-mega__column">
            <h3>Residences</h3>

            <div className="nav-mega__list">
              {residenceOptions.map((item) => (
                <button
                  type="button"
                  className={`nav-mega__item ${
                    selectedResidenceId === item.id ? "nav-mega__item--active" : ""
                  }`}
                  onMouseEnter={() => handleResidencePreview(item.id)}
                  onFocus={() => handleResidencePreview(item.id)}
                  onClick={() => handleResidenceClick(item.id)}
                  key={item.title}
                >
                  <AppImage
                    className="nav-mega__item-image"
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
          </div>

          <div className="nav-mega__column nav-mega__column--types">
            <h3>
              {selectedResidence
                ? `Apartment at ${selectedResidence.title.replace(" Apartments", "")}`
                : "Select a residence"}
            </h3>

            <p className="nav-mega__hint">
              Choose an apartment type to continue
            </p>

            <div className="nav-mega__types">
              {isResidencesLoading && residenceOptions.length === 0 ? (
                <span className="nav-mega__empty">Loading residences...</span>
              ) : selectedApartmentOptions.map((item) => (
                <button
                  type="button"
                  className={`nav-mega__type ${
                    selectedApartment === item ? "nav-mega__type--active" : ""
                  }`}
                  onClick={() => handleApartmentClick(item)}
                  key={item}
                >
                  <strong>{item}</strong>
                  <span>Find available stays in this residence</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isOpen && type === "shops" && (
        <div className="nav-mega nav-mega--shops">
          <h3>Shops</h3>

          <div className="nav-mega__list nav-mega__list--shops">
            {shopCategories.map((item) => (
              <button
                type="button"
                className="nav-mega__item"
                onClick={() => handleShopClick(item.id)}
                key={item.title}
              >
                <AppImage
                  className="nav-mega__item-image"
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
        </div>
      )}
    </div>
  );
}

export default function Header({
  user,
  activeView = "home",
  onHome,
  onLogin,
  onSignup,
  onProfile,
  onProfileView,
  onResidenceSelect,
  onShopSelect,
  onShopDirectory,
  onBecomeAgent,
  onLogout,
  unreadCount = 0,
  residences = [],
  apartmentCategories = [],
  isResidencesLoading = false,
  shopCategories = defaultShopCategories,
}) {
  const [openMenu, setOpenMenu] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const toggleMenu = (menuName) => {
    setOpenMenu((current) => (current === menuName ? null : menuName));
  };

  function toggleProfileMenu() {
    setIsProfileMenuOpen((current) => !current);
  }

  function shouldOpenProfileDirectly() {
    return (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 910px)").matches
    );
  }

  function handleUserPillClick() {
    if (shouldOpenProfileDirectly()) {
      handleProfile();
      return;
    }

    toggleProfileMenu();
  }

  function handleHome() {
    setIsProfileMenuOpen(false);
    onHome?.();
  }

  function handleProfile() {
    setIsProfileMenuOpen(false);
    onProfile?.();
  }

  function handleProfileView(view) {
    setIsProfileMenuOpen(false);
    onProfileView?.(view);
  }

  function handleResidenceSelect(residenceId, apartmentTitle = "") {
    setIsProfileMenuOpen(false);
    onResidenceSelect?.(residenceId, apartmentTitle);
  }

  function handleShopSelect(shopId) {
    setIsProfileMenuOpen(false);
    onShopSelect?.(shopId);
  }

  function handleShopDirectory() {
    setIsProfileMenuOpen(false);
    setOpenMenu(null);
    onShopDirectory?.();
  }

  function handleOrders() {
    setIsProfileMenuOpen(false);
    setOpenMenu(null);
    onProfileView?.("orders");
  }

  function handleNotifications() {
    setIsProfileMenuOpen(false);
    setOpenMenu(null);
    onProfileView?.("notifications");
  }

  return (
    <header className="site-header">
      <div className="site-inner">
        <button
          type="button"
          className="brand-button"
          onClick={handleHome}
          aria-label="Go to home"
        >
          <img
            src={bedrockLogo}
            alt="Bedrock Residences"
            className="brand-logo"
            loading="eager"
            decoding="async"
          />
        </button>

        <nav className="nav-links">
          <Dropdown
            label="Residences"
            type="residences"
            isOpen={openMenu === "residences"}
            residences={residences}
            apartmentCategories={apartmentCategories}
            isResidencesLoading={isResidencesLoading}
            onToggle={() => toggleMenu("residences")}
            onClose={() => setOpenMenu(null)}
            onResidenceSelect={handleResidenceSelect}
          />

          <Dropdown
            label="Shops"
            type="shops"
            isOpen={openMenu === "shops"}
            onToggle={() => toggleMenu("shops")}
            onClose={() => setOpenMenu(null)}
            onShopSelect={handleShopSelect}
            onShopDirectory={handleShopDirectory}
            shopCategories={shopCategories}
          />

          <button
            className="nav-link nav-link-orders"
            type="button"
            onClick={handleOrders}
          >
            <span className="nav-link-label">Orders</span>
            <span className="nav-link-icon-wrap nav-link-icon-wrap-hidden">
              <FiChevronDown className="nav-icon" />
            </span>
          </button>
        </nav>

        {user ? (
          <div className="header-user-area">
            <div className="header-user-menu">
              <button
                type="button"
                className="icon-bell"
                onClick={handleNotifications}
                aria-label="Open notifications"
                title="Notifications"
              >
                {unreadCount > 0 && <span className="bell-dot" />}
                <FiBell className="bell-icon" />
              </button>

              <button
                className="user-pill"
                type="button"
                onClick={handleUserPillClick}
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
              >
                <span>{user.username || user.name}</span>

                <FiChevronDown className="user-pill-icon" />
              </button>

              <div className="header-menu-wrap">
                <button
                  type="button"
                  className="header-menu-button"
                  onClick={toggleProfileMenu}
                  aria-label="Open account menu"
                  aria-haspopup="menu"
                  aria-expanded={isProfileMenuOpen}
                >
                  <FiMenu />
                </button>

                <ProfileMenu
                  isOpen={isProfileMenuOpen}
                  activeView={activeView}
                  onHome={handleHome}
                  onProfile={handleProfile}
                  onProfileView={handleProfileView}
                  onBecomeAgent={onBecomeAgent}
                  onLogout={onLogout}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="header-actions">
            <button className="btn btn-outline" type="button" onClick={onLogin}>
              Login
            </button>

            <button className="btn btn-accent" type="button" onClick={onSignup}>
              Sign up
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
