import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import usePopperDropdown from './usePopperDropdown';

const DropdownButton = ({
    children,
    toggleContent,
    placement = 'bottom-start',
    boundaryRef,
    anchorEl,
}) => {
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

    const renderToggle =
        !anchorEl ? React.cloneElement(toggleContent, {
            ref: buttonRef,
            onClick: (e) => {
                e.stopPropagation();
                toggleDropdown();
            },
            className: `${toggleContent.props.className || ''} ${showDropdown ? 'active' : ''}`.trim(),
        }) : null;

    const closeDropdown = () => setShowDropdown(false);

    let content;
    if (typeof children === "function") {
        // Render prop: call with closeDropdown
        content = children({ closeDropdown });
    } else {
        // Normal JSX element(s)
        content = children;
    }

    return (
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {renderToggle}
            {showDropdown &&
                ReactDOM.createPortal(
                    <div
                        ref={dropdownRef}
                        style={{ zIndex: 60 }}
                    >
                        {content}
                    </div>,
                    document.body
                )
            }
        </div>
    );
};

export default DropdownButton;
