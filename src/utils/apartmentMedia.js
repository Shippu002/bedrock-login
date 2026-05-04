import apartOne from "../assets/apart-1.jpg";
import apartTwo from "../assets/apart-2.jpg";
import apartThree from "../assets/apart-3.jpg";
import apartFour from "../assets/apart-4.jpg";
import apartFive from "../assets/apart-5.jpg";
import apartSix from "../assets/apart-6.jpg";
import apartSeven from "../assets/apart-7.jpg";

const apartmentMediaPool = [
  apartOne,
  apartTwo,
  apartThree,
  apartFour,
  apartFive,
  apartSix,
  apartSeven,
];

function getTitleSeed(title) {
  const normalizedTitle = String(title || "").toLowerCase();

  if (normalizedTitle.includes("3 bedroom")) return 3;
  if (normalizedTitle.includes("2 bedroom")) return 2;
  if (normalizedTitle.includes("1 bedroom")) return 1;

  return 0;
}

function getIdSeed(id) {
  const digits = String(id || "").replace(/\D/g, "");

  if (!digits) return 0;

  return Number(digits.slice(-1)) % apartmentMediaPool.length;
}

export function decorateApartmentWithMedia(apartment) {
  if (!apartment) return null;

  if (Array.isArray(apartment.galleryImages) && apartment.galleryImages.length) {
    return apartment;
  }

  const startIndex =
    (getTitleSeed(apartment.title) + getIdSeed(apartment.id)) %
    apartmentMediaPool.length;

  const galleryImages = Array.from({ length: 5 }, (_, index) => {
    return apartmentMediaPool[
      (startIndex + index) % apartmentMediaPool.length
    ];
  });

  return {
    ...apartment,
    galleryImages,
    previewImage: galleryImages[0],
    paymentImage: galleryImages[1] || galleryImages[0],
    statusImage: galleryImages[2] || galleryImages[0],
  };
}
