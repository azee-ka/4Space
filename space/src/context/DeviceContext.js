// src/context/DeviceContext.js
import React, { createContext, useContext, useMemo } from "react";
import { useMediaQuery } from "react-responsive";
import { BREAKPOINTS } from "../constants/breakpoints";

// Create the context
const DeviceContext = createContext();

// Provider component
export function DeviceProvider({ children }) {
  const isMobile = useMediaQuery({ maxWidth: BREAKPOINTS.mobile });
  const isTablet = useMediaQuery({
    minWidth: BREAKPOINTS.mobile + 1,
    maxWidth: BREAKPOINTS.tablet,
  });
  const isDesktop = useMediaQuery({ minWidth: BREAKPOINTS.tablet + 1 });

  // You can memoize the value for slight optimization
  const value = useMemo(() => ({
    isMobile,
    isTablet,
    isDesktop,
    isM: isMobile,
    isT: isTablet,
    isD: isDesktop,
    width: isMobile
      ? "mobile"
      : isTablet
        ? "tablet"
        : "desktop"
  }), [isMobile, isTablet, isDesktop]);


  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
}

// Custom hook to use the device context
export function useDevice() {
  return useContext(DeviceContext);
};