import { apiClient, withQuery } from "./client";

export function getAllOrders(params = {}) {
  return apiClient.get(
    withQuery("/orders", {
      page: params.page || 1,
      per_page: params.perPage || params.per_page || 20,
      type: params.type,
      status: params.status,
    }),
  );
}

export function getOrderCounts() {
  return apiClient.get("/orders/counts");
}

export function getFoodOrdersOnly() {
  return apiClient.get("/orders/food");
}

export function getBookingsOnly(bookingType = "upcoming") {
  return apiClient.get(
    withQuery("/orders/bookings", {
      booking_type: bookingType,
    }),
  );
}

export function getShopOrdersOnly() {
  return apiClient.get("/orders/shop");
}

export function getServiceOrdersOnly() {
  return apiClient.get("/orders/services");
}

export function getOrderTimeline(bookingId) {
  return apiClient.get(`/orders/booking/${bookingId}/timeline`);
}
