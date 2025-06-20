import React, { useEffect } from 'react';
import { InlineMath } from 'react-katex';
import './mathOutput.css';

const MathOutput = ({ output, handleCopyClick, handleCopyClick1, isCopied, isCopied1, states, isLoading }) => {

  var isInteger;

  try {
    isInteger = output.solution.isInteger;
  } catch (error) {
    isInteger = false;
  }

  /**
   const out = {
     outputString: outputString,
     outputStringForDecimal: outputStringForDecimal,
     solution: result,
     isLarge: isLarge,
   }
    */

  const renderOutput = () => {

    if (typeof output.outputString !== 'undefined') {
      try {
        return <InlineMath math={output.outputString} />;
      } catch (error) {
        console.error('Error rendering output:', error);
        return null;
      }
    } else {
      return <InlineMath math={''} />;
    }
  };

  const renderOutput1 = () => {
    if (output.outputStringForDecimal !== '') {
      try {
        return <InlineMath math={output.outputStringForDecimal} />;
      } catch (error) {
        console.error('Error rendering output:', error);
        return null;
      }
    }
  };

  return (
    <div className='calculator-solution-container'>
      <div className='solution-heading-container'>
        <h4 className='solution-heading'>{`Solution:`}</h4>
        <div className='copy-buttons'>
          <div className={`copy-button-container`}>
            {!isLoading &&
              <span className={`copy-button ${isCopied ? 'copied' : ''}`} onClick={handleCopyClick}>
                {isCopied ? 'Solution Copied!' : 'Copy Solution'}
              </span>
            }
          </div>
          <div className={`copy-button-container`}>
            {!isLoading && !isInteger && output.solution !== null && output.outputStringForDecimal !== "" &&
              <span className={`copy-button ${isCopied1 ? 'copied' : ''}`} onClick={handleCopyClick1}>
                {isCopied1 ? 'Deicmal Output Copied!' : `Copy Decimal Output`}
              </span>}
          </div>
        </div>
      </div>
      <div className='solution-output'>
        {!isLoading && output.isLarge &&
          <div className={`math-output-1 ${isLoading ? 'loading' : ''}`}>
            {output.outputStringForDecimal !== null && isLoading ? (
              <div className='loading-spinner'></div>
            ) : (
              <div className='math-output-render1'>
                <p>Decimal</p>
                <div className='output-rendered1'>{renderOutput1()}</div>
              </div>
            )}
          </div>}
        <div className={`math-output ${(isLoading && (output !== null)) ? 'loading' : ''}`}>
          {isLoading ? (
            <div className='loading-spinner'></div>
          ) : (
            <div className='math-output-render'>{renderOutput()}</div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MathOutput;