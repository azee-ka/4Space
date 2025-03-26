// usePopperDropdown.js
import { useEffect, useRef, useState } from 'react';
import { createPopper } from '@popperjs/core';

const usePopperDropdown = (
    initialShow = false,
    placement = 'bottom-start',
    boundaryRef
) => {
    const [showDropdown, setShowDropdown] = useState(initialShow);
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);


    // Intersection Observer to detect if the button goes out of view
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                // If the button goes out of view, hide the dropdown
                entries.forEach(entry => {
                    if (!entry.isIntersecting) {
                        setShowDropdown(false); // Hide the dropdown if button is out of view
                    }
                });
            },
            {
                root: boundaryRef?.current || null, // If you have a specific parent boundary to track
                rootMargin: '0px', // Optionally add some margin around the root
                threshold: 0.1, // Trigger when 10% of the button is out of view
            }
        );

        if (buttonRef.current) {
            observer.observe(buttonRef.current);
        }

        // Cleanup observer when component unmounts or button changes
        return () => {
            if (buttonRef.current) {
                observer.unobserve(buttonRef.current);
            }
        };
    }, [boundaryRef]);


    useEffect(() => {
        let popperInstance = null;

        if (showDropdown && buttonRef.current && dropdownRef.current) {
            popperInstance = createPopper(buttonRef.current, dropdownRef.current, {
                placement: placement,
                modifiers: [
                    {
                        name: 'offset',
                        options: {
                            offset: [0, 6],
                        },
                    },
                    {
                        name: 'preventOverflow',
                        options: {
                            boundary: boundaryRef?.current || 'viewport',
                        },
                    },
                    {
                        name: 'flip',
                        options: {
                            enabled: true,
                            boundary: boundaryRef?.current || 'viewport',
                        },
                    },
                    {
                        name: 'hide',
                        options: {
                            enabled: true,
                            boundary: boundaryRef?.current || 'viewport',
                        },
                    },
                ],
            });
        }

        return () => {
            if (popperInstance) {
                popperInstance.destroy();
            }
        };
    }, [showDropdown, placement, boundaryRef]);


    const toggleDropdown = () => setShowDropdown(!showDropdown);

    return { buttonRef, dropdownRef, showDropdown, setShowDropdown, toggleDropdown };
};

export default usePopperDropdown;
