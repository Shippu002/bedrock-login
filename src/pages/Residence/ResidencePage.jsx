import { FiChevronLeft, FiMapPin, FiStar, FiUsers } from "react-icons/fi";
import AppImage from "../../components/AppImage";
import ListingSection from "../../components/ListingSection";
import { getResidencePage } from "../../data/listings";
import { filterListingSections } from "../../utils/apartmentFilters";
import "./ResidencePage.css";

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
      <AppImage src={item.image} alt="" />

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

function ResidencePage({ residenceId, filters, onBack, onApartmentSelect }) {
  const residence = getResidencePage(residenceId);
  const selectedApartmentTitle = String(filters?.apartmentTitle || "").trim();
  const pageTitle = selectedApartmentTitle
    ? `${selectedApartmentTitle} in ${residence.title}`
    : residence.title;
  const filteredSections = filterListingSections(residence.sections, {
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
          <p>{residence.title}</p>
        </div>
      </div>

      <h1 className="residence-page__title">{pageTitle}</h1>

      <div className="residence-page__sections">
        {filteredSections.length > 0 ? (
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
            <p>Try changing the date, apartment type, or number of guests.</p>
          </div>
        )}
      </div>

      <div className="residence-mobile-list">
        {mobileApartments.length > 0 ? (
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
            <p>Try changing the date, apartment type, or number of guests.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default ResidencePage;
