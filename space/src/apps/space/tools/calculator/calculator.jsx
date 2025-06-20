import React, { useEffect, useRef, useState } from "react";
import "katex/dist/katex.min.css";
import katex from "katex";
import "./calculator.css";
import { MathfieldElement } from "mathlive";
import { Clipboard, X } from "lucide-react";
import apiCall from "../../../../utils/api";

const SYMBOL_SETS = {
  Algebra: [
    { label: "+", latex: "+" },
    { label: "-", latex: "-" },
    { label: "\\times", latex: "\\cdot" },
    { label: "\\div", latex: "\\div" },
    { label: "x^2", latex: "x^{2}" },
    { label: "\\sqrt{x}", latex: "\\sqrt{\\placeholder{}}" },
    { label: "\\sqrt[3]{x}", latex: "\\sqrt[3]{\\placeholder{}}" },
    { label: "x^{y}", latex: "x^{\\placeholder{}}" },
    { label: "(", latex: "(" },
    { label: ")", latex: ")" },
    { label: "=", latex: "=" },
    { label: "\\ne", latex: "\\ne" },
    { label: "<", latex: "<" },
    { label: ">", latex: ">" },
    { label: "\\le", latex: "\\le" },
    { label: "\\ge", latex: "\\ge" },
    { label: "\\pm", latex: "\\pm" },
    { label: "\\mp", latex: "\\mp" },
    { label: "\\left|x\\right|", latex: "\\left|\\placeholder{}\\right|" },
    { label: "\\bmod", latex: "\\bmod" },
    { label: "\\lfloor x \\rfloor", latex: "\\lfloor\\placeholder{}\\rfloor" },
    { label: "\\lceil x \\rceil", latex: "\\lceil\\placeholder{}\\rceil" },
    {
      label: "\\frac{a}{b}",
      latex: "\\frac{\\placeholder{}}{\\placeholder{}}",
    },
  ],

  Calculus: [
    {
      label: "\\int",
      latex: "\\int_{\\placeholder{}}^{\\placeholder{}}\\placeholder{}",
    },
    {
      label: "\\iint",
      latex: "\\iint_{\\placeholder{}}^{\\placeholder{}}\\placeholder{}",
    },
    {
      label: "\\iiint",
      latex: "\\iiint_{\\placeholder{}}^{\\placeholder{}}\\placeholder{}",
    },
    {
      label: "\\oint",
      latex: "\\oint_{\\placeholder{}}^{\\placeholder{}}\\placeholder{}",
    },
    { label: "\\frac{d}{dx}", latex: "\\frac{d}{dx}\\placeholder{}" },
    { label: "\\frac{d^2}{dx^2}", latex: "\\frac{d^2}{dx^2}\\placeholder{}" },
    { label: "\\partial", latex: "\\partial" },
    { label: "\\nabla", latex: "\\nabla" },
    { label: "\\infty", latex: "\\infty" },
    {
      label: "\\lim_{x \\to a}",
      latex: "\\lim_{x \\to \\placeholder{}}\\placeholder{}",
    },
    { label: "\\Delta", latex: "\\Delta" },
    { label: "\\frac{dy}{dx}", latex: "\\frac{dy}{dx}" },
    {
      label: "\\sum",
      latex: "\\sum_{\\placeholder{}}^{\\placeholder{}}\\placeholder{}",
    },
    {
      label: "\\prod",
      latex: "\\prod_{\\placeholder{}}^{\\placeholder{}}\\placeholder{}",
    },
    {
      label: "\\bigcup",
      latex: "\\bigcup_{\\placeholder{}}^{\\placeholder{}}\\placeholder{}",
    },
    {
      label: "\\bigcap",
      latex: "\\bigcap_{\\placeholder{}}^{\\placeholder{}}\\placeholder{}",
    },
    { label: "f'", latex: "f'" },
    { label: "f''", latex: "f''" },
  ],

  Greek: [
    ...[
      "alpha",
      "beta",
      "gamma",
      "delta",
      "epsilon",
      "zeta",
      "eta",
      "theta",
      "iota",
      "kappa",
      "lambda",
      "mu",
      "nu",
      "xi",
      "omicron",
      "pi",
      "rho",
      "sigma",
      "tau",
      "upsilon",
      "phi",
      "chi",
      "psi",
      "omega",
    ].map((name) => ({ label: `\\${name}`, latex: `\\${name}` })),
    ...[
      "Gamma",
      "Delta",
      "Theta",
      "Lambda",
      "Xi",
      "Pi",
      "Sigma",
      "Upsilon",
      "Phi",
      "Psi",
      "Omega",
    ].map((name) => ({ label: `\\${name}`, latex: `\\${name}` })),
  ],

  Sets: [
    { label: "\\in", latex: "\\in" },
    { label: "\\notin", latex: "\\notin" },
    { label: "\\ni", latex: "\\ni" },
    { label: "\\subseteq", latex: "\\subseteq" },
    { label: "\\subset", latex: "\\subset" },
    { label: "\\supseteq", latex: "\\supseteq" },
    { label: "\\supset", latex: "\\supset" },
    { label: "\\cup", latex: "\\cup" },
    { label: "\\cap", latex: "\\cap" },
    { label: "\\emptyset", latex: "\\emptyset" },
    { label: "\\mathbb{N}", latex: "\\mathbb{N}" },
    { label: "\\mathbb{Z}", latex: "\\mathbb{Z}" },
    { label: "\\mathbb{Q}", latex: "\\mathbb{Q}" },
    { label: "\\mathbb{R}", latex: "\\mathbb{R}" },
    { label: "\\mathbb{C}", latex: "\\mathbb{C}" },
    { label: "|A|", latex: "|\\placeholder{A}|" },
    { label: "P(A)", latex: "P(\\placeholder{A})" },
  ],

  Linear: [
    { label: "\\text{det}(A)", latex: "\\text{det}(\\placeholder{})" },
    { label: "\\text{inv}(A)", latex: "\\text{inv}(\\placeholder{})" },
    { label: "\\text{rank}(A)", latex: "\\text{rank}(\\placeholder{})" },
    { label: "\\text{eig}(A)", latex: "\\text{eig}(\\placeholder{})" },
    { label: "A^{T}", latex: "A^{\\mathsf{T}}" },
    { label: "A^{-1}", latex: "A^{-1}" },
    { label: "0", latex: "0" },
    { label: "I", latex: "I" },
    { label: "\\otimes", latex: "\\otimes" },
    { label: "\\oplus", latex: "\\oplus" },
    {
      label: "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}",
      latex: "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}",
      scaled: true,
    },
  ],

  Logic: [
    { label: "\\neg", latex: "\\neg" },
    { label: "\\wedge", latex: "\\wedge" },
    { label: "\\vee", latex: "\\vee" },
    { label: "\\veebar", latex: "\\veebar" },
    { label: "\\Rightarrow", latex: "\\Rightarrow" },
    { label: "\\Leftrightarrow", latex: "\\Leftrightarrow" },
    { label: "\\equiv", latex: "\\equiv" },
    { label: "\\models", latex: "\\models" },
    { label: "\\not\\models", latex: "\\not\\models" },
    { label: "\\forall", latex: "\\forall\\ \\placeholder{}" },
    { label: "\\exists", latex: "\\exists\\ \\placeholder{}" },
    { label: "\\top", latex: "\\top" },
    { label: "\\bot", latex: "\\bot" },
    { label: "\\therefore", latex: "\\therefore" },
    { label: "\\because", latex: "\\because" },
  ],
};

