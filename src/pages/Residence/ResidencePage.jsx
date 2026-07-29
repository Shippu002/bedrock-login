import { FiChevronLeft, FiMapPin, FiStar, FiUsers } from "react-icons/fi";
import AppImage from "../../components/AppImage";
import BrandLoader from "../../components/BrandLoader";
import ListingSection from "../../components/ListingSection";
import { filterListingSections } from "../../utils/apartmentFilters";
import "./ResidencePage.css";

const fallbackResidenceTitles = {
  opebi: "Opebi Residence",
  oduduwa: "Oduduwa Residence",
  bateye: "Bateye",
  community: "Community Residence",
  "obeds-court": "Obed's Court",
  "obeds-court-ikoyi": "Obed's Court",
  "patricks-court": "Patrick's Court",
  "patricks-court-ikoyi": "Patrick's Court",
  "ikate-residence-lekki": "Ikate Residence",
};
const residenceDisplayNames = [
  { key: "bateye", label: "Bateye" },
  { key: "opebi", label: "Opebi Residence" },
  { key: "community", label: "Community Residence" },
  { key: "oduduwa", label: "Oduduwa Residence" },
  { key: "obeds-court", label: "Obed's Court" },
  { key: "patricks-court", label: "Patrick's Court" },
  { key: "ikate", label: "Ikate Residence" },
];

function slugifyResidenceLabel(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getResidenceDisplayName(residenceId, fallbackTitle = "") {
  const lookupValue = slugifyResidenceLabel(`${residenceId} ${fallbackTitle}`);
  const knownResidence = residenceDisplayNames.find((item) =>
    lookupValue.includes(item.key),
  );

  return knownResidence?.label || fallbackTitle || "Residences";
}

function formatCurrency(value) {
  return `NGN${Number(value || 0).toLocaleString()}`;
}

function ResidenceMobileRow({ item, sectionTitle, onApartmentSelect }) {
  return (
    <button
      type="button"
      className="residence-mobile-row"
      onClick={() => onApartmentSelect?.(item)}
    >
      <AppImage
        src={item.image}
        alt={item.title}
        className="residence-mobile-row__image"
      />

      <span className="residence-mobile-row__body">
        <span className="residence-mobile-row__eyebrow">{sectionTitle}</span>
        <strong>{item.title}</strong>

        <span className="residence-mobile-row__meta">
          <span>
            <FiMapPin />
            {item.location}
          </span>
          <span>
            <FiStar />
            {item.rating}
          </span>
        </span>

        <span className="residence-mobile-row__foot">
          <span>
            <FiUsers />
            {item.guests} guests
          </span>
          <b>{formatCurrency(item.price)}</b>
        </span>
      </span>
    </button>
  );
}

function ResidencePage({
  residenceId,
  filters,
  sections,
  isLoading = false,
  loadError = "",
  onBack,
  onApartmentSelect,
}) {
  const backendSections = Array.isArray(sections)
    ? sections.filter((section) => section.residenceId === residenceId)
    : [];
  const sourceSections = backendSections;
  const selectedApartmentTitle = String(filters?.apartmentTitle || "").trim();
  const residenceTitle = getResidenceDisplayName(
    residenceId,
    backendSections[0]?.title || fallbackResidenceTitles[residenceId],
  );
  const pageTitle = selectedApartmentTitle
    ? `${selectedApartmentTitle} in ${residenceTitle}`
    : residenceTitle;
  const filteredSections = filterListingSections(sourceSections, {
    ...filters,
    residenceId,
  });
  const mobileApartments = filteredSections.flatMap((section) =>
    section.items.map((item) => ({
      ...item,
      sectionTitle: section.title.replace(/\s*>$/, ""),
    })),
  );

  return (
    <section className="residence-page">
      <button
        type="button"
        className="residence-page__back"
        onClick={onBack}
      >
        <FiChevronLeft />
        <span>Back to all residences</span>
      </button>

      <div className="residence-mobile-head">
        <button
          type="button"
          className="residence-mobile-head__back"
          onClick={onBack}
          aria-label="Go back"
        >
          <FiChevronLeft />
          <span>Back</span>
        </button>

        <div>
          <p className="residence-mobile-head__title">
            {selectedApartmentTitle || "Apartments"}
          </p>
          <p>{residenceTitle}</p>
        </div>
      </div>

      <h1 className="residence-page__title">{pageTitle}</h1>

      <div className="residence-page__sections">
        {isLoading ? (
          <div className="residence-page__empty">
            <BrandLoader
              title="Loading apartments"
              message="Getting the latest apartments for this residence."
            />
          </div>
        ) : filteredSections.length > 0 ? (
          filteredSections.map((section) => (
            <ListingSection
              key={section.id}
              section={section}
              onApartmentSelect={onApartmentSelect}
            />
          ))
        ) : (
          <div className="residence-page__empty">
            <h2>No apartments match your search</h2>
            <p>
              {loadError ||
                "Try changing the date, apartment type, or number of guests."}
            </p>
          </div>
        )}
      </div>

      <div className="residence-mobile-list">
        {isLoading ? (
          <div className="residence-mobile-empty">
            <BrandLoader
              title="Loading apartments"
              message="Getting the latest apartments for this residence."
            />
          </div>
        ) : mobileApartments.length > 0 ? (
          mobileApartments.map((item) => (
            <ResidenceMobileRow
              item={item}
              sectionTitle={item.sectionTitle}
              onApartmentSelect={onApartmentSelect}
              key={item.id}
            />
          ))
        ) : (
          <div className="residence-mobile-empty">
            <h2>No apartments match your search</h2>
            <p>
              {loadError ||
                "Try changing the date, apartment type, or number of guests."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default ResidencePage;
