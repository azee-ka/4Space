// src/utils/editor/editor.jsx
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle
} from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBold,
  faItalic,
  faUnderline,
  faStrikethrough,
  faListOl,
  faListUl,
  faAlignLeft,
  faAlignCenter,
  faAlignRight,
  faCode,
  faSuperscript,
  faSubscript,
  faImage
} from "@fortawesome/free-solid-svg-icons";
import EmojiButton from "./EmojiButton";
import "./editor.css";

const InlineBlot = Quill.import("blots/inline");
class Emoji extends InlineBlot {
  static blotName = "emoji";
  static tagName = "span";
  static className = "emoji";
  static create(value) {
    const node = super.create();
    node.textContent = value;
    return node;
  }
  static formats(node) {
    return node.textContent;
  }
  static value(node) {
    return node.textContent;
  }
}
Quill.register(Emoji, true);

const CustomEditor = forwardRef(
  (
    {
      content,
      onContentChange,
      placeholder = "Type something...",
      showToolbar = true,
      isPlainText = false,
      supportMedia = true,
      onImageUpload = () => {}
    },
    ref
  ) => {
    const editorRef = useRef(null);
    const quillRef = useRef(null);
    const [formats, setFormats] = useState({});

    useImperativeHandle(ref, () => ({
      insertEmoji: (emoji) => {
        if (!quillRef.current) return;
        const range = quillRef.current.getSelection(true);
        quillRef.current.insertEmbed(
          range.index,
          "emoji",
          emoji.native
        );
        quillRef.current.setSelection(
          range.index + emoji.native.length,
          0
        );
      }
    }));

    const initializeQuill = useCallback(() => {
      if (!editorRef.current || quillRef.current) return;

      const quill = new Quill(editorRef.current, {
        theme: "snow",
        placeholder,
        modules: { toolbar: false }
      });
      quillRef.current = quill;

      quill.on("selection-change", (range) => {
        if (range) {
          setFormats(quill.getFormat(range.index, 0));
        }
      });

      // ←── Modified text-change handler ──▶
      quill.on("text-change", () => {
        onContentChange(quill.root.innerHTML);
        const sel = quill.getSelection();
        if (sel) {
          setFormats(quill.getFormat(sel.index, 0));
        }
      });
      // ←───────────────────────────────────▶

      if (content) {
        quill.root.innerHTML = content;
      }
    }, [placeholder, content, onContentChange]);

    useEffect(() => {
      initializeQuill();
    }, [initializeQuill]);

    useEffect(() => {
      if (!quillRef.current) return;
      if (content === "") {
        quillRef.current.setContents([]);
      }
    }, [content]);

    const insertEmoji = (emoji) => {
      if (!quillRef.current) return;
      const range = quillRef.current.getSelection(true);
      quillRef.current.insertEmbed(
        range.index,
        "emoji",
        emoji.native
      );
      quillRef.current.setSelection(
        range.index + emoji.native.length,
        0
      );
    };

    const insertImage = () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = () => {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          const range = quillRef.current.getSelection(true);
          quillRef.current.insertEmbed(
            range.index,
            "image",
            reader.result
          );
        };
        reader.readAsDataURL(file);
      };
      input.click();
    };

    const applyFormat = (format, value = true) => {
      const quill = quillRef.current;
      if (!quill) return;
      const range = quill.getSelection(true);
      if (!range) return;

      const current = quill.getFormat(range.index, 0);
      let newVal;
      if (format === "list" || format === "align") {
        newVal = current[format] === value ? false : value;
      } else {
        newVal = !current[format];
      }

      quill.format(format, newVal, Quill.sources.USER);
      // Also sync state immediately
      setFormats(quill.getFormat(range.index, 0));
    };

    return (
      <div className="editor-container">
        <div className="editor">
          <div ref={editorRef} />
        </div>
        {showToolbar && (
          <div className="toolbar">
            <button
              type='button'
              onClick={() => applyFormat("bold")}
              className={`button ${formats.bold ? "active" : ""}`}
            >
              <FontAwesomeIcon icon={faBold} />
            </button>
            <button
              type='button'
              onClick={() => applyFormat("italic")}
              className={`button ${formats.italic ? "active" : ""}`}
            >
              <FontAwesomeIcon icon={faItalic} />
            </button>
            <button
              type='button'
              onClick={() => applyFormat("underline")}
              className={`button ${
                formats.underline ? "active" : ""
              }`}
            >
              <FontAwesomeIcon icon={faUnderline} />
            </button>
            <button
              type='button'
              onClick={() => applyFormat("strike")}
              className={`button ${
                formats.strike ? "active" : ""
              }`}
            >
              <FontAwesomeIcon icon={faStrikethrough} />
            </button>
            <button
              type='button'
              onClick={() => applyFormat("list", "ordered")}
              className={`button ${
                formats.list === "ordered" ? "active" : ""
              }`}
            >
              <FontAwesomeIcon icon={faListOl} />
            </button>
            <button
              type='button'
              onClick={() => applyFormat("list", "bullet")}
              className={`button ${
                formats.list === "bullet" ? "active" : ""
              }`}
            >
              <FontAwesomeIcon icon={faListUl} />
            </button>
            <button
              type='button'
              onClick={() => applyFormat("align", "")}
              className={`button ${
                !formats.align ? "active" : ""
              }`}
            >
              <FontAwesomeIcon icon={faAlignLeft} />
            </button>
            <button
              type='button'
              onClick={() => applyFormat("align", "center")}
              className={`button ${
                formats.align === "center" ? "active" : ""
              }`}
            >
              <FontAwesomeIcon icon={faAlignCenter} />
            </button>
            <button
              type='button'
              onClick={() => applyFormat("align", "right")}
              className={`button ${
                formats.align === "right" ? "active" : ""
              }`}
            >
              <FontAwesomeIcon icon={faAlignRight} />
            </button>
            <button
              type='button'
              onClick={() => applyFormat("code")}
              className={`button ${formats.code ? "active" : ""}`}
            >
              <FontAwesomeIcon icon={faCode} />
            </button>
            <button
              type='button'
              onClick={() => applyFormat("script", "super")}
              className={`button ${
                formats.script === "super" ? "active" : ""
              }`}
            >
              <FontAwesomeIcon icon={faSuperscript} />
            </button>
            <button
              type='button'
              onClick={() => applyFormat("script", "sub")}
              className={`button ${
                formats.script === "sub" ? "active" : ""
              }`}
            >
              <FontAwesomeIcon icon={faSubscript} />
            </button>
            {supportMedia && (
              <button
                type='button'
                onClick={insertImage}
                className="button"
              >
                <FontAwesomeIcon icon={faImage} />
              </button>
            )}
            <EmojiButton onEmojiSelect={insertEmoji} />
          </div>
        )}
      </div>
    );
  }
);

export default CustomEditor;
