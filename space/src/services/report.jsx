// src/services/report.js
import apiCall from "../utils/api";

// Abstraction for reporting content
export const reportContent = async ({ content_type, object_id, reasons, custom_reason }) => {
    const response = await apiCall(
        'report/report-content/',
        'POST',
        {
            content_type,
            object_id,
            reasons,
            custom_reason,
        }
    );
    return response.data;
};
