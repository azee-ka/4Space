import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './smallSidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlus, faStream, faLayerGroup, faSearch, faChartBar, faGear, faUser, faChartLine, faUserGroup, faPenToSquare, faTools, faBook, faCodeBranch, faDiagramProject } from '@fortawesome/free-solid-svg-icons';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import SearchSidebar from '../searchSidebar/searchSidebar';
import { useCreatePostContext } from '../../../context/CreatePostContext';
import ProfileMenuSidebar from './profileMenuSidebar.js/profileMenuSidebar';
import DropdownButton from '../../../utils/popperButton/DropdownButton';
import { useModeContext } from '../../../context/modeContext';
import CreateSpaceTulip from '../../../apps/space/createSpaceTulip/createSpaceTulip';
import { useCreateCommunityContext } from '../../../context/CreateCommunityContext';
import { useDevice } from '../../../context/DeviceContext';

const SmallSidebar = ({ setSearchSidebarOpen, searchSidebarOpen }) => {
    const { isM } = useDevice();
    const { mode } = useModeContext();
    const { openCreatePostOverlay } = useCreatePostContext();
    const { openCreateCommunityOverlay } = useCreateCommunityContext();

    const [createMenuOpen, setCreateMenuOpen] = useState(false);
    const plusBtnRef = useRef(null);


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
        { icon: <FontAwesomeIcon icon={faPenToSquare} />, label: 'Create Community', onClick: () => openCreateCommunityOverlay(window.location.pathname), type: 'button' },
    ];
    const spaceIcons = [
        { icon: <FontAwesomeIcon icon={faChartLine} />, label: 'Space Dashboard', path: '/space/dashboard', type: 'link' },
        { icon: <FontAwesomeIcon icon={faDiagramProject} />, label: 'Projects', path: '/space/projects', type: 'link' },
        { icon: <FontAwesomeIcon icon={faBook} />, label: 'Library', path: '/space/library', type: 'link' },
        { icon: <FontAwesomeIcon icon={faCodeBranch} />, label: 'Repositories', path: '/space/repositories', type: 'link' },
        { icon: <FontAwesomeIcon icon={faSearch} />, label: 'Search', onClick: () => { searchSidebarOpen ? setSearchSidebarOpen(false) : setSearchSidebarOpen(true) }, type: 'button' },
        {
            type: 'dropdown',
            component: (
                <DropdownButton
                    toggleContent={
                        <button className="create-space-btn" ref={plusBtnRef}>
                            <FontAwesomeIcon icon={faPlus} />
                        </button>
                    }
                    placement="right"
                >
                    <CreateSpaceTulip anchorRef={plusBtnRef} onClose={() => setCreateMenuOpen(false)} />
                </DropdownButton>
            ),
            label: 'Create Space',
        },
        { icon: <FontAwesomeIcon icon={faTools} />, label: 'Tools', path: '/space/tools', type: 'link' },
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

    const sidebarBtns = mode === 'communities' ? communitiesIcons : mode === 'space' ? spaceIcons : homeIcons;


    const filteredSidebarBtns = isM
    ? sidebarBtns.filter(item => item.label !== "Search")
    : sidebarBtns;


    return (
        <div className={`small-sidebar ${searchSidebarOpen ? 'search-sidebar-open' : ''}`}>
            <div className='small-sidebar-inner-menu'>
                <div className="small-sidebar-top">
                    {filteredSidebarBtns?.map((item, index) => (
                        <div
                            key={index}
                            className="small-sidebar-item"
                            onClick={(e) => { handleClick(item); e.stopPropagation(); }}
                        >
                            {item.type === 'dropdown' ? (
                                item.component
                            ) : item.type === 'button' ? (
                                item.label === 'Create Space' ? (
                                    <button ref={plusBtnRef}>{item.icon}</button>
                                ) : (
                                    <button>{item.icon}</button>
                                )
                            ) : (
                                <Link to={item.path} onClick={(e) => e.stopPropagation()}>{item.icon}</Link>
                            )}
                            <div className="tooltip">{item.label}</div>
                        </div>
                    ))}
                </div>
                
                {!isM &&
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
                }
            </div>



            {<SearchSidebar isOpen={searchSidebarOpen} onClose={() => setSearchSidebarOpen(false)} />}

            {createMenuOpen && (
                <CreateSpaceTulip
                    anchorRef={plusBtnRef}
                    onClose={() => setCreateMenuOpen(false)}
                />
            )}

        </div>
    );

};

export default SmallSidebar;