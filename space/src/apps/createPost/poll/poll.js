import React, { useEffect, useRef, useState } from 'react';
import './poll.css';
import { useDrag, useDrop } from 'react-dnd';
import { FaGripLines } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const ItemType = 'poll-option';

const Poll = () => {
    const [options, setOptions] = useState(["", ""]);
    const lastFocusedIndex = useRef(null); // Track last focused input

    const handleOptionChange = (index, value) => {
        setOptions((prevOptions) =>
            prevOptions.map((opt, i) => (i === index ? value : opt))
        );
        lastFocusedIndex.current = index; // Preserve focus
    };

    const handleAddOption = () => {
        setOptions((prevOptions) => [...prevOptions, ""]);
        lastFocusedIndex.current = options.length; // Track new option index for focus
    };

    const handleRemoveOption = (index) => {
        setOptions((prevOptions) => {
            const newOptions = prevOptions.filter((_, i) => i !== index);
            lastFocusedIndex.current = null; // Reset focus to avoid jumping
            return newOptions;
        });
    };

    const moveOption = (dragIndex, hoverIndex) => {
        setOptions((prevOptions) => {
            const updatedOptions = [...prevOptions];
            const draggedOption = updatedOptions[dragIndex];
            updatedOptions.splice(dragIndex, 1);
            updatedOptions.splice(hoverIndex, 0, draggedOption);
            return updatedOptions;
        });
    };

    const DraggableOption = ({ index, option }) => {
        const inputRef = useRef(null);
        const [, drag] = useDrag({
            type: ItemType,
            item: { index },
        });

        const [, drop] = useDrop({
            accept: ItemType,
            hover: (item) => {
                if (item.index !== index) {
                    moveOption(item.index, index);
                    item.index = index;
                }
            },
        });

        useEffect(() => {
            if (lastFocusedIndex.current === index) {
                inputRef.current?.focus();
            }
        }, [options.length, index]); // Focus only when needed

        return (
            <div ref={(node) => drag(drop(node))} className="poll-option-container">
                <FaGripLines className="drag-icon" />
                <input
                    type="text"
                    placeholder={`Option ${index + 1}`}
                    className="create-post-input poll-option"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    ref={inputRef}
                />
                {index >= 2 && (
                    <button className="remove-option-btn" onClick={() => handleRemoveOption(index)}>
                        <FontAwesomeIcon icon={faTimes} className='icon-style'/>
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="poll-post-fields">
            <input
                type="text"
                placeholder="Poll Question..."
                className="create-post-input poll-question"
            />
            {options.map((option, index) => (
                <DraggableOption key={index} index={index} option={option} />
            ))}
            <button className="add-option-btn" onClick={handleAddOption}>
                + Add Option
            </button>
        </div>
    );
};

export default Poll;
