import React, { createContext } from 'react';

export const MathContext = createContext();

export const MathProvider = ({ children, mathFieldRef }) => {
  const writeToMathField = (latex) => {
    if (mathFieldRef.current) {
      mathFieldRef.current.latex(latex);
    }
  };
  return (
    <MathContext.Provider value={{ writeToMathField }}>
      {children}
    </MathContext.Provider>
  );
};
