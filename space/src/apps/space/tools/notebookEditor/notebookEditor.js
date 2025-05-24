import { useEffect, useState } from "react";
import axios from "axios";

const NotebookEditor = ({ projectId }) => {
  const [cells, setCells] = useState([]);

  useEffect(() => {
    axios.get(`/api/tools/${projectId}/notebook/`).then(res => setCells(res.data.cells || []));
  }, [projectId]);

  const addCell = () => {
    setCells([...cells, { type: "code", input: "", output: "" }]);
  };

  const updateCell = (index, input) => {
    const newCells = [...cells];
    newCells[index].input = input;
    setCells(newCells);
  };

  const save = () => {
    axios.put(`/api/tools/${projectId}/notebook/`, { cells });
  };

  return (
    <div>
      <h3>Notebook Editor</h3>
      {cells.map((cell, i) => (
        <textarea
          key={i}
          value={cell.input}
          onChange={(e) => updateCell(i, e.target.value)}
          rows={5}
          style={{ width: "100%", marginBottom: "1rem" }}
        />
      ))}
      <button onClick={addCell}>Add Cell</button>
      <button onClick={save}>Save</button>
    </div>
  );
};

export default NotebookEditor;
