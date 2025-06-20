import React, { useState } from 'react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { symbols, greekLetters, upperGreekLetters, trig, linearAlgebra } from './mathButtons.js';
import './tabs.css';

const tabButtons = {
  tab1: {
    name: "Basic",
    buttons: symbols,
  },
  tab2: {
    name: "Greek Alphabet",
    buttons: greekLetters,
  },
  tab3: {
    name: "Calculus",
    buttons: upperGreekLetters,
  },
  tab4: {
    name: "Trig",
    buttons: trig,
  },
  // tab5: {
  //   name: "Linear Algebra",
  //   buttons: linearAlgebra,
  // },
};


const KaTeXButton = ({ label, value, writeToMathField }) => (
  <button className="calculator-button" onClick={() => writeToMathField(value)}>
    <InlineMath math={label} />
  </button>
);

const Tabs = ({ writeToMathField }) => {
  const [activeTab, setActiveTab] = useState(Object.keys(tabButtons)[0]);
  let separatorRendered = false;

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className='calculator-tabs-container'>
      <div className='calculator-tabs-container-inner'>
        <div className="calculator-tab-buttons">
          <div className="calculator-tab-buttons-inner">
            {Object.entries(tabButtons).map(([tab, { name }]) => (
              <button
                key={tab}
                className={tab === activeTab ? 'active' : ''}
                onClick={() => handleTabClick(tab)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
        <div className="calculator-tab-content">
          <div className="calculator-tab-content-inner">
            {tabButtons[activeTab].buttons && (
              <ul className="calculator-button-list">
                {Object.entries(tabButtons[activeTab].buttons).map(([label, [value, strokes]]) => (
                  <React.Fragment key={label}>
                    {!separatorRendered && label.toUpperCase() === label && (
                      <hr className="separator-line" />
                    )}
                    <li>
                      <KaTeXButton
                        label={label}
                        value={value}
                        writeToMathField={() => {
                          writeToMathField(value, strokes);
                        }}
                      />
                    </li>
                    {label.toUpperCase() === label && (separatorRendered = true)} {/* Set flag to true after rendering separator */}
                  </React.Fragment>
                ))}
              </ul>
            )}
            {!tabButtons[activeTab].buttons && <p>No buttons available for this tab.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tabs;