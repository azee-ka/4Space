import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBold, faItalic, faUnderline, faStrikethrough, faListOl, faListUl,
  faAlignLeft, faAlignCenter, faAlignRight, faCode, faSuperscript,
  faSubscript, faImage
} from "@fortawesome/free-solid-svg-icons";
import EmojiButton from "./EmojiButton";
import "./editor.scss";

const InlineBlot = Quill.import('blots/inline');

class Emoji extends InlineBlot {
  static blotName = 'emoji';      // ✅ required for insertEmbed
  static tagName = 'span';
  static className = 'emoji';

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


const CustomEditor = forwardRef(({
  content,
  onContentChange,
  placeholder = "Type something...",
  showToolbar = true,
  isPlainText = false,
  supportMedia = true,
  onImageUpload = () => {},
}, ref) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);


  // expose insertEmoji to parent
  useImperativeHandle(ref, () => ({
    insertEmoji: (emoji) => {
      if (!quillRef.current) return;
      const range = quillRef.current.getSelection(true);
      quillRef.current.insertEmbed(range.index, "emoji", emoji.native);
      quillRef.current.setSelection(range.index + emoji.native.length, 0);
    },
  }));


  const initializeQuill = useCallback(() => {
    if (!editorRef.current || quillRef.current) return;
    quillRef.current = new Quill(editorRef.current, {
      theme: "snow",
      placeholder,
      modules: { toolbar: false },
    });

    quillRef.current.on("text-change", () => {
      onContentChange(quillRef.current.root.innerHTML);
    });

    if (content) {
      quillRef.current.root.innerHTML = content;
    }
  }, [placeholder, content, onContentChange]);

  useEffect(() => {
    initializeQuill();
  }, [initializeQuill]);

  const insertEmoji = (emoji) => {
    if (!quillRef.current) return;
    const range = quillRef.current.getSelection(true);
    quillRef.current.insertEmbed(range.index, "emoji", emoji.native);
    quillRef.current.setSelection(range.index + emoji.native.length, 0);
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
        quillRef.current.insertEmbed(range.index, "image", reader.result);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const applyFormat = (format, value = true) => {
    const current = quillRef.current.getFormat();
    quillRef.current.format(format, current[format] ? false : value);
  };

  return (
    <div className="editor-container">
      <div className="editor">
        <div ref={editorRef} />
      </div>
      {showToolbar && (
        <div className="toolbar">
          <button onClick={() => applyFormat("bold")} className="button"><FontAwesomeIcon icon={faBold} /></button>
          <button onClick={() => applyFormat("italic")} className="button"><FontAwesomeIcon icon={faItalic} /></button>
          <button onClick={() => applyFormat("underline")} className="button"><FontAwesomeIcon icon={faUnderline} /></button>
          <button onClick={() => applyFormat("strike")} className="button"><FontAwesomeIcon icon={faStrikethrough} /></button>
          <button onClick={() => applyFormat("list", "ordered")} className="button"><FontAwesomeIcon icon={faListOl} /></button>
          <button onClick={() => applyFormat("list", "bullet")} className="button"><FontAwesomeIcon icon={faListUl} /></button>
          <button onClick={() => applyFormat("align", "")} className="button"><FontAwesomeIcon icon={faAlignLeft} /></button>
          <button onClick={() => applyFormat("align", "center")} className="button"><FontAwesomeIcon icon={faAlignCenter} /></button>
          <button onClick={() => applyFormat("align", "right")} className="button"><FontAwesomeIcon icon={faAlignRight} /></button>
          <button onClick={() => applyFormat("code")} className="button"><FontAwesomeIcon icon={faCode} /></button>
          <button onClick={() => applyFormat("script", "super")} className="button"><FontAwesomeIcon icon={faSuperscript} /></button>
          <button onClick={() => applyFormat("script", "sub")} className="button"><FontAwesomeIcon icon={faSubscript} /></button>
          {supportMedia && (
            <button onClick={insertImage} className="button"><FontAwesomeIcon icon={faImage} /></button>
          )}
          <EmojiButton onEmojiSelect={insertEmoji} />
        </div>
      )}
    </div>
  );
});

export default CustomEditor;
