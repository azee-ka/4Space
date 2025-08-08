import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import "./renderContent.css";

// Allow-list iframe sources you trust
const IFRAME_ALLOW = [
  /^https:\/\/(www\.)?youtube\.com\/embed\//,
  /^https:\/\/player\.vimeo\.com\/video\//,
  /^https:\/\/(www\.)?spotify\.com\/embed\//,
];

// Extend sanitize schema: allow className on code, responsive images, safe iframes
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), "iframe"],
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code || []), ["className"]],
    pre: [...(defaultSchema.attributes?.pre || []), ["className"]],
    img: [
      ...(defaultSchema.attributes?.img || []),
      ["className"],
      ["loading", /^(?:eager|lazy)$/],
      ["decoding", /^(?:async|auto|sync)$/],
      ["width"],
      ["height"],
    ],
    a: [
      ...(defaultSchema.attributes?.a || []),
      ["target", /^(?:_blank|_self|_parent|_top)$/],
      ["rel", "noopener", "noreferrer", "nofollow"],
    ],
    iframe: [
      ["src"],
      ["title"],
      ["allow", true],
      ["allowfullscreen", true],
      ["width"],
      ["height"],
      ["frameborder"],
      ["referrerpolicy"],
    ],
  },
};

// Safe iframe renderer: only render if src matches allow-list
function SafeIframe(props) {
  const src = props?.src || "";
  const ok = IFRAME_ALLOW.some((rx) => rx.test(src));
  if (!ok) return null;
  return (
    <div className="rc-embed">
      <iframe
        {...props}
        loading="lazy"
        referrerPolicy="no-referrer"
        allowFullScreen
      />
    </div>
  );
}

// Smart external link
function SmartLink(props) {
  const href = props?.href || "";
  const isExternal = /^https?:\/\//i.test(href);
  return (
    <a
      {...props}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer nofollow" : undefined}
    />
  );
}

// Responsive image with lazy loading
function SmartImage(props) {
  return <img {...props} loading="lazy" decoding="async" className="rc-img" />;
}

/**
 * RenderContent
 * @param {string} props.source - markdown or HTML markdown
 * @param {boolean} [props.allowRawHtml=true] - allow raw HTML (sanitized)
 * @param {number} [props.truncateWords] - optionally render excerpt (first N words)
 * @param {boolean} [props.autolinkHeadings=true] - clickable heading anchors
 * @param {boolean} [props.highlightCode=true] - code syntax highlighting
 */
export default function RenderContent({
  source,
  allowRawHtml = true,
  truncateWords,
  autolinkHeadings = true,
  highlightCode = true,
}) {
  // Optional excerpt
  const textForExcerpt = (truncateWords && truncateWords > 0)
    ? source.split(/\s+/).slice(0, truncateWords).join(" ") + "…"
    : source;

  const rehypePlugins = [
    rehypeSlug,
    autolinkHeadings && [
      rehypeAutolinkHeadings,
      { behavior: "append", properties: { className: ["rc-hlink"] } },
    ],
    allowRawHtml && rehypeRaw,
    [rehypeSanitize, sanitizeSchema],
    highlightCode && rehypeHighlight,
  ].filter(Boolean);

  return (
    <div className="rc-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={rehypePlugins}
        components={{
          a: SmartLink,
          img: SmartImage,
          iframe: SafeIframe,
          table: (props) => <table className="rc-table" {...props} />,
          pre: (props) => <pre className="rc-pre" {...props} />,
          code: (props) => <code className="rc-code" {...props} />,
          blockquote: (props) => <blockquote className="rc-quote" {...props} />,
          hr: (props) => <hr className="rc-hr" {...props} />,
        }}
      >
        {textForExcerpt}
      </ReactMarkdown>
    </div>
  );
}