import React from "react";

const FileExplorer = ({ files, activeFile, setActiveFile, onNewFile }) => (
  <aside className="file-explorer">
    <div className="explorer-header">
      <span>EXPLORER</span>
      <button onClick={onNewFile}>+</button>
    </div>
    <ul>
      {files.map((file) => (
        <li
          key={file.id}
          className={file.id === activeFile?.id ? "active" : ""}
          onClick={() => setActiveFile(file)}
        >
          {file.filename}
        </li>
      ))}
    </ul>
  </aside>
);
export default FileExplorer;
