function unwrapResponsePayload(response) {
  if (!response || typeof response !== "object") return {};

  if (response.user) return response.user;
  if (response.data?.user) return response.data.user;
  if (response.data && typeof response.data === "object") return response.data;

  return response;
}

export function normalizeBackendUser(response, fallback = {}) {
  const user = unwrapResponsePayload(response);
  const firstName = user.first_name || user.firstName || "";
  const lastName = user.last_name || user.lastName || "";
  const fullName =
    user.name ||
    user.full_name ||
    user.fullName ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    fallback.name ||
    fallback.username ||
    "";
  const email = user.email || fallback.email || "";
  const username =
    user.username ||
    user.referral_code ||
    fallback.username ||
    fullName ||
    email.split("@")[0] ||
    "Bedrock User";

  const normalizedUser = {
    ...fallback,
    backendId: user.id || user.uuid || fallback.backendId || fallback.id,
    name: fullName,
    username,
    email,
    phone:
      user.phone_number ||
      user.phoneNumber ||
      user.phone ||
      fallback.phone ||
      "",
    state: user.state || fallback.state || "",
    country: user.country || fallback.country || "",
    countryCode:
      user.country_code ||
      user.countryCode ||
      fallback.countryCode ||
      fallback.country_code ||
      "",
    currency: user.currency || fallback.currency || "",
    profilePhoto:
      user.avatar_url ||
      user.avatar ||
      user.profile_photo ||
      user.profilePhoto ||
      fallback.profilePhoto ||
      "",
    isVerified:
      user.is_verified ??
      user.email_verified ??
      user.isVerified ??
      fallback.isVerified ??
      false,
    messages: Array.isArray(user.messages)
      ? user.messages
      : Array.isArray(fallback.messages)
        ? fallback.messages
        : [],
    bookings: Array.isArray(user.bookings)
      ? user.bookings
      : Array.isArray(fallback.bookings)
        ? fallback.bookings
        : [],
    orders: Array.isArray(user.orders)
      ? user.orders
      : Array.isArray(fallback.orders)
        ? fallback.orders
        : [],
    messageCount:
      user.message_count ??
      user.messageCount ??
      fallback.messageCount ??
      fallback.messages?.length ??
      0,
  };

  delete normalizedUser.password;

  return normalizedUser;
}
