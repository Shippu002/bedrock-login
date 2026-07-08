import { FiChevronLeft, FiMapPin, FiStar, FiUsers } from "react-icons/fi";
import AppImage from "../../components/AppImage";
import ListingSection from "../../components/ListingSection";
import { filterListingSections } from "../../utils/apartmentFilters";
import "./ResidencePage.css";

const fallbackResidenceTitles = {
  opebi: "Opebi Residence",
  "opebi-i": "Opebi I Residence",
  "opebi-ii": "Opebi II Residence",
  oduduwa: "Oduduwa Residence",
  bateye: "Bateye Residence",
  community: "Community Residence",
};

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
  const residenceTitle =
    backendSections[0]?.title ||
    fallbackResidenceTitles[residenceId] ||
    "Residences";
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
          <h1>{selectedApartmentTitle || "Apartments"}</h1>
          <p>{residenceTitle}</p>
        </div>
      </div>

      <h1 className="residence-page__title">{pageTitle}</h1>

      <div className="residence-page__sections">
        {isLoading ? (
          <div className="residence-page__empty">
            <h2>Loading apartments</h2>
            <p>Getting the latest apartments for this residence.</p>
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
            <h2>Loading apartments</h2>
            <p>Getting the latest apartments for this residence.</p>
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
