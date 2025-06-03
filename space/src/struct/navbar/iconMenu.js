import React from "react";
import './iconMenu.css';

const SidebarMenuIcon = ({ sidebarOpen, handleHighOrderSidebarToggle}) => {
    return (
        <div className='navbar-sidebar-icon'>
            <div className={`navbar-sidebar-menu-toggle-inner ${sidebarOpen ? 'sidebar-visible' : ''}`}>
                <div className='navbar-sidebar-menu-toggle-inner-content' onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleHighOrderSidebarToggle()}>
                        <span className={`icon-bar ${sidebarOpen ? 'rotate' : ''}`}></span>
                        <span className={`icon-bar ${sidebarOpen ? 'rotate' : ''}`}></span>
                        <span className={`icon-bar ${sidebarOpen ? 'rotate' : ''}`}></span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SidebarMenuIcon;