import HomePage from "./pages/HomePage/HomePage";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import ChatWidget from "./components/ChatWidget";
import "./App.css";
import "./styles/booking-tour.css";
import "./styles/mobile-guard.css";

export default function App() {
  return (
    <>
      <HomePage />
      <FloatingWhatsApp />
      <ChatWidget />
    </>
  );
}
