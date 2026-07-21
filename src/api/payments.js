import { apiClient, getPaymentCallbackUrl, withQuery } from "./client";

export function getPaymentMethods() {
  return apiClient.get("/payments/methods");
}

export function initializePayment(data = {}) {
  const callbackUrl =
    data.callbackUrl || data.callback_url || getPaymentCallbackUrl();

  return apiClient.post("/payments/initialize", {
    order_type: data.orderType || data.order_type || data.type,
    order_id: data.orderId || data.order_id || data.id,
    payment_method: data.paymentMethod || data.payment_method || "paystack",
    ...(callbackUrl ? { callback_url: callbackUrl } : {}),
  });
}

export function verifyPayment(reference) {
  return apiClient.post("/payments/verify", { reference });
}

export function getPaymentStatus(reference) {
  return apiClient.get(`/payments/status/${reference}`);
}

export function getPaymentHistory(params = {}) {
  return apiClient.get(
    withQuery("/payments/history", {
      page: params.page,
      per_page: params.perPage || params.per_page,
      status: params.status,
    }),
  );
}