const Calculator = () => {
  const [activeTab, setActiveTab] = useState("Algebra");
  const [latex, setLatex] = useState("");
  const [output, setOutput] = useState("");
const [copied, setCopied] = useState(false);

  const mathfieldContainerRef = useRef(null); // DOM node to append to
  const mathfieldInstanceRef = useRef(null); // store MathfieldElement instance

  useEffect(() => {
    if (mathfieldContainerRef.current && !mathfieldInstanceRef.current) {
      const mf = new MathfieldElement();
      mf.setOptions({
        smartMode: true,
        virtualKeyboardMode: "manual",
        virtualKeyboards: "all",
        defaultMode: "math",
        placeholder: "Type expression...",
        keypressSound: null,
        plonkSound: null,
      });
      mf.setValue("");
      mf.style.width = "100%";
      mf.style.fontSize = "1.4rem";

      mf.addEventListener("input", () => {
        setLatex(mf.getValue());
      });

      mathfieldContainerRef.current.appendChild(mf);
      mathfieldInstanceRef.current = mf;

      customElements.whenDefined("math-field").then(() => {
        const shadowRoot = mf.shadowRoot;
        if (!shadowRoot) return;

        const style = document.createElement("style");
        style.textContent = `
  :host {
    --caret-color: #00ffc3;
    --selection-background-color: rgba(0, 255, 195, 0.2);
    --highlight: rgba(0, 255, 195, 0.1);
    --placeholder-color: #aafff0;

    --keyboard-background: rgba(20, 20, 20, 0.8);
    --keyboard-button-background: rgba(255, 255, 255, 0.1);
    --keyboard-button-hover-background: rgba(255, 255, 255, 0.2);
    --keyboard-button-active-background: #00c9a7;
    --keyboard-button-foreground: #ffffff;
  }

  /* Caret and base text */
  textarea {
    caret-color: #00ffc3 !important;
    color: white;
  }

  ::selection {
    background-color: rgba(0, 255, 195, 0.3);
  }

  /* Placeholder color */
  .ML__placeholder {
    color: #aafff0 !important;
  }

  /* Force all math content to white */
  .ML__container,
  .ML__mathlive,
  .ML__cmr,
  .ML__mathstyle,
  .ML__sqrt-sign,
  .ML__delim-size1,
  .ML__placeholder,
  .ML__vlist,
  .ML__content,
  .ML__strut,
  .ML__base,
  .ML__symbol {
    color: white !important;
    fill: white !important;
    border-color: white !important;
  }

  /* Fix square root tick color */
  .ML__sqrt-line {
    border-top: 1px solid white !important;
  }

  /* Virtual keyboard background for good measure */
  .ML__keyboard {
    backdrop-filter: blur(12px);
    border-radius: 14px;
    background-color: rgba(20, 20, 20, 0.9);
  }
`;
        shadowRoot.appendChild(style);
      });
    }
  }, []);

  const handleInsert = (latexCmd) => {
    const mf = mathfieldInstanceRef.current;
    if (mf) {
      mf.focus();
      mf.insert(latexCmd);
    }
  };

  const handleEvaluate = async () => {
    try {
      const res = await apiCall(
        "space/projects/tools/calculator/solve/",
        "POST",
        { expression: latex }
        );
      console.log(res.data);
      setOutput(res.data.output_latex || res.data.raw_result || "No output");
    } catch (err) {
        console.error(err)
      setOutput("Error evaluating expression");
    }
  };

  const handleClear = () => {
    const mf = mathfieldInstanceRef.current;
    if (mf) mf.setValue("");
    setLatex("");
    setOutput("");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(latex);
  };

  return (
    <div className="glass-wrapper">
      <h2 className="glass-title-outside">Calculator</h2>
      <div className="calculator-main">
        <div className="calculator-sidebar"></div>
        <div className="glass-calculator">
          <div className="glass-tabs">
            {Object.keys(SYMBOL_SETS).map((tab) => (
              <button
                key={tab}
                className={`glass-tab-btn ${tab === activeTab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="glass-symbols-grid">
            {SYMBOL_SETS[activeTab].map((sym, idx) => (
              <button
                key={idx}
                className="glass-symbol-btn"
                onClick={() => handleInsert(sym.latex)}
              >
                <span
                  className={sym.scaled ? "katex-scale" : ""}
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(sym.label, {
                      throwOnError: false,
                    }),
                  }}
                />
              </button>
            ))}
          </div>

          <div className="glass-calculator-input-panel">
            <div className="glass-input-row">
              <div
                className={`mathfield-box ${
                  latex.trim() !== "" ? "has-content" : ""
                }`}
              >
                <span className="mathfield-placeholder">
                  Type expression...
                </span>
                <div ref={mathfieldContainerRef} style={{ width: "100%" }} />
              </div>

              <button className="glass-evaluate-btn" onClick={handleEvaluate}>
                Evaluate
              </button>
            </div>

            <div className="glass-utility-row">
              <button
                className="glass-icon-btn"
                onClick={handleClear}
                title="Clear"
                aria-label="Clear"
              >
                <X size={16} />
              </button>
              <button
                className="glass-icon-btn"
                onClick={handleCopy}
                title="Copy"
                aria-label="Copy"
              >
                <Clipboard size={16} />
              </button>
            </div>
          </div>
          <div className="glass-output">
  <div className="glass-output-header">
    <strong>Output:</strong>
    {output && (
      <div className="tooltip-wrapper">
  <button
    className="glass-icon-btn"
    onClick={() => {
      navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }}
    title="Copy Output"
    aria-label="Copy Output"
  >
    <Clipboard size={16} />
    <span className="tooltip-text">{copied ? "Copied!" : "Copy"}</span>
  </button>
</div>

    )}
  </div>

  {output ? (
    <div
      className="glass-latex"
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(output, {
          throwOnError: false,
        }),
      }}
    />
  ) : (
    <p className="glass-latex-placeholder">No output yet</p>
  )}
</div>

        </div>
      </div>
    </div>
  );
};

export default Calculator;
