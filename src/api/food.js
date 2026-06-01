import { apiClient, withQuery } from "./client";

export function getMenu(params = {}) {
  return apiClient.get(
    withQuery("/food/menu", {
      meal_type: params.mealType || params.meal_type,
      dietary_tag: params.dietaryTag || params.dietary_tag,
      search: params.search,
    }),
    { skipAuth: true },
  );
}

export function getMealTypes() {
  return apiClient.get("/food/meal-types", { skipAuth: true });
}

export function getDietaryTags() {
  return apiClient.get("/food/dietary-tags", { skipAuth: true });
}

export function getFoodItem(foodItemId) {
  return apiClient.get(`/food/items/${foodItemId}`, { skipAuth: true });
}

export function createFoodOrder(data = {}) {
  return apiClient.post("/food/orders", {
    booking_id: data.bookingId || data.booking_id,
    apartment_number: data.apartmentNumber || data.apartment_number,
    delivery_time: data.deliveryTime || data.delivery_time,
    guest_count: data.guestCount || data.guest_count || data.guests,
    notes: data.notes || data.note || "",
    use_rock_points: Boolean(data.useRockPoints || data.use_rock_points),
    items: data.items || [],
  });
}

export function getFoodOrders(params = {}) {
  return apiClient.get(
    withQuery("/food/orders", {
      page: params.page || 1,
      per_page: params.perPage || params.per_page || 15,
      status: params.status,
    }),
  );
}

export function getFoodOrderDetails(foodOrderId) {
  return apiClient.get(`/food/orders/${foodOrderId}`);
}

export function payFoodOrder(foodOrderId, data = {}) {
  return apiClient.post(`/food/orders/${foodOrderId}/pay`, {
    payment_method: data.paymentMethod || data.payment_method || "paystack",
    reference: data.reference,
  });
}

export function verifyFoodPayment(foodOrderId, reference) {
  return apiClient.post(`/food/orders/${foodOrderId}/verify-payment`, {
    reference,
  });
}

export function getFoodOrderTimeline(foodOrderId) {
  return apiClient.get(`/food/orders/${foodOrderId}/timeline`);
}

export function cancelFoodOrder(foodOrderId) {
  return apiClient.post(`/food/orders/${foodOrderId}/cancel`);
}
