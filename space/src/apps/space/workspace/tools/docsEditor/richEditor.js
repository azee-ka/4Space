import React, {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from "@tiptap/react";

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
import TextStyle from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Typography from "@tiptap/extension-typography";
import { Extension, Mark, Node } from "@tiptap/core";

import { createLowlight } from "lowlight";
import js from "highlight.js/lib/languages/javascript";
import htmlLang from "highlight.js/lib/languages/xml";
import cssLang from "highlight.js/lib/languages/css";
import jsonLang from "highlight.js/lib/languages/json";
import pyLang from "highlight.js/lib/languages/python";

import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Eraser,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link as LinkIcon, Image as ImageIcon,
  Code, Table as TableIcon, Highlighter, Type, ArrowRight, ArrowLeft,
  Subscript as SubIcon, Superscript as SuperIcon, Quote,
  Undo2, Redo2, Minus, Plus, Mic, Download, Printer, MessageSquare,
  BookMarked, Maximize2, Minimize2, RefreshCcw, History,
  Sun, Moon, Heading1, Heading2, Heading3, Search, X, Check,
  ExternalLink, Braces as VariablesIcon, Wand2, LayoutPanelLeft,
  ChevronDown, ChevronRight, ChevronUp, Settings2, Ruler as RulerIcon, Square,
  SplitSquareHorizontal, MoreHorizontal,
} from "lucide-react";

import { fetchRichTextContent, saveRichTextContent } from "../../../../../services/space";
import { RICH_TEXT_CONTENT } from "../../../../../services/queryKeys";
import "./richEditor.css";
import { timeAgo } from "../../../../../utils/convertDateTIme";

/* ---------------- Code highlighting ---------------- */
const lowlight = createLowlight();
lowlight.register("javascript", js);
lowlight.register("html", htmlLang);
lowlight.register("css", cssLang);
lowlight.register("json", jsonLang);
lowlight.register("python", pyLang);

/* ---------------- Custom extensions ---------------- */
const FontSize = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [{
      types: ["textStyle"],
      attributes: {
        fontSize: {
          default: null,
          renderHTML: a => (a.fontSize ? { style: `font-size:${a.fontSize}` } : {}),
          parseHTML: el => el.style.fontSize || null
        },
        lineHeight: {
          default: null,
          renderHTML: a => (a.lineHeight ? { style: `line-height:${a.lineHeight}` } : {}),
          parseHTML: el => el.style.lineHeight || null
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: size => ({ chain }) => chain().setMark("textStyle", { fontSize: size }).run(),
      setLineHeight: lh => ({ chain }) => chain().setMark("textStyle", { lineHeight: lh }).run(),
      unsetTypography: () => ({ chain }) => chain().setMark("textStyle", { fontSize: null, lineHeight: null }).run(),
    };
  },
});

const PageBreak = Extension.create({
  name: "pageBreak",
  addCommands() {
    return {
      insertPageBreak: () => ({ commands }) =>
        commands.insertContent({ type: "horizontalRule", attrs: { class: "page-break" } }),
    };
  },
});

const CommentMark = Mark.create({
  name: "comment",
  inclusive: false,
  addAttributes() { return { cid: { default: null } }; },
  parseHTML() { return [{ tag: 'span[data-cid]' }]; },
  renderHTML({ HTMLAttributes }) { return ["span", { ...HTMLAttributes, "data-cid": HTMLAttributes.cid, class: "comment-mark" }, 0]; },
});

const VariableMark = Mark.create({
  name: "variable",
  inclusive: false,
  addAttributes() { return { name: { default: null } }; },
  parseHTML() { return [{ tag: 'span[data-var]' }]; },
  renderHTML({ HTMLAttributes }) { return ["span", { ...HTMLAttributes, "data-var": HTMLAttributes.name, class: "var-chip" }, 0]; },
  addCommands() { return { insertVariable: name => ({ chain }) => chain().setMark("variable", { name }).insertContent(`{{${name}}}`).run() }; },
});

/** Section block — lets you apply section-level margins to a selection */
const Section = Node.create({
  name: "section",
  group: "block",
  content: "block+",
  defining: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    return {
      leftIn: { default: null },
      rightIn: { default: null },
    };
  },
  parseHTML() { return [{ tag: 'section[data-section]' }]; },
  renderHTML({ HTMLAttributes }) {
    const style = {};
    if (HTMLAttributes.leftIn != null) style.paddingLeft = `${HTMLAttributes.leftIn}in`;
    if (HTMLAttributes.rightIn != null) style.paddingRight = `${HTMLAttributes.rightIn}in`;
    return ["section", { "data-section": "true", style: Object.entries(style).map(([k, v]) => `${k}:${v}`).join(";") }, 0];
  },
  addCommands() {
    return {
      wrapSection:
        (leftIn, rightIn) =>
        ({ chain }) =>
          chain().wrapIn(this.name, { leftIn, rightIn }).run(),
      setSectionMargins:
        (leftIn, rightIn) =>
        ({ chain }) =>
          chain().updateAttributes(this.name, { leftIn, rightIn }).run(),
      unsetSection:
        () =>
        ({ chain }) =>
          chain().lift(this.name).run(),
    };
  },
});

/* ---------------- Utils ---------------- */
const IN_PX = 96;
const CM_PER_IN = 2.54;

const plainText = (html = "") =>
  html.replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/?[^>]+(>|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const countSyllables = (w) => {
  const s = (w || "").toLowerCase().replace(/[^a-z]/g, "");
  if (!s) return 0;
  if (s.length <= 3) return 1;
  return (s.match(/[aeiouy]{1,2}/g) || []).length;
};

const computeInsights = (txt) => {
  const words = txt ? txt.split(/\s+/).filter(Boolean) : [];
  const sentences = txt ? (txt.match(/[.!?]+/g) || []).length || 1 : 1;
  const W = words.length || 1; const S = sentences || 1;
  const syllables = words.reduce((a, b) => a + countSyllables(b), 0);
  const FK = 0.39 * (W / S) + 11.8 * (syllables / W) - 15.59;
  const FRE = 206.835 - 1.015 * (W / S) - 84.6 * (syllables / W);
  const stop = new Set("a,an,the,of,to,in,for,on,and,or,as,is,are,be,was,were,it,that,this,with,by,at,from,not,into,over,under,if,then,so,than,which,who,whom,whose,what,when,where,why,how,you,me,i,they,them,us,we,our,your,my,his,her,its,their".split(","));
  const freq = {};
  for (const w of words) {
    const k = w.toLowerCase().replace(/[^a-z0-9'-]/g, "");
    if (!k || stop.has(k) || k.length < 3) continue;
    freq[k] = (freq[k] || 0) + 1;
  }
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const wikilinks = [...txt.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1]);
  const citations = [...txt.matchAll(/\[cite:([^\]]+)\]/g)].map((m) => m[1].trim());
  return { words: W, sentences: S, gradeLevel: Math.max(0, +FK.toFixed(1)), readingEase: +FRE.toFixed(1), readingMinutes: Math.max(1, Math.round(W / 225)), topTerms: top, wikilinks, citations };
};

const PAGE_SPECS = {
  Letter: { wIn: 8.5, hIn: 11 },
  A4:     { wIn: 8.27, hIn: 11.69 },
  Legal:  { wIn: 8.5, hIn: 14 },
};
const PAGE_GAP_PX = 36; // visual seam thickness band

/* ---------------- Tiny UI helpers ---------------- */
function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => { if (!ref.current || ref.current.contains(e.target)) return; handler(); };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener, { passive: true });
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

