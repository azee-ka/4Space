import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MonacoEditor from "./monacoEditor";
import FileExplorer from "./fileExplorer";
import FileTabs from "./fileTabs";
import {
  fetchCodeFiles,
  createCodeFile,
  saveCodeFileContent
} from "../../../../../services/space";
import { CODE_FILES } from "../../../../../services/queryKeys";
import "./ide.css";

const CodeIDE = ({ projectId: projectIdProp }) => {
  const { projectId: projectIdUrl } = useParams();
  const projectId = projectIdProp || projectIdUrl;
  const queryClient = useQueryClient();

  // 1. Query to fetch all files
  const { data: files = [], isLoading } = useQuery({
    queryKey: CODE_FILES(projectId),
    queryFn: () => fetchCodeFiles(projectId),
    enabled: !!projectId,
  });

  // 2. Local state for active file (id or object)
  const [activeFile, setActiveFile] = useState(null);

  // Keep active file object in sync if files change
  // Set first file as active if none selected
  React.useEffect(() => {
    if (!activeFile && files.length > 0) setActiveFile(files[0]);
    // If active file id no longer exists, switch to first
    if (activeFile && !files.some(f => f.id === activeFile.id)) {
      setActiveFile(files[0] || null);
    }
  }, [files, activeFile]);

  // 3. Create new file
  const createMutation = useMutation({
    mutationFn: ({ filename, language }) => createCodeFile({ projectId, filename, language }),
    onSuccess: (newFile) => {
      queryClient.invalidateQueries(CODE_FILES(projectId));
      setActiveFile(newFile);
    },
  });

  // 4. Save file content (for currently active file)
  const saveMutation = useMutation({
    mutationFn: ({ fileId, content }) =>
      saveCodeFileContent({ projectId, fileId, content }),
    onSuccess: (updatedFile) => {
      // Immediately update just this file in cache
      queryClient.setQueryData(CODE_FILES(projectId), oldFiles => {
        if (!oldFiles) return oldFiles;
        return oldFiles.map(f => (f.id === updatedFile.id ? updatedFile : f));
      });
    }
  });

  // 5. Handler for new file
  const createFile = () => {
    const filename = prompt("Filename?");
    if (!filename) return;
    createMutation.mutate({ filename, language: "javascript" });
  };

  // 6. Handler for editing file
  const updateFileContent = (content) => {
    if (!activeFile) return;
    setActiveFile({ ...activeFile, content });
    // Optionally debounce this save call for UX!
    saveMutation.mutate({ fileId: activeFile.id, content });
  };

  return (
    <div className="vscode-ide">
      <FileExplorer
        files={files}
        activeFile={activeFile}
        setActiveFile={setActiveFile}
        onNewFile={createFile}
      />
      <div className="ide-main">
        <FileTabs files={files} active={activeFile} setActiveFile={setActiveFile} />
        <MonacoEditor file={activeFile} onChange={updateFileContent} />
      </div>
    </div>
  );
};

export default CodeIDE;
