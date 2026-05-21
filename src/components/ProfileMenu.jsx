import {
  FiCalendar,
  FiGlobe,
  FiHeart,
  FiHelpCircle,
  FiLogOut,
  FiMail,
  FiSettings,
  FiShoppingBag,
  FiUser,
  FiUserPlus,
} from "react-icons/fi";
import "../styles/profile-menu.css";

export default function ProfileMenu({
  isOpen,
  activeView = "home",
  onProfile,
  onProfileView,
  onBecomeAgent,
  onLogout,
}) {
  if (!isOpen) return null;

  const menuGroups = [
    [
      { id: "wishlists", label: "Wishlists", icon: FiHeart, view: "wishlists" },
      { id: "bookings", label: "Bookings", icon: FiCalendar, view: "bookings" },
      { id: "orders", label: "Orders", icon: FiShoppingBag, view: "orders" },
      { id: "notifications", label: "Messages", icon: FiMail, view: "notifications" },
      { id: "shop", label: "Shop", icon: FiShoppingBag, view: "shop" },
      { id: "profile", label: "Profile", icon: FiUser, onClick: onProfile },
    ],
    [
      {
        id: "settings",
        label: "Account and Settings",
        icon: FiSettings,
        view: "settings",
      },
      {
        id: "language",
        label: "Language & Currency",
        icon: FiGlobe,
        view: "settings",
      },
      { id: "refer", label: "Refer and Earn", icon: FiUserPlus, view: "refer" },
      { id: "privacy", label: "Privacy Policy", icon: FiGlobe, view: "privacy" },
      { id: "legal", label: "Legal", icon: FiHelpCircle, view: "legal" },
      { id: "help", label: "Help Center", icon: FiHelpCircle, view: "help" },
    ],
    [
      {
        id: "agent",
        label: "Become an agent",
        icon: FiUserPlus,
        onClick: onBecomeAgent,
      },
      { id: "logout", label: "Log out", icon: FiLogOut, onClick: onLogout },
    ],
  ];

  return (
    <div className="profile-menu" role="menu" aria-label="Profile menu">
      {menuGroups.map((group, groupIndex) => (
        <div className="profile-menu__group" key={`group-${groupIndex}`}>
          {group.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                type="button"
                className={`profile-menu__item ${
                  isActive ? "profile-menu__item--active" : ""
                }`}
                onClick={item.onClick || (() => onProfileView?.(item.view))}
                role="menuitem"
                key={item.id}
              >
                <span className="profile-menu__icon" aria-hidden="true">
                  <Icon />
                </span>
                <span className="profile-menu__label">{item.label}</span>
                {item.badge > 0 && (
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
