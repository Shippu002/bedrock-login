import { apiClient, withQuery } from "./client";

function cleanPayload(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
}

export function getProfile() {
  return apiClient.get("/profile");
}

export function updateProfile(data = {}) {
  return apiClient.put(
    "/profile",
    cleanPayload({
      first_name: data.firstName || data.first_name,
      last_name: data.lastName || data.last_name,
      name: data.name,
      email: data.email,
      phone_number: data.phoneNumber || data.phone_number || data.phone,
      state: data.state,
      country: data.country,
      country_code: data.countryCode || data.country_code,
      currency: data.currency,
    }),
  );
}

export function updateAvatar(file) {
  const formData = new FormData();

  formData.append("avatar", file);

  return apiClient.post("/profile/avatar", formData);
}

export function changePassword({
  currentPassword,
  current_password,
  newPassword,
  new_password,
  newPasswordConfirmation,
  new_password_confirmation,
}) {
  const nextPassword = newPassword || new_password;

  return apiClient.post("/profile/change-password", {
    current_password: currentPassword || current_password,
    new_password: nextPassword,
    new_password_confirmation:
      newPasswordConfirmation || new_password_confirmation || nextPassword,
  });
}

export function getRockPoints() {
  return apiClient.get("/profile/rock-points");
}

export function getReferralInfo() {
  return apiClient.get("/profile/referral");
}

export function getNotifications(params = {}) {
  return apiClient.get(
    withQuery("/profile/notifications", {
      page: params.page || 1,
      per_page: params.perPage || params.per_page || 20,
    }),
  );
}

export function getNotificationsCount() {
  return apiClient.get("/profile/notifications/count");
}

export function markNotificationAsRead(notificationId) {
  return apiClient.post(`/profile/notifications/${notificationId}/read`);
}

export function markAllNotificationsAsRead() {
  return apiClient.post("/profile/notifications/read-all");
}

export function getDocuments() {
  return apiClient.get("/documents");
}

function normalizeDocumentType(type) {
  const documentTypeMap = {
    cac: "cac_certificate",
    nin: "id_card",
    voters_card: "id_card",
  };

  return documentTypeMap[type] || type || "id_card";
}

export function uploadDocument({ file, type }) {
  const formData = new FormData();

  formData.append("document", file);
  formData.append("document_type", normalizeDocumentType(type));

  return apiClient.post("/documents/upload", formData);
}

export function submitKyc() {
  return apiClient.post("/auth/agent/submit-application");
}

export function getHelpInfo() {
  return apiClient.get("/help", { skipAuth: true });
}

export function getLegalDocuments() {
  return apiClient.get("/legal", { skipAuth: true });
}
