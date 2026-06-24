import { FaWhatsapp } from "react-icons/fa";
import "./FloatingWhatsApp.css";

const WHATSAPP_CHAT_URL = "https://wa.link/8k0a1n";

export default function FloatingWhatsApp() {
  return (
    <a
      className="floating-whatsapp"
      href={WHATSAPP_CHAT_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Bedrock Residences on WhatsApp"
      title="Chat with us on WhatsApp"
    >
      <FaWhatsapp aria-hidden="true" />
      <span>Chat</span>
    </a>
  );
}
