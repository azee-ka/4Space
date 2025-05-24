import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
import css from "highlight.js/lib/languages/css";
import json from "highlight.js/lib/languages/json";
import python from "highlight.js/lib/languages/python";

import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Eraser,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link as LinkIcon, Image as ImageIcon,
  Code, Table as TableIcon, PaintBucket, Type,
  ArrowRight, ArrowLeft, Subscript as SubIcon, Superscript as SuperIcon
} from "lucide-react";

import useApi from "../../../../utils/useApi";
import "./richEditor.css";

const lowlight = createLowlight();
lowlight.register("javascript", js);
lowlight.register("html", html);
lowlight.register("css", css);
lowlight.register("json", json);
lowlight.register("python", python);

const RichTextEditor = () => {
  const { projectId } = useParams();
  const { callApi } = useApi();
  const [initialContent, setInitialContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);

  const menus = {
    File: ["New", "Open", "Save", "Download"],
    Edit: ["Undo", "Redo", "Cut", "Copy", "Paste"],
    Insert: ["Image", "Table", "Link", "Horizontal Line"],
    Format: ["Bold", "Italic", "Underline", "Highlight", "Clear Format"],
    Tools: ["Word Count"],
    Help: ["Docs", "Keyboard Shortcuts"]
  };

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
      Superscript
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "editor-content",
      },
    },
    onUpdate: ({ editor }) => {
      setInitialContent(editor.getHTML());
    },
  });

  const toolbarGroups = [
    {
      label: "Font",
      items: [
        [<Bold size={18} />, () => editor.chain().focus().toggleBold().run()],
        [<Italic size={18} />, () => editor.chain().focus().toggleItalic().run()],
        [<UnderlineIcon size={18} />, () => editor.chain().focus().toggleUnderline().run()],
        [<SuperIcon size={18} />, () => editor.chain().focus().toggleSuperscript().run()],
        [<SubIcon size={18} />, () => editor.chain().focus().toggleSubscript().run()],
        [<Eraser size={18} />, () => editor.chain().focus().unsetAllMarks().run()],
      ]
    },
    {
      label: "Color",
      items: [
        [<Type size={18} />, () => {
          const color = prompt("Text color?");
          if (color) editor.chain().focus().setColor(color).run();
        }],
        [<PaintBucket size={18} />, () => {
          const color = prompt("Highlight color?");
          if (color) editor.chain().focus().setHighlight({ color }).run();
        }]
      ]
    },
    {
      label: "Paragraph",
      items: [
        [<AlignLeft size={18} />, () => editor.chain().focus().setTextAlign("left").run()],
        [<AlignCenter size={18} />, () => editor.chain().focus().setTextAlign("center").run()],
        [<AlignRight size={18} />, () => editor.chain().focus().setTextAlign("right").run()],
        [<List size={18} />, () => editor.chain().focus().toggleBulletList().run()],
        [<ListOrdered size={18} />, () => editor.chain().focus().toggleOrderedList().run()],
        [<ArrowRight size={18} />, () => editor.chain().focus().sinkListItem("listItem").run()],
        [<ArrowLeft size={18} />, () => editor.chain().focus().liftListItem("listItem").run()],
      ]
    },
    {
      label: "Insert",
      items: [
        [<LinkIcon size={18} />, () => {
          const url = prompt("Enter URL");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }],
        [<ImageIcon size={18} />, () => {
          const url = prompt("Image URL");
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }],
        [<TableIcon size={18} />, () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()],
        [<Code size={18} />, () => editor.chain().focus().toggleCodeBlock().run()]
      ]
    }
  ];

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await callApi(`tools/${projectId}/richtext/`, "GET");
        setInitialContent(res.data.content || "");
      } catch (err) {
        console.error("Failed to load content:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [projectId]);

  const save = async () => {
    try {
      await callApi(`tools/${projectId}/richtext/`, "PUT", {
        content: initialContent,
      });
      alert("Saved!");
    } catch (err) {
      console.error("Save error:", err);
      alert("Save failed.");
    }
  };

  if (loading || !editor) return <p>Loading editor...</p>;

  return (
    <div className="doc-editor-container">
      <div className="editor-header">
        <div className="doc-title" contentEditable suppressContentEditableWarning>
          Untitled Document
        </div>
        <button className="save-btn" onClick={save}>
          💾
        </button>
      </div>

      <div className="editor-menubar">
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
      </div>

<div className="editor-toolbar">
  <div className="toolbar-selects">
    <select onChange={(e) => editor.chain().focus().setFontFamily?.(e.target.value).run()}>
      <option value="Arial">Arial</option>
      <option value="Inter">Inter</option>
      <option value="Georgia">Georgia</option>
      <option value="Courier New">Courier New</option>
    </select>

    <select onChange={(e) => editor.chain().focus().setFontSize?.(e.target.value).run()}>
      {[8, 10, 12, 14, 16, 18, 24, 32, 48].map(size => (
        <option key={size} value={size}>{size}px</option>
      ))}
    </select>
  </div>

  {/* FLATTENED BUTTONS */}
  <div className="toolbar-buttons">
    {toolbarGroups.flatMap(group =>
      group.items.map(([icon, action], idx) => (
        <button key={idx} onClick={action} className="toolbar-btn">{icon}</button>
      ))
    )}
  </div>
</div>


      <div className="page-container">
        <div className="editor-paper">
          <EditorContent editor={editor} />
        </div>
      </div>

      <div className="editor-footer">
        {editor.storage.characterCount.words()} words • {editor.storage.characterCount.characters()} characters
      </div>
    </div>
  );
};

export default RichTextEditor;
