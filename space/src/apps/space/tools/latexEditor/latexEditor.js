import { useEffect, useState, useCallback, useRef } from "react";
import "./latexEditor.css";
import useApi from "../../../../utils/useApi";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { StreamLanguage } from "@codemirror/language";
import { stex } from "@codemirror/legacy-modes/mode/stex";
import { linter, lintGutter } from "@codemirror/lint";
import { autocompletion, completeFromList } from "@codemirror/autocomplete";
import { useParams } from "react-router-dom";
import {
  FaBold, FaItalic, FaUnderline, FaHeading, FaListUl,
  FaSuperscript, FaDollarSign, FaFilePdf, FaCog
} from "react-icons/fa";
import { MdFunctions } from "react-icons/md";
import fullCommands from './complete-latex-commands.json';
import { keymap } from "@codemirror/view";
import { insertText } from "@codemirror/commands";
import katex from "katex";
import "katex/dist/katex.min.css";


const extractUserMacros = (text) => {
  const macros = [];
  const macroRegex = /\\newcommand\{(\\\w+)\}/g;
  const operatorRegex = /\\DeclareMathOperator\{(\\\w+)\}/g;
  const envRegex = /\\newenvironment\{(\w+)\}/g;
  let match;
  while ((match = macroRegex.exec(text))) macros.push({ label: match[1], apply: match[1], type: "user-macro" });
  while ((match = operatorRegex.exec(text))) macros.push({ label: match[1], apply: match[1], type: "user-operator" });
  while ((match = envRegex.exec(text))) macros.push({ label: `\\begin{${match[1]}}`, apply: `\\begin{${match[1]}}\n\n\\end{${match[1]}}`, type: "environment" });
  return macros;
};

const latexLinter = () => (view) => {
  const diagnostics = [];
  const text = view.state.doc.toString();
  const stack = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{") stack.push(i);
    else if (text[i] === "}") {
      if (!stack.length) {
        diagnostics.push({
          from: i, to: i + 1, severity: "error", message: "Unmatched closing brace"
        });
      } else {
        stack.pop();
      }
    }
  }
  stack.forEach(pos => {
    diagnostics.push({
      from: pos, to: pos + 1, severity: "error", message: "Unmatched opening brace"
    });
  });
  return diagnostics;
};


const customLatexInputHandler = EditorView.inputHandler.of((view, from, to, text) => {
  const state = view.state;
  const selection = state.selection.main;

  // Only allow if it's a single character insert
  if (selection.empty && from === to && (text === "$" || text === "\\")) {
    const before = state.sliceDoc(0, selection.from);
    const after = state.sliceDoc(selection.from);

    // Check for single "$"
    if (text === "$") {
      view.dispatch({
        changes: { from, insert: "$$" },
        selection: { anchor: from + 1 },
      });
      return true;
    }

    // Check if user is typing \[
    if (text === "\\" && after.startsWith("[")) {
      view.dispatch({
        changes: { from, to: from + 2, insert: "\\[\\]" },
        selection: { anchor: from + 2 },
      });
      return true;
    }
  }

  return false;
});



