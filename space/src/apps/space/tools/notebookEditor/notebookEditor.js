import React from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchNotebookCells, saveNotebookCells } from "../../../../services/space";
import { NOTEBOOK_CELLS } from "../../../../services/queryKeys";

const NotebookEditor = ({ projectId }) => {
  const queryClient = useQueryClient();

  // Load cells
  const { data: cells = [], isLoading } = useQuery({
    queryKey: NOTEBOOK_CELLS(projectId),
    queryFn: () => fetchNotebookCells(projectId),
    enabled: !!projectId,
  });

  // Save cells mutation
  const mutation = useMutation({
    mutationFn: (cells) => saveNotebookCells({ projectId, cells }),
    onSuccess: () => {
      queryClient.invalidateQueries(NOTEBOOK_CELLS(projectId));
    }
  });

  // Local edit state (so you can make changes before saving)
  const [localCells, setLocalCells] = React.useState([]);

  // Sync loaded cells into local state on load/change
  React.useEffect(() => {
    setLocalCells(cells);
  }, [cells]);

  // Add cell
  const addCell = () => {
    setLocalCells([...localCells, { type: "code", input: "", output: "" }]);
  };

  // Update cell
  const updateCell = (index, input) => {
    setLocalCells(cells =>
      cells.map((cell, i) =>
        i === index ? { ...cell, input } : cell
      )
    );
  };

  // Save cells (push to API)
  const save = () => {
    mutation.mutate(localCells);
  };

  return (
    <div>
      <h3>Notebook Editor</h3>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          {localCells.map((cell, i) => (
            <textarea
              key={i}
              value={cell.input}
              onChange={(e) => updateCell(i, e.target.value)}
              rows={5}
              style={{ width: "100%", marginBottom: "1rem" }}
            />
          ))}
          <button onClick={addCell}>Add Cell</button>
          <button onClick={save} disabled={mutation.isLoading}>
            {mutation.isLoading ? "Saving..." : "Save"}
          </button>
        </>
      )}
    </div>
  );
};

export default NotebookEditor;
