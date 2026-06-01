import { useEffect, useRef, useState } from "react";
import ListingCard from "./ListingCard";
import "../styles/listing-section.css";

function getCardsPerPage(width) {
  if (width <= 910) return 0;
  if (width <= 960) return 2;
  if (width <= 1200) return 3;
  return 5;
}

function ListingSection({ section, onApartmentSelect }) {
  const gridRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1440 : window.innerWidth,
  );
  const [pageIndex, setPageIndex] = useState(0);
  const [mobileScrollState, setMobileScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
  });
  const isMobileCarousel = viewportWidth <= 910;
  const cardsPerPage = getCardsPerPage(viewportWidth);
  const totalPages = cardsPerPage
    ? Math.max(1, Math.ceil(section.items.length / cardsPerPage))
    : 1;
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const visibleItems = isMobileCarousel
    ? section.items
    : section.items.slice(
        safePageIndex * cardsPerPage,
        safePageIndex * cardsPerPage + cardsPerPage,
      );
  const canGoPrevious = isMobileCarousel
    ? mobileScrollState.canScrollLeft
    : safePageIndex > 0;
  const canGoNext = isMobileCarousel
    ? mobileScrollState.canScrollRight
    : safePageIndex < totalPages - 1;

  useEffect(() => {
    function handleResize() {
      setViewportWidth(window.innerWidth);
    }

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const grid = gridRef.current;

    if (!grid || !isMobileCarousel) {
      setMobileScrollState({
        canScrollLeft: false,
        canScrollRight: false,
      });
      return undefined;
    }

    function updateScrollState() {
      const maxScrollLeft = grid.scrollWidth - grid.clientWidth;

      setMobileScrollState({
        canScrollLeft: grid.scrollLeft > 2,
        canScrollRight: grid.scrollLeft < maxScrollLeft - 2,
      });
    }

    updateScrollState();
    const animationFrame = window.requestAnimationFrame(updateScrollState);
    const timeoutId = window.setTimeout(updateScrollState, 260);
    grid.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(timeoutId);
      grid.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [isMobileCarousel, section.items.length, visibleItems.length]);

  function scrollMobileCards(direction) {
    const grid = gridRef.current;

    if (!grid) return;

    grid.scrollBy({
      left: direction * Math.max(220, grid.clientWidth * 0.82),
      behavior: "smooth",
    });
  }

  function handlePrevious() {
    if (isMobileCarousel) {
      scrollMobileCards(-1);
      return;
    }

    setPageIndex((currentPage) =>
      Math.max(0, Math.min(currentPage, totalPages - 1) - 1),
    );
  }

  function handleNext() {
    if (isMobileCarousel) {
      scrollMobileCards(1);
      return;
    }

    setPageIndex((currentPage) =>
      Math.min(totalPages - 1, Math.min(currentPage, totalPages - 1) + 1),
    );
  }

  return (
    <section className="listing-section">
      <div className="listing-section__header">
        <h2 className="listing-section__title">{section.title}</h2>

        <div className="listing-section__controls">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            aria-label={`Previous ${section.title} apartments`}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext}
            aria-label={`Next ${section.title} apartments`}
          >
            ›
          </button>
        </div>
      </div>

      <div className="listing-section__grid" ref={gridRef}>
        {visibleItems.map((item, index) => (
          <ListingCard
            key={item.id}
            item={item}
            showAvailableBadge={
              isMobileCarousel
                ? index === 0
                : safePageIndex === 0 && index === 0
            }
            onApartmentSelect={onApartmentSelect}
          />
        ))}
      </div>
    </section>
  );
}

export default ListingSection;
