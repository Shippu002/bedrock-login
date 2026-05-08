import listingPrimary from "../assets/listing-primary.png";
import listingSecondary from "../assets/listing-secondary.png";

const sectionResidences = [
  { id: "opebi", name: "Opebi Residence" },
  { id: "opebi", name: "Opebi II Residence" },
  { id: "oduduwa", name: "Oduduwa Residence" },
  { id: "bateye", name: "Bateye's Residence" },
  { id: "community", name: "Community's Residence" },
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

function getBedroomCount(title) {
  const match = title.match(/(\d+)\s*Bedroom/i);
  return match ? Number(match[1]) : 1;
}

function makeItem(sectionIndex, itemIndex) {
  const title = titles[itemIndex % titles.length];
  const sectionResidence = sectionResidences[sectionIndex];

  return {
    id: `${sectionIndex + 1}-${itemIndex + 1}`,
    title,
    residenceId: sectionResidence.id,
    residenceName: sectionResidence.name,
    location: locations[itemIndex % locations.length],
    guests: 8,
    rooms: getBedroomCount(title) + 1,
    cars: 2,
    wifi: true,
    rating: 4.8,
    price: 200000 + itemIndex * 25000,
    image: itemIndex === 0 ? listingPrimary : listingSecondary,
    available: itemIndex % 3 !== 1,
  };
}

export const listingSections = sectionResidences.map(({ id, name }, sectionIndex) => ({
  id: `section-${sectionIndex + 1}`,
  residenceId: id,
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
  const title = titles[itemIndex % titles.length];

  return {
    id: `${residenceId}-${sectionIndex + 1}-${itemIndex + 1}`,
    title,
    residenceId,
    residenceName,
    location: "Oduduwa, Ikeja GRA",
    guests: 8,
    rooms: getBedroomCount(title) + 1,
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
      residenceId: id,
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
