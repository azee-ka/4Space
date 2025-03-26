import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './smallSidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlus, faCalendar, faFolder, faCog, faStream, faLayerGroup, faSearch, faDashboard, faDatabase, faChartBar } from '@fortawesome/free-solid-svg-icons';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import SearchSidebar from '../searchSidebar/searchSidebar';
import { useCreatePostContext } from '../../../context/CreatePostContext';

const SmallSidebar = ({ setSearchSidebarOpen, searchSidebarOpen }) => {
    const { openCreatePostOverlay } = useCreatePostContext();

    const taskFlow = [
        { icon: <FontAwesomeIcon icon={faChartBar} />, label: 'Dasboard', path: '/', type: 'link' },
        { icon: <FontAwesomeIcon icon={faStream} />, label: 'Timeline', path: '/timeline', type: 'link' },
        { icon: <FontAwesomeIcon icon={faLayerGroup} />, label: 'Explore', path: '/explore', type: 'link' },
        { icon: <FontAwesomeIcon icon={faSearch} />, label: 'Search', onClick: () => { searchSidebarOpen ? setSearchSidebarOpen(false) : setSearchSidebarOpen(true) }, type: 'button' },
        { icon: <ChatBubbleLeftRightIcon className='chat-icon' />, label: 'Messages', path: '/messages', type: 'link' },
        { icon: <FontAwesomeIcon icon={faEdit} />, label: 'Create Post', onClick: () => openCreatePostOverlay(window.location.pathname), type: 'button' },
    ];

    const navigate = useNavigate();

    const handleClick = (item) => {
        if (item.type === 'button') {
            if (typeof item.onClick === 'function') {
                item.onClick();
            }
        } else if (item.type === 'link') {
            navigate(item.path);
        }
    };

    return (
        <div className={`small-sidebar ${searchSidebarOpen ? 'search-sidebar-open' : ''}`}>
            {taskFlow?.map((item, index) => (
                <div
                    key={index}
                    className="small-sidebar-item"
                    onClick={(e) => { handleClick(item); e.stopPropagation(); }}
                >
                    {item.type === 'button' ? (
                        <button>{item.icon}</button>
                    ) : (
                        <Link to={item.path} onClick={(e) => e.stopPropagation()}>{item.icon}</Link>
                    )}
                    <div className="tooltip">{item.label}</div>
                </div>
            ))}
            {<SearchSidebar isOpen={searchSidebarOpen} />}
        </div>
    );

};

export default SmallSidebar;