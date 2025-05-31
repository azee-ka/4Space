import React, { useState } from 'react';
import './reportOverlay.scss';
import { useReportOverlayContext } from '../../context/ReportOverlayContext';
import useApi from '../../utils/useApi';
import { FaTimes } from 'react-icons/fa';

const ReportOverlay = ({ contentType, objectId, onClose }) => {
    const { callApi } = useApi();
    const [selectedReasons, setSelectedReasons] = useState([]);
    const [customReason, setCustomReason] = useState('');

    const reasons = [
        // Group 1: Most Common Issues
        'Spam',
        'Phishing',
        'Misleading Information',
        // Group 2: Harassment and Threats
        'Bullying',
        'Threats',
        'Stalking',
        'Hate Speech',
        // Group 3: Violent and Inappropriate Content
        'Violent Content',
        'Sexual Content',
        // Group 4: Privacy Violations
        'Doxxing',
        'Unauthorized Sharing',
        // Group 5: Miscellaneous
        'Impersonation',
        'Misinformation',
        'Intellectual Property Violation',
        'Malware or Viruses',
        'Scams or Fraud',
        'Other'
    ];

    const handleReasonChange = (reason) => {
        setSelectedReasons((prevReasons) =>
            prevReasons.includes(reason)
                ? prevReasons.filter((r) => r !== reason)
                : [...prevReasons, reason]
        );
    };

    const handleSubmit = async () => {
        try {
            console.log('cont', contentType);
            console.log('id', objectId);
            const reportData = {
                content_type: contentType,
                object_id: objectId,
                reasons: selectedReasons,
                custom_reason: customReason,
            };
            const response = await callApi('report/report-content/', 'POST', reportData);
            console.log(response.data);
            onClose();
        } catch (error) {
            console.error("Failed to submit report:", error);
        }
    };

    return (
        <div className="report-overlay" onClick={onClose}>
            <div className="report-content-card" onClick={(e) => e.stopPropagation()}>
                <button className="report-content-close-btn" onClick={onClose}>
                    <FaTimes className="icon-style" />
                </button>
                <h2>Report Content</h2>
                <div className="reason-list">
                    {reasons.map((reason) => (
                        <label key={reason} className="reason-item" htmlFor={reason}>
                            {reason}
                            <input
                                type="checkbox"
                                id={reason}
                                value={reason}
                                checked={selectedReasons.includes(reason)}
                                onChange={() => handleReasonChange(reason)}
                                className="custom-checkbox"
                            />
                            <span className="custom-checkmark"></span>
                        </label>
                    ))}
                </div>
                {selectedReasons.includes('Other') && (
                    <div className='report-other-field'>
                        <label>Specifiy Reason (Selected Other):</label>
                        <textarea
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                            placeholder="Describe the issue..."
                        />
                    </div>
                )}
                <button className='report-submit-btn' onClick={handleSubmit}>Submit Report</button>
            </div>
        </div>
    );
};

export default ReportOverlay;
