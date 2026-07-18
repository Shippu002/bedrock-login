import { useEffect, useRef, useState } from "react";
import { FiSend, FiX } from "react-icons/fi";
import {
  createUserMessage,
  getAssistantResponse,
  getInitialAssistantMessage,
} from "../services/chatAssistant";
import { requestBookingTour } from "../services/bookingTour";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

const START_TOUR_TEXT = "Start guided tour";

function ChatWindow({ onClose }) {
  const [messages, setMessages] = useState(() => [getInitialAssistantMessage()]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [guideState, setGuideState] = useState({ active: false, stepIndex: -1 });
  const messageListRef = useRef(null);

  useEffect(() => {
    const list = messageListRef.current;

    if (!list) return;

    list.scrollTop = list.scrollHeight;
  }, [messages, isTyping]);

  async function sendMessage(rawText) {
    const text = String(rawText || "").trim();

    if (!text || isTyping) return;

    setInputValue("");
    setMessages((currentMessages) => [
      ...currentMessages,
      createUserMessage(text),
    ]);

    if (text.toLowerCase() === START_TOUR_TEXT.toLowerCase()) {
      window.setTimeout(() => {
        requestBookingTour({ force: true });
      }, 120);
      onClose?.();
      return;
    }

    setIsTyping(true);

    window.setTimeout(async () => {
      const response = await getAssistantResponse(text, guideState);

      setGuideState(response.guideState);
      setMessages((currentMessages) => [
        ...currentMessages,
        response.message,
      ]);
      setIsTyping(false);
    }, 520);
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(inputValue);
  }

  const lastAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const quickReplies = lastAssistantMessage?.quickReplies || [];

  return (
    <section
      className="chat-window"
      aria-label="Bedrock assistant chat"
      role="dialog"
      aria-modal="false"
    >
      <header className="chat-window__header">
        <div>
          <span className="chat-window__eyebrow">Bedrock Assistant</span>
          <h2>Booking help</h2>
        </div>

        <button type="button" onClick={onClose} aria-label="Close assistant">
          <FiX />
        </button>
      </header>

      <div className="chat-window__messages" ref={messageListRef}>
        {messages.map((message) => (
          <MessageBubble message={message} key={message.id} />
        ))}

        {isTyping && (
          <div className="chat-message chat-message--assistant">
            <span className="chat-message__avatar">B</span>
            <TypingIndicator />
          </div>
        )}
      </div>

      {quickReplies.length > 0 && !isTyping && (
        <div className="chat-window__quick-replies">
          {quickReplies.map((reply) => (
            <button type="button" onClick={() => sendMessage(reply)} key={reply}>
              {reply}
            </button>
          ))}
        </div>
      )}

      <form className="chat-window__form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputValue}
          placeholder="Ask about booking..."
          onChange={(event) => setInputValue(event.target.value)}
          aria-label="Message Bedrock assistant"
        />
        <button type="submit" aria-label="Send message" disabled={isTyping}>
          <FiSend />
        </button>
      </form>
    </section>
  );
}

export default ChatWindow;
