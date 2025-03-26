import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import usePopperDropdown from './usePopperDropdown';
// import './dropdownButton.css'; // Import your CSS file for styling

const DropdownButton = ({
    children,            // The dropdown content, can be anything
    toggleContent,     // The button or trigger content
    placement = 'bottom-start',
    boundaryRef
}) => {
    const { buttonRef, dropdownRef, showDropdown, toggleDropdown, setShowDropdown } = usePopperDropdown(false, placement, boundaryRef);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setShowDropdown(false); // Explicitly close the dropdown
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownRef, buttonRef, setShowDropdown]);


    const clonedToggleContent = React.cloneElement(toggleContent, {
        ref: buttonRef,
        onClick: (e) => {
            e.stopPropagation();
            toggleDropdown();
        },
        className: `${toggleContent.props.className || ''} ${showDropdown ? 'active' : ''}`.trim(),
    });
    

    return (
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {clonedToggleContent}
            {/* <div ref={buttonRef}
                onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown();
                }}>
                {toggleContent}}
            </div> */}
            {showDropdown &&
                ReactDOM.createPortal(
                    <div 
                        ref={dropdownRef}
                        style={{
                            zIndex: 60,
                        }}
                    >
                        {children} {/* The dropdown content */}
                    </div>,
                    document.body
                )
            }
        </div>
    );
};

export default DropdownButton;