function Modal({ open, title, onClose, children, footer }) {
  const boxRef = useRef(null);
  useOnClickOutside(boxRef, onClose);
  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="rdx-modal-backdrop">
      <div className="rdx-modal" ref={boxRef} role="dialog" aria-modal="true">
        <div className="rdx-modal-header">
          <div className="rdx-modal-title">{title}</div>
          <button className="rdx-icon ghost" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div className="rdx-modal-body">{children}</div>
        {footer && <div className="rdx-modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/** Dropdown menu with optional nested submenus */
function Menu({ label, items, active, onOpen, onClose }) {
  const ref = useRef(null);
  useOnClickOutside(ref, onClose);
  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose();
    if (active) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [active, onClose]);

  return (
    <div className={`rdx-menu ${active ? "open" : ""}`} ref={ref} onMouseDown={(e) => e.stopPropagation()}>
      <button
        className="rdx-menu-label"
        aria-expanded={active ? "true" : "false"}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={active ? onClose : onOpen}
      >
        {label}
      </button>
      {active && (
        <div className="rdx-dropdown" onMouseDown={(e) => e.stopPropagation()}>
          {items.map((it) => (
            <div key={it.label} className="rdx-dropdown-row">
              <div
                className={`rdx-dropdown-item ${it.children ? "has-children" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!it.children) { it.onClick?.(); onClose(); }
                }}
              >
                {it.icon && <it.icon size={16} />} <span>{it.label}</span>
                {it.kbd && <kbd>{it.kbd}</kbd>}
                {it.children && <ChevronRight size={16} className="submenu-arrow" />}
              </div>
              {it.children && (
                <div className="rdx-submenu" onMouseDown={(e) => e.stopPropagation()}>
                  {it.children.map((sub) => (
                    <div
                      key={sub.label}
                      className="rdx-dropdown-item"
                      onClick={(e) => { e.stopPropagation(); sub.onClick?.(); onClose(); }}
                    >
                      {sub.icon && <sub.icon size={16} />} <span>{sub.label}</span>
                      {sub.kbd && <kbd>{sub.kbd}</kbd>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Portal-positioned popover helper ---------------- */
function useAnchorRect(open, ref, deps = []) {
  const [rect, setRect] = useState(null);
  useLayoutEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (!el) return;
    const calc = () => setRect(el.getBoundingClientRect());
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    window.addEventListener("scroll", calc, { passive: true });
    window.addEventListener("resize", calc);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", calc);
      window.removeEventListener("resize", calc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ref, ...deps]);
  return rect;
}

/* ---------------- Custom Select (now globally-coordinated) ---------------- */
function RdxSelect({
  id,
  value,
  onChange,
  items,
  ariaLabel,
  width = 160,
  placeholder = "",
  activePopoverId,
  setActivePopoverId,
  themeSync,
}) {
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const open = activePopoverId === id;
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, items.findIndex((i) => i.value === value))
  );
  const rect = useAnchorRect(open, btnRef, [items.length]);

  useEffect(() => {
    const idx = Math.max(0, items.findIndex((i) => i.value === value));
    setActiveIndex(idx === -1 ? 0 : idx);
  }, [value, items]);

  useOnClickOutside(menuRef, () => setActivePopoverId(null));

  const label =
    (items.find((i) => i.value === value) || { label: placeholder || "Select…" }).label;

  return (
    <div className="rdx-select" style={{ width }}>
      <button
        ref={btnRef}
        type="button"
        className="rdx-select-btn"
        aria-haspopup="listbox"
        aria-expanded={open ? "true" : "false"}
        aria-label={ariaLabel}
        onClick={() => {
          themeSync?.();
          setActivePopoverId(open ? null : id);
        }}
      >
        <span className="truncate">{label}</span>
        <ChevronDown size={16} aria-hidden />
      </button>

      {open && rect && createPortal(
        <div
          ref={menuRef}
          className="rdx-select-menu"
          role="listbox"
          tabIndex={-1}
          style={{
            top: rect.bottom + 6,
            left: Math.max(8, Math.min(rect.left, window.innerWidth - 220)),
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setActivePopoverId(null);
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => Math.min(items.length - 1, i + 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(0, i - 1));
            }
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              const it = items[activeIndex];
              if (it) onChange(it.value);
              setActivePopoverId(null);
            }
          }}
        >
          {items.map((it, i) => (
            <div
              key={it.value}
              role="option"
              className="rdx-option"
              aria-selected={String(it.value) === String(value)}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => {
                onChange(it.value);
                setActivePopoverId(null);
              }}
            >
              <span className="truncate">{it.label}</span>
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

/* ---------------- Color dropdowns (globally-coordinated) ---------------- */
function ColorDropdown({
  id,
  editor,
  kind = "text",
  icon: Icon,
  title,
  activePopoverId,
  setActivePopoverId,
  themeSync,
}) {
  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const open = activePopoverId === id;
  useOnClickOutside(wrapRef, () => {
    if (open) setActivePopoverId(null);
  });
  const rect = useAnchorRect(open, btnRef);

  const textPalette = [
    "#000000", "#111827", "#374151", "#ef4444", "#dc2626", "#f59e0b", "#10b981",
    "#2563eb", "#7c3aed", "#0ea5b7", "#6b7280", "#9ca3af", "#d1d5db", "#ffffff"
  ];
  const hlPalette = ["#fffbcc", "#fde68a", "#d9f99d", "#a7f3d0", "#bfdbfe", "#ddd6fe", "#fecaca", "#f5d0fe"];
  const palette = kind === "text" ? textPalette : hlPalette;

  const currentText = editor?.getAttributes("textStyle")?.color || null;
  const currentHl = editor?.getAttributes("highlight")?.color || null;
  const current = kind === "text" ? currentText : currentHl;

  const apply = (color) => {
    if (!editor) return;
    const ch = editor.chain().focus();
    if (kind === "text") {
      if (color === null) ch.unsetColor().run();
      else ch.setColor(color).run();
    } else {
      if (color === null) ch.unsetHighlight().run();
      else ch.setHighlight({ color }).run();
    }
    setActivePopoverId(null);
  };

  return (
    <div className="rdx-colorwrap" ref={wrapRef}>
      <button
        ref={btnRef}
        className={`tbtn ${current ? "active" : ""}`}
        title={title}
        onClick={() => {
          themeSync?.();
          setActivePopoverId(open ? null : id);
        }}
      >
        <Icon size={18} />
        <span className="color-dot" style={{ background: current || "transparent" }} />
      </button>

      {open && rect && createPortal(
        <div
          className="rdx-colordrop"
          role="menu"
          style={{
            top: rect.bottom + 6,
            left: Math.max(8, Math.min(rect.left, window.innerWidth - 280)),
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setActivePopoverId(null);
            }
          }}
        >
          <div className="cd-title">{title}</div>
          <div className="cd-grid" role="group" aria-label={`${title} swatches`}>
            {palette.map((c) => (
              <button
                key={c}
                className={`cd-swatch${c === current ? " selected" : ""}`}
                aria-label={c}
                style={{ "--sw": c }}
                onClick={() => apply(c)}
              />
            ))}
          </div>

          <div className="cd-row">
            <label className="cd-custom">
              <span>Custom</span>
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(current || "") ? current : "#000000"}
                onChange={(e) => apply(e.target.value)}
              />
            </label>

            <button className="cd-none" onClick={() => apply(null)}>
              No {kind === "text" ? "color" : "highlight"}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ---------------- Full-width sticky ruler ---------------- */
function TopRulerFull({
  barRef,
  barWidthPx,
  pageLeftPx,
  pageWidthPx,
  pageWidthIn,
  leftIn,
  rightIn,
  pxPerIn,
  units = "in",
  snapFraction = 8,
  compact = true,
  onLeft,
  onRight,
  onReady,
}) {
  const ref = barRef;
  useEffect(() => { onReady?.(); }, [onReady]);

  const SNAP_IN = 1 / snapFraction; // inches
  const pageRightPx = pageLeftPx + pageWidthPx;

  const ticks = useMemo(() => {
    if (!barWidthPx || !pxPerIn) return [];
    const totalIn = barWidthPx / pxPerIn;
    const stepIn = SNAP_IN;
    const count = Math.ceil(totalIn / stepIn);
    const arr = [];
    for (let i = 0; i <= count; i++) {
      const inch = +(i * stepIn);
      const x = inch * pxPerIn;
      const is = (v, s) => Math.abs(v / s - Math.round(v / s)) < 1e-6;
      let cls = "eighth";
      if (is(inch, 1)) cls = "major";
      else if (is(inch, 0.5)) cls = "half";
      else if (is(inch, 0.25)) cls = "quarter";
      const onPage = x >= pageLeftPx - 0.5 && x <= pageRightPx + 0.5;
      let label = "";
      if (cls === "major" && onPage) {
        if (units === "in") label = `${Math.round((x - pageLeftPx) / pxPerIn)}`;
        else label = `${(((x - pageLeftPx) / pxPerIn) * CM_PER_IN).toFixed(0)}`;
      }
      arr.push({ x, cls, label });
    }
    return arr;
  }, [barWidthPx, pxPerIn, SNAP_IN, pageLeftPx, pageRightPx, units]);

  const dragging = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onDown = (e) => {
      const t = e.target;
      if (t.dataset.handle === "left") dragging.current = "left";
      else if (t.dataset.handle === "right") dragging.current = "right";
    };
    const onMove = (e) => {
      if (!dragging.current) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const x = clientX - rect.left;

      const rx = Math.max(pageLeftPx, Math.min(pageRightPx, x));
      const inchesFromLeft = (rx - pageLeftPx) / pxPerIn;
      const snapped = Math.round(inchesFromLeft / SNAP_IN) * SNAP_IN;

      const minContentIn = 3;
      if (dragging.current === "left") {
        const newLeft = Math.min(snapped, pageWidthIn - rightIn - minContentIn);
        onLeft(+newLeft.toFixed(3));
      } else {
        const newRight = Math.min(pageWidthIn - snapped, pageWidthIn - leftIn - minContentIn);
        onRight(+newRight.toFixed(3));
      }
    };
    const onUp = () => { dragging.current = null; };

    el.addEventListener("mousedown", onDown);
    el.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: false });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("touchstart", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, [ref, pageLeftPx, pageRightPx, pxPerIn, pageWidthIn, leftIn, rightIn, onLeft, onRight, SNAP_IN]);

  const leftPx = pageLeftPx + leftIn * pxPerIn;
  const rightPx = pageRightPx - rightIn * pxPerIn;
  const contentPx = Math.max(0, rightPx - leftPx);

  const styleOverride = { ["--rulerbar-h"]: compact ? "24px" : "32px" };

  return (
    <div className="rulerbar" ref={ref} style={styleOverride}>
      <div className="ruler-track">
        <div className="page-rail" style={{ left: `${pageLeftPx}px`, width: `${pageWidthPx}px` }} />
        {ticks.map((t, i) => (
          <div key={i} className={`tick ${t.cls}`} style={{ left: `${t.x}px` }}>
            <span className="tbar" />
            {t.label !== "" && <span className="tmark">{t.label}</span>}
          </div>
        ))}
        <div className="margin left" style={{ left: `${pageLeftPx}px`, width: `${leftPx - pageLeftPx}px` }} />
        <div className="margin right" style={{ left: `${rightPx}px`, width: `${pageRightPx - rightPx}px` }} />
        <div className="content-span" style={{ left: `${leftPx}px`, width: `${contentPx}px` }} />
        <button className="handle left" data-handle="left" style={{ left: `${leftPx - 6}px` }} />
        <button className="handle right" data-handle="right" style={{ left: `${rightPx - 6}px` }} />
      </div>
    </div>
  );
}

  // >>> Robust theme sync: reflect on container & root and propagate CSS variables for portals
  const THEME_VARS = [
    "--bg-app","--paper","--paper-contrast","--glass","--text","--text-muted",
    "--border","--shadow-sm","--shadow-md","--accent","--accent-2",
    "--seg-bg","--seg-border","--comment-bg"
  ];

/* ---------------- Main ---------------- */
const RichTextEditor = () => {
  const containerRef = useRef(null);

  const { projectId } = useParams();
  const queryClient = useQueryClient();

  const { data: initialContent = "", isLoading } = useQuery({
    queryKey: RICH_TEXT_CONTENT(projectId),
    queryFn: () => fetchRichTextContent(projectId),
    enabled: !!projectId,
  });

  const saveMutation = useMutation({
    mutationFn: ({ content, title }) => saveRichTextContent({ projectId, content, title }),
    onSuccess: () => {
      queryClient.invalidateQueries(RICH_TEXT_CONTENT(projectId));
      setLastSaved(new Date());
    },
  });

  const prevContentRef = useRef("");
  const autoSaveRef = useRef(null);
  const [docTitle, setDocTitle] = useState("Untitled Document");
  const [lastSaved, setLastSaved] = useState(null);

  const [viewMode, setViewMode] = useState("page"); // 'page' | 'pageless'

  // theme handling
  const [theme, _setTheme] = useState("dark");
  const [themeLocked, setThemeLocked] = useState(false);
  const setTheme = (t) => { setThemeLocked(true); _setTheme(t); };

  // if user hasn't manually chosen, sync theme with view mode
  useEffect(() => {
    if (!themeLocked) _setTheme(viewMode === "page" ? "light" : "dark");
  }, [viewMode, themeLocked]);


  const syncThemeToDOM = useCallback(() => {
    const root = document.documentElement;
    const body = document.body;
    root.setAttribute("data-theme", theme);
    body.setAttribute("data-theme", theme);
    if (containerRef.current) containerRef.current.setAttribute("data-theme", theme);
    if (containerRef.current) {
      const s = getComputedStyle(containerRef.current);
      THEME_VARS.forEach(k => {
        const v = s.getPropertyValue(k);
        if (v) root.style.setProperty(k, v.trim());
      });
    }
  }, [theme]);

  useEffect(() => {
    syncThemeToDOM();
    const id = requestAnimationFrame(syncThemeToDOM);
    return () => cancelAnimationFrame(id);
  }, [syncThemeToDOM]);

  // Global popover manager (ensures one-at-a-time)
  const [activePopoverId, setActivePopoverId] = useState(null);

  // Close menus with ESC, also close any popover
  const [openMenu, setOpenMenu] = useState(null);
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setActivePopoverId(null);
      }
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, []);

  const [zoom, setZoom] = useState(1);
  const [formatCollapsed, setFormatCollapsed] = useState(false);

  const [pageSize, setPageSize] = useState("Letter");
  const [orientation, setOrientation] = useState("portrait");

  const [marginLeftIn, setMarginLeftIn] = useState(1.0);
const [marginRightIn, setMarginRightIn] = useState(1.0);
const [marginTopIn, setMarginTopIn] = useState(1.0);
const [marginBottomIn, setMarginBottomIn] = useState(1.0);

  const [pagelessWidth, setPagelessWidth] = useState("72ch");
  const [focusMode, setFocusMode] = useState(false);

  const [showOutline, setShowOutline] = useState(true);
  const [collapseOutline, setCollapseOutline] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [showInsights, setShowInsights] = useState(true);
  const [collapseInsights, setCollapseInsights] = useState(true);

  const [content, setContent] = useState(initialContent || "");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [modals, setModals] = useState({
    link: false, image: false,
    findReplace: false, templates: false, snapshotAsk: null, variables: false,
    pageSetup: false, sectionMargins: false,
    more: false,
  });
  const [linkHref, setLinkHref] = useState("");
  const [imageInput, setImageInput] = useState({ url: "", fileDataUrl: "" });
  const [findReplace, setFindReplace] = useState({ find: "", replace: "", caseSensitive: false, useRegex: false });
  const [variables, setVariables] = useState({});
  const [snapshots, setSnapshots] = useState([]);
  const SNAP_KEY = `doc_snapshots_${projectId || "local"}`;

  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const pageScrollRef = useRef(null);
  const editorElRef = useRef(null);
  const rulerRef = useRef(null);

  const [pageCount, setPageCount] = useState(1);
  const [pageIndex, setPageIndex] = useState(1);

  // Ruler config
  const [showRuler, setShowRuler] = useState(true);
  const [rulerUnits, setRulerUnits] = useState("in");
  const [rulerSnap, setRulerSnap] = useState(8);
  const [rulerCompact, setRulerCompact] = useState(true);
  const [rulerScope, setRulerScope] = useState("document");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ blockquote: true, history: true, codeBlock: false }),
      Underline,
      Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Begin your masterpiece…" }),
      CharacterCount.configure({ limit: 500000 }),
      Highlight.configure({ multicolor: true }),
      Color,
      Link.configure({ openOnClick: true, autolink: true, linkOnPaste: true }),
      Image.configure({ inline: false, allowBase64: true }),
      TaskList, TaskItem,
      CodeBlockLowlight.configure({ lowlight }),
      Table.configure({ resizable: true }), TableRow, TableHeader, TableCell,
      HorizontalRule, Subscript, Superscript,
      TextStyle, FontFamily, FontSize, Typography,
      PageBreak, CommentMark, VariableMark, Section,
    ],
    content: initialContent || "",
    editorProps: { attributes: { class: `editor-content${focusMode ? " focus-mode" : ""}`, spellcheck: "true" } },
    onUpdate: ({ editor }) => setContent(editor.getHTML()),
  });

  useEffect(() => {
    try { setSnapshots(JSON.parse(localStorage.getItem(SNAP_KEY) || "[]")); }
    catch { setSnapshots([]); }
  }, [SNAP_KEY]); // <-- keep as is if you had it; typo fixed below

  // fix small typo if present
  useEffect(() => {
    try { setSnapshots(JSON.parse(localStorage.getItem(SNAP_KEY) || "[]")); }
    catch { setSnapshots([]); }
  }, [SNAP_KEY]);

  useEffect(() => {
    if (!editor) return;
    if (initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent || "", false);
      setContent(initialContent || "");
      prevContentRef.current = initialContent || "";
    }
  }, [editor, initialContent]);

  useEffect(() => {
    if (!editor) return;
    const dk = `doc_draft_${projectId || "local"}`;
    const mk = `doc_draft_meta_${projectId || "local"}`;
    autoSaveRef.current = setInterval(() => {
      const current = editor.getHTML();
      if (current !== prevContentRef.current) {
        saveMutation.mutate({ content: current, title: docTitle });
        prevContentRef.current = current;
        localStorage.setItem(dk, current);
        localStorage.setItem(mk, JSON.stringify({ ts: Date.now() }));

        const last = snapshots[snapshots.length - 1];
        if (!last || Date.now() - last.ts > 60000) {
          const next = [...snapshots, { ts: Date.now(), html: current }].slice(-20);
          setSnapshots(next);
          localStorage.setItem(SNAP_KEY, JSON.stringify(next));
        }
      }
    }, 5000);
    return () => clearInterval(autoSaveRef.current);
  }, [editor, projectId, docTitle, saveMutation, snapshots, SNAP_KEY]);

  const outline = useMemo(() => {
    if (!editor) return [];
    const items = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "heading") items.push({ text: node.textContent || "(heading)", level: node.attrs.level, pos });
    });
    return items;
  }, [editor, content]);

  const insights = useMemo(() => computeInsights(plainText(content)), [content]);

  // speech
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = "en-US";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
      editor?.chain().focus().insertContent(t).run();
    };
    recognitionRef.current = r;
  }, [editor]);
  const toggleListening = () => {
    const r = recognitionRef.current; if (!r) return;
    if (listening) { r.stop(); setListening(false); } else { r.start(); setListening(true); }
  };

  // palette
  useEffect(() => {
    const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen(v => !v); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // page geometry
  const baseSpec = PAGE_SPECS[pageSize];
  const pageWIn = orientation === "portrait" ? baseSpec.wIn : baseSpec.hIn;
  const pageHIn = orientation === "portrait" ? baseSpec.hIn : baseSpec.wIn;
  const pageHeightPx = Math.round(pageHIn * IN_PX);

  const [geom, setGeom] = useState({
    barWidthPx: 1,
    pageLeftPx: 0,
    pageWidthPx: 1,
    pxPerIn: IN_PX * zoom,
    pageTopOffsetPx: 0, // NEW
  });

  const measure = useCallback(() => {
    const bar = rulerRef.current;
    const ed = editorElRef.current;
    const cont = containerRef.current;
    const sc = pageScrollRef.current;
    if (!bar || !ed || !sc) return;

    const br = bar.getBoundingClientRect();
    const er = ed.getBoundingClientRect();
    const sr = sc.getBoundingClientRect();

    const pageLeftPx = er.left - br.left;
    const pageWidthPx = er.width || Math.max(1, parseFloat(getComputedStyle(ed).width));
    const barWidthPx = br.width || bar.clientWidth || 1;
    const pxPerIn = pageWidthPx / pageWIn;

    // NEW: where the editor paper starts within the scroller (accounts for zoom)
    const pageTopOffsetPx = Math.max(0, Math.round(er.top - sr.top));

    setGeom({ barWidthPx, pageLeftPx, pageWidthPx, pxPerIn, pageTopOffsetPx });

    if (cont) {
      const s = getComputedStyle(cont);
      THEME_VARS.forEach(k => {
        const v = s.getPropertyValue(k);
        if (v) document.documentElement.style.setProperty(k, v.trim());
      });
    }
  }, [pageWIn]);

  useLayoutEffect(() => {
    measure();
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [measure]);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (editorElRef.current) ro.observe(editorElRef.current);
    if (rulerRef.current) ro.observe(rulerRef.current);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    const sc = pageScrollRef.current;
    sc && sc.addEventListener("scroll", measure, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
      sc && sc.removeEventListener("scroll", measure);
    };
  }, [measure, zoom, viewMode, pageSize, orientation, marginLeftIn, marginRightIn]);

useEffect(() => {
  const scroller = pageScrollRef.current;
  const contentEl = editorElRef.current;
  if (!scroller || !contentEl) return;

  // Derive page count strictly from editor content height
  const calcPages = () => {
    const contentHeight = contentEl.scrollHeight; // includes editor padding (margins inside the sheet)
    const pages = Math.max(1, Math.ceil(contentHeight / pageHeightPx));
    setPageCount(prev => (prev === pages ? prev : pages)); // no-ops avoid extra renders
  };

  // Page index advances by one physical page (sheet + visual gap)
  const calcIndex = () => {
    const unit = pageHeightPx + PAGE_GAP_PX;
    const idx = Math.floor((scroller.scrollTop + 1) / unit) + 1;
    setPageIndex(prev => (prev === idx ? prev : idx));
  };

  calcPages();
  calcIndex();

  const onScroll = () => calcIndex();
  scroller.addEventListener("scroll", onScroll);

  const ro = new ResizeObserver(calcPages);
  ro.observe(contentEl);

  return () => {
    scroller.removeEventListener("scroll", onScroll);
    ro.disconnect();
  };
}, [pageHeightPx, viewMode, content, marginTopIn, marginBottomIn]);

  // >>> FIX: kill initial scroll “nudge” and force top on mount
  const didInitScrollRef = useRef(false);
// >>> FIX: kill initial scroll “nudge” and force top on mount
useLayoutEffect(() => {
  const sc = pageScrollRef.current;

  // Guard for SSR and eslint's restricted global 'history'
  let prev;
  if (typeof window !== "undefined" && window.history && "scrollRestoration" in window.history) {
    prev = window.history.scrollRestoration;
    try { window.history.scrollRestoration = "manual"; } catch {}
  }

  if (sc && !didInitScrollRef.current) {
    sc.scrollTop = 0;
    didInitScrollRef.current = true;
  }

  return () => {
    if (typeof window !== "undefined" && window.history && prev != null) {
      try { window.history.scrollRestoration = prev; } catch {}
    }
  };
}, []);

  // dialogs
  const openLink = () => { const prev = editor?.getAttributes("link")?.href || ""; setLinkHref(prev); setModals(m => ({ ...m, link: true })); };
  const openImage = () => setModals(m => ({ ...m, image: true }));
  const openFindReplace = () => setModals(m => ({ ...m, findReplace: true }));
  const openVariables = () => setModals(m => ({ ...m, variables: true }));
  const openPageSetup = () => setModals(m => ({ ...m, pageSetup: true }));
  const openSectionMargins = () => setModals(m => ({ ...m, sectionMargins: true }));
  const openMore = () => setModals(m => ({ ...m, more: true }));
  const closeAllModals = () => setModals({ link: false, image: false, findReplace: false, templates: false, snapshotAsk: null, variables: false, pageSetup: false, sectionMargins: false, more: false });

  const addComment = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const cid = `c_${Date.now()}`;
    editor.chain().focus().setMark("comment", { cid }).run();
  };

  // replace all
  const doFind = useCallback(() => setPaletteOpen(true), []);
  const doReplaceAll = () => {
    if (!editor || !findReplace.find) return;
    const html = editor.getHTML();
    let pattern = findReplace.useRegex ? findReplace.find : findReplace.find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const flags = `${findReplace.caseSensitive ? "g" : "gi"}`;
    const next = html.replace(new RegExp(pattern, flags), findReplace.replace);
    editor.commands.setContent(next, false);
    setContent(next);
    setModals(m => ({ ...m, findReplace: false }));
  };

  const insertVarChip = (name) => editor?.chain().focus().insertContent(`<span class="var-chip" data-var="${name}">{{${name}}}</span>`).run();
  const applyVariablesIntoDoc = () => {
    if (!editor) return;
    let html = editor.getHTML();
    Object.entries(variables).forEach(([k, v]) => {
      const safe = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      html = html.replace(new RegExp(`\\{\\{\\s*${safe}\\s*\\}\\}`, "g"), v);
    });
    editor.commands.setContent(html, false);
    setContent(html);
  };

  const pageWidthIn = pageWIn;
  const pageHeightIn = pageHIn;

  const styleVars = {
    "--page-width": `${pageWidthIn}in`,
"--page-margin-left": `${marginLeftIn}in`,
"--page-margin-right": `${marginRightIn}in`,
"--page-margin-top": `${marginTopIn}in`,
"--page-margin-bottom": `${marginBottomIn}in`,
// Back-compat if any CSS still reads the old var:
"--page-margin-vertical": `${marginTopIn}in`,
    "--pageless-width": pagelessWidth === "full" ? "min(1400px, 100%)" : pagelessWidth,
    "--page-break": `${Math.round(pageHeightIn * IN_PX)}px`, // kept for other CSS that may use it
    "--zoom": zoom,
  };

const setMarginsPreset = (name) => {
  if (name === "Narrow") { setMarginLeftIn(0.5); setMarginRightIn(0.5); setMarginTopIn(0.5); setMarginBottomIn(0.5); }
  if (name === "Normal") { setMarginLeftIn(1); setMarginRightIn(1); setMarginTopIn(1); setMarginBottomIn(1); }
  if (name === "Wide")   { setMarginLeftIn(1.25); setMarginRightIn(1.25); setMarginTopIn(1); setMarginBottomIn(1); }
};

  const currentStyleValue = useMemo(() => {
    if (!editor) return "normal";
    if (editor.isActive("heading", { level: 1 })) return "title";
    if (editor.isActive("heading", { level: 2 })) return "subtitle";
    for (let i = 1; i <= 6; i++) if (editor.isActive("heading", { level: i })) return `h${i}`;
    return "normal";
  }, [editor, content]);

  const applyStyle = (val) => {
    const ch = editor.chain().focus();
    if (val === "normal") ch.setParagraph().run();
    else if (val === "title") ch.toggleHeading({ level: 1 }).run();
    else if (val === "subtitle") ch.toggleHeading({ level: 2 }).run();
    else if (/^h[1-6]$/.test(val)) ch.toggleHeading({ level: +val.slice(1) }).run();
  };

  const setLeftScoped = (inches) => {
    if (rulerScope === "document") {
      setMarginLeftIn(inches);
    } else {
      const right = editor.isActive("section") ? (editor.getAttributes("section").rightIn ?? 0) : 0;
      if (editor.isActive("section")) editor.chain().focus().setSectionMargins(inches, right).run();
      else editor.chain().focus().wrapSection(inches, right).run();
    }
  };
  const setRightScoped = (inches) => {
    if (rulerScope === "document") {
      setMarginRightIn(inches);
    } else {
      const left = editor.isActive("section") ? (editor.getAttributes("section").leftIn ?? 0) : 0;
      if (editor.isActive("section")) editor.chain().focus().setSectionMargins(left, inches).run();
      else editor.chain().focus().wrapSection(left, inches).run();
    }
  };

  // Menus (with nested items) — only one at a time via openMenu
  const menuDefs = [
    {
      label: "File",
      items: [
        { label: "New", icon: RefreshCcw, kbd: "⌘/Ctrl+N", onClick: () => editor.commands.setContent("") },
        {
          label: "Import",
          children: [
            { label: "HTML…", icon: ExternalLink, onClick: () => alert("Import HTML not wired in this sample.") },
            { label: "Word (.docx)…", icon: ExternalLink, onClick: () => alert("Import DOCX not wired in this sample.") },
          ],
        },
        {
          label: "Download",
          children: [
            {
              label: "Word (.docx)",
              icon: Download,
              onClick: () => {
                import(/* webpackIgnore: true */ "docx").then(docx => {
                  const { Document, Packer, Paragraph, TextRun } = docx;
                  const json = editor.getJSON();
                  const paras = [];
                  (json.content || []).forEach((node) => {
                    if (node.type === "paragraph" || node.type === "heading") {
                      paras.push(new Paragraph({ children: [new TextRun({ text: (node.content || []).map((c) => c.text || "").join("") })] }));
                    }
                  });
                  const doc = new Document({ sections: [{ children: paras }] });
                  Packer.toBlob(doc).then(blob => {
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = `${docTitle || "document"}.docx`;
                    a.click();
                    URL.revokeObjectURL(a.href);
                  });
                });
              }
            },
            {
              label: "HTML",
              icon: Download,
              onClick: () => {
                const blob = new Blob([`<!doctype html><html><head><meta charset="utf-8"/><title>${docTitle || "Document"}</title></head><body>${editor?.getHTML() || ""}</body></html>`], { type: "text/html" });
                const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${docTitle || "document"}.html`; a.click(); URL.revokeObjectURL(a.href);
              }
            },
            { label: "PDF (print to PDF)", icon: Printer, onClick: () => window.print() },
          ]
        },
        { label: "Page Setup…", icon: Settings2, onClick: openPageSetup },
        { label: "Print", icon: Printer, kbd: "⌘/Ctrl+P", onClick: () => window.print() },
      ],
    },
    {
      label: "Edit",
      items: [
        { label: "Undo", icon: Undo2, kbd: "⌘/Ctrl+Z", onClick: () => editor.commands.undo() },
        { label: "Redo", icon: Redo2, kbd: "⇧+⌘/Ctrl+Z", onClick: () => editor.commands.redo() },
        { label: "Find & Replace…", icon: Search, kbd: "⌘/Ctrl+F", onClick: openFindReplace },
        { label: "Clear Formatting", icon: Eraser, onClick: () => editor.commands.unsetAllMarks() },
      ],
    },
    {
      label: "View",
      items: [
        { label: showRuler ? "Hide Ruler" : "Show Ruler", icon: RulerIcon, onClick: () => setShowRuler(v => !v) },
        {
          label: viewMode === "page" ? "Switch to Pageless" : "Switch to Page view",
          icon: LayoutPanelLeft,
          onClick: () => setViewMode(v => (v === "page" ? "pageless" : "page"))
        },
        { label: focusMode ? "Exit Focus Mode" : "Enter Focus Mode", icon: Maximize2, onClick: () => setFocusMode(v => !v) },
        {
          label: theme === "dark" ? "Light Theme" : "Dark Theme",
          icon: theme === "dark" ? Sun : Moon,
          onClick: () => setTheme(theme === "dark" ? "light" : "dark")
        },
        { label: "Ruler Units: " + (rulerUnits === "in" ? "Inches" : "Centimeters"), onClick: () => setRulerUnits(u => (u === "in" ? "cm" : "in")) },
        { label: `Ruler Snap: 1/${rulerSnap === 8 ? "8" : "16"}"`, onClick: () => setRulerSnap(s => (s === 8 ? 16 : 8)) },
        { label: rulerCompact ? "Ruler: Comfortable" : "Ruler: Compact", onClick: () => setRulerCompact(c => !c) },
        { label: "Toggle Outline", onClick: () => setShowOutline(v => !v) },
        { label: "Toggle Comments", onClick: () => setShowComments(v => !v) },
        { label: "Toggle Insights", onClick: () => setShowInsights(v => !v) },
        { label: formatCollapsed ? "Show Format Bar" : "Hide Format Bar", onClick: () => setFormatCollapsed(v => !v) },
      ],
    },
    {
      label: "Insert",
      items: [
        {
          label: "Headings",
          children: [
            { label: "Title", icon: Heading1, onClick: () => applyStyle("title") },
            { label: "Subtitle", icon: Heading2, onClick: () => applyStyle("subtitle") },
            { label: "Heading 1", icon: Heading1, onClick: () => applyStyle("h1") },
            { label: "Heading 2", icon: Heading2, onClick: () => applyStyle("h2") },
            { label: "Heading 3", icon: Heading3, onClick: () => applyStyle("h3") },
          ]
        },
        { label: "Image…", icon: ImageIcon, onClick: openImage },
        { label: "Table (3×3)", icon: TableIcon, onClick: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
        { label: "Horizontal Rule", icon: Minus, onClick: () => editor.commands.setHorizontalRule() },
        { label: "Page Break", icon: Minus, onClick: () => editor.commands.insertPageBreak() },
        { label: "Comment", icon: MessageSquare, onClick: addComment },
        { label: "Variable {{name}}", icon: VariablesIcon, onClick: openVariables },
        { label: "Code Block", icon: Code, onClick: () => editor.chain().focus().toggleCodeBlock().run() },
        { label: "Checklist", icon: List, onClick: () => editor.chain().focus().toggleTaskList().run() },
      ],
    },
    { label: "Format",
      items: [
        { label: "Section Margins… (Selection)", icon: Square, onClick: openSectionMargins },
        { label: "Increase Line Spacing", onClick: () => editor.chain().focus().setLineHeight("2").run() },
        { label: "Decrease Line Spacing", onClick: () => editor.chain().focus().setLineHeight("1.2").run() },
        { label: "Left Align", icon: AlignLeft, onClick: () => editor.chain().focus().setTextAlign("left").run() },
        { label: "Center Align", icon: AlignCenter, onClick: () => editor.chain().focus().setTextAlign("center").run() },
        { label: "Right Align", icon: AlignRight, onClick: () => editor.chain().focus().setTextAlign("right").run() },
        { label: "Justify", icon: AlignJustify, onClick: () => editor.chain().focus().setTextAlign("justify").run() },
      ],
    },
    { label: "Layout",
      items: [
        { label: "Orientation: " + (orientation === "portrait" ? "Portrait" : "Landscape"), icon: SplitSquareHorizontal, onClick: () => setOrientation(o => (o === "portrait" ? "landscape" : "portrait")) },
        { label: "Margins: Narrow", onClick: () => setMarginsPreset("Narrow") },
        { label: "Margins: Normal", onClick: () => setMarginsPreset("Normal") },
        { label: "Margins: Wide", onClick: () => setMarginsPreset("Wide") },
      ],
    },
    { label: "Help", items: [{ label: "Shortcuts (⌘/Ctrl-K)", onClick: () => setPaletteOpen(true) }] },
  ];

  // fonts & first-paint stabilization — guarantees correct initial geometry
  useEffect(() => {
    let raf1 = requestAnimationFrame(measure);
    let raf2 = requestAnimationFrame(() => requestAnimationFrame(measure));
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => requestAnimationFrame(measure));
    }
    window.addEventListener("load", measure);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.removeEventListener("load", measure);
    };
  }, [measure]);

  if (isLoading || !editor) return <p>Loading editor…</p>;

  // >>> Build physical pages (stacked sheets) and clip editor content between them
