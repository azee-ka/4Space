// src/components/UploadModal.js
import React from "react";
import useFolderStructure from "../../../../../hooks/useFolderStructure";
import "./repositoryView.css"; // or your scoped modal styles

import {
  FaJsSquare,
  FaHtml5,
  FaCss3Alt,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaReact,
  FaFileArchive,
  FaFileAlt,
} from "react-icons/fa";
import { MdInsertDriveFile } from "react-icons/md";

const fileIconMap = {
  js: <FaJsSquare />,
  jsx: <FaReact />,
  ts: <FaJsSquare />,
  html: <FaHtml5 />,
  css: <FaCss3Alt />,
  pdf: <FaFilePdf />,
  doc: <FaFileWord />,
  docx: <FaFileWord />,
  xls: <FaFileExcel />,
  xlsx: <FaFileExcel />,
  zip: <FaFileArchive />,
  txt: <FaFileAlt />,
  default: <MdInsertDriveFile />,
};

const getFileIcon = (filename) => {
  if (!filename || typeof filename !== "string") return fileIconMap.default;
  const ext = filename.split(".").pop().toLowerCase();
  return fileIconMap[ext] || fileIconMap.default;
};

const onFileDragStart = (file, setDragTarget) => (e) => {
  // prevent dragging the “×” button
  if (e.target.tagName.toLowerCase() === "button") {
    e.preventDefault();
    return;
  }
  console.log("Dragging:", file.name);
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", file.name);
  setDragTarget(null);
};

const onFileDragEnd = (setDragTarget) => () => {
  setDragTarget(null);
};

export default function UploadModal({ onClose, onUpload }) {
  const {
    selectedFiles,
    setSelectedFiles,
    folderStructure,
    currentPath,
    setCurrentPath,
    handleFileSelect,
    createFolder,
    getCurrentFolder,
    assignFileToFolder,
    assignFileToFolderAtPath,
    removeFile,
  } = useFolderStructure();

  const [newFolderName, setNewFolderName] = React.useState("");
  const [dragTarget, setDragTarget] = React.useState(null);

  const currentFolder = getCurrentFolder();

  // Recursively pull every File object out of your tree
  const flattenTreeFiles = (nodes) => {
    let out = [];
    for (let entry of nodes) {
      if (entry.type === "file") {
        out.push(entry.file);
      } else if (entry.type === "folder" && entry.children) {
        out.push(...flattenTreeFiles(entry.children));
      }
    }
    return out;
  };

  const handleUpload = () => {
    // 1) all “root” files
    const roots = selectedFiles;
    // 2) all files inside any folders
    const nested = flattenTreeFiles(folderStructure);
    // 3) merge, dedupe by name (just in case)
    const allFiles = [
      ...roots,
      ...nested.filter((f) => !roots.some((r) => r.name === f.name)),
    ];

    // hand off to parent
    onUpload(allFiles);

    // reset state & close
    setSelectedFiles([]);
    // you may also want to clear folderStructure here if desired
    onClose();
  };

  // Recursively walk FileSystem entries and collect Files,
  // preserving a proper webkitRelativePath for each one.
  const traverseFileTree = (entry, path = "") =>
    new Promise((resolve) => {
      if (entry.isFile) {
        entry.file((file) => {
          file.webkitRelativePath = path + file.name;
          resolve([file]);
        });
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        dirReader.readEntries(async (entries) => {
          const filesNested = await Promise.all(
            entries.map((ent) => traverseFileTree(ent, path + entry.name + "/"))
          );
          resolve(filesNested.flat());
        });
      } else {
        resolve([]);
      }
    });

  const handleDrop = async (e) => {
    e.preventDefault();
    const items = Array.from(e.dataTransfer.items);
    // walk each DataTransferItem
    const filesNested = await Promise.all(
      items.map((item) => {
        const entry = item.webkitGetAsEntry?.();
        if (entry) {
          // directory or file entry
          return traverseFileTree(entry);
        } else if (item.kind === "file") {
          // fallback: plain file
          const file = item.getAsFile();
          file.webkitRelativePath = file.name;
          return Promise.resolve([file]);
        }
        return Promise.resolve([]);
      })
    );
    const files = filesNested.flat();
    handleFileSelect({ target: { files } });
  };

  const goBack = () => {
    setCurrentPath((prev) => prev.slice(0, -1));
  };

  const renderFileTree = () => (
    <>
      {currentPath.length > 0 && (
        <button className="repo-back-btn" onClick={goBack}>
          ← Back
        </button>
      )}

      {selectedFiles.length > 0 && currentPath.length === 0 && (
        <div className="repo-folder">
          <h4>Unassigned</h4>
          <ul className="repo-list small">
            {selectedFiles.map((file, i) => (
              <li
                key={i}
                className="repo-file-item"
                draggable
                onDragStart={onFileDragStart(file, setDragTarget)}
                onDragEnd={onFileDragEnd(setDragTarget)}
              >
                <span className="file-icon">{getFileIcon(file.name)}</span>
                <span>{file.name}</span>
                <button
                  className="remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.name);
                  }}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {currentFolder.children?.map((entry, i) =>
        entry.type === "folder" ? (
          <div
            key={i}
            className={`repo-folder ${
              dragTarget === entry.name ? "drag-over" : ""
            }`}
            onClick={() => setCurrentPath([...currentPath, entry.name])}
            onDragOver={(e) => {
              e.preventDefault();
              setDragTarget(entry.name);
            }}
            onDragLeave={() => setDragTarget(null)}
            onDrop={(e) => {
              e.preventDefault();
              // 1) get the filename from the DnD payload
              const fileName = e.dataTransfer.getData("text/plain");
              if (!fileName) return;
              // 2) find the actual File object in Unassigned
              const fileObj = selectedFiles.find((f) => f.name === fileName);
              if (!fileObj) return;

              // 3) insert it into THIS folder
              assignFileToFolderAtPath(fileObj, [...currentPath, entry.name]);

              // reset the hover state
              setDragTarget(null);
            }}
          >
            <h4>{entry.name}</h4>
          </div>
        ) : (
          <li
            key={i}
            className="repo-file-item"
            draggable
            onDragStart={onFileDragStart(entry.file, setDragTarget)}
            onDragEnd={onFileDragEnd(setDragTarget)}
          >
            {" "}
            <span className="file-icon">{getFileIcon(entry.name)}</span>
            <span>{entry.name}</span>
            <button
              className="remove-btn"
              onClick={() => removeFile(entry.name)}
            >
              ✕
            </button>
          </li>
        )
      )}
    </>
  );

  return (
    <div className="repo-modal-overlay" onClick={onClose}>
      <div className="repo-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Upload Files</h3>

        <div
          className="repo-drop-zone"
          onClick={() => document.getElementById("upload-files").click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const dropped = Array.from(e.dataTransfer.files);
            handleFileSelect({ target: { files: dropped } });
          }}
        >
          <p>Click or drag files/folders here to add</p>
          <input
            id="upload-files"
            type="file"
            multiple
            webkitdirectory="true"
            directory=""
            className="repo-file-input"
            onChange={handleFileSelect}
          />
        </div>

        <div className="repo-folder-bar">
          <input
            placeholder="New folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
          <button
            onClick={() => {
              createFolder(newFolderName);
              setNewFolderName("");
            }}
          >
            + Add Folder
          </button>
        </div>

        <div className="repo-file-tree">{renderFileTree()}</div>

        <div className="repo-modal__actions">
          <button onClick={handleUpload}>Upload</button>
          <button className="cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
