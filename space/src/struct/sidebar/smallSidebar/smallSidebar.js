import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './smallSidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlus, faCalendar, faFolder, faCog, faStream, faLayerGroup, faSearch, faDashboard, faDatabase, faChartBar, faGear, faUser, faListAlt, faThList, faGauge, faChartLine, faUsers, faPeopleGroup, faUserGroup, faPlusCircle, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import SearchSidebar from '../searchSidebar/searchSidebar';
import { useCreatePostContext } from '../../../context/CreatePostContext';
import ProfileMenuSidebar from './profileMenuSidebar.js/profileMenuSidebar';
import DropdownButton from '../../../utils/popperButton/DropdownButton';
import { useModeContext } from '../../../context/modeContext';

const SmallSidebar = ({ setSearchSidebarOpen, searchSidebarOpen }) => {
    const { mode, setMode } = useModeContext();
    const { openCreatePostOverlay } = useCreatePostContext();

    const homeIcons = [
        { icon: <FontAwesomeIcon icon={faChartBar} />, label: 'Dasboard', path: '/dashboard', type: 'link' },
        { icon: <FontAwesomeIcon icon={faStream} />, label: 'Timeline', path: '/timeline', type: 'link' },
        { icon: <FontAwesomeIcon icon={faLayerGroup} />, label: 'Explore', path: '/explore', type: 'link' },
        { icon: <FontAwesomeIcon icon={faSearch} />, label: 'Search', onClick: () => { searchSidebarOpen ? setSearchSidebarOpen(false) : setSearchSidebarOpen(true) }, type: 'button' },
        { icon: <ChatBubbleLeftRightIcon className='chat-icon' />, label: 'Messages', path: '/messages', type: 'link' },
        { icon: <FontAwesomeIcon icon={faEdit} />, label: 'Create Post', onClick: () => openCreatePostOverlay(window.location.pathname), type: 'button' },
    ];
    const communitiesIcons = [
        { icon: <FontAwesomeIcon icon={faChartLine} />, label: 'Communities Dasboard', path: '/communities/dashboard', type: 'link' },
        { icon: <FontAwesomeIcon icon={faUserGroup} />, label: 'Communities Timeline', path: '/communities/timeline', type: 'link' },
        { icon: <FontAwesomeIcon icon={faSearch} />, label: 'Search', onClick: () => { searchSidebarOpen ? setSearchSidebarOpen(false) : setSearchSidebarOpen(true) }, type: 'button' },
        { icon: <ChatBubbleLeftRightIcon className='chat-icon' />, label: 'Messages', path: '/messages', type: 'link' },
        { icon: <FontAwesomeIcon icon={faPenToSquare} />, label: 'Create Community', onClick: () => openCreatePostOverlay(window.location.pathname), type: 'button' },
    ];
    const bottomIcons = [
        { icon: <FontAwesomeIcon icon={faGear} />, label: 'Settings', path: '/settings', type: 'link' },
        {
            type: 'dropdown',
            component: (
                <DropdownButton
                    toggleContent={
                        <button className="profile-menu-toggle">
                            <FontAwesomeIcon icon={faUser} />
                        </button>
                    }
                    placement="top-start"
                >
                    <ProfileMenuSidebar />
                </DropdownButton>
            ),
            label: 'Profile Menu',
        }
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

    console.log('sidebarMode', setMode);

    const sidebarBtns = mode === 'communities' ? communitiesIcons : homeIcons;
    


    return (
        <div className={`small-sidebar ${searchSidebarOpen ? 'search-sidebar-open' : ''}`}>
            <div className="small-sidebar-top">
                {sidebarBtns?.map((item, index) => (
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
            </div>
            <div className="small-sidebar-bottom">
                {bottomIcons?.map((item, index) => (
                    <div
                        key={index}
                        className="small-sidebar-item"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {item.type === 'dropdown' ? (
                            item.component
                        ) : item.type === 'button' ? (
                            <button onClick={item.onClick}>{item.icon}</button>
                        ) : (
                            <Link to={item.path} onClick={(e) => e.stopPropagation()}>{item.icon}</Link>
                        )}
                        <div className="tooltip">{item.label}</div>
                    </div>
                ))}
            </div>
            {<SearchSidebar isOpen={searchSidebarOpen} onClose={() => setSearchSidebarOpen(false)} />}
        </div>
    );

};

export default SmallSidebar;