const LaTeXEditor = ({ projectIdProp }) => {
  const { projectId: projectIdUrl } = useParams();
  const { callApi } = useApi();
  const [latex, setLatex] = useState("");
  const [saved, setSaved] = useState(true);
  const [pdfURL, setPdfURL] = useState(null);
  const [customFiles, setCustomFiles] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [lintErrors, setLintErrors] = useState([]);
  const [dynamicMacros, setDynamicMacros] = useState([]);
  const editorRef = useRef(null);

  const [viewMode, setViewMode] = useState("compiled"); // or "raw"

  const projectId = projectIdProp || projectIdUrl;

  useEffect(() => {
    const fetchLatex = async () => {
      try {
        const response = await callApi(`space/tools/${projectId}/latex/`);
        setLatex(response.data.content || "");
        setErrorMsg(null);
      } catch {
        setErrorMsg("Failed to load LaTeX content.");
      }
    };
    if (projectId) fetchLatex();
  }, [projectId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!saved) {
        save();
        compileLatex();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [latex, saved]);

  useEffect(() => {
    const view = editorRef.current?.view;
    if (!view) return;
    const diagnostics = latexLinter()(view);
    setLintErrors(diagnostics);
    setDynamicMacros(extractUserMacros(view.state.doc.toString()));
  }, [latex]);


  const save = useCallback(() => {
    if (!projectId) return;
    callApi(`space/tools/${projectId}/latex/`, "PUT", { content: latex })
      .then(() => setSaved(true))
      .catch(() => setErrorMsg("Save failed."));
  }, [latex, projectId]);

  useEffect(() => {
    const handleSaveShortcut = (e) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", handleSaveShortcut);
    return () => window.removeEventListener("keydown", handleSaveShortcut);
  }, [save]);

  const compileLatex = async () => {
    setErrorMsg(null);
    try {
      const blob = new Blob([latex], { type: "text/plain" });
      const file = new File([blob], "document.tex");
      const formData = new FormData();
      formData.append("tex", file);
      customFiles.forEach(f => formData.append("files", f));
      const response = await callApi(`space/tools/${projectId}/latex/render/`, "POST", formData, "multipart/form-data", null, { responseType: "blob" });
      setPdfURL(URL.createObjectURL(response.data));
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  const insertAtCursor = (snippet) => {
    if (!editorRef.current) return;
    const view = editorRef.current.view;
    const { from } = view.state.selection.main;
    view.dispatch({ changes: { from, insert: snippet }, selection: { anchor: from + snippet.length } });
    view.focus();
  };


  const splitLatexBlocks = (text) => {
    return text.split(/\n+/).map(line => {
      const trimmed = line.trim();
      if (trimmed === "") return { type: "text", content: "" };
      return { type: "math", content: trimmed };
    });
  };


  return (
    <div className="latex-editor-root">
      <header className="latex-editor-header">
        <h1>LaTeX Editor</h1>
        <span className={`save-status ${saved ? "saved" : "unsaved"}`}>
          {saved ? "✓ Saved" : "• Unsaved"}
        </span>
        <button className="tooltip-btn settings-btn" onClick={() => setShowConfig(true)}>
          <FaCog />
          <span className="tooltip-text">Configure</span>
        </button>
      </header>

      <div className="latex-editor-toolbar">
        <button className="tooltip-btn" onClick={() => insertAtCursor("\\textbf{}")}><FaBold /><span className="tooltip-text">Bold</span></button>
        <button className="tooltip-btn" onClick={() => insertAtCursor("\\textit{}")}><FaItalic /><span className="tooltip-text">Italic</span></button>
        <button className="tooltip-btn" onClick={() => insertAtCursor("\\underline{}")}><FaUnderline /><span className="tooltip-text">Underline</span></button>
        {viewMode === "compiled" &&
          <>
            <button className="tooltip-btn" onClick={() => insertAtCursor("\\section{}")}><FaHeading /><span className="tooltip-text">Section</span></button>

            <button className="tooltip-btn" onClick={() => insertAtCursor("\n\\begin{itemize}\n  \\item \n\\end{itemize}\n")}><FaListUl /><span className="tooltip-text">Itemize</span></button>


            <button className="tooltip-btn" onClick={() => insertAtCursor("\n\\begin{equation}\n\n\\end{equation}\n")}><MdFunctions /><span className="tooltip-text">Equation</span></button>

            <button className="tooltip-btn" onClick={() => insertAtCursor("\\[  \\]")}><FaSuperscript /><span className="tooltip-text">Display Math</span></button>
            <button className="tooltip-btn" onClick={() => insertAtCursor("$  $")}><FaDollarSign /><span className="tooltip-text">Inline Math</span></button>
            <button className={`tooltip-btn compile-btn ${lintErrors.length > 0 ? "has-errors" : ""}`} onClick={compileLatex}>
              <FaFilePdf /><span className="tooltip-text">{lintErrors.length > 0 ? `⚠ ${lintErrors.length} error(s)` : "Compile PDF"}</span>
              Compile
            </button>
          </>
        }

        <div className="view-toggle">
          <label className="switch">
            <input
              type="checkbox"
              checked={viewMode === "compiled"}
              onChange={() => setViewMode(viewMode === "compiled" ? "raw" : "compiled")}
            />
            <span className="slider round"></span>
          </label>
          <span className="toggle-label">
            {viewMode === "compiled" ? "PDF" : "Math"}
          </span>
        </div>


      </div>

      <div className="latex-editor-split">
        <div className="latex-editor-pane">
          <CodeMirror
            value={latex}
            height="100%"
            extensions={[
              StreamLanguage.define(stex),
              linter(latexLinter()),
              lintGutter(),
              autocompletion({ override: [completeFromList([...fullCommands, ...dynamicMacros])] }),
              EditorView.lineWrapping,
              customLatexInputHandler,
            ]}
            theme="dark"
            onCreateEditor={(view) => (editorRef.current = { view })}
            onChange={(value) => {
              setLatex(value);
              setSaved(false);
            }}
            className="latex-editor-codemirror"
          />
          {errorMsg && (
            <div className="latex-error-box">
              ⚠ LaTeX Error:<br />
              <pre>{errorMsg}</pre>
            </div>
          )}
        </div>
        <div className="latex-preview-pane">
          {viewMode === "compiled" ? (
            pdfURL ? (
              <iframe src={pdfURL} title="PDF Preview" width="100%" height="100%" style={{ border: "none" }} />
            ) : (
              <div className="preview-placeholder">Compile to view PDF</div>
            )
          ) : (
            <div className="katex-preview">
              {latex.split("\n").map((line, i) => (
                <div key={i} className="math-line">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: katex.renderToString(line.trim(), {
                        displayMode: false,
                        throwOnError: false
                      }),
                    }}
                  />
                </div>
              ))}
            </div>

          )}
        </div>
      </div>

      {showConfig && (
        <div className="create-post-overlay">
          <div className="create-post-card">
            <button className="create-post-overlay-close-btn" onClick={() => setShowConfig(false)}>✖</button>
            <div className="create-post-card-content">
              <div className="create-post-card-content-inner">
                <h2>Editor Configuration</h2>
                <div className="post-settings">
                  <div>
                    <h3>Upload Custom Files</h3>
                    <input type="file" multiple onChange={e => setCustomFiles([...e.target.files])} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaTeXEditor;
