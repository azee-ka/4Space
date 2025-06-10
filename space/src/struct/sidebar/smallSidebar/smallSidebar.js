import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './smallSidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlus, faStream, faLayerGroup, faSearch, faChartBar, faGear, faUser, faChartLine, faUserGroup, faPenToSquare, faTools, faBook, faCodeBranch, faDiagramProject, faNetworkWired, faProjectDiagram, faDna, faSitemap, faSatellite, faSatelliteDish, faBraille, faNeuter } from '@fortawesome/free-solid-svg-icons';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import SearchSidebar from '../searchSidebar/searchSidebar';
import { useCreatePostContext } from '../../../context/CreatePostContext';
import ProfileMenuSidebar from './profileMenuSidebar.js/profileMenuSidebar';
import DropdownButton from '../../../utils/popperButton/DropdownButton';
import { useModeContext } from '../../../context/modeContext';
import CreateSpaceTulip from '../../../apps/space/createSpaceTulip/createSpaceTulip';
import { useCreateCommunityContext } from '../../../context/CreateCommunityContext';
import { useDevice } from '../../../context/DeviceContext';
// import WorkspaceIcon from './WorkspaceIcon';


import {
    WorkspaceIcon,
  DashboardIcon,
  TimelineIcon,
  ExploreIcon,
  SearchIcon,
  MessagesIcon,
  CreateIcon,
  ProjectsIcon,
  LibraryIcon,
  RepoIcon,
  ToolsIcon,
  SettingsIcon,
  ProfileIcon
} from '../../../utils/CustomIcons';
import { useDisplaySettings } from '../../../context/DisplaySettingsContext';



const SmallSidebar = ({ setSearchSidebarOpen, searchSidebarOpen }) => {
    const { isM } = useDevice();
    const { mode } = useModeContext();
    const { settings } = useDisplaySettings();
    const theme = settings.themeMode;
    const { openCreatePostOverlay } = useCreatePostContext();
    const { openCreateCommunityOverlay } = useCreateCommunityContext();

    const [createMenuOpen, setCreateMenuOpen] = useState(false);
    const plusBtnRef = useRef(null);


    const homeIcons = [
        { icon: <DashboardIcon mode={theme}  />, label: 'Dasboard', path: '/dashboard', type: 'link' },
        { icon: <TimelineIcon mode={theme}  />, label: 'Timeline', path: '/timeline', type: 'link' },
        { icon: <ExploreIcon mode={theme}  />, label: 'Explore', path: '/explore', type: 'link' },
        { icon: <SearchIcon mode={theme}  />, label: 'Search', onClick: () => { searchSidebarOpen ? setSearchSidebarOpen(false) : setSearchSidebarOpen(true) }, type: 'button' },
        { icon: <MessagesIcon mode={theme}  />, label: 'Messages', path: '/messages', type: 'link' },
        { icon: <CreateIcon mode={theme}  />, label: 'Create Post', onClick: () => openCreatePostOverlay(window.location.pathname), type: 'button' },
    ];
    const communitiesIcons = [
        { icon: <DashboardIcon mode={theme}  />, label: 'Communities Dasboard', path: '/communities/dashboard', type: 'link' },
        { icon: <TimelineIcon mode={theme}  />, label: 'Communities Timeline', path: '/communities/timeline', type: 'link' },
        { icon: <SearchIcon mode={theme}  />, label: 'Search', onClick: () => { searchSidebarOpen ? setSearchSidebarOpen(false) : setSearchSidebarOpen(true) }, type: 'button' },
        { icon: <MessagesIcon mode={theme}  />, label: 'Messages', path: '/messages', type: 'link' },
        { icon: <CreateIcon mode={theme}  />, label: 'Create Community', onClick: () => openCreateCommunityOverlay(window.location.pathname), type: 'button' },
    ];
    const spaceIcons = [
        { icon: <WorkspaceIcon mode={theme}  />, label: 'Space', path: '/space/', type: 'link' },
        { icon: <DashboardIcon mode={theme}  />, label: 'Space Dashboard', path: '/space/dashboard', type: 'link' },
        { icon: <ProjectsIcon mode={theme}  />, label: 'Projects', path: '/space/projects', type: 'link' },
        { icon: <LibraryIcon mode={theme}  />, label: 'Library', path: '/space/library', type: 'link' },
        { icon: <RepoIcon mode={theme}  />, label: 'Repositories', path: '/space/repositories', type: 'link' },
        { icon: <SearchIcon mode={theme}  />, label: 'Search', onClick: () => { searchSidebarOpen ? setSearchSidebarOpen(false) : setSearchSidebarOpen(true) }, type: 'button' },
        {
            type: 'dropdown',
            component: (
                <DropdownButton
                    toggleContent={
                        <button className="create-space-btn" ref={plusBtnRef}>
                            <CreateIcon />
                        </button>
                    }
                    placement="right"
                >
                    <CreateSpaceTulip anchorRef={plusBtnRef} onClose={() => setCreateMenuOpen(false)} />
                </DropdownButton>
            ),
            label: 'Create Space',
        },
        { icon: <ToolsIcon />, label: 'Tools', path: '/space/tools', type: 'link' },
    ];



    const bottomIcons = [
        { icon: <SettingsIcon />, label: 'Settings', path: '/settings', type: 'link' },
        {
            type: 'dropdown',
            component: (
                <DropdownButton
                    toggleContent={
                        <button className="profile-menu-toggle">
                            <ProfileIcon />
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