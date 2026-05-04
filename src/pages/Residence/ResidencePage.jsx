import ListingSection from "../../components/ListingSection";
import { getResidencePage } from "../../data/listings";
import "./ResidencePage.css";

function ResidencePage({ residenceId, onApartmentSelect }) {
  const residence = getResidencePage(residenceId);

  return (
    <section className="residence-page">
      <h1 className="residence-page__title">{residence.title}</h1>

      <div className="residence-page__sections">
        {residence.sections.map((section) => (
          <ListingSection
            key={section.id}
            section={section}
            onApartmentSelect={onApartmentSelect}
          />
        ))}
      </div>
    </section>
  );
}

export default ResidencePage;
