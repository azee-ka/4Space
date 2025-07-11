import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMarkdownContent, saveMarkdownContent } from "../../../../../services/space";
import { MARKDOWN_CONTENT } from "../../../../../services/queryKeys";

const MarkdownEditor = ({ projectId }) => {
  const queryClient = useQueryClient();

  // Query for markdown content
  const { data: content = "", isLoading } = useQuery({
    queryKey: MARKDOWN_CONTENT(projectId),
    queryFn: () => fetchMarkdownContent(projectId),
    enabled: !!projectId,
  });

  // Local state for textarea (so user can edit before saving)
  const [localContent, setLocalContent] = React.useState("");

  // Sync loaded content into local state on load/change
  React.useEffect(() => {
    setLocalContent(content);
  }, [content]);

  // Save mutation
  const mutation = useMutation({
    mutationFn: (newContent) => saveMarkdownContent({ projectId, content: newContent }),
    onSuccess: () => {
      queryClient.invalidateQueries(MARKDOWN_CONTENT(projectId));
    }
  });

  // Save handler
  const save = () => {
    mutation.mutate(localContent);
  };

  return (
    <div>
      <h3>Markdown Editor</h3>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <textarea
            value={localContent}
            onChange={e => setLocalContent(e.target.value)}
            rows={20}
            style={{ width: "100%" }}
          />
          <button onClick={save} disabled={mutation.isLoading}>
            {mutation.isLoading ? "Saving..." : "Save"}
          </button>
        </>
      )}
    </div>
  );
};

export default MarkdownEditor;
