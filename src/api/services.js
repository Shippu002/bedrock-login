import { apiClient, withQuery } from "./client";

export function getServiceCategories() {
  return apiClient.get("/services/categories", { skipAuth: true });
}

export function getServices(params = {}) {
  return apiClient.get(
    withQuery("/services", {
      category_id: params.categoryId || params.category_id,
      category: params.category,
      page: params.page,
      per_page: params.perPage || params.per_page,
    }),
    { skipAuth: true },
  );
}

export function getServiceDetails(serviceId) {
  return apiClient.get(`/services/${serviceId}`, { skipAuth: true });
}

export function getLaundryItems() {
  return apiClient.get("/services/laundry/items", { skipAuth: true });
}

export function getMassageOptions() {
  return apiClient.get("/services/massage/options", { skipAuth: true });
}

export function createServiceOrder(data = {}) {
  return apiClient.post("/services/orders", {
    service_id: data.serviceId || data.service_id,
    booking_id: data.bookingId || data.booking_id,
    apartment_number: data.apartmentNumber || data.apartment_number,
    scheduled_at: data.scheduledAt || data.scheduled_at,
    duration: data.duration,
    notes: data.notes || data.note || "",
    items: data.items,
  });
}

export function getServiceOrders(params = {}) {
  return apiClient.get(
    withQuery("/orders/services", {
      page: params.page,
      per_page: params.perPage || params.per_page,
      status: params.status,
    }),
  );
}

export function getServiceOrderDetails(serviceOrderId) {
  return apiClient.get(`/services/orders/${serviceOrderId}`);
}

export function payServiceOrder(serviceOrderId, data = {}) {
  return apiClient.post(`/services/orders/${serviceOrderId}/pay`, {
    payment_method: data.paymentMethod || data.payment_method || "paystack",
    reference: data.reference,
  });
}

export function verifyServicePayment(serviceOrderId, reference) {
  return apiClient.post(`/services/orders/${serviceOrderId}/verify-payment`, {
    reference,
  });
}
