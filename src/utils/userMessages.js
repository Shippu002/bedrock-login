export function getUserMessages(user) {
  if (!user) return [];

  if (Array.isArray(user.messages)) return user.messages;
  if (Array.isArray(user.unreadMessages)) return user.unreadMessages;

  return [];
}

export function getUserMessageCount(user) {
  if (!user) return 0;

  const messages = getUserMessages(user);

  if (messages.length > 0) return messages.length;

  const count = Number(
    user.messageCount ??
      user.messagesCount ??
      user.unreadMessageCount ??
      user.unreadMessagesCount ??
      user.unreadMessages ??
      0,
  );

  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}
