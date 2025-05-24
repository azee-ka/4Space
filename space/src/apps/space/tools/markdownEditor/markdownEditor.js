import { useEffect, useState } from "react";
import axios from "axios";

const MarkdownEditor = ({ projectId }) => {
  const [content, setContent] = useState("");

  useEffect(() => {
    axios.get(`/api/tools/${projectId}/markdown/`).then(res => setContent(res.data.content || ""));
  }, [projectId]);

  const save = () => {
    axios.put(`/api/tools/${projectId}/markdown/`, { content });
  };

  return (
    <div>
      <h3>Markdown Editor</h3>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={20} style={{ width: "100%" }} />
      <button onClick={save}>Save</button>
    </div>
  );
};

export default MarkdownEditor;