import { apiClient, withQuery } from "./client";

export function getResidences() {
  return apiClient.get("/apartments/residences", { skipAuth: true });
}

export function getApartments(params = {}) {
  return apiClient.get(
    withQuery("/apartments", {
      page: params.page || 1,
      per_page: params.perPage || params.per_page || 15,
      residence_id: params.residenceId || params.residence_id,
      category_id: params.categoryId || params.category_id,
      check_in: params.checkIn || params.check_in,
      check_out: params.checkOut || params.check_out,
      guests: Number(params.guests || 0) > 0 ? params.guests : undefined,
      search: params.search,
      min_price: params.minPrice || params.min_price,
      max_price: params.maxPrice || params.max_price,
      amenities: params.amenities,
      sort_by: params.sortBy || params.sort_by,
    }),
    { skipAuth: true },
  );
}

export function getPopularApartments(limit = 10) {
  return apiClient.get(
    withQuery("/apartments/popular", { limit }),
    { skipAuth: true },
  );
}

export function getBedroomCategories() {
  return apiClient.get("/apartments/categories", { skipAuth: true });
}

export function getApartmentsByResidence(residenceId, params = {}) {
  return apiClient.get(
    withQuery(`/apartments/residence/${residenceId}`, {
      limit: params.limit || 10,
      page: params.page,
      per_page: params.perPage || params.per_page,
    }),
    { skipAuth: true },
  );
}

export function getApartmentDetails(apartmentId) {
  return apiClient.get(`/apartments/${apartmentId}`, { skipAuth: true });
}

export function getApartmentBySlug(slug) {
  return apiClient.get(`/apartments/slug/${slug}`, { skipAuth: true });
}

export function checkAvailability({ apartmentId, apartment_id, checkIn, checkOut }) {
  return apiClient.post(
    "/apartments/check-availability",
    {
      apartment_id: apartmentId || apartment_id,
      check_in: checkIn,
      check_out: checkOut,
    },
    { skipAuth: true },
  );
}

export function calculatePricing({
  apartmentId,
  apartment_id,
  checkIn,
  checkOut,
  guests,
  couponCode,
}) {
  return apiClient.post(
    "/apartments/calculate-pricing",
    {
      apartment_id: apartmentId || apartment_id,
      check_in: checkIn,
      check_out: checkOut,
      guests,
      coupon_code: couponCode || null,
    },
  );
}

export function getApartmentReviews(apartmentId, params = {}) {
  return apiClient.get(
    withQuery(`/apartments/${apartmentId}/reviews`, {
      page: params.page || 1,
      per_page: params.perPage || params.per_page || 10,
    }),
    { skipAuth: true },
  );
}
