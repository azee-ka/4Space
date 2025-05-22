import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSmile } from '@fortawesome/free-solid-svg-icons';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import DropdownButton from '../popperButton/DropdownButton';

const EmojiButton = ({ onEmojiSelect }) => {
  const handleEmojiSelect = (emoji) => {
    if (onEmojiSelect) onEmojiSelect(emoji);
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
        <Picker data={data} onEmojiSelect={handleEmojiSelect} />
      </DropdownButton>
    </div>
  );
};

export default EmojiButton;
