import React, { useRef, useEffect } from 'react';
import * as Desmos from 'desmos';
import './MathQuillInput.css';

const MathQuillInput = ({ latex, onChange }) => {
  const calculatorRef = useRef(null);

  useEffect(() => {
    const calculator = Desmos.GraphingCalculator(calculatorRef.current, {
      expressions: false, // Disable graphing expressions
      settingsMenu: false, // Disable the settings menu
    });

    // Set the initial latex
    calculator.setExpression({ id: 'math', latex });

    // Listen for changes in the math field
    calculator.observe('math', () => {
      const newLatex = calculator.getExpression({ id: 'math' }).latex;
      onChange(newLatex);
    });

    return () => {
      calculator.destroy();
    };
  }, [latex, onChange]);

  return <div className="mathquill-input" ref={calculatorRef} />;
};

export default MathQuillInput;
