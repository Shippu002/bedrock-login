import { apiClient, withQuery } from "./client";

export function getQuickRequestTypes() {
  return apiClient.get("/requests/quick-request-types");
}

export function createQuickRequest(data = {}) {
  return apiClient.post("/requests/quick", {
    booking_id: data.bookingId || data.booking_id,
    request_type: data.requestType || data.request_type,
    description: data.description,
    agree_terms: data.agreeTerms ?? data.agree_terms ?? false,
  });
}

export function createChauffeurRequest(data = {}) {
  return apiClient.post("/requests/chauffeur", {
    booking_id: data.bookingId || data.booking_id,
    destination: data.destination,
    pickup_time: data.pickupTime || data.pickup_time,
    notes: data.notes || data.note || "",
    agree_terms: data.agreeTerms ?? data.agree_terms ?? false,
  });
}

export function getExchangeRates() {
  return apiClient.get("/exchange-rates", { skipAuth: true });
}

export function createBureauDeChangeRequest(data = {}) {
  return apiClient.post("/requests/bureau-de-change", {
    booking_id: data.bookingId || data.booking_id,
    currency_from: data.currencyFrom || data.currency_from,
    currency_to: data.currencyTo || data.currency_to,
    amount: data.amount,
    notes: data.notes || data.note || "",
    agree_terms: data.agreeTerms ?? data.agree_terms ?? false,
  });
}

export function getRequests(params = {}) {
  return apiClient.get(
    withQuery("/requests", {
      type: params.type,
      status: params.status,
      page: params.page,
      per_page: params.perPage || params.per_page,
    }),
  );
}

export function getRequestDetails(requestId) {
  return apiClient.get(`/requests/${requestId}`);
}
