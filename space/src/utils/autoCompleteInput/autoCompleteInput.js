import React, { useState, useRef, useEffect } from 'react';
import Quill from 'quill'; // Import Quill library
import 'quill/dist/quill.snow.scss'; // Import Quill styles
import './autoCompleteInput.scss';

const AutoCompleteInput = ({ onChange, placeholder, type = 'textarea' }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef(null); // Ref for input or textarea
    const quillRef = useRef(null); // Ref for Quill editor
    const quillInstance = useRef(null);

    useEffect(() => {
        if (type === 'custom' && quillRef.current) {
            // Initialize Quill only once when the component mounts
            quillInstance.current = new Quill(quillRef.current, {
                theme: 'snow',
                placeholder: placeholder || "Type something...",
                modules: {
                    toolbar: false // Attach custom toolbar
                }
            });

            quillInstance.current.on('text-change', () => {
                const htmlContent = quillInstance.current.root.innerHTML; // Get HTML content
                const textContent = quillInstance.current.getText().trim(); // Get plain text content without HTML tags
                setInputValue(htmlContent);
                handleQuillChange(textContent);
                onChange(htmlContent);
            });
        }
    }, [type, placeholder, onChange]);

    const fetchSuggestions = (query) => {
        console.log('query', query)
        const mockData = {
            mentions: ['john', 'jane', 'admin'],
            hashtags: ['crypto', 'tech', 'news'],
            exchanges: ['bitfinex', 'coinbase', 'kraken']
        };

        const type = query.startsWith('@') ? 'mentions' :
            query.startsWith('#') ? 'hashtags' :
                query.startsWith('x/') ? 'exchanges' : null;

        if (type) {
            const results = mockData[type].filter(item => item.startsWith(query.slice(1)));
            setSuggestions(results);
        } else {
            setSuggestions([]);
        }
    };

    const insertSuggestion = (startPos, endPos, symbol, suggestion) => {
        const before = inputValue.slice(0, startPos);
        const after = inputValue.slice(endPos);
        return before + symbol + suggestion + ' ' + after;
    };


    const handleQuillChange = (value) => {
        const regex = /(?:@|#|x\/)[^\s]*/g;
        const matches = value.match(regex);
        console.log('matches', matches)
        if (matches && matches.length > 0) {
            const lastMatch = matches[matches.length - 1];
            fetchSuggestions(lastMatch);
        } else {
            setSuggestions([]);
        }
    };


    const handleChange = (e) => {
        const value = e.target.value;
        setInputValue(value);
        console.log('val', value)
        const regex = /(?:@|#|x\/)[^\s]*/g;
        const matches = value.match(regex);

        if (matches && matches.length > 0) {
            const lastMatch = matches[matches.length - 1];
            fetchSuggestions(lastMatch);
        } else {
            setSuggestions([]);
        }

        onChange(value);
    };

    const handleSelectSuggestion = (suggestion) => {
        if (type === 'custom') {
            const quill = quillInstance.current;
            quill.focus();
            const range = quill.getSelection();
            if (range) {
                const [prefix] = inputValue.slice(0, range.index).match(/(?:@|#|x\/)[^\s]*$/) || [''];
                const startPos = range.index - prefix.length;
    
                quill.deleteText(startPos, prefix.length); // Delete the trigger text
                quill.insertText(startPos, suggestion + ' '); // Insert the suggestion with a space
                quill.setSelection(startPos + suggestion.length + 2); // Move cursor after the suggestion
    
                const newValue = quill.root.innerHTML;
                setInputValue(newValue.trim());
                onChange(newValue);
                setSuggestions([]);
            }
        } else {
            const cursorPosition = inputRef.current.selectionStart;

            const regex = /(?:@|#|x\/)[^\s]*/g;
            const beforeCursor = inputValue.slice(0, cursorPosition);
            const matches = beforeCursor.match(regex);

            if (matches && matches.length > 0) {
                const lastMatch = matches[matches.length - 1];
                const startPos = beforeCursor.lastIndexOf(lastMatch);
                const endPos = startPos + lastMatch.length;
                const symbol = lastMatch[0];
                const updatedText = insertSuggestion(startPos, endPos, symbol, suggestion);

                setInputValue(updatedText);
                setSuggestions([]);

                const newCursorPosition = startPos + symbol.length + suggestion.length + 1;
                setTimeout(() => {
                    inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
                }, 0);

                onChange(updatedText);
            }

            if (inputRef.current) {
                inputRef.current.focus();
            }
        }
    };

    const handleSuggestionClick = (suggestion) => {
        handleSelectSuggestion(suggestion);
    };
    

    return (
        <div className="autocomplete-container">
            {type === 'textarea' && (
                <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleChange}
                    placeholder={placeholder || "Type something..."}
                />
            )}
            {type === 'input' && (
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleChange}
                    placeholder={placeholder || "Type something..."}
                />
            )}
            {type === 'custom' && (
                <div ref={quillRef}></div>
            )}
            {suggestions.length > 0 && (
                <div className="autocomplete-dropup">
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={index}
                            className="suggestion-item"
                            onClick={() => handleSuggestionClick(suggestion)}
                        >
                            {suggestion}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AutoCompleteInput;
