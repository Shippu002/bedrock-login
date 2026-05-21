export function decorateApartmentWithMedia(apartment) {
  if (!apartment) return null;

  const galleryImages = [
    ...(Array.isArray(apartment.galleryImages) ? apartment.galleryImages : []),
    apartment.image,
    apartment.previewImage,
    apartment.paymentImage,
    apartment.statusImage,
  ].filter(Boolean);
  const uniqueGalleryImages = [...new Set(galleryImages)];
  const primaryImage = uniqueGalleryImages[0] || "";

  return {
    ...apartment,
    galleryImages: uniqueGalleryImages,
    previewImage: apartment.previewImage || primaryImage,
    paymentImage: apartment.paymentImage || uniqueGalleryImages[1] || primaryImage,
    statusImage: apartment.statusImage || uniqueGalleryImages[2] || primaryImage,
  };
}
