// utils/editor/EmojiButton.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSmile } from '@fortawesome/free-solid-svg-icons';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import DropdownButton from '../popperButton/DropdownButton';

const EmojiButton = ({ inputRef, value, onChange }) => {
  const insertEmojiAtCursor = (emoji) => {
    const emojiChar = emoji.native || emoji;
    const el = inputRef?.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;

    const newText = value.slice(0, start) + emojiChar + value.slice(end);
    onChange(newText);

    // Set cursor after the emoji
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + emojiChar.length, start + emojiChar.length);
    }, 0);
  };

  return (
    <div className="emoji-btn-container">
      <DropdownButton
        placement="top-start"
        toggleContent={
          <button className="emoji-button">
            <FontAwesomeIcon icon={faSmile} />
          </button>
        }
      >
        <Picker data={data} onEmojiSelect={insertEmojiAtCursor} />
      </DropdownButton>
    </div>
  );
};

export default EmojiButton;
