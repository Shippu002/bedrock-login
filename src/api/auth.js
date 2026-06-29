import { apiClient, clearAuthToken, setAuthToken } from "./client";

export const authEndpoints = {
  guestRegister: "/auth/guest/register/step1",
  guestRegisterStep1: "/auth/guest/register/step1",
  guestRegisterStep2: "/auth/guest/register/step2",
  guestRegisterStep3: "/auth/guest/register/step3",
  guestRegisterStep4: "/auth/guest/register/step4",
  agentRegister: "/auth/agent/register/step1",
  agentRegisterStep1: "/auth/agent/register/step1",
  agentRegisterStep2: "/auth/agent/register/step2",
  agentSubmitApplication: "/auth/agent/submit-application",
  verifyOtp: "/auth/verify-email",
  verifyEmail: "/auth/verify-email",
  resendOtp: "/auth/resend-otp",
  checkUsername: "/auth/check-username",
  resumeOnboarding: "/auth/resume-onboarding",
  login: "/auth/login",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  me: "/auth/me",
  onboardingStatus: "/auth/onboarding-status",
  logout: "/auth/logout",
  deleteAccount: "/auth/delete-account",
};

function cleanPayload(payload = {}) {
  return Object.fromEntries(
    Object.entries(payload).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : email;
}

function normalizeStepOnePayload(data = {}) {
  return cleanPayload({
    full_name: data.fullName || data.full_name || data.name,
    email: normalizeEmail(data.email),
    phone_number: data.phoneNumber || data.phone_number || data.phone,
    phone_country_code:
      data.phoneCountryCode ||
      data.phone_country_code ||
      data.dialCode ||
      data.countryCode,
    referral_code: data.referralCode || data.referral_code || data.referral,
  });
}

function normalizeAgentAccountType(value) {
  if (value === "corporate_agent" || value === "individual_agent") {
    return value;
  }

  if (value === "corporate") return "corporate_agent";

  return "individual_agent";
}

const tokenResponseKeys = [
  "token",
  "access_token",
  "accessToken",
  "auth_token",
  "authToken",
  "bearer_token",
  "bearerToken",
  "plain_text_token",
  "plainTextToken",
];

function normalizeAuthToken(token) {
  return typeof token === "string"
    ? token.trim().replace(/^Bearer\s+/i, "")
    : "";
}

function getTokenFromResponse(value, depth = 0) {
  if (!value || typeof value !== "object" || depth > 4) {
    return "";
  }

  for (const key of tokenResponseKeys) {
    const token = normalizeAuthToken(value[key]);

    if (token) {
      return token;
    }
  }

  for (const nestedKey of ["data", "auth", "authorization", "session", "user"]) {
    const token = getTokenFromResponse(value[nestedKey], depth + 1);

    if (token) {
      return token;
    }
  }

  return "";
}

function persistTokenFromResponse(response) {
  const token = getTokenFromResponse(response);

  if (token) {
    setAuthToken(token);
  }

  return response;
}

function collectErrorText(value) {
  if (!value) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectErrorText);
  if (typeof value === "object") {
    return Object.values(value).flatMap(collectErrorText);
  }

  return [];
}

function isDuplicateEmailError(error) {
  const message = [
    error?.message,
    ...collectErrorText(error?.data),
  ]
    .join(" ")
    .toLowerCase();

  return (
    message.includes("email") &&
    (message.includes("already") ||
      message.includes("taken") ||
      message.includes("exists") ||
      message.includes("linked"))
  );
}

function isMethodOrRouteError(error) {
  const message = [
    error?.message,
    ...collectErrorText(error?.data),
  ]
    .join(" ")
    .toLowerCase();

  return (
    error?.status === 404 ||
    error?.status === 405 ||
    message.includes("method") ||
    message.includes("route") ||
    message.includes("could not be found")
  );
}

function isServerError(error) {
  return error?.status >= 500;
}

function getDuplicateEmailMessage() {
  return "This email is already linked to an account.";
}

async function postPublicRegistrationStep(path, payload) {
  try {
    const response = await apiClient.post(path, payload, { skipAuth: true });

    return persistTokenFromResponse(response);
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      throw new Error(getDuplicateEmailMessage(), { cause: error });
    }

    throw error;
  }
}

