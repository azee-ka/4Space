import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import usePopperDropdown from './usePopperDropdown';

const DropdownButton = ({
    children,
    toggleContent,
    placement = 'bottom-start',
    boundaryRef,
    anchorEl, // <-- Optional DOM node or ref for custom anchor
}) => {
    // Pass anchorEl into hook
    const { buttonRef, dropdownRef, showDropdown, toggleDropdown, setShowDropdown } = usePopperDropdown(false, placement, boundaryRef, anchorEl);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownRef, buttonRef, setShowDropdown]);

    // If using anchorEl (for example, a span inside the text), do not render the toggleContent
    // (It's only for those uses that want a button trigger)
    // So: only clone the button if anchorEl is not set (fallback)
    const renderToggle =
        !anchorEl ? React.cloneElement(toggleContent, {
            ref: buttonRef,
            onClick: (e) => {
                e.stopPropagation();
                toggleDropdown();
            },
            className: `${toggleContent.props.className || ''} ${showDropdown ? 'active' : ''}`.trim(),
        }) : null;

    return (
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {renderToggle}
            {showDropdown &&
                ReactDOM.createPortal(
                    <div 
                        ref={dropdownRef}
                        style={{ zIndex: 60 }}
                        // Optionally: you could animate, style, etc.
                    >
                        {children}
                    </div>,
                    document.body
                )
            }
        </div>
    );
};

export default DropdownButton;
