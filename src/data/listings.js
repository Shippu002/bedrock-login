import listingPrimary from "../assets/listing-primary.png";
import listingSecondary from "../assets/listing-secondary.png";

const sectionNames = [
  "Opebi Residence",
  "Opebi II Residence",
  "Oduduwa Residence",
  "Bateye's Residence",
  "Community's Residence",
];

const titles = [
  "1 Bedroom apartment",
  "1 Bedroom apartment",
  "2 Bedroom apartment",
  "3 Bedroom apartment",
  "3 Bedroom apartment",
];

const locations = [
  "Oduduwa, Ikeja",
  "Allen, Ikeja",
  "Alausa, Ikeja",
  "Yaba, Lagos",
  "Victoria Island, Lagos",
];

function makeItem(sectionIndex, itemIndex) {
  return {
    id: `${sectionIndex + 1}-${itemIndex + 1}`,
    title: titles[itemIndex % titles.length],
    residenceName: sectionNames[sectionIndex],
    location: locations[itemIndex % locations.length],
    guests: 8,
    rooms: 4,
    cars: 2,
    wifi: true,
    rating: 4.8,
    price: 200000 + itemIndex * 25000,
    image: itemIndex === 0 ? listingPrimary : listingSecondary,
    available: itemIndex % 3 !== 1,
  };
}

export const listingSections = sectionNames.map((name, sectionIndex) => ({
  id: `section-${sectionIndex + 1}`,
  title: `${name} · Ikeja`,
  items: Array.from({ length: 5 }, (_, itemIndex) =>
    makeItem(sectionIndex, itemIndex),
  ),
}));

const residencePageTitles = {
  opebi: "Opebi's Residences",
  oduduwa: "Oduduwa's Residences",
  bateye: "Bateye's Residences",
  community: "Community's Residences",
};

const residenceBedroomSections = [
  "1 Bedroom apartment",
  "2 Bedroom apartment",
  "3 Bedroom apartment",
];

function makeResidenceItem(residenceId, sectionIndex, itemIndex) {
  const residenceName = residencePageTitles[residenceId].replace(
    "Residences",
    "Residence",
  );

  return {
    id: `${residenceId}-${sectionIndex + 1}-${itemIndex + 1}`,
    title: titles[itemIndex % titles.length],
    residenceName,
    location: "Oduduwa, Ikeja GRA",
    guests: 8,
    rooms: 4,
    cars: 2,
    wifi: true,
    rating: 4.8,
    price: 200000,
    image: itemIndex === 0 ? listingPrimary : listingSecondary,
    available: itemIndex === 0,
  };
}

export const residencePages = Object.entries(residencePageTitles).map(
  ([id, title]) => ({
    id,
    title,
    sections: residenceBedroomSections.map((sectionTitle, sectionIndex) => ({
      id: `${id}-${sectionIndex + 1}`,
      title: `${sectionTitle} >`,
      items: Array.from({ length: 5 }, (_, itemIndex) =>
        makeResidenceItem(id, sectionIndex, itemIndex),
      ),
    })),
  }),
);

export function getResidencePage(residenceId) {
  return (
    residencePages.find((residence) => residence.id === residenceId) ||
    residencePages[0]
  );
}
