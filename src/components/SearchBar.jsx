import { useState } from "react";
import {
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiMinus,
  FiPlus,
  FiSearch,
} from "react-icons/fi";
import opebiImage from "../assets/opebi.jpg";
import oduduwaImage from "../assets/oduduwa.jpg";
import bateyeImage from "../assets/bateye.png";
import communityImage from "../assets/community.jpg";
import "../styles/searchbar.css";

const residenceOptions = [
  {
    id: "opebi",
    title: "Opebi's Apartments",
    location: "Ikeja GRA Lagos Nigeria",
    image: opebiImage,
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
    image: oduduwaImage,
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
    image: bateyeImage,
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
    image: communityImage,
    apartments: [
      "Shared Apartment",
      "1 Bedroom Apartment",
      "2 Bedroom Apartment",
      "Serviced Studio",
    ],
  },
];

const augustDates = [
  ["26", "27", "28", "29", "30", "1", "2"],
  ["3", "4", "5", "6", "7", "8", "9"],
  ["10", "11", "12", "13", "14", "15", "16"],
  ["17", "18", "19", "20", "21", "22", "23"],
  ["24", "25", "26", "27", "28", "29", "30"],
  ["31", "1", "2", "3", "4", "5", "6"],
];

const guestTypes = [
  { id: "adults", label: "Adults", hint: "Ages 13 or above" },
  { id: "children", label: "Children", hint: "Ages 2 -12" },
  { id: "infants", label: "Infants", hint: "Under 2 years old" },
  { id: "pets", label: "Pets", hint: "Under 2 years old" },
];

function CalendarMonth({ mutedStart = false }) {
  return (
    <div className="search-calendar">
      <div className="search-calendar__header">
        <button type="button" aria-label="Previous month">
          <FiChevronLeft />
        </button>
        <strong>August 2023</strong>
        <button type="button" aria-label="Next month">
          <FiChevronRight />
        </button>
      </div>

      <div className="search-calendar__weekdays">
        {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>

      <div className="search-calendar__days">
        {augustDates.flat().map((day, index) => {
          const isMuted =
            (mutedStart && index < 5) || (!mutedStart && index > 34);
          const isRange = ["13", "14", "15", "16", "17", "18", "19", "20", "21"].includes(day);
          const isSelected = day === "12" || day === "22";

          return (
            <button
              type="button"
              className={`${isMuted ? "is-muted" : ""} ${
                isRange ? "is-range" : ""
              } ${isSelected ? "is-selected" : ""}`}
              key={`${day}-${index}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SearchBar({ onResidenceSelect }) {
  const [openPanel, setOpenPanel] = useState(null);
  const [selectedResidenceId, setSelectedResidenceId] = useState("opebi");
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [guestCounts, setGuestCounts] = useState({
    adults: 0,
    children: 0,
    infants: 0,
    pets: 0,
  });

  const totalGuests = guestCounts.adults + guestCounts.children;
  const selectedResidence = residenceOptions.find(
    (item) => item.id === selectedResidenceId,
  ) || residenceOptions[0];

  function handleSubmit(event) {
    event.preventDefault();
    setOpenPanel(null);
  }

  function togglePanel(panel) {
    setOpenPanel((currentPanel) => (currentPanel === panel ? null : panel));
  }

  function updateGuestCount(id, direction) {
    setGuestCounts((currentCounts) => ({
      ...currentCounts,
      [id]: Math.max(0, currentCounts[id] + direction),
    }));
  }

  function handleResidenceClick(residenceId) {
    setSelectedResidenceId(residenceId);
    setSelectedApartment(null);
    setOpenPanel(null);
    onResidenceSelect?.(residenceId);
  }

  function handleApartmentClick(apartment) {
    setSelectedApartment(apartment);
    setOpenPanel(null);
    onResidenceSelect?.(selectedResidence.id);
  }

  return (
    <section className="search-bar-section">
      <form className="search-bar" onSubmit={handleSubmit}>
        <div className="search-bar__field search-bar__field--residence">
          <button
            type="button"
            className="search-bar__field-button"
            onClick={() => togglePanel("residences")}
            aria-expanded={openPanel === "residences"}
          >
            <span className="search-bar__label">Residences</span>
            <span className="search-bar__value">Search by Residence</span>
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
            <span className="search-bar__value">Add date</span>
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
            <span className="search-bar__label">Number of guest</span>
            <span className="search-bar__value">
              {totalGuests > 0 ? `${totalGuests} guest` : "Add guest"}
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
                    <img src={item.image} alt="" />
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

              <div className="search-popover__types">
                {(selectedResidence?.apartments || []).map((item) => (
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
                    <span>Find the best template for your business</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {openPanel === "dates" && (
          <div className="search-popover search-popover--dates">
            <CalendarMonth mutedStart />
            <CalendarMonth />
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
