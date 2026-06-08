import { useState } from "react";
import {
  FiCalendar,
  FiChevronDown,
  FiHome,
  FiMinus,
  FiPlus,
  FiSearch,
  FiSliders,
} from "react-icons/fi";
import AppImage from "./AppImage";
import { useDialogFocus } from "../hooks/useDialogFocus";
import "../styles/searchbar.css";

const guestTypes = [
  { id: "adults", label: "Adults", hint: "Ages 13 or above" },
  { id: "children", label: "Children", hint: "Ages 2 -12" },
  { id: "infants", label: "Infants", hint: "Under 2 years old" },
];

const initialGuestCounts = guestTypes.reduce(
  (counts, guestType) => ({
    ...counts,
    [guestType.id]: 0,
  }),
  {},
);

function formatShortDate(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function getShortResidenceLabel(title) {
  return String(title || "Residence")
    .replace(/\s*Residence.*/i, "")
    .replace(/'s Apartments/i, "")
    .replace(/ Apartments/i, "");
}

function getResidenceFilterLabel(item) {
  return [item.title, item.location].filter(Boolean).join(" ");
}

function ResidenceThumbnail({ src, alt, className = "" }) {
  const [hasImage, setHasImage] = useState(Boolean(src));

  if (!hasImage) {
    return (
      <span
        className={`residence-thumb-placeholder ${className}`.trim()}
        role="img"
        aria-label={alt}
      >
        <FiHome aria-hidden="true" />
      </span>
    );
  }

  return (
    <AppImage
      className={className}
      src={src}
      fallbackSrc=""
      alt={alt}
      onError={() => setHasImage(false)}
    />
  );
}

function SearchBar({
  onSearch,
  onResidenceSelect,
  residences = [],
  apartmentCategories = [],
  shopCategories = [],
  isLoading = false,
}) {
  const residenceOptions = residences;
  const [openPanel, setOpenPanel] = useState(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedResidenceId, setSelectedResidenceId] = useState("");
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [dateRange, setDateRange] = useState({
    checkIn: "",
    checkOut: "",
  });
  const [guestCounts, setGuestCounts] = useState(initialGuestCounts);
  const [searchQuery, setSearchQuery] = useState("");

  const totalGuests = guestTypes.reduce(
    (total, guestType) => total + (Number(guestCounts[guestType.id]) || 0),
    0,
  );
  const selectedResidence =
    residenceOptions.find((item) => item.id === selectedResidenceId) || null;
  const selectedApartmentOptions =
    selectedResidence?.apartments?.length > 0
      ? selectedResidence.apartments
      : apartmentCategories
          .filter((category) => category.bedrooms)
          .map((category) => `${category.bedrooms} Bedroom Apartment`);
  const residenceLabel =
    selectedApartment || selectedResidence?.title || "Search by Residence";
  const dateLabel =
    dateRange.checkIn && dateRange.checkOut
      ? `${formatShortDate(dateRange.checkIn)} - ${formatShortDate(
          dateRange.checkOut,
        )}`
      : dateRange.checkIn
        ? formatShortDate(dateRange.checkIn)
        : "Add date";
  const mobileFilterRef = useDialogFocus(isMobileFilterOpen, {
    onClose: closeMobileFilter,
  });
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const searchSuggestions = normalizedSearchQuery
    ? [
        ...residenceOptions.map((residence) => ({
          id: `residence-${residence.id}`,
          label: residence.title,
          meta: residence.location || "Residence",
          query: residence.title,
          icon: "residence",
        })),
        ...selectedApartmentOptions.map((apartment) => ({
          id: `apartment-${apartment}`,
          label: apartment,
          meta: selectedResidence?.title || "Apartment type",
          query: [selectedResidence?.title, apartment].filter(Boolean).join(" "),
          icon: "apartment",
        })),
        ...shopCategories.map((category) => ({
          id: `shop-${category.id}`,
          label: category.title,
          meta: category.location || "Shop",
          query: category.title,
          icon: "shop",
        })),
      ]
        .filter((item) =>
          [item.label, item.meta, item.query]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearchQuery),
        )
        .slice(0, 6)
    : [];

  function buildSearchPayload(overrides = {}) {
    return {
      residenceId: selectedResidenceId,
      apartmentTitle: selectedApartment || "",
      checkIn: dateRange.checkIn,
      checkOut: dateRange.checkOut,
      guests: totalGuests,
      query: searchQuery.trim(),
      ...overrides,
    };
  }

  function handleSubmit(event) {
    event.preventDefault();
    setOpenPanel(null);
    onSearch?.(buildSearchPayload());
  }

  function handleSuggestionClick(suggestion) {
    setSearchQuery(suggestion.query);
    setOpenPanel(null);
    setIsMobileFilterOpen(false);
    onSearch?.(
      buildSearchPayload({
        query: suggestion.query,
      }),
    );
  }

  function togglePanel(panel) {
    setOpenPanel((currentPanel) => (currentPanel === panel ? null : panel));
  }

  function openMobileFilter() {
    setOpenPanel(null);
    setIsMobileFilterOpen(true);
  }

  function closeMobileFilter() {
    setIsMobileFilterOpen(false);
  }

  function updateGuestCount(id, direction) {
    setGuestCounts((currentCounts) => ({
      ...currentCounts,
      [id]: Math.max(0, (Number(currentCounts[id]) || 0) + direction),
    }));
  }

  function shouldOpenResidencePage() {
    return (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 910px)").matches
    );
  }

  function handleResidenceClick(residenceId) {
    setSearchQuery("");

    if (shouldOpenResidencePage() && onResidenceSelect) {
      setOpenPanel(null);
      onResidenceSelect(residenceId);
      return;
    }

    setSelectedResidenceId((currentResidenceId) =>
      currentResidenceId === residenceId ? "" : residenceId,
    );
    setSelectedApartment(null);
  }

  function handleMobileResidenceSelect(residenceId) {
    setSearchQuery("");
    setSelectedResidenceId((currentResidenceId) =>
      currentResidenceId === residenceId ? "" : residenceId,
    );
    setSelectedApartment(null);
  }

  function handleApartmentClick(apartment) {
    setSearchQuery("");
    setSelectedApartment(apartment);
    setOpenPanel(null);
  }

  function handleAllResidencesClick() {
    setSelectedResidenceId("");
    setSelectedApartment(null);
    setSearchQuery("");
    setOpenPanel(null);
    onSearch?.(
      buildSearchPayload({
        residenceId: "",
        apartmentTitle: "",
        query: "",
      }),
    );
  }

  function handleMobileFilterSearch() {
    setOpenPanel(null);
    setIsMobileFilterOpen(false);
    onSearch?.(buildSearchPayload());
  }

  function handleMobileFilterClear() {
    setSelectedResidenceId("");
    setSelectedApartment(null);
    setSearchQuery("");
    setDateRange({ checkIn: "", checkOut: "" });
    setGuestCounts(initialGuestCounts);
    onSearch?.(
      buildSearchPayload({
        residenceId: "",
        apartmentTitle: "",
        checkIn: "",
        checkOut: "",
        guests: 0,
        query: "",
      }),
    );
  }

  function updateDateRange(field, value) {
    setDateRange((currentRange) => {
      if (field === "checkIn") {
        return {
          checkIn: value,
          checkOut:
            currentRange.checkOut && currentRange.checkOut <= value
              ? ""
              : currentRange.checkOut,
        };
      }

      return {
        ...currentRange,
        checkOut: value,
      };
    });
  }

  return (
    <section className="search-bar-section">
      <form className="search-bar" onSubmit={handleSubmit}>
        <div className="search-bar-mobile">
          <div
            className="search-bar-mobile__search"
          >
            <button
              type="submit"
              className="search-bar-mobile__submit"
              aria-label="Search"
            >
              <FiSearch />
            </button>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onFocus={() => setOpenPanel(null)}
              placeholder="Search..."
              aria-label="Search residences, apartments, and shops"
            />
          </div>

          <button
            type="button"
            className="search-bar-mobile__filter"
            onClick={openMobileFilter}
            aria-label="Open filters"
          >
            <FiSliders />
          </button>
        </div>

        <div className="search-bar-mobile__chips" aria-label="Residence filters">
          <button
            type="button"
            className={!selectedResidenceId ? "is-active" : ""}
            onClick={handleAllResidencesClick}
          >
            <ResidenceThumbnail
              src={residenceOptions[0]?.image}
              alt="All residences"
            />
            <span>All</span>
          </button>

          {residenceOptions.map((item) => (
            <button
              type="button"
              className={selectedResidenceId === item.id ? "is-active" : ""}
              onClick={() => handleResidenceClick(item.id)}
              key={item.id}
            >
              <ResidenceThumbnail
                src={item.image}
                alt={`${item.title} residence`}
              />
              <span>{getShortResidenceLabel(item.title)}</span>
            </button>
            ))}
        </div>

        {isMobileFilterOpen && (
          <div
            className="mobile-filter"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-filter-title"
          >
            <button
              type="button"
              className="mobile-filter__backdrop"
              onClick={closeMobileFilter}
              aria-label="Close filters"
            />

            <div
              className="mobile-filter__sheet"
              ref={mobileFilterRef}
              tabIndex={-1}
            >
              <span className="mobile-filter__handle" aria-hidden="true" />
              <h2 id="mobile-filter-title">Filter by</h2>

              <div className="mobile-filter__group">
                <span className="mobile-filter__label">Select Location</span>
                <div className="mobile-filter__locations">
                  {isLoading && residenceOptions.length === 0 ? (
                    <div className="mobile-filter__empty">
                      Loading residences...
                    </div>
                  ) : residenceOptions.map((item) => (
                    <button
                      type="button"
                      className={
                        selectedResidenceId === item.id ? "is-active" : ""
                      }
                      onClick={() => handleMobileResidenceSelect(item.id)}
                      key={item.id}
                    >
                      <ResidenceThumbnail
                        src={item.image}
                        alt={`${item.title} residence`}
                      />
                      <span>{getResidenceFilterLabel(item)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="mobile-filter__field">
                <span>Check-in-Date</span>
                <div className="mobile-filter__date-input">
                  <FiCalendar />
                  <input
                    type="date"
                    value={dateRange.checkIn}
                    onChange={(event) =>
                      updateDateRange("checkIn", event.target.value)
                    }
                    aria-label="Check-in date"
                  />
                </div>
              </label>

              <label className="mobile-filter__field">
                <span>Check-out-Date</span>
                <div className="mobile-filter__date-input">
                  <FiCalendar />
                  <input
                    type="date"
                    min={dateRange.checkIn}
                    value={dateRange.checkOut}
                    onChange={(event) =>
                      updateDateRange("checkOut", event.target.value)
                    }
                    aria-label="Check-out date"
                  />
                </div>
              </label>

              <div className="mobile-filter__field">
                <span>Number of Guests</span>
                <div className="mobile-filter__guest-row">
                  <span>Add number of guest</span>
                  <div>
                    <button
                      type="button"
                      onClick={() => updateGuestCount("adults", -1)}
                      aria-label="Remove guest"
                    >
                      <FiMinus />
                    </button>
                    <strong>{totalGuests}</strong>
                    <button
                      type="button"
                      onClick={() => updateGuestCount("adults", 1)}
                      aria-label="Add guest"
                    >
                      <FiPlus />
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="mobile-filter__primary"
                onClick={handleMobileFilterSearch}
              >
                Search Apartments
              </button>

              <button
                type="button"
                className="mobile-filter__clear"
                onClick={handleMobileFilterClear}
              >
                Clear all
              </button>
            </div>
          </div>
        )}

        <div className="search-bar__field search-bar__field--residence">
          <div className="search-bar__field-control">
            <span className="search-bar__label">Residences</span>
            <div className="search-bar__input-row">
              <input
                className="search-bar__text-input"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => setOpenPanel(null)}
                placeholder={residenceLabel}
                aria-label="Search residences, apartments, and shops"
              />
              <button
                type="button"
                className="search-bar__dropdown-button"
                onClick={() => togglePanel("residences")}
                aria-label="Open residence list"
                aria-expanded={openPanel === "residences"}
              >
                <FiChevronDown />
              </button>
            </div>
          </div>
        </div>

        <div className="search-bar__divider" />

        <div className="search-bar__field search-bar__field--date">
          <button
            type="button"
            className="search-bar__field-button"
            onClick={() => togglePanel("dates")}
            aria-expanded={openPanel === "dates"}
          >
            <span className="search-bar__label">Start date - End date</span>
            <span className="search-bar__value">{dateLabel}</span>
            <FiChevronDown />
          </button>
        </div>

        <div className="search-bar__divider" />

        <div className="search-bar__field search-bar__field--guest">
          <button
            type="button"
            className="search-bar__field-button"
            onClick={() => togglePanel("guests")}
            aria-expanded={openPanel === "guests"}
          >
            <span className="search-bar__label">Number of guests</span>
            <span className="search-bar__value">
              {totalGuests > 0
                ? `${totalGuests} ${totalGuests === 1 ? "guest" : "guests"}`
                : "Add guests"}
            </span>
            <FiChevronDown />
          </button>
        </div>

        <button
          type="submit"
          className="search-bar__button"
          aria-label="Search"
        >
          <FiSearch />
        </button>

        {openPanel === "residences" && (
          <div className="search-popover search-popover--residences">
            <div className="search-popover__column">
              <h3>Residences</h3>

              <div className="search-popover__list">
                {residenceOptions.map((item) => (
                  <button
                    type="button"
                    className={`search-popover__item ${
                      selectedResidenceId === item.id
                        ? "search-popover__item--active"
                        : ""
                    }`}
                    onClick={() => handleResidenceClick(item.id)}
                    key={item.title}
                  >
                    <ResidenceThumbnail
                      src={item.image}
                      alt={`${item.title} residence`}
                    />
                    <span>
                      <strong>{item.title}</strong>
                      <em>{item.location}</em>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="search-popover__column search-popover__column--types">
              <h3>
                {selectedResidence
                  ? `Apartment at ${selectedResidence.title.replace(" Apartments", "")}`
                  : "Select a residence"}
              </h3>

              <p className="search-popover__hint">
                Choose an apartment type to continue
              </p>

              <div className="search-popover__types">
                {selectedApartmentOptions.map((item) => (
                  <button
                    type="button"
                    className={
                      selectedApartment === item
                        ? "search-popover__type--active"
                        : ""
                    }
                    onClick={() => handleApartmentClick(item)}
                    key={item}
                  >
                    <strong>{item}</strong>
                    <span>Find available stays in this residence</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {searchSuggestions.length > 0 && !openPanel && (
          <div className="search-suggestions" aria-label="Search suggestions">
            {searchSuggestions.map((suggestion) => (
              <button
                type="button"
                className="search-suggestions__item"
                onClick={() => handleSuggestionClick(suggestion)}
                key={suggestion.id}
              >
                <span className="search-suggestions__icon">
                  {suggestion.icon === "residence" ? <FiHome /> : <FiSearch />}
                </span>
                <span>
                  <strong>{suggestion.label}</strong>
                  <em>{suggestion.meta}</em>
                </span>
              </button>
            ))}
          </div>
        )}

        {openPanel === "dates" && (
          <div className="search-popover search-popover--dates">
            <label className="search-date-field">
              <span>Start date</span>
              <input
                type="date"
                value={dateRange.checkIn}
                onChange={(event) =>
                  updateDateRange("checkIn", event.target.value)
                }
              />
            </label>

            <label className="search-date-field">
              <span>End date</span>
              <input
                type="date"
                min={dateRange.checkIn}
                value={dateRange.checkOut}
                onChange={(event) =>
                  updateDateRange("checkOut", event.target.value)
                }
              />
            </label>

            <button
              type="button"
              className="search-popover__clear"
              onClick={() => setDateRange({ checkIn: "", checkOut: "" })}
            >
              Clear dates
            </button>
          </div>
        )}

        {openPanel === "guests" && (
          <div className="search-popover search-popover--guests">
            {guestTypes.map((guest) => (
              <div className="guest-row" key={guest.id}>
                <span>
                  <strong>{guest.label}</strong>
                  <em>{guest.hint}</em>
                </span>

                <div className="guest-counter">
                  <button
                    type="button"
                    onClick={() => updateGuestCount(guest.id, -1)}
                    aria-label={`Remove ${guest.label}`}
                  >
                    <FiMinus />
                  </button>
                  <strong>{guestCounts[guest.id]}</strong>
                  <button
                    type="button"
                    onClick={() => updateGuestCount(guest.id, 1)}
                    aria-label={`Add ${guest.label}`}
                  >
                    <FiPlus />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </form>
    </section>
  );
}

export default SearchBar;
