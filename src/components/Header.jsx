import { useState } from "react";
import { FiBell, FiChevronDown } from "react-icons/fi";
import bedrockLogo from "../assets/bedrock-logo.svg";
import ProfileMenu from "./ProfileMenu";
import "../styles/header.css";

const residencesMenu = [
  "Oduduwa's Residence",
  "Bateye's Residence",
  "Opebi I",
  "Opebi II",
  "Community",
];

const shopsMenu = [
  "Interior Shop",
  "Furniture Shop",
  "Lifestyle Shop",
  "Accessories Shop",
];

function Dropdown({ label, items, isOpen, onToggle }) {
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

      {isOpen && (
        <div className="dropdown-menu">
          {items.map((item) => (
            <button key={item} className="dropdown-item" type="button">
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header({
  user,
  onLogin,
  onSignup,
  onBecomeAgent,
  onLogout,
}) {
  const [openMenu, setOpenMenu] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);


  const toggleMenu = (menuName) => {
    setOpenMenu((current) => (current === menuName ? null : menuName));
  };

  function toggleProfileMenu() {
    setIsProfileMenuOpen((current) => !current);
  }


  return (
    <header className="site-header">
      <div className="site-inner">
        <img
          src={bedrockLogo}
          alt="Bedrock Residences"
          className="brand-logo"
        />

        <nav className="nav-links">
          <Dropdown
            label="Residences"
            items={residencesMenu}
            isOpen={openMenu === "residences"}
            onToggle={() => toggleMenu("residences")}
          />

          <Dropdown
            label="Shops"
            items={shopsMenu}
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
              className="icon-bell"
              type="button"
              aria-label="Notifications"
            >
              <span className="bell-dot" />
              <FiBell className="bell-icon" />
            </button>

            <div className="header-user-menu">
              <button
                className="user-pill"
                type="button"
                onClick={toggleProfileMenu}
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
              >
                <span>{user.username || user.name}</span>

                <FiChevronDown className="user-pill-icon" />
              </button>

              <ProfileMenu
                isOpen={isProfileMenuOpen}
                onBecomeAgent={onBecomeAgent}
                onLogout={onLogout}
              />
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
