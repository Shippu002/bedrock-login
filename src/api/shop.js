import { apiClient, getPaymentCallbackUrl, withQuery } from "./client";

export function getProducts(params = {}) {
  return apiClient.get(
    withQuery("/shop/products", {
      category: params.category,
      search: params.search,
    }),
    { skipAuth: true },
  );
}

export function getCategories() {
  return apiClient.get("/shop/categories", { skipAuth: true });
}

export function getProductDetails(productId) {
  return apiClient.get(`/shop/products/${productId}`, { skipAuth: true });
}

export function createShopOrder(data = {}) {
  return apiClient.post("/shop/orders", {
    booking_id: data.bookingId || data.booking_id,
    apartment_number: data.apartmentNumber || data.apartment_number,
    notes: data.notes || data.note || "",
    items: data.items || [],
  });
}

export function getShopOrders(params = {}) {
  return apiClient.get(
    withQuery("/shop/orders", {
      page: params.page,
      per_page: params.perPage || params.per_page,
      status: params.status,
    }),
  );
}

export function getShopOrderDetails(shopOrderId) {
  return apiClient.get(`/shop/orders/${shopOrderId}`);
}

export function payShopOrder(shopOrderId, data = {}) {
  const callbackUrl =
    data.callbackUrl || data.callback_url || getPaymentCallbackUrl();

  return apiClient.post(`/shop/orders/${shopOrderId}/pay`, {
    payment_method: data.paymentMethod || data.payment_method || "paystack",
    reference: data.reference,
    ...(callbackUrl ? { callback_url: callbackUrl } : {}),
  });
}

export function verifyShopPayment(shopOrderId, reference) {
  return apiClient.post(`/shop/orders/${shopOrderId}/verify-payment`, {
    reference,
  });
}

export function getShopOrderTimeline(shopOrderId) {
  return apiClient.get(`/shop/orders/${shopOrderId}/timeline`);
}

export function cancelShopOrder(shopOrderId) {
  return apiClient.post(`/shop/orders/${shopOrderId}/cancel`);
}
