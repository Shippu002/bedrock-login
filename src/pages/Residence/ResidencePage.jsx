import ListingSection from "../../components/ListingSection";
import { getResidencePage } from "../../data/listings";
import { filterListingSections } from "../../utils/apartmentFilters";
import "./ResidencePage.css";

function ResidencePage({ residenceId, filters, onApartmentSelect }) {
  const residence = getResidencePage(residenceId);
  const filteredSections = filterListingSections(residence.sections, {
    ...filters,
    residenceId,
  });

  return (
    <section className="residence-page">
      <h1 className="residence-page__title">{residence.title}</h1>

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
    </section>
  );
}

export default ResidencePage;
