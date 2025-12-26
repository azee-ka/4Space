import React, { useState, useEffect, useRef } from 'react';
import { FaSave, FaCheck } from 'react-icons/fa';

const NotesWidget = ({ widget, onConfigUpdate, isExpanded }) => {
  const [notes, setNotes] = useState(widget.config?.notes || '# My Notes\n\nStart writing here...');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const textareaRef = useRef(null);
  
  // Auto-save with debouncing
  useEffect(() => {
    setIsSaving(true);
    const timer = setTimeout(() => {
      onConfigUpdate({ notes });
      setIsSaving(false);
      setLastSaved(new Date());
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [notes]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isExpanded) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [notes, isExpanded]);
  
  const handleKeyDown = (e) => {
    // Tab support
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newValue = notes.substring(0, start) + '  ' + notes.substring(end);
      setNotes(newValue);
      
      // Set cursor position
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };
  
  const wordCount = notes.split(/\s+/).filter(Boolean).length;
  const charCount = notes.length;
  const lineCount = notes.split('\n').length;
  
  return (
    <div className="notes-widget">
      {/* Toolbar */}
      <div className="notes-toolbar">
        <div className="notes-stats">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} characters</span>
          {isExpanded && (
            <>
              <span>•</span>
              <span>{lineCount} lines</span>
            </>
          )}
        </div>
        <div className="notes-save-status">
          {isSaving ? (
            <span className="saving">
              <FaSave /> Saving...
            </span>
          ) : lastSaved ? (
            <span className="saved">
              <FaCheck /> Saved {lastSaved.toLocaleTimeString()}
            </span>
          ) : null}
        </div>
      </div>
      
      {/* Editor */}
      <textarea 
        ref={textareaRef}
        className="notes-textarea"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Start writing..."
        spellCheck={true}
        style={{ 
          minHeight: isExpanded ? '500px' : '400px',
          height: isExpanded ? 'auto' : '400px'
        }}
      />
    </div>
  );
};

export default NotesWidget;