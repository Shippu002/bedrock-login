import { apiClient } from "./client";

export function getFavorites() {
  return apiClient.get("/favorites");
}

export function toggleFavorite(apartmentId) {
  return apiClient.post(`/favorites/${apartmentId}/toggle`);
}
