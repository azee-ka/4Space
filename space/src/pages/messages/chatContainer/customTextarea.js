import React, { useRef, useEffect } from "react";

const CustomTextarea = ({
  value,
  onChange,
  placeholder = "Type your message...",
  maxHeight = 120,
  minHeight = 40,
  className = "",
  ...props
}) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";

    // Manually enforce initial height and max height
    const scrollHeight = el.scrollHeight;
    const finalHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
    el.style.height = `${finalHeight}px`;
  }, [value, maxHeight, minHeight]);

  return (
    <textarea
      ref={textareaRef}
      className={className}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={1}
      style={{
        minHeight: `${minHeight}px`,
        maxHeight: `${maxHeight}px`,
        overflowY: "auto",
        resize: "none",
        boxSizing: "border-box"
      }}
      {...props}
    />
  );
};

export default CustomTextarea;
