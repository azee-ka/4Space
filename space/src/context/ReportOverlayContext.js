import React, { createContext, useState, useContext } from 'react';
import ReportOverlay from '../components/reportOverlay/reportOverlay';

const ReportOverlayContext = createContext();

export const useReportOverlayContext = () => {
  return useContext(ReportOverlayContext);
};

export const ReportOverlayProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [contentType, setContentType] = useState('');
  const [objectId, setObjectId] = useState(null);

  const openReportOverlay = (type, id) => {
    setContentType(type);
    setObjectId(id);
    setIsOpen(true);
  };

  const closeReportOverlay = () => {
    setIsOpen(false);
  };

  return (
    <ReportOverlayContext.Provider value={{ openReportOverlay, closeReportOverlay }}> {/* Corrected name here */}
      {children}
      {isOpen && <ReportOverlay contentType={contentType} objectId={objectId} onClose={closeReportOverlay} />}
    </ReportOverlayContext.Provider>
  );
};
