import { useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiChevronRight,
  FiShield,
} from "react-icons/fi";
import {
  getLegalDocumentKey,
  mergeLegalDocuments,
} from "../../data/legalDocuments";
import "./LegalPage.css";

function scrollLegalPageToTop() {
  if (typeof window === "undefined") return;

  window.requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  });
}

function LegalDetail({ document, onBack, backLabel }) {
  const paragraphs = String(document?.body || "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const sections = Array.isArray(document?.sections) ? document.sections : [];

  return (
    <section className="public-legal-card public-legal-detail">
      <button type="button" className="public-legal-back" onClick={onBack}>
        <FiArrowLeft />
        <span>{backLabel}</span>
      </button>

      <div className="public-legal-icon">
        <FiShield />
      </div>

      <h1>{document?.title || "Legal document"}</h1>

      <div className="public-legal-copy">
        {document?.description && (
          <p className="public-legal-copy__intro">{document.description}</p>
        )}

        {paragraphs.length > 0 &&
          paragraphs.map((paragraph, index) => (
            <p key={`${document?.id || "legal"}-${index}`}>{paragraph}</p>
          ))}

        {sections.map((section) => (
          <section className="public-legal-copy__section" key={section.title}>
            <h2>{section.title}</h2>
            {section.body && <p>{section.body}</p>}
            {Array.isArray(section.items) && section.items.length > 0 && (
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}

export default function LegalPage({
  legalDocuments = [],
  initialDocumentId = "",
  onBack,
  backLabel = "Back to home",
  returnToSourceOnDetail = false,
}) {
  const documents = useMemo(
    () => mergeLegalDocuments(legalDocuments),
    [legalDocuments],
  );
  const [selectedDocumentId, setSelectedDocumentId] = useState(() =>
    documents.some(
      (document) => getLegalDocumentKey(document) === initialDocumentId,
    )
      ? initialDocumentId
      : "",
  );
  const selectedDocument = documents.find(
    (document) => getLegalDocumentKey(document) === selectedDocumentId,
  );

  function handleOpenDocument(documentId) {
    setSelectedDocumentId(documentId);
    scrollLegalPageToTop();
  }

  function handleBackToIndex() {
    setSelectedDocumentId("");
    scrollLegalPageToTop();
  }

  return (
    <section className="public-legal-page">
      <div className="public-legal-page__inner">
        {selectedDocument ? (
          <LegalDetail
            document={selectedDocument}
            onBack={returnToSourceOnDetail ? onBack : handleBackToIndex}
            backLabel={
              returnToSourceOnDetail ? backLabel : "Back to legal documents"
            }
          />
        ) : (
          <section className="public-legal-card public-legal-index">
            <button type="button" className="public-legal-back" onClick={onBack}>
              <FiArrowLeft />
              <span>{backLabel}</span>
            </button>

            <div className="public-legal-index__heading">
              <span>Bedrock Residences</span>
              <h1>Legal</h1>
              <p>
                Review Bedrock policies and published legal documents in one
                place.
              </p>
            </div>

            <div className="public-legal-list">
              {documents.map((document) => (
                <button
                  type="button"
                  onClick={() =>
                    handleOpenDocument(getLegalDocumentKey(document))
                  }
                  key={document.id}
                >
                  <span>
                    <strong>{document.title}</strong>
                    <small>Read policy</small>
                  </span>
                  <FiChevronRight />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
