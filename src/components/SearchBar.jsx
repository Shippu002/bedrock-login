import "../styles/searchbar.css";
import { FiSearch } from "react-icons/fi";

function SearchBar() {
  function handleSubmit(event) {
    event.preventDefault();
  }

  return (
    <section className="search-bar-section">
      <form className="search-bar" onSubmit={handleSubmit}>
        <div className="search-bar__field search-bar__field--residence">
          <label htmlFor="residence" className="search-bar__label">
            Residences
          </label>

          <select id="residence" defaultValue="">
            <option value="" disabled>
              Search by Residence
            </option>
            <option value="opebi-residence-ikeja">
              Opebi Residence - Ikeja
            </option>
            <option value="opebi-ii-residence-ikeja">
              Opebi II Residence - Ikeja
            </option>
            <option value="oduduwas-residence-ikeja">
              Oduduwa&apos;s Residence - Ikeja
            </option>
            <option value="bateyes-residence-ikeja">
              Bateye&apos;s Residence - Ikeja
            </option>
            <option value="communitys-residence-yaba">
              Community&apos;s Residence - Yaba
            </option>
          </select>
        </div>

        <div className="search-bar__divider" />

        <div className="search-bar__field search-bar__field--date">
          <label htmlFor="start-date" className="search-bar__label">
            Start date - End date
          </label>

          <div className="search-bar__date-range">
            <input id="start-date" type="date" />
            <span className="search-bar__date-separator">-</span>
            <input id="end-date" type="date" />
          </div>
        </div>

        <div className="search-bar__divider" />

        <div className="search-bar__field search-bar__field--guest">
          <label htmlFor="guest-count" className="search-bar__label">
            Number of guest
          </label>

          <input
            id="guest-count"
            type="number"
            min="1"
            placeholder="Add guest"
          />
        </div>

        <button
          type="submit"
          className="search-bar__button"
          aria-label="Search"
        >
          <FiSearch />
        </button>
      </form>
    </section>
  );
}

export default SearchBar;
