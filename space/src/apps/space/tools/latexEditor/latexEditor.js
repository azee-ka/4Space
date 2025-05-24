import { useEffect, useState } from "react";
import axios from "axios";
import TeX from "@matejmazur/react-katex";

const LaTeXEditor = ({ projectId }) => {
  const [latex, setLatex] = useState("");

  useEffect(() => {
    axios.get(`/api/tools/${projectId}/latex/`).then(res => setLatex(res.data.content || ""));
  }, [projectId]);

  const save = () => {
    axios.put(`/api/tools/${projectId}/latex/`, { content: latex });
  };

  return (
    <div>
      <h3>LaTeX Editor</h3>
      <textarea value={latex} onChange={(e) => setLatex(e.target.value)} rows={10} style={{ width: "100%" }} />
      <TeX block math={latex} />
      <button onClick={save}>Save</button>
    </div>
  );
};

export default LaTeXEditor;