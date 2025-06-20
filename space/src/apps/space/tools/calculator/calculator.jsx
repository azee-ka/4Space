import React, { useEffect, useRef, useState } from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import './calculator.css';
import { MathfieldElement } from 'mathlive';
import Masonry from 'react-masonry-css';

const SYMBOL_SETS = {
  Algebra: [
    { label: '+', latex: '+' }, { label: '-', latex: '-' }, { label: '\\times', latex: '\\cdot' },
    { label: '\\div', latex: '\\div' }, { label: 'x^2', latex: 'x^2' }, { label: '\\sqrt{x}', latex: '\\sqrt{}' },
    { label: '\\sqrt[3]{x}', latex: '\\sqrt[3]{}' }, { label: 'x^{y}', latex: '^{}' }, { label: '(', latex: '(' },
    { label: ')', latex: ')' }, { label: '=', latex: '=' }, { label: '\\ne', latex: '\\ne' },
    { label: '<', latex: '<' }, { label: '>', latex: '>' }, { label: '\\le', latex: '\\le' }, { label: '\\ge', latex: '\\ge' },
    { label: '\\pm', latex: '\\pm' }, { label: '\\mp', latex: '\\mp' }, { label: '\\left|x\\right|', latex: '\\left|\\right|' },
    { label: '\\bmod', latex: '\\bmod' }, { label: '\\lfloor x \\rfloor', latex: '\\lfloor x \\rfloor' },
    { label: '\\lceil x \\rceil', latex: '\\lceil x \\rceil' }, { label: '\\frac{a}{b}', latex: '\\frac{}{}' }
  ],
  Calculus: [
    { label: '\\int', latex: '\\int' }, { label: '\\iint', latex: '\\iint' }, { label: '\\iiint', latex: '\\iiint' },
    { label: '\\oint', latex: '\\oint' }, { label: '\\frac{d}{dx}', latex: '\\frac{d}{dx}' },
    { label: '\\frac{d^2}{dx^2}', latex: '\\frac{d^2}{dx^2}' }, { label: '\\partial', latex: '\\partial' },
    { label: '\\nabla', latex: '\\nabla' }, { label: '\\infty', latex: '\\infty' }, { label: '\\lim_{x \\to a}', latex: '\\lim_{x \\to }' },
    { label: '\\Delta', latex: '\\Delta' }, { label: '\\frac{dy}{dx}', latex: '\\frac{dy}{dx}' },
    { label: '\\sum', latex: '\\sum' }, { label: '\\prod', latex: '\\prod' }, { label: '\\bigcup', latex: '\\bigcup' },
    { label: '\\bigcap', latex: '\\bigcap' }, { label: 'f\'', latex: "f'" }, { label: 'f\'\'', latex: "f''" }
  ],
  Greek: [
    // Lowercase
    ...[
      'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta',
      'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'rho',
      'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'
    ].map(name => ({ label: `\\${name}`, latex: `\\${name}` })),
    // Uppercase
    ...[
      'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma', 'Upsilon', 'Phi', 'Psi', 'Omega'
    ].map(name => ({ label: `\\${name}`, latex: `\\${name}` }))
  ],
  Sets: [
    { label: '\\in', latex: '\\in' }, { label: '\\notin', latex: '\\notin' },
    { label: '\\ni', latex: '\\ni' }, { label: '\\subseteq', latex: '\\subseteq' },
    { label: '\\subset', latex: '\\subset' }, { label: '\\supseteq', latex: '\\supseteq' },
    { label: '\\supset', latex: '\\supset' }, { label: '\\cup', latex: '\\cup' }, { label: '\\cap', latex: '\\cap' },
    { label: '\\emptyset', latex: '\\emptyset' }, { label: '\\mathbb{N}', latex: '\\mathbb{N}' },
    { label: '\\mathbb{Z}', latex: '\\mathbb{Z}' }, { label: '\\mathbb{Q}', latex: '\\mathbb{Q}' },
    { label: '\\mathbb{R}', latex: '\\mathbb{R}' }, { label: '\\mathbb{C}', latex: '\\mathbb{C}' },
    { label: '|A|', latex: '|A|' }, { label: 'P(A)', latex: 'P(A)' }
  ],
  Linear: [
    { label: '\\text{det}(A)', latex: '\\text{det}()' }, { label: '\\text{inv}(A)', latex: '\\text{inv}()' },
    { label: '\\text{rank}(A)', latex: '\\text{rank}()' }, { label: '\\text{eig}(A)', latex: '\\text{eig}()' },
    { label: 'A^{T}', latex: 'A^{\\mathsf{T}}' }, { label: 'A^{-1}', latex: 'A^{-1}' },
    { label: '0', latex: '0' }, { label: 'I', latex: 'I' }, { label: '\\otimes', latex: '\\otimes' },
    { label: '\\oplus', latex: '\\oplus' }, {
      label: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}',
      latex: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}'
    }
  ],
  Logic: [
    { label: '\\neg', latex: '\\neg' }, { label: '\\wedge', latex: '\\wedge' }, { label: '\\vee', latex: '\\vee' },
    { label: '\\veebar', latex: '\\veebar' }, { label: '\\Rightarrow', latex: '\\Rightarrow' },
    { label: '\\Leftrightarrow', latex: '\\Leftrightarrow' }, { label: '\\equiv', latex: '\\equiv' },
    { label: '\\models', latex: '\\models' }, { label: '\\not\\models', latex: '\\not\\models' },
    { label: '\\forall', latex: '\\forall' }, { label: '\\exists', latex: '\\exists' },
    { label: '\\top', latex: '\\top' }, { label: '\\bot', latex: '\\bot' },
    { label: '\\therefore', latex: '\\therefore' }, { label: '\\because', latex: '\\because' }
  ]
};


