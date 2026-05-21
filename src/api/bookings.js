import { apiClient, withQuery } from "./client";

export function createBooking(data = {}) {
  return apiClient.post("/bookings", {
    apartment_id: data.apartmentId || data.apartment_id,
    check_in: data.checkIn || data.check_in,
    check_out: data.checkOut || data.check_out,
    guests: data.guests,
    special_requests: data.specialRequests || data.special_requests || "",
    coupon_code: data.couponCode || data.coupon_code || null,
    use_rock_points: Boolean(data.useRockPoints || data.use_rock_points),
    agree_to_policies: data.agreeToPolicies ?? data.agree_to_policies ?? true,
  });
}

export function getBookings(params = {}) {
  return apiClient.get(
    withQuery("/bookings", {
      page: params.page || 1,
      per_page: params.perPage || params.per_page || 15,
      booking_type: params.bookingType || params.booking_type,
      status: params.status,
    }),
  );
}

export function getUpcomingBookings() {
  return apiClient.get("/bookings/upcoming");
}

export function getPastBookings() {
  return apiClient.get("/bookings/past");
}

export function getBookingDetails(bookingId) {
  return apiClient.get(`/bookings/${bookingId}`);
}

export function getBookingByReference(reference) {
  return apiClient.get(`/bookings/ref/${reference}`);
}

export function getExtensionSummary(bookingId, newCheckOutDate) {
  return apiClient.get(
    withQuery(`/bookings/${bookingId}/extension-summary`, {
      new_check_out_date: newCheckOutDate,
    }),
  );
}

export function extendBooking(bookingId, data = {}) {
  return apiClient.post(`/bookings/${bookingId}/extend`, {
    new_check_out_date: data.newCheckOutDate || data.new_check_out_date,
    agree_to_policies: data.agreeToPolicies ?? data.agree_to_policies ?? true,
  });
}

export function cancelBooking(bookingId, reason) {
  return apiClient.post(`/bookings/${bookingId}/cancel`, { reason });
}

export function initiatePayment(bookingId, paymentMethod = "paystack") {
  return apiClient.post(`/bookings/${bookingId}/initiate-payment`, {
    payment_method: paymentMethod,
  });
}

export function verifyPayment(reference) {
  return apiClient.post("/payments/verify", { reference });
}

export function getInvoice(bookingId) {
  return apiClient.get(`/bookings/${bookingId}/invoice`);
}

export function submitReview(bookingId, { rating, comment }) {
  return apiClient.post(`/bookings/${bookingId}/review`, {
    rating,
    comment,
  });
}
