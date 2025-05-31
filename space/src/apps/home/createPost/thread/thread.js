import React, { useRef, useState } from 'react';
import './thread.scss';
import { FaEllipsisV, FaUpload } from 'react-icons/fa';

const Thread = React.forwardRef(({ showpostEditorToolbar, setShowpostEditorToolbar, handleButtonClick }, ref) => {
    const [postType, setpostType] = useState("idea");

    const handlepostTypeChange = (e) => setpostType(e.target.value);

    // Expose the getData method via the ref
    React.useImperativeHandle(ref, () => ({
        getData: () => ({
            type: 'Thread',
            content_type: postType,
        }),
    }));

    return (
        <div className="create-post-actions-menubar">
            <div className="create-post-actions-menubar-inner">
                <div className="create-post-menu-btn" onClick={handleButtonClick}>
                    <label>
                        <FaUpload className="icon-style" />
                    </label>
                </div>
                <div className="create-post-menu-btn" id="create-post-menu-btn-selector">
                    <select value={postType} onChange={handlepostTypeChange}>
                        <option disabled value="idea">Select Type</option>
                        <option value="announcement">Announcement</option>
                        <option value="leaning-opinion">Leaning Opinion</option>
                        <option value="idea">Thought</option>
                        <option value="question">Question</option>
                    </select>
                </div>
            </div>
            <div className="create-post-actions-menubar-inner">
                <button
                    className="create-post-settings-btn"
                    onClick={() => setShowpostEditorToolbar(!showpostEditorToolbar)}
                >
                    {showpostEditorToolbar ? 'Hide Toolbar' : 'Show Toolbar'}
                </button>
                <button className="create-post-settings-btn">
                    <FaEllipsisV className="icon-style" />
                </button>
            </div>
        </div>
    );
});

export default Thread;