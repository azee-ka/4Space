// app/messages/utils/CustomTextarea.tsx
import React, { forwardRef, useEffect, useRef } from "react";
import { TextInput, TextInputProps, StyleSheet } from "react-native";

interface CustomTextareaProps extends TextInputProps {
  maxHeight?: number;
  minHeight?: number;
}

const CustomTextarea = forwardRef<TextInput, CustomTextareaProps>(
  (
    {
      value,
      onChangeText,
      placeholder = "Type a message...",
      maxHeight = 120,
      minHeight = 40,
      style,
      ...props
    },
    ref
  ) => {
    const innerRef = useRef<TextInput>(null);
    const inputRef = (ref as any) || innerRef;

    useEffect(() => {
      const el = inputRef.current;
      if (!el) return;
      el.setNativeProps({ height: minHeight });
      // measure content size
      // NOTE: onContentSizeChange can also adjust height
    }, [value, maxHeight, minHeight]);

    return (
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#888"
        multiline
        onContentSizeChange={(e) => {
          const newHeight = Math.max(
            minHeight,
            Math.min(e.nativeEvent.contentSize.height, maxHeight)
          );
          inputRef.current?.setNativeProps({ style: { height: newHeight } });
        }}
        style={[styles.textarea, style]}
        {...props}
      />
    );
  }
);

export default CustomTextarea;

const styles = StyleSheet.create({
  textarea: {
    fontSize: 16,
    color: "#FFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    textAlignVertical: "top",
  },
});
