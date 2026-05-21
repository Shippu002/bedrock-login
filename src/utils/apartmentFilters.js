export const defaultApartmentFilters = {
  residenceId: "",
  apartmentTitle: "",
  checkIn: "",
  checkOut: "",
  guests: 0,
};

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getBedroomCount(value) {
  const normalizedValue = normalize(value);
  const numericMatch = normalizedValue.match(/(\d+)\s*(bed|bedroom)/);

  if (numericMatch) return Number(numericMatch[1]);

  const wordToNumber = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
  };
  const wordMatch = normalizedValue.match(
    /\b(one|two|three|four|five|six)\s*(bed|bedroom)\b/,
  );

  return wordMatch ? wordToNumber[wordMatch[1]] : null;
}

function matchesApartmentTitle(item, apartmentTitle) {
  if (!apartmentTitle) return true;

  const selectedBedrooms = getBedroomCount(apartmentTitle);
  const itemBedrooms =
    Number(item.bedrooms || item.bedroomCount || 0) ||
    getBedroomCount(item.title) ||
    getBedroomCount(item.type);

  if (selectedBedrooms) {
    return itemBedrooms === selectedBedrooms;
  }

  return normalize(item.title).includes(normalize(apartmentTitle));
}

function matchesDates(item, filters) {
  if (!filters.checkIn && !filters.checkOut) return true;

  return item.available !== false;
}

export function apartmentMatchesFilters(item, filters = defaultApartmentFilters) {
  if (filters.residenceId && item.residenceId !== filters.residenceId) {
    return false;
  }

  if (!matchesApartmentTitle(item, filters.apartmentTitle)) {
    return false;
  }

  if (filters.guests > 0 && item.guests < filters.guests) {
    return false;
  }

  return matchesDates(item, filters);
}

export function filterListingSections(
  sections,
  filters = defaultApartmentFilters,
) {
  return sections
    .filter((section) => {
      if (!filters.residenceId) return true;
      return section.residenceId === filters.residenceId;
    })
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        apartmentMatchesFilters(item, filters),
      ),
    }))
    .filter((section) => section.items.length > 0);
}

export function hasActiveApartmentFilters(filters = defaultApartmentFilters) {
  return Boolean(
    filters.residenceId ||
      filters.apartmentTitle ||
      filters.checkIn ||
      filters.checkOut ||
      filters.guests > 0,
  );
}
