function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`chat-message ${isUser ? "chat-message--user" : "chat-message--assistant"}`}
    >
      {!isUser && <span className="chat-message__avatar">B</span>}

      <div className="chat-message__bubble">
        {String(message.text || "")
          .split("\n")
          .map((line, index) =>
            line ? (
              <p key={`${message.id}-${index}`}>{line}</p>
            ) : (
              <span className="chat-message__space" key={`${message.id}-${index}`} />
            ),
          )}
      </div>
    </div>
  );
}

export default MessageBubble;
