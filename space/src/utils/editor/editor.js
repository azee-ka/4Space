import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Quill from "quill";
import ReactDOM from "react-dom";
import DOMPurify from 'dompurify';
import { createPopper } from '@popperjs/core';
import "quill/dist/quill.snow.css"; // Make sure to include Quill's CSS
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBold,
    faItalic,
    faUnderline,
    faCode,
    faHighlighter,
    faStrikethrough,
    faAlignLeft,
    faAlignCenter,
    faAlignRight,
    faAlignJustify,
    faListOl,
    faListUl,
    faQuoteRight,
    faRedo,
    faUndo,
    faTextHeight,
    faFont,
    faPalette,
    faEraser,
    faSuperscript,
    faSubscript,
    faTable,
    faLink,
    faImage,
} from '@fortawesome/free-solid-svg-icons';
import './editor.css';
import { EditorProvider, useEditorContext } from "./EditorContext";
import EmojiButton from "./EmojiButton";
import { parseContent } from "./parser";
import useApi from "../useApi";
import ProfilePicture from "../profilePicture/getProfilePicture";


const BlockEmbed = Quill.import("blots/block/embed");

class ImageBlot extends BlockEmbed {
    static create(value) {
        let node = super.create();
        node.setAttribute("src", value.url);
        node.setAttribute("contenteditable", false);
        node.style.maxWidth = "100%";
        node.style.width = value.width || "auto";
        node.style.height = value.height || "auto";
        node.style.cursor = "pointer";
        node.classList.add("quill-image");

        return node;
    }

    static value(node) {
        return {
            url: node.getAttribute("src"),
            width: node.style.width,
            height: node.style.height
        };
    }
}

ImageBlot.blotName = "image";
ImageBlot.tagName = "img";
Quill.register(ImageBlot);



const EmojiBlot = Quill.import('blots/inline'); // Import the inline blot base class

class Emoji extends EmojiBlot {
    static create(value) {
        const node = super.create(value);
        if (this.isEmoji(value)) {
            node.setAttribute('class', 'emoji');
            node.textContent = value;
        }
        return node;
    }

    static formats(domNode) {
        return domNode.getAttribute('class') === 'emoji' ? domNode.textContent : undefined;
    }

    // Helper function to check if the value is an emoji
    static isEmoji(value) {
        // Define a regex pattern for emojis
        const emojiPattern = /\p{Emoji}/gu;
        return emojiPattern.test(value);
    }
}

if (!Quill.imports['blots/emoji']) {
    EmojiBlot.blotName = 'emoji';  // Name of the custom blot.
    EmojiBlot.tagName = 'span';    // Ensures it stays inline.
    Quill.register('blots/emoji', Emoji); // Register the custom blot.
}



