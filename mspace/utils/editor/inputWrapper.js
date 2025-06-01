import React, { useState, useEffect, useRef } from 'react';
import './inputWrapper.scss';
import { parseContent } from './parser';
import CustomEditor from './editor';
import useApi from '../useApi';
import ProfilePicture from '../profilePicture/getProfilePicture';

const InputWrapper = ({
  value = '',
  onChange,
  placeholder = '',
  type = 'input', // text, textarea, or customEditor
  showSuggestions = true, // Whether to show suggestions based on input
  showToolbar = false,
}) => {
  const { callApi } = useApi();
  const [content, setContent] = useState(value);
  const [rawContent, setRawContent] = useState(value);
  const [suggestions, setSuggestions] = useState([]); // State to store suggestions
  const [cursorPosition, setCursorPosition] = useState(null); // State to track cursor position for positioning the suggestions list
  const inputRef = useRef(null); // To focus input after selection
  const suggestionsRef = useRef(null); // To reference the suggestions container

  useEffect(() => {
    setContent(parseContent(value));
    setRawContent(value);
  }, [value]);

  const fetchSuggestions = async (query) => {
    if (!query) return;
    try {
      const response = await callApi(`search/user/?query=${query}`);
      setSuggestions(response.data); // Assuming the response is an array of users
    } catch (error) {
      console.error('Error fetching suggestions', error);
    }
  };

  const handleTextChange = (e) => {
    const newContent = e.target.value;
    const parsedContent = parseContent(newContent);

    setRawContent(newContent); // Update raw content
    setContent(parsedContent);  // Update parsed content
    onChange(parsedContent);    // Call the external onChange handler

    // Detect text after '@' for search
    const lastMention = newContent.match(/@([a-zA-Z0-9_]+)/);
    if (lastMention) {
      fetchSuggestions(lastMention[1]); // Fetch suggestions based on the typed text after '@'
    } else {
      setSuggestions([]); // Clear suggestions if there's no '@'
    }

    // Track cursor position (use setTimeout to get cursor position after re-render)
    setTimeout(() => {
      if (inputRef.current) {
        setCursorPosition(inputRef.current.selectionStart);
      }
    }, 0);
  };

  const handleSuggestionClick = (username) => {
    // Get the current cursor position before the insertion
    const cursorPosition = inputRef.current.selectionStart;

    // Find the position of the '@' symbol in the current text before the cursor
    const lastMentionPosition = rawContent.lastIndexOf('@', cursorPosition - 1);

    // Split the content into parts before and after the '@' symbol
    const beforeMention = rawContent.slice(0, lastMentionPosition);

    // Find the portion after '@' to replace (the incomplete query)
    const afterMention = rawContent.slice(lastMentionPosition + 1); // Content after '@'

    // Check if there's more text after the incomplete username (query)
    const spaceIndex = afterMention.indexOf(' '); // Check if there's a space after the query
    const toReplace = spaceIndex === -1 ? afterMention : afterMention.slice(0, spaceIndex); // Only the incomplete query

    // Construct the new content with the selected username and space
    const newContent = `${beforeMention}@${username}${afterMention.slice(toReplace.length)}`;

    // Update rawContent and parsedContent
    setRawContent(newContent);
    setContent(parseContent(newContent));  // Parse the content (where the <a> tag is inserted)

    // Call the external onChange handler with the new content
    onChange(newContent);

    // Hide suggestions after insertion
    setSuggestions([]);

    // Focus back to the input field after insertion
    if (inputRef.current) {
      inputRef.current.focus();

      const newCursorPosition = lastMentionPosition + 1 + username.length; // Account for '@' and username length

      setTimeout(() => {
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    }
  };

  const positionSuggestions = () => {
    if (!cursorPosition || !inputRef.current || !suggestionsRef.current) return {};

    const inputRect = inputRef.current.getBoundingClientRect();
    const suggestionHeight = suggestionsRef.current.offsetHeight;
    const suggestionWidth = suggestionsRef.current.offsetWidth;

    const suggestionTop = inputRect.top + window.scrollY + inputRect.height; // Place suggestions below the input
    const suggestionLeft = inputRect.left + window.scrollX;
    const suggestionBottom = suggestionTop + suggestionHeight;

    // If there's not enough space below, position the suggestions above
    if (suggestionBottom > window.innerHeight) {
      return {
        top: inputRect.top - suggestionHeight + window.scrollY, // Position above the input
        left: suggestionLeft,
      };
    } else {
      return {
        top: suggestionTop, // Position below the input
        left: suggestionLeft,
      };
    }
  };

  const renderSuggestions = () => {
    const position = positionSuggestions();
    console.log('suge', suggestions);
    return (
      <div
        className="suggestions-list"
        ref={suggestionsRef}
        style={{ top: position.top, left: position.left }} // Dynamically set the position of suggestions list
      >
        {suggestions.map((user) => (
          <div
            key={user.username}
            className="suggestion-item"
            onClick={() => handleSuggestionClick(user.username)} // Handle click for suggestion
          >
            <div className="suggestion-item-profile-image">
              <ProfilePicture src={user.profile_image} />
            </div>
            {/* Render the suggestion with a span for the display, but without anchor tag behavior */}
            <div className="suggestion-item-user-info">
              <span>{user.username}</span>
              <span>{`${user.first_name} ${user.last_name}`}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderInput = () => {
    if (type === 'custom') {
      return (
        <CustomEditor
          content={content}
          onContentChange={onChange}
          placeholder={placeholder}
          showToolbar={showToolbar && type === 'custom'}
        />
      );
    } else if (type === 'textarea') {
      return (
        <textarea
          ref={inputRef}
          value={rawContent}
          placeholder={placeholder}
          onChange={handleTextChange}
          className="hidden-textarea"
        />
      );
    } else {
      return (
        <input
          ref={inputRef}
          type="text"
          value={rawContent}
          placeholder={placeholder}
          onChange={handleTextChange}
          className="hidden-input"
        />
      );
    }
  };

  return (
    <div className="input-wrapper">
      {renderInput()}
      {(showSuggestions && showSuggestions.length > 0) && renderSuggestions()} {/* Render suggestions */}
    </div>
  );
};

export default InputWrapper;
