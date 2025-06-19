import React, { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Heading from "@tiptap/extension-heading";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";

import { createLowlight } from "lowlight";
import js from "highlight.js/lib/languages/javascript";
import html from "highlight.js/lib/languages/xml";
import cssLang from "highlight.js/lib/languages/css";
import json from "highlight.js/lib/languages/json";
import python from "highlight.js/lib/languages/python";

import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Eraser,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link as LinkIcon, Image as ImageIcon,
  Code, Table as TableIcon, PaintBucket, Type,
  ArrowRight, ArrowLeft, Subscript as SubIcon, Superscript as SuperIcon,
  Share2
} from "lucide-react";

import {
  fetchRichTextContent,
  saveRichTextContent
} from "../../../../services/space";
import { RICH_TEXT_CONTENT } from "../../../../services/queryKeys";
import "./richEditor.css";
import { timeAgo } from "../../../../utils/convertDateTIme";

const lowlight = createLowlight();
lowlight.register("javascript", js);
lowlight.register("html", html);
lowlight.register("css", cssLang);
lowlight.register("json", json);
lowlight.register("python", python);

const RichTextEditor = () => {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const prevContentRef = useRef("");
  const autoSaveRef = useRef(null);

  const [lastSaved, setLastSaved] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [margin, setMargin] = useState("1in");

  // Query: load content
  const { data: initialContent = "", isLoading } = useQuery({
    queryKey: RICH_TEXT_CONTENT(projectId),
    queryFn: () => fetchRichTextContent(projectId),
    enabled: !!projectId
  });

  // Mutation: save content
  const saveMutation = useMutation({
    mutationFn: ({ content }) => saveRichTextContent({ projectId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries(RICH_TEXT_CONTENT(projectId));
      setLastSaved(new Date());
    }
  });

  // Editor instance
  const [content, setContent] = useState(initialContent);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Start typing your document..." }),
      CharacterCount.configure({ limit: 100000 }),
      Highlight,
      Color,
      Link.configure({ openOnClick: true }),
      Image,
      TaskList,
      TaskItem,
      CodeBlockLowlight.configure({ lowlight }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      HorizontalRule,
      Subscript,
      Superscript,
    ],
    content: initialContent,
    editorProps: {
      attributes: { class: "editor-content" },
    },
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
  });

  // Sync content from query into editor after load
  React.useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent, false);
      setContent(initialContent);
      prevContentRef.current = initialContent;
    }
    // eslint-disable-next-line
  }, [editor, initialContent]);

  // Autosave logic (every 5s if dirty)
  React.useEffect(() => {
    if (!editor) return;
    autoSaveRef.current = setInterval(() => {
      const currentContent = editor.getHTML();
      if (currentContent !== prevContentRef.current) {
        saveMutation.mutate({ content: currentContent });
        prevContentRef.current = currentContent;
      }
    }, 5000);
    return () => clearInterval(autoSaveRef.current);
    // eslint-disable-next-line
  }, [editor, projectId]);

  const menus = {
    File: ["New", "Open", "Rename", "Download as PDF", "Print"],
    Edit: ["Undo", "Redo", "Cut", "Copy", "Paste", "Find and Replace"],
    View: ["Show Ruler", "Document Outline", "Compact Mode"],
    Insert: ["Image", "Table", "Link", "Horizontal Line", "Page Break"],
    Format: ["Bold", "Italic", "Underline", "Highlight", "Clear Format", "Text Color", "Background Color"],
    Tools: ["Word Count", "Voice Typing (TBD)", "Spelling & Grammar"],
    Help: ["Docs", "Keyboard Shortcuts", "Send Feedback"]
  };

  const toolbarActions = [
    [<Bold size={18} />, () => editor.chain().focus().toggleBold().run(), () => editor.isActive('bold')],
    [<Italic size={18} />, () => editor.chain().focus().toggleItalic().run(), () => editor.isActive('italic')],
    [<UnderlineIcon size={18} />, () => editor.chain().focus().toggleUnderline().run(), () => editor.isActive('underline')],
    [<Strikethrough size={18} />, () => editor.chain().focus().toggleStrike().run(), () => editor.isActive('strike')],
    [<SuperIcon size={18} />, () => editor.chain().focus().toggleSuperscript().run(), () => editor.isActive('superscript')],
    [<SubIcon size={18} />, () => editor.chain().focus().toggleSubscript().run(), () => editor.isActive('subscript')],
    [<Eraser size={18} />, () => editor.chain().focus().unsetAllMarks().run(), null],
    [<AlignLeft size={18} />, () => editor.chain().focus().setTextAlign("left").run(), () => editor.isActive({ textAlign: "left" })],
    [<AlignCenter size={18} />, () => editor.chain().focus().setTextAlign("center").run(), () => editor.isActive({ textAlign: "center" })],
    [<AlignRight size={18} />, () => editor.chain().focus().setTextAlign("right").run(), () => editor.isActive({ textAlign: "right" })],
    [<List size={18} />, () => editor.chain().focus().toggleBulletList().run(), () => editor.isActive('bulletList')],
    [<ListOrdered size={18} />, () => editor.chain().focus().toggleOrderedList().run(), () => editor.isActive('orderedList')],
    [<ArrowRight size={18} />, () => editor.chain().focus().sinkListItem("listItem").run(), null],
    [<ArrowLeft size={18} />, () => editor.chain().focus().liftListItem("listItem").run(), null],
    [<LinkIcon size={18} />, () => {
      const url = prompt("Enter URL");
      if (url) editor.chain().focus().setLink({ href: url }).run();
    }, () => editor.isActive('link')],
    [<ImageIcon size={18} />, () => {
      const url = prompt("Image URL");
      if (url) editor.chain().focus().setImage({ src: url }).run();
    }, null],
    [<TableIcon size={18} />, () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), null],
    [<Code size={18} />, () => editor.chain().focus().toggleCodeBlock().run(), () => editor.isActive('codeBlock')],
    [<PaintBucket size={18} />, () => {
      const color = prompt("Highlight color?");
      if (color) editor.chain().focus().setHighlight({ color }).run();
    }, null],
    [<Type size={18} />, () => {
      const color = prompt("Text color?");
      if (color) editor.chain().focus().setColor(color).run();
    }, null],
  ];

  if (isLoading || !editor) return <p>Loading editor...</p>;

  return (
    <div className="doc-editor-container">
      <header className="editor-header">
        <div className="doc-title" contentEditable suppressContentEditableWarning>
          Untitled Document
        </div>
        <div className="doc-actions">
          <span className="autosave-indicator">
            {lastSaved ? `Last Updated ${timeAgo(lastSaved)}` : "Not saved yet"}
          </span>
          <button className="share-btn"><Share2 size={16} /> Share</button>
        </div>
      </header>

      <nav className="editor-menubar">
        {Object.keys(menus).map(menu => (
          <div
            className="menu-item"
            onMouseEnter={() => setActiveMenu(menu)}
            onMouseLeave={() => setActiveMenu(null)}
            key={menu}
          >
            {menu}
            {activeMenu === menu && (
              <div className="dropdown-menu">
                {menus[menu].map((item, i) => (
                  <div className="dropdown-item" key={i}>{item}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="editor-toolbar">
        <select onChange={e => editor.chain().focus().setFontFamily?.(e.target.value).run()}>
          {["Arial", "Inter", "Georgia", "Courier New"].map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <select onChange={e => editor.chain().focus().setFontSize?.(e.target.value).run()}>
          {[8, 10, 12, 14, 16, 18, 24, 32, 48].map(size => (
            <option key={size} value={size}>{size}px</option>
          ))}
        </select>
        <select onChange={e => setMargin(e.target.value)} value={margin}>
          <option value="0.5in">Narrow</option>
          <option value="1in">Normal</option>
          <option value="1.5in">Wide</option>
        </select>
        {toolbarActions.map(([icon, action, isActive], i) => (
          <button
            key={i}
            onClick={action}
            className={`toolbar-btn ${isActive && isActive() ? "active" : ""}`}
          >
            {icon}
          </button>
        ))}
      </div>

      <div className="ruler" />

      <main className="page-container">
        <div className="editor-pages">
          <EditorContent editor={editor} />
        </div>
      </main>

      <footer className="editor-footer">
        {editor.storage.characterCount.words()} words • {editor.storage.characterCount.characters()} characters
      </footer>
    </div>
  );
};

export default RichTextEditor;
