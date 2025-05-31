import React from "react";
import './postMoreOverlay.scss';
import { FaTimes } from "react-icons/fa";
import { useReportOverlayContext } from "../../../../context/ReportOverlayContext";

const PostMoreOverlay = ({ onClose }) => {
    const { openReportOverlay } = useReportOverlayContext();
    

    return (
        <div className="post-more-menu-overlay" onClick={onClose}>
            <div className="post-more-menu-card" onClick={(e) => e.stopPropagation()}>
                <div className="post-more-card-top">
                <h3>More</h3>
                <button onClick={onClose} className="post-more-menu-close-button">
                    <FaTimes />
                </button>
                </div>
                <div className="post-more-card-bottom">
                <button>
                    Author Rating
                </button>
                <button>
                    Post Metrics
                </button>
                <button onClick={openReportOverlay} className="report-button">
                    Report
                </button>
                <button onClick={onClose}>
                    Cancel
                </button>
                </div>
            </div>
        </div>
    )
}

export default PostMoreOverlay;