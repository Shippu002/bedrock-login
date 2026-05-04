import { useState } from "react";
import { FiBell, FiChevronDown, FiMenu } from "react-icons/fi";
import bedrockLogo from "../assets/bedrock-logo.svg";
import opebiImage from "../assets/opebi.jpg";
import oduduwaImage from "../assets/oduduwa.jpg";
import bateyeImage from "../assets/bateye.png";
import communityImage from "../assets/community.jpg";
import foodImage from "../assets/food.png";
import shopImage from "../assets/shop.png";
import servicesImage from "../assets/services.png";
import requestImage from "../assets/request.png";
import ProfileMenu from "./ProfileMenu";
import { getUserMessageCount } from "../utils/userMessages";
import "../styles/header.css";

const residencesMenu = [
  {
    id: "opebi",
    title: "Opebi's Apartments",
    location: "Ikeja GRA Lagos Nigeria",
    image: opebiImage,
    apartments: [
      "1 Bedroom Apartment",
      "2 Bedroom Apartment",
      "3 Bedroom Apartment",
      "Studio Apartment",
    ],
  },
  {
    id: "oduduwa",
    title: "Oduduwa's Apartments",
    location: "Ikeja GRA Lagos Nigeria",
    image: oduduwaImage,
    apartments: [
      "2 Bedroom Deluxe",
      "3 Bedroom Family Apartment",
      "4 Bedroom Duplex",
      "Penthouse Suite",
    ],
  },
  {
    id: "bateye",
    title: "Bateye's Apartments",
    location: "Ikeja GRA Lagos Nigeria",
    image: bateyeImage,
    apartments: [
      "Single Room Apartment",
      "Studio Apartment",
      "1 Bedroom Apartment",
      "2 Bedroom Apartment",
    ],
  },
  {
    id: "community",
    title: "Community Apartments",
    location: "Ikeja GRA Lagos Nigeria",
    image: communityImage,
    apartments: [
      "Shared Apartment",
      "1 Bedroom Apartment",
      "2 Bedroom Apartment",
      "Serviced Studio",
    ],
  },
];

const shopsMenu = [
  { id: "foods", title: "Foods", location: "Ikeja GRA Lagos Nigeria", image: foodImage },
  { id: "shop", title: "Shop", location: "Ikeja GRA Lagos Nigeria", image: shopImage },
  { id: "services", title: "Services", location: "Ikeja GRA Lagos Nigeria", image: servicesImage },
  { id: "request", title: "Request", location: "Ikeja GRA Lagos Nigeria", image: requestImage },
];

function Dropdown({
  label,
  type,
  isOpen,
  onToggle,
  onClose,
  onResidenceSelect,
}) {
  const [selectedResidenceId, setSelectedResidenceId] = useState("opebi");
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [selectedShopId, setSelectedShopId] = useState(null);
  const selectedResidence = residencesMenu.find(
    (item) => item.id === selectedResidenceId,
  );

  function handleResidenceClick(residenceId) {
    setSelectedResidenceId(residenceId);
    setSelectedApartment(null);
    onResidenceSelect?.(residenceId);
    onClose?.();
  }

  function handleApartmentClick(apartment) {
    setSelectedApartment(apartment);
    onResidenceSelect?.(selectedResidenceId);
    onClose?.();
  }

  return (
    <div className="nav-dropdown">
      <button
        className="nav-link"
        type="button"
        onClick={onToggle}
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
              {residencesMenu.map((item) => (
                <button
                  type="button"
                  className={`nav-mega__item ${
                    selectedResidenceId === item.id ? "nav-mega__item--active" : ""
                  }`}
                  onClick={() => handleResidenceClick(item.id)}
                  key={item.title}
                >
                  <img src={item.image} alt="" />
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

            <div className="nav-mega__types">
              {(selectedResidence?.apartments || []).map((item) => (
                <button
                  type="button"
                  className={`nav-mega__type ${
                    selectedApartment === item ? "nav-mega__type--active" : ""
                  }`}
                  onClick={() => handleApartmentClick(item)}
                  key={item}
                >
                  <strong>{item}</strong>
                  <span>Find the best template for your business</span>
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
            {shopsMenu.map((item) => (
              <button
                type="button"
                className={`nav-mega__item ${
                  selectedShopId === item.id ? "nav-mega__item--shop-active" : ""
                }`}
                onClick={() => setSelectedShopId(item.id)}
                key={item.title}
              >
                <img src={item.image} alt="" />
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
  onMessages,
  onResidenceSelect,
  onBecomeAgent,
  onLogout,
}) {
  const [openMenu, setOpenMenu] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const messageCount = getUserMessageCount(user);

  const toggleMenu = (menuName) => {
    setOpenMenu((current) => (current === menuName ? null : menuName));
  };

  function toggleProfileMenu() {
    setIsProfileMenuOpen((current) => !current);
  }

  function handleHome() {
    setIsProfileMenuOpen(false);
    onHome?.();
  }

  function handleProfile() {
    setIsProfileMenuOpen(false);
    onProfile?.();
  }

  function handleMessages() {
    setIsProfileMenuOpen(false);
    onMessages?.();
  }

  function handleProfileView(view) {
    setIsProfileMenuOpen(false);
    onProfileView?.(view);
  }

  function handleResidenceSelect(residenceId) {
    setIsProfileMenuOpen(false);
    onResidenceSelect?.(residenceId);
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
          />
        </button>

        <nav className="nav-links">
          <Dropdown
            label="Residences"
            type="residences"
            isOpen={openMenu === "residences"}
            onToggle={() => toggleMenu("residences")}
            onClose={() => setOpenMenu(null)}
            onResidenceSelect={handleResidenceSelect}
          />

          <Dropdown
            label="Shops"
            type="shops"
            isOpen={openMenu === "shops"}
            onToggle={() => toggleMenu("shops")}
          />

          <button className="nav-link nav-link-orders" type="button">
            <span className="nav-link-label">Orders</span>
            <span className="nav-link-icon-wrap nav-link-icon-wrap-hidden">
              <FiChevronDown className="nav-icon" />
            </span>
          </button>
        </nav>

        {user ? (
          <div className="header-user-area">
            <button
              className={`icon-bell ${messageCount > 0 ? "icon-bell--alert" : ""}`}
              type="button"
              onClick={handleMessages}
              aria-label={
                messageCount > 0
                  ? `Open messages, ${messageCount} unread`
                  : "Open messages"
              }
            >
              {messageCount > 0 && <span className="bell-dot" />}
              <FiBell className="bell-icon" />
            </button>

            <div className="header-user-menu">
              <button
                className="user-pill"
                type="button"
                onClick={handleProfile}
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
                  messageCount={messageCount}
                  onHome={handleHome}
                  onProfile={handleProfile}
                  onProfileView={handleProfileView}
                  onMessages={handleMessages}
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
