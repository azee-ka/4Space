import { useEffect, useState, useCallback, useRef } from "react";
import "./latexEditor.css";
import useApi from "../../../../utils/useApi";
import CodeMirror from "@uiw/react-codemirror";
import { StreamLanguage } from "@codemirror/language";
import { stex } from "@codemirror/legacy-modes/mode/stex";
import { useParams } from "react-router-dom";
import {
  FaBold, FaItalic, FaUnderline, FaHeading, FaListUl,
  FaSuperscript, FaDollarSign, FaFilePdf
} from "react-icons/fa";
import { MdFunctions } from "react-icons/md";

const LaTeXEditor = ({ projectIdProp }) => {
  const { projectId: projectIdUrl } = useParams();
  const { callApi } = useApi();
  const [latex, setLatex] = useState("");
  const [saved, setSaved] = useState(true);
  const [pdfURL, setPdfURL] = useState(null);
  const [customFiles, setCustomFiles] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const editorRef = useRef(null);

  const projectId = projectIdProp || projectIdUrl;

  useEffect(() => {
    const fetchLatex = async () => {
      try {
        const response = await callApi(`space/tools/${projectId}/latex/`);
        setLatex(response.data.content || "");
        setErrorMsg(null);
      } catch (err) {
        console.error("Error loading LaTeX content:", err);
        setErrorMsg("Failed to load LaTeX content.");
      }
    };
    if (projectId) fetchLatex();
  }, [projectId]);

  const save = useCallback(() => {
    if (!projectId) return;
    const saveLatex = async () => {
      try {
        await callApi(`space/tools/${projectId}/latex/`, "PUT", { content: latex });
        setSaved(true);
      } catch (err) {
        console.error("Saving LaTeX failed:", err);
        setErrorMsg("Save failed.");
      }
    };
    saveLatex();
  }, [latex, projectId, callApi]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!saved) save();
    }, 2000);
    return () => clearTimeout(timer);
  }, [latex, saved, save]);

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

  const insertAtCursor = (snippet) => {
    if (!editorRef.current) return;
    const view = editorRef.current.view;
    const { from } = view.state.selection.main;
    view.dispatch({
      changes: { from, insert: snippet },
      selection: { anchor: from + snippet.length }
    });
    view.focus();
  };

  const handleFileUpload = (e) => {
    setCustomFiles([...e.target.files]);
  };

  const compileLatex = async () => {
    setErrorMsg(null);
    try {
      // if (!latex.trim() && customFiles.length === 0) {
      //   const confirmGen = window.confirm("No LaTeX content found. Generate default document?");
      //   if (!confirmGen) return;
      // }

      const blob = new Blob([latex], { type: "text/plain" });
      const file = new File([blob], "document.tex");
      const formData = new FormData();
      formData.append("tex", file);
      customFiles.forEach(f => formData.append("files", f));

      const response = await callApi(
        `space/tools/${projectId}/latex/render/`,
        "POST",
        formData,
        "multipart/form-data",
        null,
        { responseType: "blob" }
      );
      console.log("Compile response:", response.data);


      // if (response.status !== 200) {
      //   const errorText = await response.data.text();
      //   const errorJson = JSON.parse(errorText);
      //   setErrorMsg(errorJson.stderr || errorJson.error || "Compilation error.");
      //   return;
      // }

      const pdfBlob = response.data;
      const url = URL.createObjectURL(pdfBlob);
      setPdfURL(url);
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  return (
    <div className="latex-editor-root">
      <div className="latex-editor-toolbar">
        <h2>LaTeX Editor</h2>
        <span className={`save-status ${saved ? "saved" : "unsaved"}`}>
          {saved ? "✓ Saved" : "• Unsaved"}
        </span>
      </div>

      <div className="latex-toolbar-iconbar">
        <button className="tooltip-btn" onClick={() => insertAtCursor("\\textbf{}")}>
          <FaBold /><span className="tooltip-text">Bold</span>
        </button>
        <button className="tooltip-btn" onClick={() => insertAtCursor("\\textit{}")}>
          <FaItalic /><span className="tooltip-text">Italic</span>
        </button>
        <button className="tooltip-btn" onClick={() => insertAtCursor("\\underline{}")}>
          <FaUnderline /><span className="tooltip-text">Underline</span>
        </button>
        <button className="tooltip-btn" onClick={() => insertAtCursor("\\section{}")}>
          <FaHeading /><span className="tooltip-text">Section</span>
        </button>
        <button className="tooltip-btn" onClick={() => insertAtCursor("\n\\begin{itemize}\n  \\item \n\\end{itemize}\n")}>
          <FaListUl /><span className="tooltip-text">Itemize List</span>
        </button>
        <button className="tooltip-btn" onClick={() => insertAtCursor("\n\\begin{equation}\n\n\\end{equation}\n")}>
          <MdFunctions /><span className="tooltip-text">Equation</span>
        </button>
        <button className="tooltip-btn" onClick={() => insertAtCursor("\\[  \\]")}>
          <FaSuperscript /><span className="tooltip-text">Display Math</span>
        </button>
        <button className="tooltip-btn" onClick={() => insertAtCursor("$  $")}>
          <FaDollarSign /><span className="tooltip-text">Inline Math</span>
        </button>
        <button className="tooltip-btn compile-btn" onClick={compileLatex}>
          <FaFilePdf /><span className="tooltip-text">Compile PDF</span>
        </button>
        <input type="file" multiple onChange={handleFileUpload} />
      </div>

      <div className="latex-editor-split">
        <div className="latex-editor-pane">
          <CodeMirror
            value={latex}
            height="100%"
            extensions={[StreamLanguage.define(stex)]}
            theme="dark"
            onCreateEditor={(view) => (editorRef.current = { view })}
            onChange={(value) => {
              setLatex(value);
              setSaved(false);
            }}
            className="latex-editor-codemirror"
          />
          {errorMsg && (
            <div style={{
              backgroundColor: "#2a0000",
              color: "#f88",
              padding: "10px",
              fontFamily: "monospace",
              borderTop: "1px solid #400",
              fontSize: "0.85em"
            }}>
              ⚠ LaTeX Error:<br />
              <pre style={{ whiteSpace: "pre-wrap" }}>{errorMsg}</pre>
            </div>
          )}
        </div>

        <div className="latex-preview-pane">
          {pdfURL ? (
            <iframe src={pdfURL} title="PDF Preview" width="100%" height="100%" style={{ border: "none" }} />
          ) : (
            <div className="preview-placeholder">
              {errorMsg ? "Fix LaTeX errors to view preview." : "Compile to view PDF"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LaTeXEditor;
