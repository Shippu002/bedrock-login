export const residenceOptions = [
  {
    id: "opebi",
    title: "Opebi's Apartments",
    location: "Ikeja GRA Lagos Nigeria",
    image: "",
    apartments: [
      "1 Bedroom Apartment",
      "2 Bedroom Apartment",
      "3 Bedroom Apartment",
      "Studio Apartment",
    ],
  },
  {
    id: "oduduwa",
    title: "Oduduwa's Apartments",
    location: "Ikeja GRA Lagos Nigeria",
    image: "",
    apartments: [
      "2 Bedroom Deluxe",
      "3 Bedroom Family Apartment",
      "4 Bedroom Duplex",
      "Penthouse Suite",
    ],
  },
  {
    id: "bateye",
    title: "Bateye's Apartments",
    location: "Ikeja GRA Lagos Nigeria",
    image: "",
    apartments: [
      "Single Room Apartment",
      "Studio Apartment",
      "1 Bedroom Apartment",
      "2 Bedroom Apartment",
    ],
  },
  {
    id: "community",
    title: "Community Apartments",
    location: "Ikeja GRA Lagos Nigeria",
    image: "",
    apartments: [
      "Shared Apartment",
      "1 Bedroom Apartment",
      "2 Bedroom Apartment",
      "Serviced Studio",
    ],
  },
];

export const listingResidenceSections = [
  { id: "opebi", name: "Opebi Residence" },
  { id: "opebi", name: "Opebi II Residence" },
  { id: "oduduwa", name: "Oduduwa Residence" },
  { id: "bateye", name: "Bateye's Residence" },
  { id: "community", name: "Community's Residence" },
];

export const residencePageTitles = Object.fromEntries(
  residenceOptions.map((item) => [
    item.id,
    `${item.title.replace("Apartments", "Residences")}`,
  ]),
);

export function getResidenceById(residenceId) {
  return residenceOptions.find((item) => item.id === residenceId) || null;
}

export function getShortResidenceLabel(title) {
  return String(title)
    .replace(/'s Apartments/i, "")
    .replace(/ Apartments/i, "")
    .replace(/Community/i, "Community");
}

export function getResidenceFilterLabel(item) {
  const residenceName = String(item.title)
    .replace(/'s Apartments/i, " Residence")
    .replace(/ Apartments/i, " Residence");
  const shortLocation = String(item.location).replace(/ Lagos Nigeria/i, "");

  return `${residenceName} ${shortLocation}`;
}