export function startGuestRegistration(data) {
  return postPublicRegistrationStep(
    authEndpoints.guestRegisterStep1,
    normalizeStepOnePayload(data),
  );
}

export function startAgentRegistration(data) {
  return postPublicRegistrationStep(
    authEndpoints.agentRegisterStep1,
    cleanPayload({
      account_type: normalizeAgentAccountType(data.accountType || data.account_type),
      ...normalizeStepOnePayload(data),
    }),
  );
}

export const registerGuest = startGuestRegistration;
export const registerAgent = startAgentRegistration;

export async function verifyOtp(email, otp) {
  const response = await apiClient.post(
    authEndpoints.verifyOtp,
    { email: normalizeEmail(email), otp },
    { skipAuth: true },
  );

  return persistTokenFromResponse(response);
}

export const verifyEmailOtp = verifyOtp;

export function resendOtp(email) {
  return apiClient.post(
    authEndpoints.resendOtp,
    { email: normalizeEmail(email), type: "email_verification" },
    { skipAuth: true },
  );
}

export async function checkUsername(username) {
  const response = await apiClient.post(
    authEndpoints.checkUsername,
    { username },
    { skipAuth: true },
  );

  const available =
    response?.available ??
    response?.data?.available ??
    response?.data?.username_available ??
    response?.success;

  return {
    response,
    available: Boolean(available),
  };
}

export async function createGuestUsername(username) {
  const response = await apiClient.post(authEndpoints.guestRegisterStep2, {
    username,
  });

  return persistTokenFromResponse(response);
}

export async function setGuestPassword({ password, passwordConfirmation }) {
  const response = await apiClient.post(authEndpoints.guestRegisterStep3, {
    password,
    password_confirmation: passwordConfirmation || password,
  });

  return persistTokenFromResponse(response);
}

export async function completeGuestRegistration(data = {}) {
  const response = await apiClient.post(
    authEndpoints.guestRegisterStep4,
    cleanPayload({
      travel_purpose: data.travelPurpose || data.travel_purpose,
      preferred_amenities:
        data.preferredAmenities || data.preferred_amenities,
      budget_range: data.budgetRange || data.budget_range,
    }),
  );

  return persistTokenFromResponse(response);
}

export async function setAgentPassword({ password, passwordConfirmation }) {
  const response = await apiClient.post(authEndpoints.agentRegisterStep2, {
    password,
    password_confirmation: passwordConfirmation || password,
  });

  return persistTokenFromResponse(response);
}

export function submitAgentApplication() {
  return apiClient.post(authEndpoints.agentSubmitApplication);
}

export async function login({ email, password }) {
  const response = await apiClient.post(
    authEndpoints.login,
    { email: normalizeEmail(email), password },
    { skipAuth: true },
  );

  return persistTokenFromResponse(response);
}

export function forgotPassword(email) {
  return apiClient.post(
    authEndpoints.forgotPassword,
    { email: normalizeEmail(email) },
    { skipAuth: true },
  );
}

export function resetPassword({ email, otp, password, passwordConfirmation }) {
  return apiClient.post(
    authEndpoints.resetPassword,
    {
      email: normalizeEmail(email),
      otp,
      password,
      password_confirmation: passwordConfirmation || password,
    },
    { skipAuth: true },
  );
}

export function getCurrentUser() {
  return apiClient.get(authEndpoints.me);
}

export function getOnboardingStatus() {
  return apiClient.get(authEndpoints.onboardingStatus);
}

export async function logout() {
  const response = await apiClient.post(authEndpoints.logout);

  clearAuthToken();

  return response;
}

export async function deleteAccount(password) {
  const normalizedPassword = String(password || "");
  const payload = cleanPayload({
    password: normalizedPassword,
    current_password: normalizedPassword,
    password_confirmation: normalizedPassword,
  });

  try {
    return await apiClient.post(authEndpoints.deleteAccount, payload);
  } catch (error) {
    if (!isMethodOrRouteError(error) && !isServerError(error)) {
      throw error;
    }

    try {
      return await apiClient.delete(authEndpoints.deleteAccount, {
        body: payload,
      });
    } catch (deleteError) {
      if (isServerError(error) && isMethodOrRouteError(deleteError)) {
        throw error;
      }

      throw deleteError;
    }
  }
}
