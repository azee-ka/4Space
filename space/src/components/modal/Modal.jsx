// src/components/Modal.jsx
import React, { useRef } from 'react'
import { CSSTransition } from 'react-transition-group'
import { FaTimes } from 'react-icons/fa'
import './Modal.css'

/**
 * size: one of "sm" | "md" | "lg" | "xl"
 * maxWidth: a CSS width string, e.g. "80%", "500px"
 * maxHeight: a CSS height string, e.g. "70vh"
 */
function Modal({
  isOpen,
  onClose,
  title,
  subHeader,
  children,
  footer,
  size,        // new
  maxWidth,    // new
  maxHeight,   // new
}) {
  const overlayRef = useRef(null)
  // build up a style object so inline overrides trump the CSS variable
  const panelStyle = {
    ...(maxWidth ? { '--modal-max-width': maxWidth } : {}),
    ...(maxHeight ? { '--modal-max-height': maxHeight } : {}),
  }
  // turn size="sm" into class="modal-sm"
  const sizeClass = size ? `modal-${size}` : ''

  return (
    <CSSTransition
      in={isOpen}
      timeout={200}
      classNames="modal"
      unmountOnExit
      nodeRef={overlayRef}
    >
      <div
        className="modal-overlay"
        ref={overlayRef}
        onClick={onClose}
      >
        <div
          className={`modal-content ${sizeClass}`}
          style={panelStyle}
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <FaTimes />
          </button>

          <header className="modal-header">
            <h2 className="modal-title">{title}</h2>
          </header>

          {subHeader && (
            <div className="modal-subheader">{subHeader}</div>
          )}

          <div className="modal-body">{children}</div>

          {footer && <footer className="modal-footer">{footer}</footer>}
        </div>
      </div>
    </CSSTransition>
  )
}

export default Modal
