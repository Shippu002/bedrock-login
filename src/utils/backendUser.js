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

function normalizeStatusValue(value) {
  return typeof value === "string"
    ? value.trim().toLowerCase().replace(/[\s-]+/g, "_")
    : "";
}

function toBooleanFlag(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  const normalizedValue = normalizeStatusValue(value);

  if (
    [
      "true",
      "yes",
      "1",
      "verified",
      "approved",
      "complete",
      "completed",
      "accepted",
      "active",
      "enabled",
    ].includes(normalizedValue)
  ) {
    return true;
  }

  if (
    [
      "false",
      "no",
      "0",
      "pending",
      "unverified",
      "not_verified",
      "rejected",
    ].includes(normalizedValue)
  ) {
    return false;
  }

  return undefined;
}

function valueHasAgentSignal(value) {
  if (Array.isArray(value)) {
    return value.some(valueHasAgentSignal);
  }

  return normalizeStatusValue(value).includes("agent");
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function asScalar(value) {
  return value && typeof value === "object" ? undefined : value;
}

function getAgentStatus(user = {}, fallback = {}) {
  const agent = asObject(user.agent || user.agent_profile || user.agentProfile);
  const application = asObject(
    user.application || user.agent_application || user.agentApplication,
  );
  const kyc = asObject(user.kyc || user.kyc_status || user.kycStatus);
  const onboarding = asObject(
    user.onboarding || user.onboarding_status || user.onboardingStatus,
  );
  const verification = asObject(
    user.verification || user.verification_status || user.verificationStatus,
  );
  const document = asObject(
    user.document || user.document_status || user.documentStatus,
  );
  const idCard = asObject(
    user.id_card || user.idCard || user.id_verification || user.idVerification,
  );

  return pickNonEmpty(
    user.agent_status,
    user.agentStatus,
    user.application_status,
    user.applicationStatus,
    user.approval_status,
    user.approvalStatus,
    asScalar(user.kyc_status),
    user.kycStatus,
    asScalar(user.onboarding_status),
    asScalar(user.onboardingStatus),
    asScalar(user.verification_status),
    asScalar(user.verificationStatus),
    asScalar(user.document_status),
    asScalar(user.documentStatus),
    asScalar(user.id_verification_status),
    asScalar(user.idVerificationStatus),
    asScalar(user.id_card_status),
    asScalar(user.idCardStatus),
    user.current_step,
    user.currentStep,
    agent.status,
    agent.agent_status,
    agent.verification_status,
    agent.approval_status,
    application.status,
    application.application_status,
    application.approval_status,
    kyc.status,
    kyc.verification_status,
    onboarding.status,
    onboarding.current_step,
    onboarding.currentStep,
    verification.status,
    document.status,
    document.verification_status,
    idCard.status,
    idCard.verification_status,
    user.status,
    fallback.agentStatus,
    fallback.agent_status,
  );
}

function getAgentVerifiedFlag(user = {}, fallback = {}, options = {}) {
  const allowGenericVerified = Boolean(options.allowGenericVerified);
  const agent = asObject(user.agent || user.agent_profile || user.agentProfile);
  const application = asObject(
    user.application || user.agent_application || user.agentApplication,
  );
  const kyc = asObject(user.kyc || user.kyc_status || user.kycStatus);
  const onboarding = asObject(
    user.onboarding || user.onboarding_status || user.onboardingStatus,
  );
  const verification = asObject(
    user.verification || user.verification_status || user.verificationStatus,
  );
  const document = asObject(
    user.document || user.document_status || user.documentStatus,
  );
  const idCard = asObject(
    user.id_card || user.idCard || user.id_verification || user.idVerification,
  );
  const directFlag = [
    allowGenericVerified ? user.is_verified : undefined,
    allowGenericVerified ? user.isVerified : undefined,
    allowGenericVerified ? user.verified : undefined,
    user.is_agent_verified,
    user.isAgentVerified,
    user.is_agent_approved,
    user.isAgentApproved,
    user.agent_verified,
    user.agentVerified,
    user.agent_approved,
    user.agentApproved,
    user.is_approved,
    user.isApproved,
    user.approved,
    user.application_approved,
    user.applicationApproved,
    user.can_login,
    user.canLogin,
    user.can_access,
    user.canAccess,
    user.onboarding_complete,
    user.onboardingComplete,
    user.onboarding_completed,
    user.onboardingCompleted,
    user.is_onboarding_complete,
    user.isOnboardingComplete,
    user.is_completed,
    user.isCompleted,
    user.completed,
    user.id_card_verified,
    user.idCardVerified,
    user.id_verified,
    user.idVerified,
    user.document_verified,
    user.documentVerified,
    user.documents_verified,
    user.documentsVerified,
    user.kyc_verified,
    user.kycVerified,
    agent.is_verified,
    agent.isVerified,
    agent.verified,
    agent.is_approved,
    agent.isApproved,
    agent.approved,
    agent.can_login,
    agent.canLogin,
    application.is_verified,
    application.isVerified,
    application.verified,
    application.is_approved,
    application.isApproved,
    application.approved,
    kyc.is_verified,
    kyc.isVerified,
    kyc.verified,
    kyc.is_approved,
    kyc.isApproved,
    onboarding.is_complete,
    onboarding.isComplete,
    onboarding.completed,
    onboarding.is_completed,
    onboarding.isCompleted,
    verification.is_verified,
    verification.isVerified,
    verification.verified,
    document.is_verified,
    document.isVerified,
    document.verified,
    idCard.is_verified,
    idCard.isVerified,
    idCard.verified,
    fallback.isAgentVerified,
    fallback.agentVerified,
    fallback.idCardVerified,
    fallback.documentVerified,
    fallback.kycVerified,
  ]
    .map(toBooleanFlag)
    .find((value) => value !== undefined);

  if (directFlag !== undefined) return directFlag;

  if (
    user.agent_verified_at ||
    user.agentVerifiedAt ||
    user.id_verified_at ||
    user.idVerifiedAt ||
    user.document_verified_at ||
    user.documentVerifiedAt ||
    user.kyc_verified_at ||
    user.kycVerifiedAt ||
    (allowGenericVerified && (user.verified_at || user.verifiedAt)) ||
    agent.verified_at ||
    agent.verifiedAt ||
    agent.approved_at ||
    agent.approvedAt ||
    application.verified_at ||
    application.verifiedAt ||
    application.approved_at ||
    application.approvedAt ||
    kyc.verified_at ||
    kyc.verifiedAt ||
    verification.verified_at ||
    verification.verifiedAt ||
    document.verified_at ||
    document.verifiedAt ||
    idCard.verified_at ||
    idCard.verifiedAt
  ) {
    return true;
  }

  const status = normalizeStatusValue(getAgentStatus(user, fallback));

  if (
    ["verified", "approved", "complete", "completed", "accepted"].includes(
      status,
    )
  ) {
    return true;
  }

  if (
    [
      "pending",
      "submitted",
      "in_review",
      "review",
      "reviewing",
      "unverified",
      "not_verified",
      "rejected",
      "declined",
    ].includes(status)
  ) {
    return false;
  }

  return Boolean(fallback.isAgentVerified);
}

export function isAgentUser(user = {}) {
  const explicitFlag = user.isAgent ?? user.is_agent;
  const explicitBoolean = toBooleanFlag(explicitFlag);

  if (explicitBoolean !== undefined) {
    return explicitBoolean;
  }

  return Boolean(
    valueHasAgentSignal(user.accountType) ||
      valueHasAgentSignal(user.account_type) ||
      valueHasAgentSignal(user.userType) ||
      valueHasAgentSignal(user.user_type) ||
      valueHasAgentSignal(user.role) ||
      valueHasAgentSignal(user.roles) ||
      valueHasAgentSignal(user.type),
  );
}

export function isAgentPendingVerification(user = {}) {
  return isAgentUser(user) && !getAgentVerifiedFlag(user);
}

export function mergeAgentVerificationStatus(user = {}, response = {}) {
  const statusPayload = unwrapResponsePayload(response);
  const status = getAgentStatus(statusPayload, user);
  const isAgent =
    isAgentUser(user) ||
    isAgentUser(statusPayload) ||
    valueHasAgentSignal(statusPayload.account_type) ||
    valueHasAgentSignal(statusPayload.accountType);

  return {
    ...user,
    isAgent,
    agentStatus: status || user.agentStatus || "",
    isAgentVerified: isAgent
      ? getAgentVerifiedFlag(statusPayload, user, {
          allowGenericVerified: true,
        })
      : false,
  };
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
  const accountType = pickNonEmpty(
    user.account_type,
    user.accountType,
    user.user_type,
    user.userType,
    user.type,
    fallback.accountType,
    fallback.account_type,
  );
  const role = pickNonEmpty(user.role, fallback.role);
  const explicitIsAgent = toBooleanFlag(
    user.is_agent ?? user.isAgent ?? fallback.isAgent,
  );
  const isAgent =
    Boolean(explicitIsAgent) ||
    valueHasAgentSignal(accountType) ||
    valueHasAgentSignal(role) ||
    valueHasAgentSignal(user.roles) ||
    valueHasAgentSignal(fallback.roles);

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
    accountType,
    role,
    roles: Array.isArray(user.roles)
      ? user.roles
      : Array.isArray(fallback.roles)
        ? fallback.roles
        : [],
    isAgent,
    agentStatus: getAgentStatus(user, fallback),
    isAgentVerified: isAgent ? getAgentVerifiedFlag(user, fallback) : false,
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
