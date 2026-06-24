import { apiClient, clearAuthToken, setAuthToken } from "./client";

export const authEndpoints = { 
  guestRegister: "/auth/register",
  agentRegister: "/auth/register/agent",
  verifyOtp: "/auth/verify-otp",
  resendOtp: "/auth/resend-otp",
  login: "/auth/login",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  me: "/auth/me",
  onboardingStatus: "/auth/onboarding-status",
  logout: "/auth/logout",
  deleteAccount: "/auth/delete-account",
};

function splitFullName(fullName = "") {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ") || firstName;

  return { firstName, lastName };
}

function normalizeAuthPayload(data = {}) {
  const { firstName, lastName } = splitFullName(data.fullName || data.name);

  const payload = {
    first_name: data.firstName || data.first_name || firstName,
    last_name: data.lastName || data.last_name || lastName,
    email: data.email,
    phone_number: data.phoneNumber || data.phone_number || data.phone,
    country: data.country,
    country_code: data.countryCode || data.country_code,
    password: data.password,
    password_confirmation:
      data.passwordConfirmation ||
      data.password_confirmation ||
      data.confirmPassword ||
      data.password,
  };

  return Object.fromEntries(
    Object.entries(payload).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

function persistTokenFromResponse(response) {
  const token =
    response?.token ||
    response?.access_token ||
    response?.data?.token ||
    response?.data?.access_token;

  if (token) {
    setAuthToken(token);
  }

  return response;
}

function isMissingRouteError(error) {
  const message = String(error?.message || "").toLowerCase();

  return message.includes("route") || message.includes("could not be found");
}

function getMissingRegisterMessage(accountType) {
  const route =
    accountType === "agent"
      ? "POST /api/v1/auth/register/agent"
      : "POST /api/v1/auth/register";

  return `Signup is not available on the production backend yet. Please ask the backend team to deploy ${route} from the Postman collection, then try again.`;
}

async function postRegister(path, data, accountType) {
  try {
    const response = await apiClient.post(path, normalizeAuthPayload(data), {
      skipAuth: true,
    });

    return persistTokenFromResponse(response);
  } catch (error) {
    if (isMissingRouteError(error)) {
      throw new Error(getMissingRegisterMessage(accountType), {
        cause: error,
      });
    }

    throw error;
  }
}

export async function registerGuest(data) {
  return postRegister(authEndpoints.guestRegister, data, "guest");
}

export async function registerAgent(data) {
  return postRegister(authEndpoints.agentRegister, data, "agent");
}

export async function verifyOtp(email, otp) {
  const response = await apiClient.post(
    authEndpoints.verifyOtp,
    { email, otp },
    { skipAuth: true },
  );

  return persistTokenFromResponse(response);
}

export function resendOtp(email) {
  return apiClient.post(
    authEndpoints.resendOtp,
    { email, type: "email_verification" },
    { skipAuth: true },
  );
}

export async function login({ email, password }) {
  const response = await apiClient.post(
    authEndpoints.login,
    { email, password },
    { skipAuth: true },
  );

  return persistTokenFromResponse(response);
}

export function forgotPassword(email) {
  return apiClient.post(
    authEndpoints.forgotPassword,
    { email },
    { skipAuth: true },
  );
}

export function resetPassword({ email, otp, password, passwordConfirmation }) {
  return apiClient.post(
    authEndpoints.resetPassword,
    {
      email,
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

export function deleteAccount() {
  return apiClient.post(authEndpoints.deleteAccount);
}
