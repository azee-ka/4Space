import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useEditorContext } from './EditorContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSmile } from '@fortawesome/free-solid-svg-icons';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import DropdownButton from '../popperButton/DropdownButton';

const EmojiButton = () => {
    const { insertEmoji } = useEditorContext();

    const handleEmojiSelect = (emoji) => {
        if (insertEmoji) {
            insertEmoji(emoji);
        }
    };


    return (
        <div className='emoji-btn-container'>
            <DropdownButton
                placement={'top-start'}
                toggleContent={
                    <button className="emoji-button">
                        <FontAwesomeIcon className='icon-style' icon={faSmile} />
                    </button>
                }
            >
                <Picker data={data} onEmojiSelect={handleEmojiSelect} />
            </DropdownButton>
        </div>
    );
};

export default EmojiButton;
