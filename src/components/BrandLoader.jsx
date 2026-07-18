import "../styles/brand-loader.css";

function BrandLoader({
  title = "Loading",
  message = "Please wait while we get things ready.",
  className = "",
}) {
  return (
    <div
      className={`brand-loader ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <div className="brand-loader__visual" aria-hidden="true">
        <span className="brand-loader__logo-puck">
          <img src="/favicon.svg" alt="" />
        </span>
      </div>

      <div className="brand-loader__copy">
        <strong>{title}</strong>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
}

export default BrandLoader;
