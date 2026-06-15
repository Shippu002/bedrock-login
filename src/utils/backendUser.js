function unwrapResponsePayload(response) {
  if (!response || typeof response !== "object") return {};

  if (response.user) return response.user;
  if (response.data?.user) return response.data.user;
  if (response.data && typeof response.data === "object") return response.data;

  return response;
}

function pickNonEmpty(...values) {
  for (const value of values) {
    if (value === undefined || value === null) continue;

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
      continue;
    }

    return value;
  }

  return "";
}

export function normalizeBackendUser(response, fallback = {}) {
  const user = unwrapResponsePayload(response);
  const firstName = pickNonEmpty(
    user.first_name,
    user.firstName,
    user.given_name,
    user.givenName,
    fallback.firstName,
    fallback.first_name,
  );
  const lastName = pickNonEmpty(
    user.last_name,
    user.lastName,
    user.surname,
    user.family_name,
    user.familyName,
    fallback.lastName,
    fallback.last_name,
  );
  const fullName =
    pickNonEmpty(user.name, user.full_name, user.fullName, user.display_name) ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    pickNonEmpty(fallback.name, fallback.fullName, fallback.username) ||
    "";
  const email = pickNonEmpty(user.email, fallback.email);
  const username =
    pickNonEmpty(user.username, user.referral_code, fallback.username) ||
    fullName ||
    email.split("@")[0] ||
    "Bedrock User";

  const normalizedUser = {
    ...fallback,
    backendId: pickNonEmpty(user.id, user.uuid, fallback.backendId, fallback.id),
    name: fullName,
    username,
    email,
    phone:
      pickNonEmpty(
        user.phone_number,
        user.phoneNumber,
        user.phone,
        user.mobile,
        user.telephone,
        fallback.phone,
        fallback.phoneNumber,
        fallback.phone_number,
      ) || "",
    state:
      pickNonEmpty(
        user.state,
        user.state_name,
        user.stateName,
        user.city,
        user.location,
        fallback.state,
        fallback.stateName,
        fallback.state_name,
      ) || "",
    country:
      pickNonEmpty(
        user.country,
        user.country_name,
        user.countryName,
        fallback.country,
        fallback.countryName,
        fallback.country_name,
      ) || "",
    countryCode:
      pickNonEmpty(
        user.country_code,
        user.countryCode,
        fallback.countryCode,
        fallback.country_code,
      ) || "",
    currency: pickNonEmpty(user.currency, fallback.currency) || "",
    profilePhoto:
      pickNonEmpty(
        user.avatar_url,
        user.avatar,
        user.profile_photo,
        user.profile_photo_url,
        user.profilePhoto,
        user.profilePhotoUrl,
        user.image,
        user.photo,
        fallback.profilePhoto,
      ) || "",
    isVerified:
      user.is_verified ??
      user.email_verified ??
      user.isVerified ??
      user.emailVerified ??
      (user.email_verified_at ? true : undefined) ??
      (user.verified_at ? true : undefined) ??
      fallback.isVerified ??
      false,
    isProfileComplete:
      user.is_profile_complete ??
      user.profile_complete ??
      user.profileComplete ??
      fallback.isProfileComplete,
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
