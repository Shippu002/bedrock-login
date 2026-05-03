import { FiLogOut, FiUser } from "react-icons/fi";
import "../styles/profile-menu.css";

export default function ProfileMenu({ isOpen, onBecomeAgent, onLogout }) {
  if (!isOpen) return null;

  return (
    <div className="profile-menu">
      <button
        type="button"
        className="profile-menu__item"
        onClick={onBecomeAgent}
      >
        <FiUser />
        <span>Become an agent</span>
      </button>

      <button type="button" className="profile-menu__item" onClick={onLogout}>
        <FiLogOut />
        <span>Log out</span>
      </button>
    </div>
  );
}
