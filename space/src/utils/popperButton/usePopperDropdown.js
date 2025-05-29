import { useEffect, useRef, useState } from 'react';
import { createPopper } from '@popperjs/core';

const usePopperDropdown = (
    initialShow = false,
    placement = 'bottom-start',
    boundaryRef,
    anchorEl, // <-- New optional anchor node
) => {
    const [showDropdown, setShowDropdown] = useState(initialShow);
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);

    // Intersection Observer: always use buttonRef as before
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) setShowDropdown(false);
                });
            },
            {
                root: boundaryRef?.current || null,
                rootMargin: '0px',
                threshold: 0.1,
            }
        );

        if (buttonRef.current) {
            observer.observe(buttonRef.current);
        }
        return () => {
            if (buttonRef.current) observer.unobserve(buttonRef.current);
        };
    }, [boundaryRef]);

    useEffect(() => {
        let popperInstance = null;
        // Use anchorEl (real DOM node) if provided, else fallback to buttonRef.current
        const referenceElement = anchorEl?.current || anchorEl || buttonRef.current;
        // Accept anchorEl as a ref or DOM node for flexibility

        if (showDropdown && referenceElement && dropdownRef.current) {
            popperInstance = createPopper(referenceElement, dropdownRef.current, {
                placement: placement,
                modifiers: [
                    { name: 'offset', options: { offset: [0, 6] } },
                    { name: 'preventOverflow', options: { boundary: boundaryRef?.current || 'viewport' } },
                    { name: 'flip', options: { enabled: true, boundary: boundaryRef?.current || 'viewport' } },
                    { name: 'hide', options: { enabled: true, boundary: boundaryRef?.current || 'viewport' } },
                ],
            });
        }

        return () => {
            if (popperInstance) popperInstance.destroy();
        };
    }, [showDropdown, placement, boundaryRef, anchorEl]); // depend on anchorEl too

    const toggleDropdown = () => setShowDropdown(!showDropdown);

    return { buttonRef, dropdownRef, showDropdown, setShowDropdown, toggleDropdown };
};

export default usePopperDropdown;
