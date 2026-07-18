import { useState } from "react";

export default function AppImage({
  src,
  fallbackSrc = "",
  alt = "",
  loading = "lazy",
  decoding = "async",
  onError,
  onLoad,
  className = "",
  ...imageProps
}) {
  const requestedSrc = src || fallbackSrc;
  const [failedSrc, setFailedSrc] = useState("");
  const [loadedSrc, setLoadedSrc] = useState("");
  const currentSrc = failedSrc === requestedSrc ? fallbackSrc : requestedSrc;
  const isLoaded = currentSrc && loadedSrc === currentSrc;
  const imageClassName = `${className} ${
    isLoaded ? "is-loaded" : "is-loading"
  }`.trim();

  function handleImageError(event) {
    onError?.(event);

    if (currentSrc !== fallbackSrc) {
      setFailedSrc(requestedSrc);
    }
  }

  function handleImageLoad(event) {
    setLoadedSrc(currentSrc);
    onLoad?.(event);
  }

  if (!currentSrc) {
    return (
      <span
        {...imageProps}
        className={imageClassName}
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
      />
    );
  }

  return (
    <img
      {...imageProps}
      className={imageClassName}
      src={currentSrc}
      alt={alt}
      loading={loading}
      decoding={decoding}
      onError={handleImageError}
      onLoad={handleImageLoad}
    />
  );
}
