import { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { FiHeadphones, FiMessageCircle, FiX } from "react-icons/fi";
import {
  BOOKING_TOUR_ACTIVE_EVENT,
  BOOKING_TOUR_CLOSE_CHAT_EVENT,
  BOOKING_TOUR_INACTIVE_EVENT,
} from "../services/bookingTour";
import ChatWindow from "./ChatWindow";
import "../styles/chat-widget.css";

const WHATSAPP_CHAT_URL = "https://wa.link/8k0a1n";

function hideZohoFloatingButton() {
  const salesiq = window.$zoho?.salesiq;

  try {
    salesiq?.floatbutton?.visible?.("hide");
  } catch {
    // Keep support UI resilient if Zoho is blocked or not ready yet.
  }
}

function openZohoLiveChat() {
  const salesiq = window.$zoho?.salesiq;

  try {
    salesiq?.floatwindow?.visible?.("show");
    salesiq?.chat?.start?.();
    return;
  } catch {
    // Fall through to a DOM click fallback below.
  }

  const fallbackLauncher = document.querySelector(
    "#zsiq_float, .zsiq_floatmain, .zsiq_flt_rel, [data-id='zsalesiq']",
  );

  fallbackLauncher?.click?.();
}

function ChatWidget() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    window.$zoho = window.$zoho || {};
    window.$zoho.salesiq = window.$zoho.salesiq || {};

    const previousReady = window.$zoho.salesiq.ready;

    window.$zoho.salesiq.ready = function handleZohoReady() {
      if (typeof previousReady === "function") {
        previousReady();
      }

      hideZohoFloatingButton();
    };

    hideZohoFloatingButton();
    const hideTimer = window.setInterval(hideZohoFloatingButton, 1200);

    return () => {
      window.clearInterval(hideTimer);
      window.$zoho.salesiq.ready = previousReady;
    };
  }, []);

  useEffect(() => {
    function closeChat() {
      setIsAssistantOpen(false);
      setIsMenuOpen(false);
    }

    function handleTourActive() {
      setIsAssistantOpen(false);
      setIsMenuOpen(false);
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

  function openAssistant() {
    setIsMenuOpen(false);
    setIsAssistantOpen(true);
  }

  function openLiveChat() {
    setIsMenuOpen(false);
    setIsAssistantOpen(false);
    openZohoLiveChat();
  }

  return (
    <div className="chat-widget">
      {isAssistantOpen && (
        <ChatWindow onClose={() => setIsAssistantOpen(false)} />
      )}

      {isMenuOpen && !isAssistantOpen && (
        <div className="chat-widget__menu" aria-label="Support options">
          <button type="button" onClick={openAssistant}>
            <FiMessageCircle aria-hidden="true" />
            <span>
              <strong>AI Help</strong>
              <small>Booking guide</small>
            </span>
          </button>

          <a
            href={WHATSAPP_CHAT_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsMenuOpen(false)}
          >
            <FaWhatsapp aria-hidden="true" />
            <span>
              <strong>WhatsApp</strong>
              <small>Message support</small>
            </span>
          </a>

          <button type="button" onClick={openLiveChat}>
            <FiHeadphones aria-hidden="true" />
            <span>
              <strong>Live Chat</strong>
              <small>Zoho support</small>
            </span>
          </button>
        </div>
      )}

      <button
        type="button"
        className="chat-widget__button"
        onClick={() => {
          if (isAssistantOpen) {
            setIsAssistantOpen(false);
            return;
          }

          setIsMenuOpen((current) => !current);
        }}
        aria-label={
          isAssistantOpen || isMenuOpen
            ? "Close Bedrock support"
            : "Open Bedrock support"
        }
        aria-expanded={isAssistantOpen || isMenuOpen}
      >
        {isAssistantOpen || isMenuOpen ? <FiX /> : <FiMessageCircle />}
        <span>Help</span>
      </button>
    </div>
  );
}

export default ChatWidget;
