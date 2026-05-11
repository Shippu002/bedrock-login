import { useState } from "react";
import fallbackImage from "../assets/listing-primary.png";

export default function AppImage({
  src,
  fallbackSrc = fallbackImage,
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
