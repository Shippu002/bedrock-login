import { useEffect, useState } from "react";
import { FiMessageCircle } from "react-icons/fi";
import {
  BOOKING_TOUR_ACTIVE_EVENT,
  BOOKING_TOUR_CLOSE_CHAT_EVENT,
  BOOKING_TOUR_INACTIVE_EVENT,
} from "../services/bookingTour";
import ChatWindow from "./ChatWindow";
import "../styles/chat-widget.css";

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);

  useEffect(() => {
    function closeChat() {
      setIsOpen(false);
    }

    function handleTourActive() {
      setIsOpen(false);
      setIsTourActive(true);
    }

    function handleTourInactive() {
      setIsTourActive(false);
    }

    window.addEventListener(BOOKING_TOUR_CLOSE_CHAT_EVENT, closeChat);
    window.addEventListener(BOOKING_TOUR_ACTIVE_EVENT, handleTourActive);
    window.addEventListener(BOOKING_TOUR_INACTIVE_EVENT, handleTourInactive);

    return () => {
      window.removeEventListener(BOOKING_TOUR_CLOSE_CHAT_EVENT, closeChat);
      window.removeEventListener(BOOKING_TOUR_ACTIVE_EVENT, handleTourActive);
      window.removeEventListener(
        BOOKING_TOUR_INACTIVE_EVENT,
        handleTourInactive,
      );
    };
  }, []);

  if (isTourActive) return null;

  return (
    <div className="chat-widget">
      {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}

      <button
        type="button"
        className="chat-widget__button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={isOpen ? "Close Bedrock assistant" : "Open Bedrock assistant"}
        aria-expanded={isOpen}
      >
        <FiMessageCircle />
        <span>AI Help</span>
      </button>
    </div>
  );
}

export default ChatWidget;
