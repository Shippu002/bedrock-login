import ListingCard from "./ListingCard";
import "../styles/listing-section.css";

function ListingSection({ section, onApartmentSelect }) {
  return (
    <section className="listing-section">
      <div className="listing-section__header">
        <h2 className="listing-section__title">{section.title}</h2>

        <div className="listing-section__controls">
          <button type="button" aria-label="Previous">
            ‹
          </button>
          <button type="button" aria-label="Next">
            ›
          </button>
        </div>
      </div>

      <div className="listing-section__grid">
        {section.items.map((item, index) => (
          <ListingCard
            key={item.id}
            item={item}
            showAvailableBadge={index === 0}
            onApartmentSelect={onApartmentSelect}
          />
        ))}
      </div>
    </section>
  );
}

export default ListingSection;
