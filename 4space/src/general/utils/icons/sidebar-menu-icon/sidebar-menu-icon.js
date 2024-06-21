import './sidebar-menu-icon.css';

const SidebarMenuIcon = ( { sidebarOpen, setSidebarOpen } ) => {

    return (
        <div className="menu-icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <div className={`menu-line ${sidebarOpen ? 'open' : ''}`}></div>
            <div className={`menu-line ${sidebarOpen ? 'open' : ''}`}></div>
            <div className={`menu-line ${sidebarOpen ? 'open' : ''}`}></div>
        </div>
    );
}

export default SidebarMenuIcon;