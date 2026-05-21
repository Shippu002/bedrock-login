import { apiClient, clearAuthToken, setAuthToken } from "./client";

function splitFullName(fullName = "") {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ") || firstName;

  return { firstName, lastName };
}

function normalizeAuthPayload(data = {}) {
  const { firstName, lastName } = splitFullName(data.fullName || data.name);

  return {
    first_name: data.firstName || data.first_name || firstName,
    last_name: data.lastName || data.last_name || lastName,
    email: data.email,
    phone_number: data.phoneNumber || data.phone_number || data.phone,
    country: data.country,
    country_code: data.countryCode || data.country_code,
    username: data.username,
    referral_code: data.referralCode || data.referral_code || data.referral,
    agent_type: data.agentType || data.agent_type,
    password: data.password,
    password_confirmation:
      data.passwordConfirmation ||
      data.password_confirmation ||
      data.confirmPassword ||
      data.password,
  };
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

export async function registerGuest(data) {
  return apiClient.post("/auth/register", normalizeAuthPayload(data), {
    skipAuth: true,
  });
}

export async function registerAgent(data) {
  const response = await apiClient.post(
    "/auth/register/agent",
    normalizeAuthPayload(data),
    { skipAuth: true },
  );

  return persistTokenFromResponse(response);
}

export async function verifyOtp(email, otp) {
  const response = await apiClient.post(
    "/auth/verify-otp",
    { email, otp },
    { skipAuth: true },
  );

  return persistTokenFromResponse(response);
}

export function resendOtp(email) {
  return apiClient.post("/auth/resend-otp", { email }, { skipAuth: true });
}

export async function login({ email, password }) {
  const response = await apiClient.post(
    "/auth/login",
    { email, password },
    { skipAuth: true },
  );

  return persistTokenFromResponse(response);
}

export function forgotPassword(email) {
  return apiClient.post("/auth/forgot-password", { email }, { skipAuth: true });
}

export function resetPassword({ email, otp, password, passwordConfirmation }) {
  return apiClient.post(
    "/auth/reset-password",
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
  return apiClient.get("/auth/me");
}

export function getOnboardingStatus() {
  return apiClient.get("/auth/onboarding-status");
}

export async function logout() {
  const response = await apiClient.post("/auth/logout");

  clearAuthToken();

  return response;
}

export function deleteAccount() {
  return apiClient.post("/auth/delete-account");
}
