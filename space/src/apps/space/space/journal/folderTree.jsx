// src/features/space/components/apps/JournalApp/FolderTree.jsx

import React, { useState } from 'react';
import { FaFolder, FaFolderOpen, FaChevronRight, FaChevronDown } from 'react-icons/fa';

const FolderTreeItem = ({ folder, selectedFolder, onSelectFolder, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubfolders = folder.subfolders && folder.subfolders.length > 0;
  const isSelected = selectedFolder === folder.id;

  return (
    <div className="folder-tree-item">
      <button
        className={`folder-item-btn ${isSelected ? 'active' : ''}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelectFolder(folder.id)}
      >
        {hasSubfolders && (
          <span
            className="folder-toggle"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
          >
            {isOpen ? <FaChevronDown /> : <FaChevronRight />}
          </span>
        )}
        {!hasSubfolders && <span className="folder-spacer" />}
        
        <span className="folder-icon" style={{ color: folder.color }}>
          {isOpen ? <FaFolderOpen /> : <FaFolder />}
        </span>
        
        <span className="folder-name">{folder.name}</span>
        
        {folder.entries_count > 0 && (
          <span className="folder-count">{folder.entries_count}</span>
        )}
      </button>

      {isOpen && hasSubfolders && (
        <div className="folder-subfolders">
          {folder.subfolders.map(subfolder => (
            <FolderTreeItem
              key={subfolder.id}
              folder={subfolder}
              selectedFolder={selectedFolder}
              onSelectFolder={onSelectFolder}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FolderTree = ({ folders, selectedFolder, onSelectFolder }) => {
  // Get only root folders (no parent)
  const rootFolders = folders.filter(f => !f.parent);

  if (rootFolders.length === 0) {
    return (
      <div className="folder-tree-empty">
        <p>No folders yet</p>
      </div>
    );
  }

  return (
    <div className="folder-tree">
      {rootFolders.map(folder => (
        <FolderTreeItem
          key={folder.id}
          folder={folder}
          selectedFolder={selectedFolder}
          onSelectFolder={onSelectFolder}
        />
      ))}
    </div>
  );
};

export default FolderTree;