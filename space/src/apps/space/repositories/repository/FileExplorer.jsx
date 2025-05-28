import React, { useState, useMemo, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import "./fileExplorer.css";

const EXTENSION_TO_LANGUAGE = {
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  py: "python",
  java: "java",
  css: "css",
  html: "html",
  json: "json",
  md: "markdown",
  sh: "bash",
  go: "go",
  c: "c",
  cpp: "cpp",
  cs: "csharp",
  php: "php",
  rb: "ruby",
  swift: "swift",
  // add more as needed
};

function getLanguageFromFileName(filename) {
  const ext = filename.split(".").pop();
  return EXTENSION_TO_LANGUAGE[ext] || "text";
}

export default function FileExplorer({ files, initialPath = [], onClose }) {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [preview, setPreview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    setCurrentPath(initialPath);
    setPreview(null);
    setIsEditing(false);
  }, [initialPath]);

  // Build nested tree
  const tree = useMemo(() => {
    const root = { type: "folder", name: "/", children: [] };
    files.forEach((f) => {
      const parts = f.path.split("/");
      let node = root;
      parts.forEach((seg, idx) => {
        const isFile = idx === parts.length - 1;
        if (isFile) {
          node.children.push({ type: "file", name: seg, url: f.file_url });
        } else {
          let child = node.children.find(
            (c) => c.type === "folder" && c.name === seg
          );
          if (!child) {
            child = { type: "folder", name: seg, children: [] };
            node.children.push(child);
          }
          node = child;
        }
      });
    });
    return root;
  }, [files]);

  // Drill into currentPath
  const entries = useMemo(() => {
    let node = tree;
    for (let seg of currentPath) {
      const found = node.children.find(
        (c) => c.type === "folder" && c.name === seg
      );
      if (!found) return [];
      node = found;
    }
    return node.children || [];
  }, [tree, currentPath]);

  // Fetch & show file
  const openFile = async (file) => {
    try {
      const res = await fetch(file.url);
      const text = await res.text();
      setPreview({ name: file.name, content: text });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to load file:", err);
    }
  };

  // breadcrumbs
  const breadcrumbs = ["/", ...currentPath].map((seg, i) => ({
    name: seg,
    path: currentPath.slice(0, i),
  }));

  function renderPreview() {
    if (!preview)
      return <div className="fe-placeholder">Select a file to preview</div>;

    const language = getLanguageFromFileName(preview.name);
    const isCode = [
      "javascript",
      "jsx",
      "typescript",
      "tsx",
      "python",
      "java",
      "css",
      "html",
      "json",
      "markdown",
      "bash",
      "go",
      "c",
      "cpp",
      "csharp",
      "php",
      "ruby",
      "swift",
    ].includes(language);

    return (
      <div style={{ width: "100%", maxWidth: "100%", minHeight: 200 }}>
        <div className="fe-preview-header">
          <span className="fe-filename">{preview.name}</span>
          {!isEditing && isCode && (
            <button
              className="fe-edit-btn"
              onClick={() => {
                setIsEditing(true);
                setEditContent(preview.content);
              }}
            >
              Edit
            </button>
          )}
        </div>
        {isEditing ? (
          <>
            <textarea
              className="fe-code-edit-area"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
            <div className="fe-code-edit-btns">
              <button
                className="fe-code-save-btn"
                onClick={() => {
                  // TODO: save to backend here
                  setPreview((prev) => ({ ...prev, content: editContent }));
                  setIsEditing(false);
                }}
              >
                Save
              </button>
              <button
                className="fe-code-cancel-btn"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </>
        ) : isCode ? (
          <SyntaxHighlighter
            language={language}
            style={oneDark}
            showLineNumbers
            className="fe-code-preview"
            customStyle={{
              borderRadius: 8,
              fontSize: "0.93rem",
              padding: "1.1em",
              margin: 0,
              background: "#22272e",
            //   height: "100%",
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              boxSizing: "border-box",
            }}
            lineNumberStyle={{
              minWidth: "2.1em",
              color: "#5a5f66",
              fontWeight: 400,
              fontSize: "0.93em",
            }}
          >
            {preview.content}
          </SyntaxHighlighter>
        ) : (
          <pre className="fe-plain-text-preview">{preview.content}</pre>
        )}
      </div>
    );
  }

  return (
    <div className="fe-wrapper">
      <aside className="fe-sidebar">
        <button
          className="fe-back"
          onClick={() =>
            currentPath.length
              ? setCurrentPath((p) => p.slice(0, -1))
              : onClose()
          }
        >
          ← {currentPath.length ? "Up" : "Back"}
        </button>
        <div className="fe-breadcrumbs">
          {breadcrumbs.map((b, i) => (
            <button
              key={i}
              className="fe-bc-item"
              onClick={() => setCurrentPath(b.path)}
            >
              {b.name}
              {i < breadcrumbs.length - 1 && ""}
            </button>
          ))}
        </div>
        <ul className="fe-list">
          {entries.length ? (
            entries.map((e, i) => (
              <li key={i} className={`fe-item fe-${e.type}`}>
                <button
                  onClick={() =>
                    e.type === "folder"
                      ? setCurrentPath((cp) => [...cp, e.name])
                      : openFile(e)
                  }
                >
                  {e.name}
                </button>
              </li>
            ))
          ) : (
            <li className="fe-empty">(empty)</li>
          )}
        </ul>
      </aside>

      <section className="fe-content">{renderPreview()}</section>
    </div>
  );
}
