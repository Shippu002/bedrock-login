import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import "../styles/promo-banner.css";

const AUTO_SLIDE_MS = 6500;
const SWIPE_THRESHOLD_PX = 42;
const SINGLE_BANNER_REPEAT_COUNT = 5;

export default function PromoBanner({ promotion, promotions = [], onClaim }) {
  const slides = useMemo(() => {
    if (Array.isArray(promotions) && promotions.length > 0) return promotions;
    return promotion ? [promotion] : [];
  }, [promotion, promotions]);
  const visualSlides = useMemo(() => {
    if (slides.length !== 1) return slides;

    return Array.from({ length: SINGLE_BANNER_REPEAT_COUNT }, (_, index) => ({
      ...slides[0],
      visualId: `${slides[0].id}-${index}`,
      isRepeatedSlide: true,
    }));
  }, [slides]);
  const defaultActiveIndex = slides.length === 1 ? 2 : 0;
  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex);
  const pointerStartXRef = useRef(null);
  const canMoveSlides = visualSlides.length > 1;
  const shouldShowControls = canMoveSlides;
  const shouldShowDots = slides.length > 1;
  const safeActiveIndex =
    visualSlides.length > 0
      ? Math.min(activeIndex, visualSlides.length - 1)
      : 0;
  const logicalActiveIndex = slides.length === 1 ? 0 : safeActiveIndex;

  const getPreviousIndex = useCallback(
    (current) => {
      if (slides.length === 1) return current <= 1 ? 3 : current - 1;

      return (current - 1 + visualSlides.length) % visualSlides.length;
    },
    [slides.length, visualSlides.length],
  );

  const getNextIndex = useCallback(
    (current) => {
      if (slides.length === 1) return current >= 3 ? 1 : current + 1;

      return (current + 1) % visualSlides.length;
    },
    [slides.length, visualSlides.length],
  );

  useEffect(() => {
    if (!canMoveSlides) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => getNextIndex(current));
    }, AUTO_SLIDE_MS);

    return () => window.clearInterval(intervalId);
  }, [canMoveSlides, getNextIndex]);

  if (slides.length === 0) return null;

  function showPrevious() {
    setActiveIndex((current) => getPreviousIndex(current));
  }

  function showNext() {
    setActiveIndex((current) => getNextIndex(current));
  }

  function handleClaim(slide) {
    if (typeof onClaim === "function") {
      onClaim(slide);
      return;
    }

    const listings = document.querySelector(".home-page__listings");
    listings?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handlePointerDown(event) {
    pointerStartXRef.current = event.clientX;
  }

  function handlePointerUp(event) {
    if (!canMoveSlides || pointerStartXRef.current === null) return;

    const distance = event.clientX - pointerStartXRef.current;
    pointerStartXRef.current = null;

    if (Math.abs(distance) < SWIPE_THRESHOLD_PX) return;
    if (distance > 0) showPrevious();
    else showNext();
  }

  return (
    <section
      className="promo-banner"
      aria-label="Bedrock promotions"
      aria-roledescription="carousel"
    >
      <div
        className="promo-banner__viewport"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div
          className="promo-banner__track"
          style={{ "--promo-active-index": safeActiveIndex }}
        >
          {visualSlides.map((slide, index) => (
            <button
              key={slide.visualId || slide.id}
              className={`promo-banner__slide ${
                index === safeActiveIndex ? "is-active" : ""
              }`.trim()}
              type="button"
              onClick={() => handleClaim(slide)}
              aria-label={slide.accessibleLabel}
            >
              <img
                className="promo-banner__artwork"
                src={slide.image}
                alt={slide.accessibleLabel}
                loading="eager"
                decoding="async"
                draggable="false"
              />
            </button>
          ))}
        </div>
      </div>

      {shouldShowControls && (
        <>
          <button
            className="promo-banner__nav promo-banner__nav--previous"
            type="button"
            onClick={showPrevious}
            aria-label="Previous promotion"
          >
            <FiChevronLeft aria-hidden="true" />
          </button>
          <button
            className="promo-banner__nav promo-banner__nav--next"
            type="button"
            onClick={showNext}
            aria-label="Next promotion"
          >
            <FiChevronRight aria-hidden="true" />
          </button>
          {shouldShowDots && (
            <div className="promo-banner__dots" aria-label="Promotion slides">
              {slides.map((slide, index) => (
                <button
                  key={`${slide.id}-dot`}
                  type="button"
                  className={index === logicalActiveIndex ? "is-active" : ""}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show ${slide.brand || "promotion"} slide ${
                    index + 1
                  }`}
                  aria-current={
                    index === logicalActiveIndex ? "true" : undefined
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
