// EditorContext.js
import React, { createContext, useContext, useRef } from 'react';

const EditorContext = createContext();

export const useEditorContext = () => {
    return useContext(EditorContext);
};

export const EditorProvider = ({ children }) => {
    const quillRef = useRef(null);

    const insertEmoji = (emoji) => {
        if (quillRef.current) {
            quillRef.current.focus();
            const currentSelection = quillRef.current.getSelection();
            const position = currentSelection ? currentSelection.index : quillRef.current.getLength();
            quillRef.current.insertEmbed(position, 'emoji', emoji.native);
            quillRef.current.setSelection(position + emoji.native.length, 0);
        }
    };

    return (
        <EditorContext.Provider value={{ quillRef, insertEmoji }}>
            {children}
        </EditorContext.Provider>
    );
};
