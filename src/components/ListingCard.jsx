import { FiMapPin, FiStar, FiUsers, FiWifi, FiTruck } from "react-icons/fi";
import { LuBedSingle } from "react-icons/lu";
import AppImage from "./AppImage";
import "../styles/listing-card.css";

function ListingCard({
  item,
  showAvailableBadge = false,
  onApartmentSelect,
}) {
  function handleSelect() {
    onApartmentSelect?.(item);
  }

  function handleKeyDown(event) {
    if (event.target !== event.currentTarget) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelect();
    }
  }

  return (
    <article
      className="listing-card"
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View ${item.title}`}
    >
      <div className="listing-card__image-wrapper">
        <AppImage
          src={item.image}
          alt={item.title}
          className="listing-card__image"
        />

        {showAvailableBadge && (
          <span className="listing-card__badge">Available</span>
        )}
      </div>

      <div className="listing-card__body">
        <div className="listing-card__top">
          <div className="listing-card__heading-group">
            <h3 className="listing-card__title">{item.title}</h3>

            <p className="listing-card__location">
              <FiMapPin className="listing-card__location-icon" />
              <span>{item.location}</span>
            </p>
          </div>

          <span className="listing-card__rating">
            <FiStar className="listing-card__rating-icon" />
            <span>{item.rating}</span>
          </span>
        </div>

        <div className="listing-card__meta">
          <span className="listing-card__meta-item">
            <FiUsers className="listing-card__meta-icon" />
            <span>{item.guests} Guest</span>
          </span>

          <span className="listing-card__meta-item">
            <LuBedSingle className="listing-card__meta-icon" />
            <span>{item.rooms} Room</span>
          </span>

          <span className="listing-card__meta-item">
            <FiTruck className="listing-card__meta-icon" />
            <span>{item.cars} cars</span>
          </span>

          <span className="listing-card__meta-item">
            <FiWifi className="listing-card__meta-icon" />
            <span>{item.wifi ? "Wi‑Fi" : "No Wi‑Fi"}</span>
          </span>
        </div>

        <div className="listing-card__bottom">
          <button
            className="listing-card__button"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleSelect();
            }}
          >
            Book apartment
          </button>

          <div className="listing-card__price-block">
            <strong>NGN{item.price.toLocaleString()}</strong>
            <span>per night</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default ListingCard;
