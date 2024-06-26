import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from 'axios';
import './photosPage.css';
import API_BASE_URL from "../../../../general/components/Authentication/utils/apiConfig";
import GetConfig from "../../../../general/components/Authentication/utils/config";
import { useAuthState } from "../../../../general/components/Authentication/utils/AuthProvider";
import { formatDate } from "../../../../general/utils/formatDate";

const PhotosPage = () => {
    const { token } = useAuthState();
    const config = GetConfig(token);
    const [photos, setPhotos] = useState([]);
    const [photosToRender, setPhotosToRender] = useState([]);

    const [error, setError] = useState('');

    // State to store the width of the photo-grid container
    const [gridWidth, setGridWidth] = useState(0);
    const photoGroupRef = useRef(null);

    const fetchPhotos = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/apps/photos/get-all-photos/`, config);
            setPhotos(response.data);
            console.log(response.data);
        } catch (error) {
            console.error('Error fetching photos:', error);
            setError('Error fetching photos. Please try again.');
        }
    };




    // const findTotalRowWidth = (items) => {
    //     let totalWidth = 0;
    //     items.forEach(item => {
    //         // Create off-screen element
    //         const offScreenElement = item.cloneNode(true);
    //         offScreenElement.style.position = 'absolute';
    //         offScreenElement.style.visibility = 'hidden';
    //         offScreenElement.style.height = 'auto';
    //         offScreenElement.style.width = 'auto';

    //         // Append off-screen element to document body
    //         document.body.appendChild(offScreenElement);

    //         // Measure natural height
    //         const naturalWidth = offScreenElement.offsetWidth;

    //         // Remove off-screen element from the document
    //         document.body.removeChild(offScreenElement);

    //         // Update max height
    //         totalWidth += naturalWidth
    //     });
    //     return totalWidth;
    // }


    // const handleStackItems = () => {
    //     const photoGroups = photoGroupRef.current.querySelectorAll('.photo-group-grid');

    //     photoGroups.forEach(group => {
    //         const groupWidth = group.getBoundingClientRect().width;
    //         const items = Array.from(group.children);
    //         const maxHeight = findMaxHeight(items);
    //         console.log('maxHeight', maxHeight);
    //         let currentRowItems = [];
    //         let currentRowWidth = 0;
    //         const rows = [];

    //         items.forEach((item, index) => {
    //             const media = item.querySelector('img, video');
    //             if (media) {
    //                 const aspectRatio = media.naturalWidth / media.naturalHeight;
    //                 const newWidth = maxHeight * aspectRatio;
    //                 console.log('newWidth', newWidth)
    //                 if (currentRowWidth + newWidth > groupWidth) {
    //                     rows.push(currentRowItems);
    //                     currentRowItems = [];
    //                     currentRowWidth = 0;
    //                 }

    //                 currentRowItems.push(item);
    //                 currentRowWidth += newWidth;
    //             }

    //             if (index === items.length - 1) {
    //                 rows.push(currentRowItems);
    //             }
    //         });
    //         console.log('currentRowItems', currentRowItems);
    //         console.log('currentRowWidth', currentRowWidth);


    //         // Render the rows with the correct height and width
    //         rows.forEach(row => {
    //             const adjustedHeight = maxHeight;

    //             row.forEach(item => {
    //                 const media = item.querySelector('img, video');
    //                 if (media) {
    //                     const aspectRatio = media.naturalWidth / media.naturalHeight;
    //                     const newWidth = adjustedHeight * aspectRatio;;

    //                     console.log('media.naturalWidth', media.naturalWidth);
    //                     console.log('media.naturalHeight', media.naturalHeight)
    //                     console.log("aspectRatio", aspectRatio);
    //                     console.log("adjustedHeight", adjustedHeight);
    //                     console.log("newWidth", newWidth);

    //                     media.style.width = `${newWidth}px`;
    //                     media.style.height = `${adjustedHeight}px`;
    //                 }
    //             });
    //         });
    //     });
    // };


    // Function to update the width
    const updateGridWidth = () => {
        if (photoGroupRef.current) {
            setGridWidth(photoGroupRef.current.offsetWidth);
        }
    };

    // useEffect hook to access the width after component mounts
    useEffect(() => {
        updateGridWidth();

        // Add event listener for window resize
        window.addEventListener('resize', updateGridWidth);

        // Cleanup function to remove the event listener
        return () => {
            window.removeEventListener('resize', updateGridWidth);
        };
    }, []);


    const handleEachGroup = (photos) => {
        let groupRows = [];
        let row = [];
        let currentRowWidth = 0;
        let currentRowHeight = 240; // Start with the minimum height

        photos.forEach((photo, index) => {
            const { naturalWidth, naturalHeight } = getPhotoDimensions(photo.media);

            const aspectRatio = naturalWidth / naturalHeight;
            const photoHeight = 240;
            const photoWidth = photoHeight * aspectRatio;
            // console.log("currentRowHeight", currentRowHeight)
            // console.log("aspectRatio", aspectRatio)
            // console.log('photoWidth1', photoWidth);
            // console.log('photoHeight1', photoHeight);

            if (aspectRatio && photoHeight && photoWidth) {
                // Check if adding this photo to the current row would exceed the grid width
                if (currentRowWidth + photoWidth > gridWidth) {
                    // Adjust the row height to make the photos fit exactly into the grid width
                    const adjustedHeight = (gridWidth / currentRowWidth) * currentRowHeight;

                    // Ensure the adjusted height is within the min and max bounds
                    const finalRowHeight = Math.min(Math.max(adjustedHeight, 240), 500);

                    // Update the width of each photo in the current row to maintain aspect ratio
                    row = row.map(item => ({
                        ...item,
                        width: finalRowHeight * aspectRatio,
                        height: finalRowHeight,
                    }));
                    if (row.length > 0) {
                        groupRows.push(row);
                    }

                    // Start a new row
                    row = [];
                    currentRowWidth = 0;
                    currentRowHeight = finalRowHeight;
                }
            
            // console.log('photoWidth', photoWidth);
            // console.log('photoHeight', photoHeight);

            row.push({
                ...photo,
                width: photoWidth,
                height: photoHeight,
                aspectRatio: aspectRatio
            });
            currentRowWidth += photoWidth;
        }
        });


        // Add the last row if it has photos
        if (row.length > 0) {
            groupRows.push(row);
        }

        return groupRows;
    };

    const handleStackItems = () => {
        let allGroupsRows = [];
        updateGridWidth();

        photos.forEach((group) => {
            let groupRows = handleEachGroup(group.photos);
            allGroupsRows.push({ date: group.date, groupRows: groupRows });
        });

        console.log(allGroupsRows)
        setPhotosToRender(allGroupsRows);

        // Process allGroupsRows as needed, for example, updating the state or rendering the rows
    };

    // Helper function to get photo dimensions
    const getPhotoDimensions = (media) => {
        const img = new Image();
        img.src = `${API_BASE_URL}${media.file}`;
        // console.log('img.width', img.width);
        // console.log('img.height', img.height)
        return { naturalWidth: img.width, naturalHeight: img.height };
    };


    useEffect(() => {
        handleStackItems();
    }, [photos]);


    useEffect(() => {
        fetchPhotos();
        handleStackItems();
    }, []);

    const handleRenderMedia = (media) => {
        if (media) {
            if (media.media_type === "image") {
                return <img src={`${API_BASE_URL}${media.file}`} alt="Photo" />;
            } else if (media.media_type === "video") {
                return <video src={`${API_BASE_URL}${media.file}`} controls />;
            } else {
                return <p>Unsupported media type</p>;
            }
        }
    };

    return (
        <div className="photos-page">
            <div className="photos-page-inner">
                <div className="photos-page-header">
                    <h2>Photos</h2>
                </div>
                <div className="photos-page-content">
                    <div className="photo-grid" ref={photoGroupRef}>
                        {photosToRender.map((photosGroup, index) => (
                            <div key={index} className="photo-each-group">
                                <div className="photo-group-date">
                                    <p>{formatDate(photosGroup.date, false, true, true)}</p>
                                </div>
                                <div className="photo-group-grid">
                                    {photosGroup.groupRows.map((row, rowIndex) => (
                                        <div key={rowIndex} className="photo-row">
                                            {row.map((item, itemIndex) => (
                                                <div key={itemIndex} className="photo-item" style={{ width: item.width, height: item.height }}>
                                                    {handleRenderMedia(item.media)}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {error && <div className="error">{error}</div>}
            </div>
        </div>
    );
};

export default PhotosPage;