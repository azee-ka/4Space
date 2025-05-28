import { useState } from "react";

export default function useFolderStructure() {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [folderStructure, setFolderStructure] = useState([]);
    const [currentPath, setCurrentPath] = useState([]);

const handleFileSelect = (e) => {
  const newFiles = Array.from(e.target.files);

  // helper to insert into your folder tree
  const insertIntoTree = (tree, pathSegments, fileObj) => {
    if (pathSegments.length === 0) return;
    const name = pathSegments[0];
    const isLast = pathSegments.length === 1;
    let node = tree.find((n) => n.name === name);

    if (!node && !isLast) {
      node = { name, type: "folder", children: [] };
      tree.push(node);
    }

    if (isLast) {
      const exists = tree.some((n) => n.name === name && n.type === "file");
      if (!exists) {
        tree.push({ name, type: "file", file: fileObj });
      }
    } else {
      if (!node.children) node.children = [];
      insertIntoTree(node.children, pathSegments.slice(1), fileObj);
    }
  };

  // split out “top‐level” files vs ones from inside a folder
  const rootFiles = newFiles.filter(
    (f) => !f.webkitRelativePath || !f.webkitRelativePath.includes("/")
  );
  const nestedFiles = newFiles.filter(
    (f) => f.webkitRelativePath && f.webkitRelativePath.includes("/")
  );

  // 1) add only truly top‐level files to Unassigned
  setSelectedFiles((prev) => {
    const uniqueRoots = rootFiles.filter((nf) => !prev.some((f) => f.name === nf.name));
    return [...prev, ...uniqueRoots];
  });

  // 2) insert only the nested ones into your folderStructure
  setFolderStructure((prev) => {
    const cloned = structuredClone(prev);
    for (const file of nestedFiles) {
      const segments = file.webkitRelativePath.split("/");
      insertIntoTree(cloned, segments, file);
    }
    return cloned;
  });
};



    const createFolder = (name) => {
        if (!name.trim()) return;

        const updateRecursive = (folders, depth = 0) =>
            folders.map((folder) => {
                if (
                    depth === currentPath.length &&
                    folder.name === currentPath[depth - 1]
                ) {
                    return {
                        ...folder,
                        children: [
                            ...(folder.children || []),
                            { name, type: "folder", children: [] },
                        ],
                    };
                }
                if (folder.children) {
                    return {
                        ...folder,
                        children: updateRecursive(folder.children, depth + 1),
                    };
                }
                return folder;
            });

        if (currentPath.length === 0) {
            setFolderStructure((prev) => [
                ...prev,
                { name, type: "folder", children: [] },
            ]);
        } else {
            setFolderStructure(updateRecursive(folderStructure));
        }
    };

    const getCurrentFolder = () => {
        let folder = { children: folderStructure };
        for (let name of currentPath) {
            folder = folder.children.find(
                (f) => f.name === name && f.type === "folder"
            );
            if (!folder) break;
        }
        return folder || { children: [] };
    };

    const assignFileToFolder = (file) => {
        setSelectedFiles((prev) => prev.filter((f) => f.name !== file.name));

        const insertRecursive = (folders, pathIndex = 0) => {
            return folders.map((folder) => {
                if (
                    folder.type === "folder" &&
                    folder.name === currentPath[pathIndex]
                ) {
                    if (pathIndex === currentPath.length - 1) {
                        const exists = folder.children.some((c) => c.name === file.name);
                        if (!exists) {
                            return {
                                ...folder,
                                children: [
                                    ...folder.children,
                                    { name: file.name, type: "file", file },
                                ],
                            };
                        }
                        return folder;
                    }
                    return {
                        ...folder,
                        children: insertRecursive(folder.children || [], pathIndex + 1),
                    };
                }
                return folder;
            });
        };

        setFolderStructure((prev) => insertRecursive(prev));
    };


    // NEW: insert into _any_ folder path you pass in
    const assignFileToFolderAtPath = (file, targetPath) => {
        // 1) remove from unassigned
        setSelectedFiles((prev) => prev.filter((f) => f.name !== file.name));

        // 2) walk the tree along targetPath and insert at the end
        const insertAt = (folders, pathSegments, idx = 0) => {
            return folders.map((f) => {
                if (f.type === "folder" && f.name === pathSegments[idx]) {
                    if (idx === pathSegments.length - 1) {
                        // we're at the drop‐target
                        const already = f.children.some((c) => c.name === file.name);
                        return already
                            ? f
                            : { ...f, children: [...f.children, { name: file.name, type: "file", file }] };
                    }
                    return { ...f, children: insertAt(f.children || [], pathSegments, idx + 1) };
                }
                return f;
            });
        };

        setFolderStructure((prev) => insertAt(prev, targetPath));
    };



    const removeFile = (filename) => {
        setSelectedFiles((prev) => prev.filter((f) => f.name !== filename));

        const removeRecursive = (folders) =>
            folders
                .map((f) => {
                    if (f.type === "folder") {
                        return {
                            ...f,
                            children: removeRecursive(f.children),
                        };
                    }
                    return f;
                })
                .filter((f) => f.type !== "file" || f.name !== filename);

        setFolderStructure((prev) => removeRecursive(prev));
    };

    return {
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
    };
}
