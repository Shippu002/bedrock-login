import { useState } from "react";
import {
  FiCalendar,
  FiChevronDown,
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
  { id: "pets", label: "Pets", hint: "Under 2 years old" },
];

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

function SearchBar({
  onSearch,
  onResidenceSelect,
  residences = [],
  apartmentCategories = [],
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
  const [guestCounts, setGuestCounts] = useState({
    adults: 0,
    children: 0,
    infants: 0,
    pets: 0,
  });

  const totalGuests = guestCounts.adults + guestCounts.children;
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

  function handleSubmit(event) {
    event.preventDefault();
    setOpenPanel(null);
    onSearch?.({
      residenceId: selectedResidenceId,
      apartmentTitle: selectedApartment || "",
      checkIn: dateRange.checkIn,
      checkOut: dateRange.checkOut,
      guests: totalGuests,
    });
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
      [id]: Math.max(0, currentCounts[id] + direction),
    }));
  }

  function shouldOpenResidencePage() {
    return (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 910px)").matches
    );
  }

  function handleResidenceClick(residenceId) {
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
    setSelectedResidenceId((currentResidenceId) =>
      currentResidenceId === residenceId ? "" : residenceId,
    );
    setSelectedApartment(null);
  }

  function handleApartmentClick(apartment) {
    setSelectedApartment(apartment);
    setOpenPanel(null);
  }

  function handleAllResidencesClick() {
    setSelectedResidenceId("");
    setSelectedApartment(null);
    setOpenPanel(null);
    onSearch?.({
      residenceId: "",
      apartmentTitle: "",
      checkIn: dateRange.checkIn,
      checkOut: dateRange.checkOut,
      guests: totalGuests,
    });
  }

  function handleMobileFilterSearch() {
    setOpenPanel(null);
    setIsMobileFilterOpen(false);
    onSearch?.({
      residenceId: selectedResidenceId,
      apartmentTitle: selectedApartment || "",
      checkIn: dateRange.checkIn,
      checkOut: dateRange.checkOut,
      guests: totalGuests,
    });
  }

  function handleMobileFilterClear() {
    setSelectedResidenceId("");
    setSelectedApartment(null);
    setDateRange({ checkIn: "", checkOut: "" });
    setGuestCounts({
      adults: 0,
      children: 0,
      infants: 0,
      pets: 0,
    });
    onSearch?.({
      residenceId: "",
      apartmentTitle: "",
      checkIn: "",
      checkOut: "",
      guests: 0,
    });
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
          <button
            type="button"
            className="search-bar-mobile__search"
            onClick={() => togglePanel("residences")}
          >
            <FiSearch />
            <span>Search...</span>
          </button>

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
            <AppImage src={residenceOptions[0]?.image} fallbackSrc="" alt="" />
            <span>All</span>
          </button>

          {residenceOptions.map((item) => (
            <button
              type="button"
              className={selectedResidenceId === item.id ? "is-active" : ""}
              onClick={() => handleResidenceClick(item.id)}
              key={item.id}
            >
              <AppImage src={item.image} fallbackSrc="" alt="" />
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
                      <AppImage src={item.image} fallbackSrc="" alt="" />
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
          <button
            type="button"
            className="search-bar__field-button"
            onClick={() => togglePanel("residences")}
            aria-expanded={openPanel === "residences"}
          >
            <span className="search-bar__label">Residences</span>
            <span className="search-bar__value">{residenceLabel}</span>
            <FiChevronDown />
          </button>
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
                    <AppImage src={item.image} fallbackSrc="" alt="" />
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