const Calculator = () => {
  const [activeTab, setActiveTab] = useState('Algebra');
  const [latex, setLatex] = useState('');
  const [output, setOutput] = useState('');
  const mathfieldRef = useRef(null);

  useEffect(() => {
    if (mathfieldRef.current && !mathfieldRef.current.hasChildNodes()) {
      const mf = new MathfieldElement({
        smartMode: true,
        virtualKeyboardMode: 'manual'
      });
      mathfieldRef.current.appendChild(mf);
      mf.addEventListener('input', () => setLatex(mf.getValue()));
    }
  }, []);

  const handleInsert = (latexCmd) => {
    const mf = mathfieldRef.current?.querySelector('math-field');
    if (mf) mf.insert(latexCmd);
  };

  const handleEvaluate = async () => {
    try {
      const res = await fetch('http://localhost:8000/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression: latex })
      });
      const data = await res.json();
      setOutput(data.latex || data.result || 'No output');
    } catch {
      setOutput('Error evaluating expression');
    }
  };

  const handleClear = () => {
    const mf = mathfieldRef.current?.querySelector('math-field');
    if (mf) mf.setValue('');
    setLatex('');
    setOutput('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(latex);
  };

  return (
    <div className="glass-wrapper">
      <h2 className="glass-title-outside">Calculator</h2>
      <div className='calculator-main'>
        <div className='calculator-sidebar'>

        </div>
      <div className="glass-calculator">
        <div className="glass-tabs">
          {Object.keys(SYMBOL_SETS).map(tab => (
            <button
              key={tab}
              className={`glass-tab-btn ${tab === activeTab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

<Masonry
  breakpointCols={{ default: 15, 1100: 3, 768: 2, 480: 1 }}
  className="glass-symbols-masonry"
  columnClassName="glass-symbols-column"
>
  {SYMBOL_SETS[activeTab].map((sym, idx) => (
    <button key={idx} className="glass-symbol-btn" onClick={() => handleInsert(sym.latex)}>
      <span dangerouslySetInnerHTML={{ __html: katex.renderToString(sym.label, { throwOnError: false }) }} />
    </button>
  ))}
</Masonry>


        <div className="glass-input-row">
          <div ref={mathfieldRef} className="mathfield-box" />
            <button className="glass-evaluate-btn" onClick={handleEvaluate}>Evaluate</button>
        </div>

        <div className="glass-controls">
          <button className="glass-control-btn" onClick={handleClear}>Clear</button>
          <button className="glass-control-btn" onClick={handleCopy}>Copy</button>
        </div>

        <div className="glass-output">
          <strong>Output:</strong>
          <div
            className="glass-latex"
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(output || '', { throwOnError: false })
            }}
          />
        </div>
      </div>
            </div>
    </div>
  );
};

export default Calculator;