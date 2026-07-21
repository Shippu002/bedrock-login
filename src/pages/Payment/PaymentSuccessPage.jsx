import AppImage from "../../components/AppImage";
import "../../styles/payment-success.css";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

function formatAmount(value) {
  const amount = Number(value || 0);

  if (!Number.isFinite(amount) || amount <= 0) return "";

  return CURRENCY_FORMATTER.format(amount);
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PaymentSuccessPage({
  confirmation,
  onViewBooking,
  onGoHome,
}) {
  const details = confirmation || {};
  const amount = formatAmount(details.amount);
  const checkIn = formatDate(details.checkIn);
  const checkOut = formatDate(details.checkOut);
  const guests = Number(details.guests || 0);
  const reference = details.reference || "";

  return (
    <section className="payment-success" aria-labelledby="payment-success-title">
      <div className="payment-success__card">
        <span className="payment-success__badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="34" height="34" focusable="false">
            <path
              d="M20 6.5 9.5 17 4 11.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <h1 id="payment-success-title" className="payment-success__title">
          Thank you for your booking
        </h1>
        <p className="payment-success__subtitle">
          Your payment was verified successfully and your reservation is locked
          in.
        </p>

        <div className="payment-success__summary">
          {details.title ? (
            <div className="payment-success__summary-head">
              <AppImage
                className="payment-success__thumb"
                src={details.image}
                fallbackSrc=""
                alt={details.title}
              />
              <div className="payment-success__summary-text">
                <p className="payment-success__summary-title">{details.title}</p>
                {details.location ? (
                  <p className="payment-success__summary-meta">
                    {details.location}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <dl className="payment-success__facts">
            {checkIn ? (
              <div className="payment-success__fact">
                <dt>Check-in</dt>
                <dd>{checkIn}</dd>
              </div>
            ) : null}
            {checkOut ? (
              <div className="payment-success__fact">
                <dt>Check-out</dt>
                <dd>{checkOut}</dd>
              </div>
            ) : null}
            {guests > 0 ? (
              <div className="payment-success__fact">
                <dt>Guests</dt>
                <dd>{guests}</dd>
              </div>
            ) : null}
            {amount ? (
              <div className="payment-success__fact payment-success__fact--total">
                <dt>Amount paid</dt>
                <dd>{amount}</dd>
              </div>
            ) : null}
            {reference ? (
              <div className="payment-success__fact">
                <dt>Reference</dt>
                <dd className="payment-success__reference">{reference}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="payment-success__actions">
          <button
            type="button"
            className="payment-success__btn payment-success__btn--primary"
            onClick={onViewBooking}
          >
            View my bookings
          </button>
          <button
            type="button"
            className="payment-success__btn payment-success__btn--ghost"
            onClick={onGoHome}
          >
            Back to home
          </button>
        </div>

        <p className="payment-success__note">
          A confirmation has been saved to your Bedrock account.
        </p>
      </div>
    </section>
  );
}
