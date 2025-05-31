import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Link, useLocation } from 'react-router-dom';
import './navbar.scss';
import { useAuth } from '../../hooks/useAuth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faSearch, faSliders } from '@fortawesome/free-solid-svg-icons';
import ProfilePicture from '../../utils/profilePicture/getProfilePicture';
import NineDotIcon from '../../utils/nine-dot';
import SidebarMenuIcon from './iconMenu';
import appLogo from '../../assets/logo.png';
import appLogoComplete from '../../assets/logo-comp.png';
import useNotifications from '../../hooks/useNotifications';
import { useCreatePostContext } from '../../context/CreatePostContext';
import { useModeContext } from '../../context/modeContext';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import { useDevice } from '../../context/DeviceContext';

const Navbar = ({
    handleProfileMenuToggle,
    handleAppMenuToggle,
    handleNotificationsMenuToggle,
    handleDisplayMenuToggle,
    sidebarOpen,
    setSidebarOpen,
    profileData,
    handleNotificationSidebarOpen = null,
}) => {
    const { isM, isT } = useDevice();
    const { isAuthenticated } = useAuth();
    const { mode } = useModeContext();

    const { count: notificationsCount } = useNotifications();

    const { openCreatePostOverlay } = useCreatePostContext();

    const [profileMenuVisible, setProfileMenuVisible] = useState(false);
    const [notificationsMenuVisible, setNotificationsMenuVisible] = useState(false);
    const [appMenuVisible, setAppMenuVisible] = useState(false)
    const [displayMenuVisible, setDisplayMenuVisible] = useState(false);


    const location = useLocation();
    const navigate = useNavigate();

    const profileMenuRef = useRef(null);
    const notificationsMenuRef = useRef(null);
    const appMenuRef = useRef(null);
    const displayMenuRef = useRef(null);

    const [navbarSearchValue, setNavbarSearchValue] = useState('');


    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setProfileMenuVisible(false);
            }
            if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target)) {
                setNotificationsMenuVisible(false);
            }
            if (appMenuRef.current && !appMenuRef.current.contains(event.target)) {
                setAppMenuVisible(false);
            }
            if (displayMenuRef.current && !displayMenuRef.current.contains(event.target)) {
                setDisplayMenuVisible(false);
            }

        };

        document.addEventListener('click', handleOutsideClick);

        return () => {
            document.removeEventListener('click', handleOutsideClick);
        };
    }, []);



    const publicPagesNavbar = [
        { path: '/login', label: 'Sign In', id: 'navbar-access', role: 'public' },
        { path: '/register', label: 'Sign Up', id: 'navbar-access', role: 'public' },
    ];

    const homePagesNavbar = [
        // Home
        { label: "Home", path: "/home" },
        { label: "Dashboard", path: "/dashboard" },
        { label: "Explore", path: "/explore" },
        { label: "Create Post", action: () => openCreatePostOverlay(window.location.pathname) },
    ];
    const communitiesPagesNavbar = [
        // Communities
        { label: "Dashboard", path: "/communities/dashboard" },
        { label: "Timeline", path: "/communities/timeline" },
    ];
    const spacePagesNavbar = [
        // Space
        { label: "Dashboard", path: "/space/dashboard" },
        { label: "Timeline", path: "/space/timeline" },
        { label: "Tools", path: "/space/tools" },
    ];
    const privatePagesNavbar = mode === 'communities' ? communitiesPagesNavbar : mode === 'space' ? spacePagesNavbar : homePagesNavbar;

    const handleMenuClick = (path, action) => {
        if (action) {
            action();
        } else {
            navigate(path);
        }
    };

    const handleHighOrderSidebarToggle = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const pagesNavbar = isAuthenticated ? privatePagesNavbar : publicPagesNavbar;

    return (
        <div className='navbar-container'>
            <div className='navbar-left'>
                <div className='navbar-icon-logo-container'>
                    {isAuthenticated &&
                        <SidebarMenuIcon sidebarOpen={sidebarOpen} handleHighOrderSidebarToggle={handleHighOrderSidebarToggle} />
                    }
                    <div className='navbar-logo-container'>
                        <Link to={`/`}>
                            <img src={appLogo} />
                            <h2 className='neon-text'>
                                4Space
                            </h2>
                            <img src={appLogoComplete} className='fade-image' />
                        </Link>
                    </div>
                </div>
            </div>
            {isAuthenticated && !isM && !isT &&
                <div className='navbar-center'>
                    <div className='navbar-search-container'>
                        <span className='navbar-search-icon'>
                            <FontAwesomeIcon icon={faSearch} />
                        </span>
                        <input
                            className='navbar-search-field'
                            value={navbarSearchValue}
                            onChange={(e) => setNavbarSearchValue(e.target.value)}
                            placeholder='Search'
                        />
                    </div>
                </div>
            }


            <div className={`navbar-right ${isAuthenticated ? '' : 'unauthenticated'}`}>
                {!isAuthenticated &&
                    <div className='navbar-pages'>
                        <ul>
                            {publicPagesNavbar?.map((item, index) => (
                                <li
                                    key={index}
                                    className={location.pathname === item.path ? 'active' : ''}
                                    id={item.id}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Link to={item.path} onClick={() => handleMenuClick(item.path, item.action)}>
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                }
                <div className='navbar-items'>
                    {isAuthenticated && (
                        <ul>
                            {!isM &&
                                <li className='messages-page-link'>
                                    <Link to={`/messages/inbox`}>
                                        <ChatBubbleLeftRightIcon className='chat-icon' />
                                    </Link>
                                </li>
                            }
                            {/* Notifications Menu */}
                            <li
                                className={`notifications-menu ${notificationsMenuVisible ? 'active' : ''}`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {!isM ? (
                                    <button onClick={handleNotificationsMenuToggle} className="notification-button">
                                        <FontAwesomeIcon icon={faBell} /> {/* Replace text with the bell icon */}
                                        {notificationsCount > 0 && (
                                            <span className="notification-count">
                                                {notificationsCount > 9 ? '9+' : notificationsCount}
                                            </span>
                                        )}
                                    </button>
                                ) : (
                                    <button onClick={handleNotificationSidebarOpen} className="notification-button">
                                        <FontAwesomeIcon icon={faBell} /> {/* Replace text with the bell icon */}
                                        {notificationsCount > 0 && (
                                            <span className="notification-count">
                                                {notificationsCount > 9 ? '9+' : notificationsCount}
                                            </span>
                                        )}
                                    </button>
                                )

                                }
                            </li>

                            {/* App Menu */}
                            {!isM &&
                                <li className="navigation-bar-menubar-icon" ref={appMenuRef} onClick={(e) => e.stopPropagation()}>
                                    <button onClick={handleAppMenuToggle}>
                                        <NineDotIcon style={{ color: 'white', background: 'transparent', fontSize: '24px' }} />
                                    </button>
                                </li>
                            }

                            {/* Display Settings Menu */}
                            {!isM &&
                                <li className="display-settings-menu" ref={displayMenuRef} onClick={(e) => e.stopPropagation()}>
                                    <button onClick={handleDisplayMenuToggle}>
                                        <FontAwesomeIcon icon={faSliders} className="display-settings-icon" />
                                    </button>
                                </li>
                            }

                            {/* Profile Menu */}
                            <li
                                className={`profile-menu ${profileMenuVisible ? 'active' : ''}`}
                                ref={profileMenuRef}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button onClick={handleProfileMenuToggle}>
                                    <ProfilePicture src={profileData?.profile_image} />
                                </button>
                            </li>

                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Navbar;
