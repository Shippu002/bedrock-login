import {
  FiCalendar,
  FiGlobe,
  FiHeart,
  FiHelpCircle,
  FiLogOut,
  FiMessageSquare,
  FiSettings,
  FiUser,
  FiUserPlus,
} from "react-icons/fi";
import "../styles/profile-menu.css";

export default function ProfileMenu({ isOpen, onBecomeAgent, onLogout }) {
  if (!isOpen) return null;

  const menuGroups = [
    [
      { label: "Wishlists", icon: FiHeart, active: true },
      { label: "Bookings", icon: FiCalendar },
      { label: "Messages", icon: FiMessageSquare, badge: "45" },
      { label: "Profile", icon: FiUser },
    ],
    [
      { label: "Account and Settings", icon: FiSettings },
      { label: "Language & Currency", icon: FiGlobe },
      { label: "Help Center", icon: FiHelpCircle },
    ],
    [
      { label: "Become an agent", icon: FiUserPlus, onClick: onBecomeAgent },
      { label: "Log out", icon: FiLogOut, onClick: onLogout },
    ],
  ];

  return (
    <div className="profile-menu" role="menu" aria-label="Profile menu">
      {menuGroups.map((group, groupIndex) => (
        <div className="profile-menu__group" key={`group-${groupIndex}`}>
          {group.map((item) => {
            const Icon = item.icon;

            return (
              <button
                type="button"
                className={`profile-menu__item ${
                  item.active ? "profile-menu__item--active" : ""
                }`}
                onClick={item.onClick}
                role="menuitem"
                key={item.label}
              >
                <span className="profile-menu__icon" aria-hidden="true">
                  <Icon />
                </span>
                <span className="profile-menu__label">{item.label}</span>
                {item.badge && (
                  <span className="profile-menu__badge">{item.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
