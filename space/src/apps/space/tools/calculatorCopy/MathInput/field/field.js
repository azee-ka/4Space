import React, { useEffect, useState } from 'react';
import { EditableMathField, addStyles } from 'react-mathquill';
import { useNavigate, useParams } from 'react-router-dom';
import './field.css';
import { FaTimes } from 'react-icons/fa';

addStyles();

function MathField({ id, onInputChange, mathFieldRef, handleEvaluateClick, placeholder, initialValue }) {
  const [isPlaceholderVisible, setPlaceholderVisible] = useState(true);

  const { expression } = useParams(); // Retrieve expression from URL parameters


  const mathFieldConfig = {
    autoCommands: 'pi theta sqrt',
    autoOperatorNames: 'sin cos tan',
    substituteTextarea: () => document.createElement('textarea'),
    handleStyle: {
      outline: '2px solid red',
    },
    degreeMode: true, // Add this line to enable degree mode
  };

  useEffect(() => {
    if (mathFieldRef.current) {
      mathFieldRef.current.latex(expression || ''); // Use the expression from URL or an empty string  
    }
  }, [mathFieldRef]);

  const handleChange = (mathField) => {
    const inputValue = mathField.latex();
    if (onInputChange) {
      onInputChange(id, inputValue);
    }
    setPlaceholderVisible(inputValue === '' ? true : false);

  };

  const handleClear = () => {
    if (mathFieldRef.current) {
      mathFieldRef.current.latex('');
      mathFieldRef.current.focus();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleEvaluateClick();
    }
  };

  return (
    <div className='field-input-area'>
      <div className='placeholder-field'>
        {isPlaceholderVisible && (
          <div className='placeholder' id={`placeholder-${id}`} >{placeholder}</div>
        )}
      </div>
      <div className='edit-field'>
        <EditableMathField
          config={mathFieldConfig}
          onChange={handleChange}
          mathquillDidMount={(mathField) => (mathFieldRef.current = mathField)}
          onKeyDown={handleKeyDown}
          id={id}
          className={`math-field`}
        />
        <button className='clear-button' onClick={handleClear}>
          <FaTimes />
        </button>
      </div>
    </div>
  );
}

export { MathField };
