import { useEffect, useState } from "react";
import axios from "axios";
import MonacoEditor from "@monaco-editor/react";

const CodeEditor = ({ projectId }) => {
  const [code, setCode] = useState(""), [language, setLanguage] = useState("javascript");

  useEffect(() => {
    axios.get(`/api/tools/${projectId}/code/`).then(res => {
      setCode(res.data.code || "");
      setLanguage(res.data.language || "javascript");
    });
  }, [projectId]);

  const save = () => {
    axios.put(`/api/tools/${projectId}/code/`, { code, language });
  };

  return (
    <div>
      <h3>Code Editor</h3>
      <MonacoEditor
        height="500px"
        defaultLanguage={language}
        value={code}
        theme="vs-dark"
        onChange={(val) => setCode(val)}
      />
      <button onClick={save}>Save</button>
    </div>
  );
};

export default CodeEditor;