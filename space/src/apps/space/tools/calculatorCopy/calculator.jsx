import React, { useRef } from 'react';
import './calculator.css';
import MathInputField from './MathInput/mathInput';

function Calculator() {
  const mathFieldRef = useRef(null);

  return (
    <div className="calculator-container">
      <div className='calculator-container-inner'>
        <div className="calculator-title">
          <div className='calculator-title-inner'>
            <h2>QuantaLab</h2>
          </div>
        </div>
        <div className='calculator-holder'>
          <div className='calculator-holder-inner'>
          <div className="calculator-sidebar-holder">
            <div className="calculator-sidebar-holder-inner">
              {/* Content Addition Pending*/}
            </div>
          </div>
          <div className="calculator-content-holder">
            <div className="calculator-content-holder-inner">
              <div className="calculator-content-holder-inner-sub">
                <MathInputField mathFieldRef={mathFieldRef} />
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Calculator;