import { useEffect, useState } from "react";
import useApi from "../../../../utils/useApi";
import MonacoEditor from "./monacoEditor";
import FileExplorer from "./fileExplorer";
import FileTabs from "./fileTabs";
import "./ide.css";
import { useParams } from "react-router-dom";

const CodeIDE = ({ projectId: projectIdProp }) => {
  const { projectId: projectIdUrl } = useParams();

  const projectId = projectIdProp || projectIdUrl;

  const { callApi } = useApi();
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await callApi(`space/tools/${projectId}/code/files/`);
        console.log("Loaded files:", response.data);
        setFiles(response.data || []);
        setActiveFile(response.data?.[0] || null);
      } catch (error) {
        console.error("Failed to load IDE:", error);
      }
    }
    load();
  }, [projectId]);

  const createFile = async () => {
    try {
      const filename = prompt("Filename?");
      if (!filename) return;
      const res = await callApi(`space/tools/${projectId}/code/files/`, "POST", { filename, language: "javascript", content: "" });
      setFiles((prev) => [...prev, res.data]);
      setActiveFile(res.data);
    } catch (error) {
      console.error("Failed to create file:", error);
    }
  };

  const updateFileContent = (content) => {
    if (!activeFile) return;
    setActiveFile({ ...activeFile, content });
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
