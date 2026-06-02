export const defaultLegalDocuments = [
  {
    id: "terms",
    type: "terms",
    title: "Terms of service",
    description:
      "These terms explain how guests may use Bedrock Residences, make reservations, and access services during a stay.",
    sections: [
      {
        title: "Using Bedrock Residences",
        items: [
          "Provide accurate personal, contact, and booking information when creating an account or making a reservation.",
          "Keep your account details secure. You are responsible for activity completed through your account.",
          "Use the website and residence services lawfully and respectfully.",
        ],
      },
      {
        title: "Bookings and payments",
        items: [
          "A booking is confirmed only after the required payment has been completed and confirmation has been issued.",
          "Prices, taxes, service charges, refundable deposits, and any additional fees are shown before payment.",
          "Check-in and check-out dates, guest count, apartment type, and contact information must be reviewed before confirming a booking.",
        ],
      },
      {
        title: "Guest responsibilities",
        items: [
          "Guests must follow the residence house rules and avoid disturbing other residents.",
          "Guests are responsible for damage caused by themselves or anyone included in their booking.",
          "Bedrock may restrict or end a stay where there is unlawful activity, serious misconduct, or a breach of residence rules.",
        ],
      },
      {
        title: "Services and availability",
        items: [
          "Apartment availability, shop items, and additional services may change before an order or booking is confirmed.",
          "Bedrock may update these terms when necessary. The current in-app version applies when you use the website.",
        ],
      },
    ],
  },
  {
    id: "cancellation",
    type: "cancellation",
    title: "Cancellation policy",
    description:
      "This policy explains the cancellation rules that apply when a guest needs to cancel or shorten an apartment booking.",
    sections: [
      {
        title: "Standard cancellation rules",
        items: [
          "Bookings cancelled more than 72 hours before check-in qualify for free cancellation.",
          "Bookings cancelled between 25 and 72 hours before check-in attract a 30% cancellation charge on the invoiced amount.",
          "Bookings cancelled within 24 hours of check-in, on the check-in date, or after check-in attract the applicable full-stay charge.",
        ],
      },
      {
        title: "Seasonal bookings and early departure",
        items: [
          "December and other high-demand seasonal bookings may attract a 50% cancellation charge.",
          "An early departure may attract a breaking fee and any additional charges disclosed during the booking process.",
        ],
      },
      {
        title: "How to request a cancellation",
        items: [
          "Open your bookings page, select the relevant reservation, and use the available cancellation option.",
          "A cancellation is complete only when the updated booking status is shown in your account or confirmed by Bedrock support.",
        ],
      },
    ],
  },
  {
    id: "refund",
    type: "refund",
    title: "Refund policy",
    description:
      "This policy explains when refunds may apply and how eligible refunds are processed.",
    sections: [
      {
        title: "Eligible refunds",
        items: [
          "Refunds are calculated according to the cancellation policy and the timing of the cancellation request.",
          "Approved refundable deposits are returned after check-out once the apartment has been inspected.",
          "Confirmed overpayments or duplicate payments will be reviewed and refunded where applicable.",
        ],
      },
      {
        title: "Processing refunds",
        items: [
          "Eligible refunds are returned through the original payment method where possible.",
          "Processing time may vary depending on the payment provider or financial institution.",
          "Any non-refundable charge will be clearly included in the refund calculation.",
        ],
      },
      {
        title: "When a refund may not apply",
        items: [
          "A refund may be reduced or declined for no-shows, late cancellations, damage, or services that have already been delivered.",
          "Contact Bedrock support if a completed payment is missing from your account or you believe a refund calculation is incorrect.",
        ],
      },
    ],
  },
  {
    id: "privacy",
    type: "privacy",
    title: "Privacy policy",
    description:
      "This policy explains the personal information Bedrock Residences collects and how it is used to support your bookings and account.",
    sections: [
      {
        title: "Information we collect",
        items: [
          "Account details such as your name, email address, phone number, and profile information.",
          "Booking, payment, order, service-request, and support information required to complete your requests.",
          "Basic technical information used to keep the website secure and improve the user experience.",
        ],
      },
      {
        title: "How we use your information",
        items: [
          "To manage your account, reservations, payments, orders, requested services, and customer support.",
          "To send booking updates, payment confirmations, security notices, and other service-related notifications.",
          "To improve Bedrock services and protect guests, residences, and the website from misuse.",
        ],
      },
      {
        title: "Sharing and protection",
        items: [
          "Personal information is shared only where necessary to provide a requested service, meet legal obligations, or protect the platform.",
          "Bedrock uses reasonable safeguards to protect personal information and does not sell guest information.",
        ],
      },
      {
        title: "Your choices",
        items: [
          "You may review or update your profile information from your account.",
          "You may contact Bedrock support if you need help with your personal information or account deletion.",
        ],
      },
    ],
  },
];

export function getLegalDocumentKey(document = {}) {
  const source = [
    document.id,
    document.type,
    document.title,
    document.raw?.slug,
    document.raw?.type,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (source.includes("cancel")) return "cancellation";
  if (source.includes("refund")) return "refund";
  if (source.includes("privacy")) return "privacy";
  if (source.includes("term")) return "terms";

  return String(document.id || document.type || "")
    .trim()
    .toLowerCase();
}

export function mergeLegalDocuments(documents = []) {
  const backendDocuments = Array.isArray(documents) ? documents : [];
  const knownKeys = new Set(defaultLegalDocuments.map((document) => document.id));
  const mergedDocuments = defaultLegalDocuments.map((defaultDocument) => {
    const backendDocument = backendDocuments.find(
      (document) => getLegalDocumentKey(document) === defaultDocument.id,
    );

    return {
      ...defaultDocument,
      ...(backendDocument || {}),
      id: defaultDocument.id,
      type: defaultDocument.type,
      title: backendDocument?.title || defaultDocument.title,
      description:
        backendDocument?.description || defaultDocument.description,
      sections: backendDocument?.sections || defaultDocument.sections,
    };
  });
  const extraDocuments = backendDocuments
    .filter((document) => !knownKeys.has(getLegalDocumentKey(document)))
    .map((document, index) => ({
      ...document,
      id: getLegalDocumentKey(document) || `legal-document-${index + 1}`,
      title: document.title || document.name || "Legal document",
      description:
        document.description || "Review this document for more information.",
    }));

  return [...mergedDocuments, ...extraDocuments];
}
