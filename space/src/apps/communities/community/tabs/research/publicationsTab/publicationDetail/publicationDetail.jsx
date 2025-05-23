import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import useApi from "../../../../../../../utils/useApi";
import "./publicationDetail.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FiExternalLink } from "react-icons/fi";
import {
  faExpand,
  faDownload,
  faUpRightFromSquare,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

const PublicationDetail = ({
  publication: propPublication,
  embedded = false,
  onBack,
}) => {
  const { publicationId } = useParams();
  const { callApi } = useApi();

  const [publication, setPublication] = useState(propPublication || null);
  const [loading, setLoading] = useState(!propPublication);
  const [pdfSrc, setPdfSrc] = useState(null);
  const [pdfError, setPdfError] = useState(false);

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (publication?.file) {
      setPdfSrc(`${publication.file}?v=${Date.now()}`);
    }
  }, [publication?.file]);

  useEffect(() => {
    if (!propPublication && publicationId) {
      const fetchData = async () => {
        try {
          const response = await callApi(
            `community/research/publication/${publicationId}/detail/`
          );
          setPublication(response.data);
        } catch (err) {
          console.error("Failed to fetch publication detail", err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [publicationId, propPublication]);

  if (!publication || loading) {
    return <div className="publication-loading">Loading...</div>;
  }

  const renderPdfViewer = () => (
    <div className={`community-card pdf-viewer-frame ${isExpanded ? 'overlay' : ''}`}>
      <div className={`pdf-viewer-toolbar ${isExpanded ? 'overlay' : ''}`}>
        <div className="left-tools">
          {pdfSrc && (
            <a
              href={pdfSrc}
              download
              className="toolbar-btn"
              title="Download PDF"
            >
              <FontAwesomeIcon icon={faDownload} />
            </a>
          )}
        </div>
        <div className="right-tools">
          {pdfSrc && (
            <a
              href={pdfSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="toolbar-btn"
              title="Open in New Tab"
            >
              <FontAwesomeIcon icon={faUpRightFromSquare} />
            </a>
          )}
          {!isExpanded &&
          <button
            className="toolbar-btn"
            onClick={() => setIsExpanded(true)}
            title="Expand PDF"
          >
            <FontAwesomeIcon icon={faExpand} />
          </button>
          }
          {isExpanded &&
            <button className="close-btn" onClick={() => setIsExpanded(false)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          }
        </div>
      </div>
      {!pdfError && pdfSrc ? (
        <embed
          key={pdfSrc}
          src={pdfSrc}
          type="application/pdf"
          className="custom-pdf-embed"
          onError={() => setPdfError(true)}
        />
      ) : (
        <div style={{ padding: "1rem", color: "#ccc" }}>
          <p>
            PDF failed to load.{" "}
            {pdfSrc && (
              <a
                href={pdfSrc}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#0cf" }}
              >
                Open PDF in new tab
              </a>
            )}
          </p>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div className="publication-detail-wrapper embedded">
        <div className="publication-nav-bar">
          <button className="back-btn" onClick={onBack}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </button>
          <Link
            to={`/communities/research/${publication.id}`}
            className="open-btn"
            title="Open in full page"
          >
            <FiExternalLink />
          </Link>
        </div>

        <h2 className="detail-title">{publication.title}</h2>

        <div className="abstract-card">
          <h3>Abstract</h3>
          <p>{publication.abstract}</p>
        </div>

        {renderPdfViewer()}
      </div>
    );
  }

  return (
    <div className="publication-detail-wrapper non-embedded">
      <div className="publication-main-column">
        <div className="publication-main-column-inner">
          <div className="publication-header">
            <h1>{publication.title}</h1>
          </div>

          <div className="community-card abstract-card">
            <h3>Abstract</h3>
            <p>{publication.abstract}</p>
          </div>

          {renderPdfViewer()}
        </div>
      </div>

      <div className="publication-sidebar">
        <div className="community-card publiciation-sidebar-inner">
          <div className="sidebar-section">
            <h4>Author</h4>
            <p>@{publication.created_by}</p>
          </div>
          <div className="sidebar-section">
            <h4>Community</h4>
            <Link
              to={`/communities/${publication.community?.slug}`}
              className="sidebar-link"
            >
              {publication.community?.name}
            </Link>
          </div>
          <div className="sidebar-section">
            <h4>Uploaded</h4>
            <p>{new Date(publication.created_at).toLocaleString()}</p>
          </div>
          <div className="sidebar-section">
            <button className="sidebar-btn">Download PDF</button>
            <button className="sidebar-btn">Cite This</button>
            <button className="sidebar-btn">Share</button>
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="pdf-overlay">
          {/* <div className="pdf-overlay-toolbar">
            <button className="close-btn" onClick={() => setIsExpanded(false)}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div> */}
         {renderPdfViewer()}
        </div>
      )}
    </div>
  );
};

export default PublicationDetail;
