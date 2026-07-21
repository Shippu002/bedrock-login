import { apiClient, getPaymentCallbackUrl, withQuery } from "./client";

export function createBooking(data = {}) {
  return apiClient.post("/bookings", {
    apartment_id: data.apartmentId || data.apartment_id,
    check_in: data.checkIn || data.check_in,
    check_out: data.checkOut || data.check_out,
    guests: data.guests,
    guest_name: data.guestName || data.guest_name || "",
    guest_phone:
      data.guestPhone ||
      data.guest_phone ||
      data.guestPhoneNumber ||
      data.guest_phone_number ||
      "",
    guest_phone_number:
      data.guestPhone ||
      data.guest_phone ||
      data.guestPhoneNumber ||
      data.guest_phone_number ||
      "",
    special_requests: data.specialRequests || data.special_requests || "",
    coupon_code: data.couponCode || data.coupon_code || null,
    use_rock_points: Boolean(data.useRockPoints || data.use_rock_points),
    agree_to_policies: data.agreeToPolicies ?? data.agree_to_policies ?? false,
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
    agree_to_policies: data.agreeToPolicies ?? data.agree_to_policies ?? false,
  });
}

export function cancelBooking(bookingId, reason) {
  const cancellationReason = reason || "Cancelled by guest";

  return apiClient.post(`/bookings/${bookingId}/cancel`, {
    reason: cancellationReason,
    cancellation_reason: cancellationReason,
  });
}

export function initiatePayment(bookingId, paymentMethod = "paystack") {
  const callbackUrl = getPaymentCallbackUrl();

  return apiClient.post(`/bookings/${bookingId}/initiate-payment`, {
    payment_method: paymentMethod,
    ...(callbackUrl ? { callback_url: callbackUrl } : {}),
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
