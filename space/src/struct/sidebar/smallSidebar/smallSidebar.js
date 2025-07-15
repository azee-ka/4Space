import { useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './smallSidebar.css';

import SearchSidebar from '../searchSidebar/searchSidebar';
import ProfileMenuSidebar from './profileMenuSidebar.js/profileMenuSidebar';
import DropdownButton from '../../../utils/popperButton/DropdownButton';
import CreateSpaceTulip from '../../../apps/space/workspace/createSpaceTulip/createSpaceTulip';

import { useDevice } from '../../../context/DeviceContext';
import { useModeContext } from '../../../context/modeContext';
import { useDisplaySettings } from '../../../context/DisplaySettingsContext';
import { useCreatePostContext } from '../../../context/CreatePostContext';
import { useCreateCommunityContext } from '../../../context/CreateCommunityContext';

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
    ProfileIcon,
    FinanceDashboardIcon,
    FinanceTradeIcon,
    FinanceStrategyIcon,
    FinanceResearchIcon,
    FinancePortfolioIcon,
    FinanceLiveIcon,
    FinanceBacktestIcon
} from '../../../utils/CustomIcons';

const SmallSidebar = ({ setSearchSidebarOpen, searchSidebarOpen }) => {
    const { isM } = useDevice();
    const { mode, subMode } = useModeContext();
    const { settings } = useDisplaySettings();
    const { openCreatePostOverlay } = useCreatePostContext();
    const { openCreateCommunityOverlay } = useCreateCommunityContext();
    const navigate = useNavigate();
    const theme = settings.themeMode;

    const [createMenuOpen, setCreateMenuOpen] = useState(false);
    const plusBtnRef = useRef(null);

    const handleClick = (item) => {
        if (item.type === 'button' && typeof item.onClick === 'function') {
            item.onClick();
        } else if (item.type === 'link') {
            navigate(item.path);
        }
    };

    // --- MAIN CONTEXTS ---
    const homeIcons = [
        { icon: <DashboardIcon mode={theme} />, label: 'Dashboard', path: '/dashboard', type: 'link' },
        { icon: <TimelineIcon mode={theme} />, label: 'Timeline', path: '/timeline', type: 'link' },
        { icon: <ExploreIcon mode={theme} />, label: 'Explore', path: '/explore', type: 'link' },
        { icon: <SearchIcon mode={theme} />, label: 'Search', onClick: () => setSearchSidebarOpen(prev => !prev), type: 'button' },
        { icon: <MessagesIcon mode={theme} />, label: 'Messages', path: '/messages', type: 'link' },
        { icon: <CreateIcon mode={theme} />, label: 'Create Post', onClick: () => openCreatePostOverlay(window.location.pathname), type: 'button' },
    ];

    const communitiesIcons = [
        { icon: <DashboardIcon mode={theme} />, label: 'Communities Dashboard', path: '/communities/dashboard', type: 'link' },
        { icon: <TimelineIcon mode={theme} />, label: 'Communities Timeline', path: '/communities/timeline', type: 'link' },
        { icon: <SearchIcon mode={theme} />, label: 'Search', onClick: () => setSearchSidebarOpen(prev => !prev), type: 'button' },
        { icon: <MessagesIcon mode={theme} />, label: 'Messages', path: '/messages', type: 'link' },
        { icon: <CreateIcon mode={theme} />, label: 'Create Community', onClick: () => openCreateCommunityOverlay(window.location.pathname), type: 'button' },
    ];

    // --- SPACE SUBCONTEXTS ---
    const spaceSidebars = {
        workspace: [
            { icon: <WorkspaceIcon mode={theme} />, label: 'Space', path: '/space/workspace', type: 'link' },
            { icon: <DashboardIcon mode={theme} />, label: 'Dashboard', path: '/space/workspace/dashboard', type: 'link' },
            { icon: <ProjectsIcon mode={theme} />, label: 'Projects', path: '/space/workspace/projects', type: 'link' },
            { icon: <LibraryIcon mode={theme} />, label: 'Library', path: '/space/workspace/library', type: 'link' },
            { icon: <RepoIcon mode={theme} />, label: 'Repositories', path: '/space/workspace/repositories', type: 'link' },
            { icon: <SearchIcon mode={theme} />, label: 'Search', onClick: () => setSearchSidebarOpen(prev => !prev), type: 'button' },
            {
                type: 'dropdown',
                component: (
                    <DropdownButton
                        toggleContent={<button className="create-space-btn" ref={plusBtnRef}><CreateIcon /></button>}
                        placement="right"
                    >
                        <CreateSpaceTulip anchorRef={plusBtnRef} onClose={() => setCreateMenuOpen(false)} />
                    </DropdownButton>
                ),
                label: 'Create Space',
            },
            { icon: <ToolsIcon />, label: 'Tools', path: '/space/workspace/tools', type: 'link' },
        ],
        finance: [
    {
      icon: <FinanceDashboardIcon mode={theme} />,
      label: 'Finance Dashboard',
      path: '/space/finance/dashboard',
      type: 'link',
    },
    {
      icon: <FinanceTradeIcon mode={theme} />,
      label: 'Finance Trade',
      path: '/space/finance/trade',
      type: 'link',
    },
    {
      icon: <FinanceStrategyIcon mode={theme} />,
      label: 'Finance Strategy',
      path: '/space/finance/startegy',
      type: 'link',
    },
    {
      icon: <FinanceResearchIcon mode={theme} />,
      label: 'Finance Research',
      path: '/space/finance/research',
      type: 'link',
    },
    {
      icon: <FinancePortfolioIcon mode={theme} />,
      label: 'Finance Portfolio',
      path: '/space/finance/portfolio',
      type: 'link',
    },
    {
      icon: <FinanceLiveIcon mode={theme} />,
      label: 'Finance Live',
      path: '/space/finance/live',
      type: 'link',
    },
    {
      icon: <FinanceBacktestIcon mode={theme} />,
      label: 'Finance Backtest',
      path: '/space/finance/backtest',
      type: 'link',
    },
  ],
    };

    const bottomIcons = [
        { icon: <SettingsIcon />, label: 'Settings', path: '/settings', type: 'link' },
        {
            type: 'dropdown',
            component: (
                <DropdownButton
                    toggleContent={<button className="profile-menu-toggle"><ProfileIcon /></button>}
                    placement="top-start"
                >
                    <ProfileMenuSidebar />
                </DropdownButton>
            ),
            label: 'Profile Menu',
        }
    ];

    // --- DETERMINE FINAL SIDEBAR CONTENT ---
    let sidebarBtns;

    if (mode === 'communities') {
        sidebarBtns = communitiesIcons;
    } else if (mode === 'space') {
        sidebarBtns = spaceSidebars[subMode] || spaceSidebars['workspace'];
    } else {
        sidebarBtns = homeIcons;
    }

    const filteredSidebarBtns = isM
        ? sidebarBtns.filter(item => item.label !== 'Search')
        : sidebarBtns;

    return (
        <div className={`small-sidebar ${searchSidebarOpen ? 'search-sidebar-open' : ''}`}>
            <div className='small-sidebar-inner-menu'>
                <div className="small-sidebar-top">
                    {filteredSidebarBtns.map((item, index) => (
                        <div
                            key={index}
                            className="small-sidebar-item"
                            onClick={(e) => { handleClick(item); e.stopPropagation(); }}
                        >
                            {item.type === 'dropdown' ? (
                                item.component
                            ) : item.type === 'button' ? (
                                <button>{item.icon}</button>
                            ) : (
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) =>
                                        isActive ? 'sidebar-link active' : 'sidebar-link'
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    end={item.path === '/' || item.path === '/space/workspace'}
                                >
                                    {item.icon}
                                </NavLink>
                            )}
                            <div className="tooltip">{item.label}</div>
                        </div>
                    ))}
                </div>

                {!isM && (
                    <div className="small-sidebar-bottom">
                        {bottomIcons.map((item, index) => (
                            <div
                                key={index}
                                className="small-sidebar-item"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {item.type === 'dropdown' ? (
                                    item.component
                                ) : (
                                    <NavLink
                                        to={item.path}
                                        className={({ isActive }) =>
                                            isActive ? 'sidebar-link active' : 'sidebar-link'
                                        }
                                        onClick={(e) => e.stopPropagation()}
                                        end={item.path === '/' || item.path === '/space/'}
                                    >
                                        {item.icon}
                                    </NavLink>
                                )}
                                <div className="tooltip">{item.label}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <SearchSidebar isOpen={searchSidebarOpen} onClose={() => setSearchSidebarOpen(false)} />

            {createMenuOpen && (
                <CreateSpaceTulip anchorRef={plusBtnRef} onClose={() => setCreateMenuOpen(false)} />
            )}
        </div>
    );
};

export default SmallSidebar;
