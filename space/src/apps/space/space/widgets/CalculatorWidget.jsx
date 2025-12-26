import React, { useState, useEffect } from 'react';

const CalculatorWidget = ({ widget, onConfigUpdate, isExpanded }) => {
  const [display, setDisplay] = useState(widget.config?.display || '0');
  const [equation, setEquation] = useState(widget.config?.equation || '');
  const [history, setHistory] = useState(widget.config?.history || []);
  
  // Save state to backend when it changes
  useEffect(() => {
    const timer = setTimeout(() => {
      onConfigUpdate({
        display,
        equation,
        history
      });
    }, 1000); // Debounce saves
    
    return () => clearTimeout(timer);
  }, [display, equation, history]);
  
  const handleClick = (value) => {
    if (value === 'C') {
      setDisplay('0');
      setEquation('');
    } else if (value === '=') {
      try {
        const result = eval(equation + display);
        const calculation = `${equation}${display} = ${result}`;
        setHistory([calculation, ...history.slice(0, 9)]); // Keep last 10
        setDisplay(result.toString());
        setEquation('');
      } catch {
        setDisplay('Error');
      }
    } else if (['+', '-', '*', '/'].includes(value)) {
      setEquation(equation + display + value);
      setDisplay('0');
    } else {
      setDisplay(display === '0' ? value : display + value);
    }
  };
  
  const buttons = [
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    'C', '0', '=', '+'
  ];
  
  return (
    <div className="calc-widget">
      <div className="calc-display">
        <div className="calc-equation">{equation}</div>
        <div className="calc-result">{display}</div>
      </div>
      <div className="calc-buttons">
        {buttons.map(btn => (
          <button 
            key={btn} 
            className={`calc-btn ${['=', 'C'].includes(btn) ? 'calc-btn-special' : ''}`}
            onClick={() => handleClick(btn)}
          >
            {btn}
          </button>
        ))}
      </div>
      
      {/* History */}
      {history.length > 0 && isExpanded && (
        <div className="calc-history">
          <div className="calc-history-header">History</div>
          {history.map((calc, i) => (
            <div key={i} className="calc-history-item">{calc}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CalculatorWidget;