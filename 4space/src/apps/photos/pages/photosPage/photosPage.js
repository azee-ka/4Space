import React, { useState, useEffect, useRef } from "react";
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
    const [error, setError] = useState('');
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


    const findMaxHeight = (items) => {
        let maxHeight = 0;
        items.forEach(item => {
            // Create off-screen element
            const offScreenElement = item.cloneNode(true);
            offScreenElement.style.position = 'absolute';
            offScreenElement.style.visibility = 'hidden';
            offScreenElement.style.height = 'auto';
            offScreenElement.style.width = 'auto';

            // Append off-screen element to document body
            document.body.appendChild(offScreenElement);

            // Measure natural height
            const naturalHeight = offScreenElement.offsetHeight;

            // Remove off-screen element from the document
            document.body.removeChild(offScreenElement);

            // Update max height
            if (naturalHeight > maxHeight) {
                maxHeight = naturalHeight;
            }
        });
        return maxHeight;
    }

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


    const renderRows = (rows) => {
        // Iterate over each row
        rows.forEach(row => {
            // Iterate over each item in the row
            row.forEach(item => {
                const media = item.media;
                if (media) {
                    // Set the width and height of the media element
                    media.style.width = `${item.newWidth}px`;
                    media.style.height = `${item.maxHeight}px`;
                }
            });
        });
    };

    const handleEachGroup = (items, maxHeight, groupWidth) => {
        let rows = [];
        let currentRow = [];
        let currentTotalWidth = 0;
        let lastIndex = 0;
    
        const calculateAspectRatios = (items, startIndex) => {
            let totalAspectRatio = 0;
            for (let i = startIndex; i < items.length; i++) {
                const media = items[i].querySelector('img, video');
                if (media) {
                    const aspectRatio = media.naturalWidth / media.naturalHeight;
                    totalAspectRatio += aspectRatio;
                }
            }
            return totalAspectRatio;
        };
    
        items.forEach((item, index) => {
            const media = item.querySelector('img, video');
            if (media) {
                const aspectRatio = media.naturalWidth / media.naturalHeight;
                let newWidth = maxHeight * aspectRatio;
    
                if (currentTotalWidth + newWidth < groupWidth || currentTotalWidth + newWidth === groupWidth) {
                    currentRow.push({ media, newWidth, maxHeight });
                    currentTotalWidth += newWidth;
                    lastIndex = index;
                } else {
                    // Attempt to fit one more item to fill the space
                    if (index + 1 < items.length) {
                        const nextMedia = items[index + 1].querySelector('img, video');
                        const nextAspectRatio = nextMedia ? nextMedia.naturalWidth / nextMedia.naturalHeight : 0;
                        const totalAspectRatio = calculateAspectRatios(items, lastIndex) + nextAspectRatio;
    
                        let newMaxHeight = groupWidth / totalAspectRatio;
                        newWidth = newMaxHeight * aspectRatio;
                        let nextNewWidth = newMaxHeight * nextAspectRatio;
    
                        if (currentTotalWidth + newWidth + nextNewWidth <= groupWidth) {
                            // Fit the next item in the current row
                            maxHeight = newMaxHeight;
                            currentRow.forEach(item => {
                                item.maxHeight = newMaxHeight;
                                item.newWidth = item.maxHeight * (item.media.naturalWidth / item.media.naturalHeight);
                            });
                            currentRow.push({ media: nextMedia, newWidth: nextNewWidth, maxHeight });
                            currentTotalWidth += newWidth + nextNewWidth;
                            lastIndex = index + 1;
                        } else {
                            // Adjust the row to new max height
                            maxHeight = groupWidth / calculateAspectRatios(items, lastIndex + 1);
                            currentRow.forEach(item => {
                                item.maxHeight = maxHeight;
                                item.newWidth = item.maxHeight * (item.media.naturalWidth / item.media.naturalHeight);
                            });
                            rows.push(currentRow);
                            currentRow = [{ media, newWidth, maxHeight }];
                            currentTotalWidth = newWidth;
                            lastIndex = index;
                        }
                    } else {
                        rows.push(currentRow);
                        currentRow = [{ media, newWidth, maxHeight }];
                        currentTotalWidth = newWidth;
                        lastIndex = index;
                    }
                }
            }
        });
    
        if (currentRow.length > 0) {
            rows.push(currentRow);
        }
    
        return rows;
    };
    


    const handleStackItems = () => {
        let minHeight = 200;
        const photoGroups = photoGroupRef.current.querySelectorAll('.photo-group-grid');

        photoGroups.forEach(group => {
            const groupWidth = group.getBoundingClientRect().width;
            console.log("groupWidth", groupWidth)
            const items = Array.from(group.children);

            let maxHeight = findMaxHeight(items);
            if (maxHeight < minHeight) {
                maxHeight = minHeight;
            }
            console.log("maxHeight", maxHeight);
            console.log('items', items);
            let newItems = handleEachGroup(items, maxHeight, groupWidth);
            console.log('newItems', newItems);
            renderRows(newItems);
        });

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
                        {photos.map((photosGroup, index) => (
                            <div key={index} className="photo-each-group">
                                <div className="photo-group-date">
                                    <p>{formatDate(photosGroup.date, false, true, true)}</p>
                                </div>
                                <div className="photo-group-grid">
                                    {photosGroup.photos.map((photo, index) => (
                                        <div key={index} className="photo-item">
                                            {handleRenderMedia(photo.media)}
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