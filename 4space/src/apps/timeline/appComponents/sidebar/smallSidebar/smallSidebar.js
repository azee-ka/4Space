import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './smallSidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlus, faCalendar, faFolder, faCog, faStream, faLayerGroup , faSearch} from '@fortawesome/free-solid-svg-icons';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import SearchSidebar from '../searchSidebar/searchSidebar';

const SmallSidebar = ({ handleShowCreatePostOverlayClick, handleOpenSearchSidebar, searchSidebarOpen, onClose }) => {
    
    const taskFlow = [
        { icon: <FontAwesomeIcon icon={faStream} />, label: 'Timeline', path: '/timeline', type: 'link' },
        { icon: <FontAwesomeIcon icon={faSearch} />, label: 'Search', onClick: () => {searchSidebarOpen ? onClose() : handleOpenSearchSidebar()}, type: 'button' },
        { icon: <FontAwesomeIcon icon={faLayerGroup} />, label: 'Explore', path: '/timeline/explore', type: 'link' },
        { icon: <FontAwesomeIcon icon={faEdit} />, label: 'Create Post', onClick: () => handleShowCreatePostOverlayClick(window.location.pathname), type: 'button' },
        { icon: <ChatBubbleLeftRightIcon className='chat-icon' />, label: 'Messages', path: '/timeline/messages', type: 'link' },
        { icon: <FontAwesomeIcon icon={faCog} />, label: 'Settings', path: '/timeline/preferences', type: 'link' },
    ];

    const navigate = useNavigate();

    const handleClick = (item) => {
        console.log("butns")
        if (item.type === 'button') {
            if (typeof item.onClick === 'function') {
                item.onClick();
                console.log("butns clicked")
            }
        } else if (item.type === 'link') {
            navigate(item.path);
        }
    };


    return (
        <div className={`small-sidebar ${searchSidebarOpen ? 'search-sidebar-open' : ''}`}>
            <div className='small-sidebar-inner'>
                {taskFlow.map((item, index) => (
                    <div
                        key={index}
                        className="small-sidebar-item"
                        onClick={(e) => {handleClick(item); e.stopPropagation();} }
                    >
                        {item.type === 'button' ? (
                            <button>{item.icon}</button>
                        ) : (
                            <Link to={item.path} onClick={(e) => e.stopPropagation()}>{item.icon}</Link>
                        )}
                    </div>
                ))}
            </div>
            {<SearchSidebar isOpen={searchSidebarOpen}/>}
        </div>
    );

};

export default SmallSidebar;