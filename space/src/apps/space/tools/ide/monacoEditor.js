import { useEffect, useRef, useState } from "react";

window.MonacoEnvironment = {
  getWorker: function (_, label) {
    switch (label) {
      case 'json':
        return new Worker(new URL('monaco-editor/esm/vs/language/json/json.worker?worker', import.meta.url), { type: 'module' });
      case 'css':
      case 'scss':
      case 'less':
        return new Worker(new URL('monaco-editor/esm/vs/language/css/css.worker?worker', import.meta.url), { type: 'module' });
      case 'html':
      case 'handlebars':
      case 'razor':
        return new Worker(new URL('monaco-editor/esm/vs/language/html/html.worker?worker', import.meta.url), { type: 'module' });
      case 'typescript':
      case 'javascript':
        return new Worker(new URL('monaco-editor/esm/vs/language/typescript/ts.worker?worker', import.meta.url), { type: 'module' });
      default:
        return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker?worker', import.meta.url), { type: 'module' });
    }
  }
};



const MonacoEditor = ({ file, onChange }) => {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const [monaco, setMonaco] = useState(null);

  useEffect(() => {
    import("monaco-editor").then((monacoInstance) => {
      setMonaco(monacoInstance);
    });
  }, []);

  useEffect(() => {
    if (!monaco || !containerRef.current || !file) return;

    if (editorRef.current) editorRef.current.dispose();

    editorRef.current = monaco.editor.create(containerRef.current, {
      value: file.content,
      language: file.language || "javascript",
      theme: "vs-dark",
      automaticLayout: true,
    });

    editorRef.current.onDidChangeModelContent(() => {
      const content = editorRef.current.getValue();
      onChange?.(content);
    });

    return () => editorRef.current?.dispose();
  }, [monaco, file]);

  return <div className="editor-pane" ref={containerRef}></div>;
};

export default MonacoEditor;
