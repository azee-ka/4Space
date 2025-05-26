import React from "react";

const FileTabs = ({ files, active, setActiveFile }) => (
  <div className="tab-bar">
    {files.map((file) => (
      <div
        key={file.id}
        className={`tab ${file.id === active?.id ? "active" : ""}`}
        onClick={() => setActiveFile(file)}
      >
        {file.filename}
      </div>
    ))}
  </div>
);
export default FileTabs;