// Physical page height + fixed gap (do NOT scale by zoom here)
const pageBreakVisualPx = pageHeightPx + PAGE_GAP_PX;
  const pageSeamsStyle = { scrollBehavior: "auto" };
const stackHeightPx = viewMode === "page"
  ? pageHeightPx + (Math.max(1, pageCount) - 1) * pageBreakVisualPx
  : 0;
  const pageMaskCSS = viewMode === "page"
    ? {
        WebkitMaskImage: `repeating-linear-gradient(to bottom,#000 0,#000 ${pageHeightPx}px,transparent ${pageHeightPx}px,transparent ${pageBreakVisualPx}px)`,
        maskImage: `repeating-linear-gradient(to bottom,#000 0,#000 ${pageHeightPx}px,transparent ${pageHeightPx}px,transparent ${pageBreakVisualPx}px)`,
        WebkitMaskRepeat: "repeat",
        maskRepeat: "repeat",
      }
    : {};

  return (
    <div
      ref={containerRef}
      className={["rdx-container", focusMode ? "focus" : ""].join(" ")}
      data-theme={theme}
      data-format-collapsed={formatCollapsed ? "true" : "false"}
      style={styleVars}
      onMouseDown={() => {
        setOpenMenu(null);
        setActivePopoverId(null);
      }}
    >
      <div className="rdx-bg" aria-hidden="true" />

      <header className="rdx-topbar" onMouseDown={(e) => e.stopPropagation()}>
        <div className="rdx-left">
          <button className="rdx-logo" title="Brand / About">
            <Wand2 size={18} /><span>Nova Docs</span>
          </button>

          <div
            className="rdx-title"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => setDocTitle(e.currentTarget.textContent || "Untitled Document")}
            aria-label="Document title"
          >
            {docTitle}
          </div>
        </div>

        <div className="rdx-right">
          <button
            className="rdx-chip"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => { setTheme(theme === "dark" ? "light" : "dark"); syncThemeToDOM(); }}
            title={theme === "dark" ? "Switch to light" : "Switch to dark"}
          >
            {theme === "dark" ? <Sun size={16}/> : <Moon size={16}/>}
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </button>

          <button
            className="rdx-chip"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setFormatCollapsed(v => !v)}
            title={formatCollapsed ? "Show toolbar" : "Hide toolbar"}
          >
            {formatCollapsed ? <ChevronDown size={16}/> : <ChevronUp size={16}/>}
            <span>{formatCollapsed ? "Toolbar" : "Hide"}</span>
          </button>

          <span className="rdx-autosave">{lastSaved ? `Saved ${timeAgo(lastSaved)}` : "Not saved yet"}</span>

          <div className="rdx-inline">
            <History size={16} />
            <RdxSelect
              id="snapshots"
              ariaLabel="Snapshots"
              value=""
              onChange={(ts) => {
                const numeric = +ts;
                const snap = snapshots.find(s => s.ts === numeric);
                if (snap) setModals(m => ({ ...m, snapshotAsk: { html: snap.html, label: "Restore this snapshot?" } }));
              }}
              items={[
                { label: "Snapshots", value: "" },
                ...snapshots.slice().reverse().map(s => ({ label: new Date(s.ts).toLocaleString(), value: String(s.ts) }))
              ]}
              width={220}
              placeholder="Snapshots"
              activePopoverId={activePopoverId}
              setActivePopoverId={setActivePopoverId}
              themeSync={syncThemeToDOM}
            />
          </div>

          <button className="rdx-chip" onClick={() => setViewMode(v => v === "page" ? "pageless" : "page")} title="Switch layout">
            <LayoutPanelLeft size={16} /><span>{viewMode === "page" ? "Pageless" : "Page view"}</span>
          </button>
          <button className="rdx-chip" onClick={() => setFocusMode(v => !v)} title="Focus mode">
            {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}<span>Focus</span>
          </button>
          <button className="rdx-chip" onClick={toggleListening} title="Voice typing">
            <Mic size={16} /><span>{listening ? "Stop" : "Dictate"}</span>
          </button>
          <button className="rdx-chip" onClick={() => window.print()} title="Print">
            <Printer size={16} /><span>Print</span>
          </button>
          <button
            className="rdx-chip"
            onClick={() => {
              import(/* webpackIgnore: true */ "docx").then(docx => {
                const { Document, Packer, Paragraph, TextRun } = docx;
                const json = editor.getJSON();
                const paras = [];
                (json.content || []).forEach((node) => {
                  if (node.type === "paragraph" || node.type === "heading") {
                    paras.push(new Paragraph({ children: [new TextRun({ text: (node.content || []).map((c) => c.text || "").join("") })] }));
                  }
                });
                const doc = new Document({ sections: [{ children: paras }] });
                Packer.toBlob(doc).then(blob => {
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `${docTitle || "document"}.docx`;
                  a.click();
                  URL.revokeObjectURL(a.href);
                });
              }).catch(() => {
                const blob = new Blob([`<!doctype html><html><head><meta charset="utf-8"/><title>${docTitle || "Document"}</title></head><body>${editor?.getHTML() || ""}</body></html>`], { type: "text/html" });
                const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${docTitle || "document"}.html`; a.click(); URL.revokeObjectURL(a.href);
              });
            }}
            title="Export"
          >
            <Download size={16} /><span>Export</span>
          </button>

          <button className="tbtn" title="More" onClick={openMore}><MoreHorizontal size={18} /></button>
        </div>
      </header>

      <nav className="rdx-menubar" onMouseDown={(e) => e.stopPropagation()}>
        <div className="rdx-menuwrap">
          {menuDefs.map((menu) => (
            <Menu
              key={menu.label}
              label={menu.label}
              items={menu.items}
              active={openMenu === menu.label}
              onOpen={() => { setActivePopoverId(null); setOpenMenu(menu.label); }}
              onClose={() => setOpenMenu(null)}
            />
          ))}
        </div>

        <div className="rdx-menuright">
          <div className="zoom">
            <button className="tbtn" title="Zoom out" onClick={() => setZoom(z => Math.max(0.5, +(z - 0.1).toFixed(2)))}><Minus size={18} /></button>
            <span>{Math.round(zoom * 100)}%</span>
            <button className="tbtn" title="Zoom in" onClick={() => setZoom(z => Math.min(2, +(z + 0.1).toFixed(2)))}><Plus size={18} /></button>
          </div>
          <button className="tbtn" title="Page Setup" onClick={openPageSetup}><Settings2 size={18} /></button>
        </div>
      </nav>

      {/* Format bar — single row, scrollable, collapsible */}
      <div
        className="rdx-formatbar"
        data-collapsed={formatCollapsed ? "true" : "false"}
        onMouseDown={(e) => e.stopPropagation()}
onDoubleClick={() => { setMarginLeftIn(1); setMarginRightIn(1); setMarginTopIn(1); setMarginBottomIn(1); }}
      >
        <button className="tbtn" title="Undo" onClick={() => editor.commands.undo()}><Undo2 size={18} /></button>
        <button className="tbtn" title="Redo" onClick={() => editor.commands.redo()}><Redo2 size={18} /></button>

        <RdxSelect
          id="style"
          ariaLabel="Style"
          value={currentStyleValue}
          onChange={applyStyle}
          items={[
            { label: "Normal text", value: "normal" },
            { label: "Title", value: "title" },
            { label: "Subtitle", value: "subtitle" },
            { label: "Heading 1", value: "h1" },
            { label: "Heading 2", value: "h2" },
            { label: "Heading 3", value: "h3" },
            { label: "Heading 4", value: "h4" },
            { label: "Heading 5", value: "h5" },
            { label: "Heading 6", value: "h6" },
          ]}
          width={172}
          activePopoverId={activePopoverId}
          setActivePopoverId={setActivePopoverId}
          themeSync={syncThemeToDOM}
        />

        <RdxSelect
          id="font"
          ariaLabel="Font"
          value="Inter"
          onChange={(v) => editor.chain().focus().setFontFamily(v).run()}
          items={["Inter","Arial","Georgia","Times New Roman","Garamond","Courier New","JetBrains Mono"].map(f => ({ label: f, value: f }))}
          width={140}
          activePopoverId={activePopoverId}
          setActivePopoverId={setActivePopoverId}
          themeSync={syncThemeToDOM}
        />

        <RdxSelect
          id="size"
          ariaLabel="Size"
          value="16px"
          onChange={(v) => editor.chain().focus().setFontSize(v).run()}
          items={["12px","14px","16px","18px","20px","24px","28px","32px","40px","48px"].map(s => ({ label: s, value: s }))}
          width={92}
          activePopoverId={activePopoverId}
          setActivePopoverId={setActivePopoverId}
          themeSync={syncThemeToDOM}
        />

        <RdxSelect
          id="line"
          ariaLabel="Line"
          value="1.5"
          onChange={(v) => editor.chain().focus().setLineHeight(v).run()}
          items={["1.2","1.5","1.75","2","2.5"].map(lh => ({ label: lh, value: lh }))}
          width={84}
          activePopoverId={activePopoverId}
          setActivePopoverId={setActivePopoverId}
          themeSync={syncThemeToDOM}
        />
        <span className="sep" />

        <button className={`tbtn ${editor.isActive("bold") ? "active" : ""}`} title="Bold" onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={18} /></button>
        <button className={`tbtn ${editor.isActive("italic") ? "active" : ""}`} title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={18} /></button>
        <button className={`tbtn ${editor.isActive("underline") ? "active" : ""}`} title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={18} /></button>
        <button className={`tbtn ${editor.isActive("strike") ? "active" : ""}`} title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={18} /></button>
        <button className={`tbtn ${editor.isActive("superscript") ? "active" : ""}`} title="Superscript" onClick={() => editor.chain().focus().toggleSuperscript().run()}><SuperIcon size={18} /></button>
        <button className={`tbtn ${editor.isActive("subscript") ? "active" : ""}`} title="Subscript" onClick={() => editor.chain().focus().toggleSubscript().run()}><SubIcon size={18} /></button>
        <span className="sep" />

        <ColorDropdown
          id="textColor"
          editor={editor}
          kind="text"
          icon={Type}
          title="Text color"
          activePopoverId={activePopoverId}
          setActivePopoverId={setActivePopoverId}
          themeSync={syncThemeToDOM}
        />
        <ColorDropdown
          id="highlight"
          editor={editor}
          kind="highlight"
          icon={Highlighter}
          title="Highlight"
          activePopoverId={activePopoverId}
          setActivePopoverId={setActivePopoverId}
          themeSync={syncThemeToDOM}
        />
        <span className="sep" />

        <button className={`tbtn ${editor.isActive({ textAlign: "left" }) ? "active" : ""}`} title="Left" onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft size={18} /></button>
        <button className={`tbtn ${editor.isActive({ textAlign: "center" }) ? "active" : ""}`} title="Center" onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter size={18} /></button>
        <button className={`tbtn ${editor.isActive({ textAlign: "right" }) ? "active" : ""}`} title="Right" onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight size={18} /></button>
        <button className={`tbtn ${editor.isActive({ textAlign: "justify" }) ? "active" : ""}`} title="Justify" onClick={() => editor.chain().focus().setTextAlign("justify").run()}><AlignJustify size={18} /></button>
        <span className="sep" />

        <button className={`tbtn ${editor.isActive("bulletList") ? "active" : ""}`} title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={18} /></button>
        <button className={`tbtn ${editor.isActive("orderedList") ? "active" : ""}`} title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={18} /></button>
        <button className="tbtn" title="Indent" onClick={() => editor.chain().focus().sinkListItem("listItem").run()}><ArrowRight size={18} /></button>
        <button className="tbtn" title="Outdent" onClick={() => editor.chain().focus().liftListItem("listItem").run()}><ArrowLeft size={18} /></button>
        <span className="sep" />

        <button className={`tbtn ${editor.isActive("blockquote") ? "active" : ""}`} title="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={18} /></button>
        <button className={`tbtn ${editor.isActive("codeBlock") ? "active" : ""}`} title="Code block" onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code size={18} /></button>
        <button className="tbtn" title="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon size={18} /></button>
        <span className="sep" />

        <button className={`tbtn ${editor.isActive("link") ? "active" : ""}`} title="Link" onClick={openLink}><LinkIcon size={18} /></button>
        <button className="tbtn" title="Image" onClick={openImage}><ImageIcon size={18} /></button>
      </div>

      {/* FULL-WIDTH RULER */}
      {showRuler && (
        <TopRulerFull
          barRef={rulerRef}
          barWidthPx={geom.barWidthPx}
          pageLeftPx={geom.pageLeftPx}
          pageWidthPx={geom.pageWidthPx}
          pageWidthIn={pageWidthIn}
          leftIn={marginLeftIn}
          rightIn={marginRightIn}
          pxPerIn={geom.pxPerIn}
          units={rulerUnits}
          snapFraction={rulerSnap}
          compact={rulerCompact}
          onLeft={setLeftScoped}
          onRight={setRightScoped}
          onReady={measure}
        />
      )}

      <div className={`rdx-workspace${focusMode ? " focus" : ""}`}>
        {showOutline && !focusMode && (
          <aside className="rdx-sidebar left" data-collapsed={collapseOutline ? "true" : "false"}>
            <div className="rdx-sidebar-header collapsible" onClick={() => setCollapseOutline(v => !v)}>
              <BookMarked size={16} /> Outline
              <ChevronDown className="caret" size={16} />
            </div>
            <div className="rdx-outline">
              {outline.length === 0 && <div className="muted">No headings yet</div>}
              {outline.map((h, idx) => (
                <div key={idx} className={`outline-item level-${h.level}`} onClick={() => editor.chain().focus().setTextSelection(h.pos).run()}>
                  {h.text}
                </div>
              ))}
            </div>
          </aside>
        )}

        <main
          className={`rdx-page ${viewMode}`}
          ref={pageScrollRef}
          style={pageSeamsStyle}
        >
          <div
            className={`rdx-page-wrap ${viewMode}`}
            // physical pages: position backgrounds and clip the editor
            style={
              viewMode === "page"
                ? { position: "relative", background: "none", minHeight: `${stackHeightPx}px` }
                : undefined
            }
          >
            {viewMode === "page" && (
              <div
                className="page-stack"
                aria-hidden="true"
                style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
              >
                {Array.from({ length: Math.max(1, pageCount) }).map((_, i) => (
                  <div
                    key={i}
                    className="page-sheet"
                    style={{
                      position: "absolute",
                      left: "50%",
                      transform: "translateX(-50%)",
                      top: `${i * pageBreakVisualPx}px`,
                      width: "var(--page-width)",
                      height: `${pageHeightIn}in`,
                      background: "var(--paper)",
                      boxShadow: "var(--shadow-md)",
                      borderRadius: "6px",
                    }}
                  />
                ))}
              </div>
            )}
            <EditorContent
              editor={editor}
              ref={(el) => {
                editorElRef.current = el;
                if (el) requestAnimationFrame(measure);
              }}
              style={
    viewMode === "page"
      ? {
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "var(--page-width)",
          background: "transparent",
          border: "none",
          boxShadow: "none",
padding: `var(--page-margin-top) var(--page-margin-right) var(--page-margin-bottom) var(--page-margin-left)`,          ...pageMaskCSS,
        }
      : { padding: `2rem`, width: `var(--pageless-width)`, minHeight: "min(1200px, 80vh)" }
  }
            />
            {viewMode === "page" && (
              <div className="page-meter">Page {pageIndex} / {pageCount}</div>
            )}
          </div>
        </main>

        {!focusMode && (
          <aside className="rdx-sidebar right" data-collapsed={collapseInsights ? "true" : "false"}>
            {showComments && (
              <>
                <div className="rdx-sidebar-header">Comments</div>
                <div className="rdx-comments">
                  <div className="muted">Select text and press the bubble to add a comment.</div>
                </div>
              </>
            )}

            {showInsights && (
              <>
                <div className="rdx-sidebar-header collapsible" onClick={() => setCollapseInsights(v => !v)}>
                  Insights
                  <ChevronDown className="caret" size={16} />
                </div>
                <div className="rdx-insights">
                  <div className="ins-row"><span>Words</span><b>{insights.words.toLocaleString()}</b></div>
                  <div className="ins-row"><span>Reading time</span><b>{insights.readingMinutes} min</b></div>
                  <div className="ins-row"><span>Grade level</span><b>{insights.gradeLevel}</b></div>
                  <div className="ins-row"><span>Reading ease</span><b>{insights.readingEase}</b></div>
                  <div className="ins-block">
                    <div className="ins-title">Top terms</div>
                    <ul className="pill-list">
                      {insights.topTerms.map(([term, n]) => <li key={term} className="pill">{term} <span className="pill-num">{n}</span></li>)}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </aside>
        )}
      </div>

      {!focusMode && (
        <footer className="rdx-footer">
          {editor.storage.characterCount.words()} words • {editor.storage.characterCount.characters()} characters
        </footer>
      )}

      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="rdx-bubble">
            <button className={editor.isActive("bold") ? "active" : ""} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold size={16} /></button>
            <button className={editor.isActive("italic") ? "active" : ""} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic size={16} /></button>
            <button className={editor.isActive("underline") ? "active" : ""} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><UnderlineIcon size={16} /></button>
            <button onClick={addComment} title="Comment"><MessageSquare size={16} /></button>
            <button onClick={openLink} title="Link"><LinkIcon size={16} /></button>
          </div>
        </BubbleMenu>
      )}

      {editor && (
        <FloatingMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          shouldShow={({ editor }) => {
            const { $from } = editor.state.selection;
            const text = $from.parent.textBetween(0, $from.parent.content.size, "\n", "\n");
            return $from.parent.type.name === "paragraph" && /^\s*\/\w*$/.test(text);
          }}
        >
          <div className="rdx-floating">
            <button onClick={() => { stripSlash(editor); applyStyle("title"); }} title="Title"><Heading1 size={16} /></button>
            <button onClick={() => { stripSlash(editor); applyStyle("subtitle"); }} title="Subtitle"><Heading2 size={16} /></button>
            <button onClick={() => { stripSlash(editor); applyStyle("h3"); }} title="H3"><Heading3 size={16} /></button>
            <button onClick={() => { stripSlash(editor); editor.chain().focus().toggleBulletList().run(); }} title="Bullets"><List size={16} /></button>
            <button onClick={() => { stripSlash(editor); editor.chain().focus().toggleOrderedList().run(); }} title="Numbered"><ListOrdered size={16} /></button>
            <button onClick={() => { stripSlash(editor); editor.chain().focus().toggleBlockquote().run(); }} title="Quote"><Quote size={16} /></button>
            <button onClick={() => { stripSlash(editor); editor.chain().focus().toggleCodeBlock().run(); }} title="Code"><Code size={16} /></button>
            <button onClick={() => { stripSlash(editor); openVariables(); }} title="Variable"><VariablesIcon size={16} /></button>
          </div>
        </FloatingMenu>
      )}

      {/* Modals */}
      <Modal
        open={modals.link}
        title="Insert / Edit Link"
        onClose={closeAllModals}
        footer={
          <>
            <button className="rdx-btn" onClick={() => { editor.chain().focus().unsetLink().run(); closeAllModals(); }}>Remove</button>
            <button className="rdx-btn" onClick={() => { if (linkHref) editor.chain().focus().setLink({ href: linkHref }).run(); closeAllModals(); }}><Check size={14}/> Apply</button>
          </>
        }
      >
        <div className="rdx-row">
          <label>URL</label>
          <input type="url" placeholder="https://…" value={linkHref} onChange={(e) => setLinkHref(e.target.value)} />
        </div>
      </Modal>

      <Modal
        open={modals.image}
        title="Insert Image"
        onClose={closeAllModals}
        footer={<button className="rdx-btn" onClick={() => {
          const src = imageInput.fileDataUrl || imageInput.url;
          if (src) editor.chain().focus().setImage({ src }).run();
          setImageInput({ url: "", fileDataUrl: "" });
          closeAllModals();
        }}><Check size={14}/> Insert</button>}
      >
        <div className="rdx-row">
          <label>From URL</label>
          <input type="url" placeholder="https://…" value={imageInput.url} onChange={(e) => setImageInput(s => ({ ...s, url: e.target.value }))} />
        </div>
        <div className="rdx-row">
          <label>From file</label>
          <input type="file" accept="image/*" onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => setImageInput(s => ({ ...s, fileDataUrl: reader.result }));
            reader.readAsDataURL(file);
          }} />
        </div>
      </Modal>

      <Modal
        open={modals.findReplace}
        title="Find & Replace"
        onClose={closeAllModals}
        footer={
          <>
            <button className="rdx-btn" onClick={doFind}><Search size={14}/> Find</button>
            <button className="rdx-btn" onClick={doReplaceAll}><Check size={14}/> Replace All</button>
          </>
        }
      >
        <div className="rdx-row">
          <label>Find</label>
          <input value={findReplace.find} onChange={(e) => setFindReplace(s => ({ ...s, find: e.target.value }))} placeholder="text or /regex/"/>
        </div>
        <div className="rdx-row">
          <label>Replace with</label>
          <input value={findReplace.replace} onChange={(e) => setFindReplace(s => ({ ...s, replace: e.target.value }))} placeholder="replacement"/>
        </div>
        <div className="rdx-inline" style={{ gap: ".8rem", paddingTop: ".25rem" }}>
          <label><input type="checkbox" checked={findReplace.caseSensitive} onChange={(e) => setFindReplace(s => ({ ...s, caseSensitive: e.target.checked }))}/> Case sensitive</label>
          <label><input type="checkbox" checked={findReplace.useRegex} onChange={(e) => setFindReplace(s => ({ ...s, useRegex: e.target.checked }))}/> Use regex</label>
        </div>
      </Modal>

      <Modal
        open={!!modals.snapshotAsk}
        title="Confirm"
        onClose={() => setModals(m => ({ ...m, snapshotAsk: null }))}
        footer={
          <>
            <button className="rdx-btn secondary" onClick={() => setModals(m => ({ ...m, snapshotAsk: null }))}>Cancel</button>
            <button className="rdx-btn" onClick={() => {
              editor.commands.setContent(modals.snapshotAsk.html, false);
              setContent(modals.snapshotAsk.html);
              setModals(m => ({ ...m, snapshotAsk: null }));
            }}><Check size={14}/> Apply</button>
          </>
        }
      >
        <p>{modals.snapshotAsk?.label}</p>
      </Modal>

      <Modal
        open={modals.variables}
        title="Variables"
        onClose={closeAllModals}
        footer={<button className="rdx-btn" onClick={applyVariablesIntoDoc}><Check size={14}/> Apply to Document</button>}
      >
        <div className="vars">
          <div className="vars-row">
            <input placeholder="Name (e.g. company)" id="var-name" />
            <input placeholder="Value (e.g. Acme Inc.)" id="var-value" />
            <button className="rdx-btn" onClick={() => {
              const name = document.getElementById("var-name").value.trim();
              const value = document.getElementById("var-value").value;
              if (!name) return;
              setVariables(v => ({ ...v, [name]: value }));
              insertVarChip(name);
            }}>Add</button>
          </div>
          <div className="vars-list">
            {Object.keys(variables).length === 0 ? (
              <div className="muted">No variables yet</div>
            ) : (
              Object.entries(variables).map(([k, v]) => (
                <div className="vars-item" key={k}>
                  <span className="vars-name">{k}</span>
                  <input value={v} onChange={(e) => setVariables(prev => ({ ...prev, [k]: e.target.value }))} />
                  <button className="rdx-btn danger" onClick={() => setVariables(({ [k]: _drop, ...rest }) => rest)}>Delete</button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={modals.pageSetup}
        title="Page Setup"
        onClose={closeAllModals}
        footer={<button className="rdx-btn" onClick={closeAllModals}><Check size={14}/> Done</button>}
      >
        <div className="rdx-row">
          <label>Page size</label>
          <RdxSelect
            id="page-size"
            ariaLabel="Page size"
            value={pageSize}
            onChange={setPageSize}
            items={Object.keys(PAGE_SPECS).map(p => ({ label: p, value: p }))}
            width={180}
            activePopoverId={activePopoverId}
            setActivePopoverId={setActivePopoverId}
            themeSync={syncThemeToDOM}
          />
        </div>
        <div className="rdx-row">
          <label>Orientation</label>
          <RdxSelect
            id="orientation"
            ariaLabel="Orientation"
            value={orientation}
            onChange={setOrientation}
            items={[{label:"Portrait", value:"portrait"},{label:"Landscape", value:"landscape"}]}
            width={180}
            activePopoverId={activePopoverId}
            setActivePopoverId={setActivePopoverId}
            themeSync={syncThemeToDOM}
          />
        </div>
        <div className="rdx-row">
          <label>Top margin</label>
          <RdxSelect
            id="top-margin"
            ariaLabel="Top margin"
            value={`${marginTopIn}`}
            onChange={(v) => setMarginTopIn(parseFloat(v))}
            items={["0.25","0.5","0.75","1","1.25","1.5","2"].map(v => ({ label: `${v}"`, value: v }))}
            width={140}
            activePopoverId={activePopoverId}
            setActivePopoverId={setActivePopoverId}
            themeSync={syncThemeToDOM}
          />
        </div>

        <div className="rdx-row">
          <label>Bottom margin</label>
          <RdxSelect
            id="bottom-margin"
            ariaLabel="Bottom margin"
            value={`${marginBottomIn}`}
            onChange={(v) => setMarginBottomIn(parseFloat(v))}
            items={["0.25","0.5","0.75","1","1.25","1.5","2"].map(v => ({ label: `${v}"`, value: v }))}
            width={140}
            activePopoverId={activePopoverId}
            setActivePopoverId={setActivePopoverId}
            themeSync={syncThemeToDOM}
          />
        </div>

        <div className="rdx-row">
          <label>Left margin</label>
          <RdxSelect
            id="left-margin"
            ariaLabel="Left margin"
            value={`${marginLeftIn}`}
            onChange={(v) => setMarginLeftIn(parseFloat(v))}
            items={["0.25","0.5","0.75","1","1.25","1.5","2"].map(v => ({ label: `${v}"`, value: v }))}
            width={140}
            activePopoverId={activePopoverId}
            setActivePopoverId={setActivePopoverId}
            themeSync={syncThemeToDOM}
          />
        </div>

        <div className="rdx-row">
          <label>Right margin</label>
          <RdxSelect
            id="right-margin"
            ariaLabel="Right margin"
            value={`${marginRightIn}`}
            onChange={(v) => setMarginRightIn(parseFloat(v))}
            items={["0.25","0.5","0.75","1","1.25","1.5","2"].map(v => ({ label: `${v}"`, value: v }))}
            width={140}
            activePopoverId={activePopoverId}
            setActivePopoverId={setActivePopoverId}
            themeSync={syncThemeToDOM}
          />
        </div>
      </Modal>

      {/* "More" modal */}
      <Modal
        open={modals.more}
        title="More"
        onClose={closeAllModals}
        footer={<button className="rdx-btn" onClick={closeAllModals}><Check size={14}/> Done</button>}
      >
        <div className="rdx-row">
          <label>Theme</label>
          <RdxSelect
            id="theme"
            ariaLabel="Theme"
            value={theme}
            onChange={setTheme}
            items={[{label:"Dark", value:"dark"},{label:"Light", value:"light"}]}
            width={160}
            activePopoverId={activePopoverId}
            setActivePopoverId={setActivePopoverId}
            themeSync={syncThemeToDOM}
          />
        </div>
        <div className="rdx-row">
          <label>Layout</label>
          <RdxSelect
            id="layout"
            ariaLabel="Layout"
            value={viewMode}
            onChange={setViewMode}
            items={[{label:"Page", value:"page"},{label:"Pageless", value:"pageless"}]}
            width={160}
            activePopoverId={activePopoverId}
            setActivePopoverId={setActivePopoverId}
            themeSync={syncThemeToDOM}
          />
        </div>
        <div className="rdx-row">
          <label>Show Ruler</label>
          <input type="checkbox" checked={!!showRuler} onChange={e => setShowRuler(e.target.checked)} />
        </div>
        <div className="rdx-row">
          <label>Collapse toolbar</label>
          <input type="checkbox" checked={!!formatCollapsed} onChange={e => setFormatCollapsed(e.target.checked)} />
        </div>
      </Modal>

      {paletteOpen && (
        <div className="rdx-palette-backdrop" onMouseDown={() => setPaletteOpen(false)}>
          <div className="rdx-palette" onMouseDown={(e) => e.stopPropagation()}>
            <div className="palette-input">
              <Search size={16} />
              <input
                autoFocus
                placeholder="Type a command… (title, subtitle, h1, bold, link, pageless, page, light, dark)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const q = e.currentTarget.value.trim().toLowerCase();
                    if (q === "title") applyStyle("title");
                    else if (q === "subtitle") applyStyle("subtitle");
                    else if (q === "h1") applyStyle("h1");
                    else if (q === "h2") applyStyle("h2");
                    else if (q === "h3") applyStyle("h3");
                    else if (q === "bold") editor.chain().focus().toggleBold().run();
                    else if (q === "italic") editor.chain().focus().toggleItalic().run();
                    else if (q === "link") openLink();
                    else if (q === "image") openImage();
                    else if (q === "pageless") setViewMode("pageless");
                    else if (q === "page") setViewMode("page");
                    else if (q === "dark") setTheme("dark");
                    else if (q === "light") setTheme("light");
                    setPaletteOpen(false);
                  }
                }}
              />
            </div>
            <div className="palette-grid">
              <button onClick={() => { applyStyle("title"); setPaletteOpen(false); }}><Heading1 size={16}/> Title</button>
              <button onClick={() => { applyStyle("subtitle"); setPaletteOpen(false); }}><Heading2 size={16}/> Subtitle</button>
              <button onClick={() => { applyStyle("h3"); setPaletteOpen(false); }}><Heading3 size={16}/> Heading 3</button>
              <button onClick={() => { editor.chain().focus().toggleBold().run(); setPaletteOpen(false); }}><Bold size={16}/> Bold</button>
              <button onClick={() => { openLink(); setPaletteOpen(false); }}><LinkIcon size={16}/> Link</button>
              <button onClick={() => { openImage(); setPaletteOpen(false); }}><ImageIcon size={16}/> Image</button>
              <button onClick={() => { setViewMode(v => v === "page" ? "pageless" : "page"); setPaletteOpen(false); }}><LayoutPanelLeft size={16}/> Toggle layout</button>
              <button onClick={() => { setTheme(theme === "dark" ? "light" : "dark"); setPaletteOpen(false); }}>{theme === "dark" ? <Sun size={16}/> : <Moon size={16}/> } Theme</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function stripSlash(editor) {
  const { $from } = editor.state.selection;
  const parent = $from.parent;
  const text = parent.textBetween(0, parent.content.size, "\n", "\n");
  if (/^\s*\//.test(text)) {
    const start = $from.start();
    const idx = text.indexOf("/");
    editor.chain().setTextSelection({ from: start + idx, to: start + idx + 1 }).deleteSelection().run();
  }
}

export default RichTextEditor;