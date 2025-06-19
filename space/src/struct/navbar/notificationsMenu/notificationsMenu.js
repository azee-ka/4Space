// NotificationsMenu.js
import React from 'react';
import './notificationsMenu.css';
import NotificationList from './notificationList';
import { FaChevronRight } from 'react-icons/fa';
import DropdownButton from '../../../utils/popperButton/DropdownButton';

const NotificationsMenuContent = ({ handleNotificationSidebarOpen, closeDropdown }) => (
    <div className='notifications-menu-container' onClick={(e) => e.stopPropagation()}>
        <div className='notifications-menu-top-panel'>
            <h3>Notifications</h3>
            <button
                onClick={() => {
                    closeDropdown?.();
                    handleNotificationSidebarOpen(null);
                }}
            >
                <p>
                    Expand Panel
                    <span><FaChevronRight /></span>
                </p>
            </button>
        </div>
        <NotificationList handleNotificationSidebarOpen={handleNotificationSidebarOpen} />
    </div>
);

const NotificationsMenu = ({
  toggleContent,
  handleNotificationSidebarOpen,
  placement = 'bottom-end',
  boundaryRef,
}) => (
  <DropdownButton
    toggleContent={toggleContent}
    placement={placement}
    boundaryRef={boundaryRef}
  >
    {({ closeDropdown }) => (
      <NotificationsMenuContent
        handleNotificationSidebarOpen={handleNotificationSidebarOpen}
        closeDropdown={closeDropdown}
      />
    )}
  </DropdownButton>
);

export default NotificationsMenu;