const CustomEditor = ({ 
    content, 
    onContentChange, 
    placeholder, 
    showToolbar = false, 
    isPlainText = false,
    supportMedia,
    onImageUpload,
}) => {
    const { callApi } = useApi();
    const editorRef = useRef(null);
    const { quillRef: quillInstance } = useEditorContext();

    const isSelecting = useRef(false); // Track if text selection is happening
    const [activeFormats, setActiveFormats] = useState({});

    const [color, setColor] = useState("#ffffff");

    const [referenceElement, setReferenceElement] = useState(null);
    const [popperElement, setPopperElement] = useState(null);
    const [arrowElement, setArrowElement] = useState(null);

    const [inputValue, setInputValue] = useState();
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        if (referenceElement && popperElement) {
            const popperInstance = createPopper(referenceElement, popperElement, {
                placement: 'bottom-start', // Position the popper below the cursor
                modifiers: [
                    {
                        name: 'flip',
                        options: {
                            boundary: 'viewport', // Keep the suggestions within the viewport
                        },
                    },
                    {
                        name: 'offset',
                        options: {
                            offset: [0, 0], // Adjust popper position based on cursor
                        },
                    },
                    {
                        name: 'arrow',
                        options: {
                            element: arrowElement,
                        },
                    },
                ],
            });

            return () => {
                popperInstance.destroy();
            };
        }
    }, [referenceElement, popperElement, arrowElement]);



    useEffect(() => {
        if (quillInstance.current) {
            if (content === '') {
                quillInstance.current.setContents([]);
                // console.log('Editor Cleared')
            }
        }
    }, [content]);



    const handleQuillChange = useCallback((value) => {
        const regex = /(?:@|#|x\/)[^\s]*/g;
        let match, isActiveQuery = false;
        while ((match = regex.exec(value)) !== null) {
            const cursorPosition = quillInstance.current.getSelection()?.index || 0;
            if (cursorPosition >= match.index && cursorPosition <= regex.lastIndex) {
                isActiveQuery = true;
                fetchSuggestions(match[0].slice(1));
                setReferenceElement(editorRef.current);
                break;
            }
        }
        if (!isActiveQuery) setSuggestions([]);
    }, []);


    const fetchSuggestions = useCallback(async (query) => {
        if (!query) return;
        try {
            const response = await callApi(`search/user/?query=${query}`);
            setSuggestions(response.data);
        } catch (error) {
            console.error('Error fetching suggestions', error);
        }
    }, []);


    const applyFormat = useCallback((command, value = true) => {
        if (quillInstance.current) {
            const isCurrentlyApplied = activeFormats[command];
            quillInstance.current.format(command, !isCurrentlyApplied ? value : false);
            setActiveFormats(quillInstance.current.getFormat());
        }
    }, [activeFormats]);


    const renderButton = useCallback((command, icon, value) => (
        <button
            onClick={() => applyFormat(command, value)}
            className={`button ${activeFormats[command] === (value || true) ? 'active' : ''}`}
        >
            <FontAwesomeIcon icon={icon} />
        </button>
    ), [applyFormat, activeFormats]);


    // Handle image upload
    const handleImageUpload = () => {
        if (quillInstance.current) {
            quillInstance.current.focus();  // Ensure focus before inserting the image
        }
        console.log("ime up called")
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async () => {
            if (input.files[0]) {
                const file = input.files[0];
                const reader = new FileReader();
                reader.onload = (e) => {
                    insertImage(quillInstance.current, e.target.result);
                };
                reader.readAsDataURL(file);
            }
        };
        console.log("ime up called222")
        input.click();
    };

    const insertImage = (quill, url) => {
        const range = quill.getSelection();
        if (range) {
            // Ensure cursor is in a valid position
            if (range.index !== null && range.length !== 0) {
                quill.insertEmbed(range.index, 'image', { url, width: 'auto', height: 'auto' });
            } else {
                // If there is no selection, insert the image at the current cursor position
                quill.insertEmbed(range.index, 'image', { url, width: 'auto', height: 'auto' });
            }
        }
    };
    

    const handleColorChange = useCallback((e) => {
        const selectedColor = e.target.value;
        setColor(selectedColor);
        if (quillInstance.current) {
            const range = quillInstance.current.getSelection();
            quillInstance.current.format('color', selectedColor, range);
        }
    }, []);


    const memoizedQuillOptions = useMemo(() => ({
        theme: 'snow',
        placeholder: placeholder || "Type something...",
        modules: { toolbar: false }
    }), [placeholder]);

    const initializeQuill = useCallback(() => {
        if (editorRef.current) {
            quillInstance.current = new Quill(editorRef.current, memoizedQuillOptions);
            quillInstance.current.on('text-change', handleTextChange);
        }
    }, [memoizedQuillOptions]);

    const handleTextChange = useCallback(() => {
        if (!quillInstance.current) return;
        const htmlContent = quillInstance.current.root.innerHTML;
        const textContent = quillInstance.current.getText().trim();
        setInputValue(htmlContent);
        onContentChange(htmlContent);
        handleQuillChange(textContent);
    }, [onContentChange]);

    // Pass `handleImageUpload` to the parent or toolbar outside the editor
    useEffect(() => {
        if (onImageUpload) {
            onImageUpload(handleImageUpload);
        }
    }, [onImageUpload]);


    useEffect(() => {
        initializeQuill();
    }, [initializeQuill]);
    

    // Adding event listeners to handle clicks and selections
    useEffect(() => {
        const handleMouseDown = (event) => {
            if (editorRef.current && editorRef.current.contains(event.target)) {
                // Only set the flag if the target is inside the editor
                isSelecting.current = true;
            }
        };

        const handleMouseUp = (event) => {
            // Check if the mouse click is outside the editor AND outside other editable fields
            if (editorRef.current && !editorRef.current.contains(event.target) && !isSelecting.current) {
                // Add a check to ensure the blur doesn't happen if the target is an input field or other editable element
                if (!event.target.closest('input, textarea, button')) {
                    quillInstance.current.blur(); // Blur the editor if the click is outside and not on other editable elements
                }
            }
            isSelecting.current = false;
        };


        // Add event listeners to document, but specifically handle cases for the editor
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);

        // Cleanup event listeners on component unmount
        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);


    const renderSuggestions = () => (
        <div ref={setPopperElement} className="suggestions-list" style={{ zIndex: 9999 }}>
            {suggestions.map((user, index) => (
                <div key={index} className="suggestion-item" onClick={() => handleSuggestionClick(user.username)}>
                    <div className='suggestion-item-profile-image'>
                        <ProfilePicture src={user.profile_image} />
                    </div>
                    <div className='suggestion-item-user-info'>
                        <span>{user.username}</span>
                        <span>{`${user.first_name} ${user.last_name}`}</span>
                    </div>
                </div>
            ))}
            <div ref={setArrowElement} className="arrow" />
        </div>
    );

    const handleSuggestionClick = (suggestion) => {
        if (!quillInstance.current) {
            console.error('Quill editor is not initialized.');
            return;
        }
        const quill = quillInstance.current;
        quill.focus();
        const range = quill.getSelection();
        if (range) {
            // Extract the content before the cursor and find the last incomplete query
            const textBeforeCursor = quill.getText(0, range.index);
            const match = textBeforeCursor.match(/(?:@|#|x\/)[^\s]*$/);

            if (match) {
                const prefix = match[0]; // The incomplete query (e.g., "@u")
                const startPos = range.index - prefix.length;

                quill.deleteText(startPos + 1, prefix.length); // Delete the trigger text
                quill.insertText(startPos + 1, suggestion + ' '); // Insert the suggestion with a space
                quill.setSelection(startPos + suggestion.length + 2); // Move cursor after the suggestion

                const newValue = quill.root.innerHTML;
                // setInputValue(newValue.trim());
                onContentChange(newValue);
                setSuggestions([]);
            }
        }
    };
    

    return (
        <div className="editor-container">
            <div className="editor">
                <div ref={editorRef} />
            </div>
            {suggestions.length > 0 && ReactDOM.createPortal(renderSuggestions(), document.body)}
            {showToolbar &&
                <div className="toolbar">
                    {renderButton('bold', faBold)}
                    {renderButton('italic', faItalic)}
                    {renderButton('underline', faUnderline)}
                    {renderButton('strike', faStrikethrough)}
                    {renderButton('list', faListOl, 'ordered')}
                    {renderButton('list', faListUl, 'bullet')}
                    {renderButton('align', faAlignLeft, '')}
                    {renderButton('align', faAlignCenter, 'center')}
                    {renderButton('align', faAlignRight, 'right')}
                    {renderButton('code', faCode)}
                    {renderButton('script', faSuperscript, 'super')}
                    {renderButton('script', faSubscript, 'sub')}
                    {supportMedia && (
                        <button onClick={handleImageUpload}>
                            <FontAwesomeIcon icon={faImage} />
                        </button>
                    )}
                    <div className="color-picker">
                        <input
                            type="color"
                            value={color}
                            onChange={handleColorChange}
                            className="color-picker"
                        />
                    </div>
                    <EmojiButton />
                    <div className="editor-selector">
                        <select onChange={(e) => applyFormat('size', e.target.value)} value={activeFormats.size || '16px'}>
                            <option value="12px">12px</option>
                            <option value="14px">14px</option>
                            <option value="16px">16px</option>
                            <option value="18px">18px</option>
                            <option value="20px">20px</option>
                        </select>
                    </div>
                </div>
            }
        </div>
    );
};

export default CustomEditor;
