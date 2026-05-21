import { useState } from "react";

export default function AppImage({
  src,
  fallbackSrc = "",
  alt = "",
  loading = "lazy",
  decoding = "async",
  onError,
  ...imageProps
}) {
  const requestedSrc = src || fallbackSrc;
  const [failedSrc, setFailedSrc] = useState("");
  const currentSrc = failedSrc === requestedSrc ? fallbackSrc : requestedSrc;

  function handleImageError(event) {
    onError?.(event);

    if (currentSrc !== fallbackSrc) {
      setFailedSrc(requestedSrc);
    }
  }

  if (!currentSrc) {
    return (
      <span
        {...imageProps}
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
      />
    );
  }

  return (
    <img
      {...imageProps}
      src={currentSrc}
      alt={alt}
      loading={loading}
      decoding={decoding}
      onError={handleImageError}
    />
  );
}
