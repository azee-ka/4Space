// CommunitySettings.js
import React, { useEffect, useState, useMemo } from 'react';
import './communitySettings.scss';
import { useCommunity } from '../../../../context/CommunityContext';

const TABS = [
    'Manage Members',
    'Appearance',
    'Posting Rules',
    'Integrations',
    'Security',
    'Announcements',
];
const ROLES = ['Admin', 'Moderator', 'Member', 'Guest'];
const permissionOptions = [
    { value: 'Allowed', label: 'Allowed' },
    { value: 'Blocked', label: 'Blocked' },
    { value: 'Limited', label: 'Limited' },
];

const CommunitySettings = ({ onBack, initialTab }) => {
    const { community, settings } = useCommunity();

    // Local state for UI changes only
    const [roles, setRoles] = useState({});
    const [roleChanges, setRoleChanges] = useState({});
    const [activeTab, setActiveTab] = useState(initialTab && TABS.includes(initialTab) ? initialTab : TABS[0]);
    const [settingsUi, setSettingsUi] = useState({
        theme: 'glass',
        contentModeration: true,
        integrations: true,
        twoFactorAuth: false,
        privateCommunity: false,
        announcement: '',
    });
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    // Fetch members when tab is selected (from context)
    useEffect(() => {
        if (activeTab === 'Manage Members' && community?.id) {
            settings.fetchMembers();
        }
    }, [activeTab, community?.id, settings]);

    // ----- PERMISSIONS/ROLE HANDLING -----
    const updatePermission = (userId, key, value) => {
        setRoles(prev => ({
            ...prev,
            [userId]: {
                ...prev[userId],
                [key]: value === 'Allowed',
            },
        }));
    };

    const updateUserRole = (userId, newRole) => {
        setRoleChanges(prev => ({
            ...prev,
            [userId]: newRole
        }));
        settings.setMembers(prev =>
            prev.map(user =>
                user.id === userId ? { ...user, role: newRole } : user
            )
        );
    };

    const handleRevertChange = (userId) => {
        setRoles(prev => {
            const updated = { ...prev };
            delete updated[userId];
            return updated;
        });
        setRoleChanges(prev => {
            const updated = { ...prev };
            delete updated[userId];
            return updated;
        });
    };

    // Users with unsaved changes
    const changedUserIds = useMemo(() => {
        const permissionIds = Object.keys(roles);
        const roleIds = Object.keys(roleChanges);
        return [...new Set([...permissionIds, ...roleIds])];
    }, [roles, roleChanges]);

    const changedUsers = useMemo(() => {
        return changedUserIds
            .map(id => settings.members.find(u => u.id === parseInt(id)))
            .filter(Boolean);
    }, [changedUserIds, settings.members]);

    // ----- SAVE -----
    const saveAllChanges = async () => {
        try {
            await settings.bulkUpdate(roleChanges, roles);
            setRoles({});
            setRoleChanges({});
            settings.fetchMembers();
        } catch (err) {
            console.error('Failed to save changes', err);
        }
    };

    // ----- FILTER -----
    const filteredMembers = useMemo(() => {
        return settings.members.filter(user =>
            user.username.toLowerCase().includes(search.toLowerCase()) &&
            (roleFilter === 'all' || user.role === roleFilter)
        );
    }, [settings.members, search, roleFilter]);

    // ----- RENDERING -----
    const renderPermissionsRow = (user) => (
        <div key={user.id} className="settings-row">
            <span className="username-col">{user.username}</span>
            <span className="role-col">
                <select
                    className="perm-dropdown"
                    value={user.role}
                    onChange={e => updateUserRole(user.id, e.target.value)}
                >
                    {ROLES.map(role => (
                        <option key={role} value={role}>{role}</option>
                    ))}
                </select>
            </span>
            <span className="perm-col">
                <select
                    className="perm-dropdown"
                    value={roles[user.id]?.can_post_discussions ? 'Allowed' : 'Blocked'}
                    onChange={e => updatePermission(user.id, 'can_post_discussions', e.target.value)}
                >
                    {permissionOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </span>
            <span className="perm-col">
                <select
                    className="perm-dropdown"
                    value={roles[user.id]?.can_invite_members ? 'Allowed' : 'Blocked'}
                    onChange={e => updatePermission(user.id, 'can_invite_members', e.target.value)}
                >
                    {permissionOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </span>
            <span className="perm-col">
                <select
                    className="perm-dropdown"
                    value={roles[user.id]?.can_manage_settings ? 'Allowed' : 'Blocked'}
                    onChange={e => updatePermission(user.id, 'can_manage_settings', e.target.value)}
                >
                    {permissionOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </span>
        </div>
    );

    const renderChangedUsersPreview = () => (
        <div className="changed-users-container">
            <div className="changed-users-title">📝 Unsaved Changes Preview</div>
            <div className="changed-users-info">
                {changedUsers.length} user{changedUsers.length > 1 ? 's' : ''} modified
            </div>
            <div className="settings-table-container mini-preview">
                <div className="settings-row header">
                    <span className="username-col">User</span>
                    <span className="role-col">Role</span>
                    <span className="perm-col">Post</span>
                    <span className="perm-col">Invite</span>
                    <span className="perm-col">Settings</span>
                </div>
                <div className="settings-table-scroll mini-scroll">
                    {changedUsers.map(user => {
                        const uid = user.id;
                        const roleBefore = user.originalRole || user.role;
                        const roleAfter = roleChanges[uid] ?? roleBefore;
                        const permsBefore = {
                            can_post_discussions: !!user.permissions?.can_post_discussions,
                            can_invite_members: !!user.permissions?.can_invite_members,
                            can_manage_settings: !!user.permissions?.can_manage_settings,
                        };
                        const permsAfter = {
                            ...permsBefore,
                            ...roles[uid]
                        };
                        const getDiff = (before, after) =>
                            before !== after ? (
                                <span className="change-highlight">
                                    <span className="change-before">{before ? 'Allowed' : 'Blocked'}</span>
                                    <span className="change-arrow">→</span>
                                    <span className="change-after">{after ? 'Allowed' : 'Blocked'}</span>
                                </span>
                            ) : (
                                <span className="unchanged">{before ? 'Allowed' : 'Blocked'}</span>
                            );
                        return (
                            <div key={uid} className="settings-row changed-preview-row">
                                <span className="username-col">{user.username}</span>
                                <span className="role-col">
                                    {roleBefore === roleAfter ? (
                                        <span className="unchanged">{roleAfter}</span>
                                    ) : (
                                        <span className="change-highlight">
                                            <span className="change-before">{roleBefore}</span>
                                            <span className="change-arrow">→</span>
                                            <span className="change-after">{roleAfter}</span>
                                        </span>
                                    )}
                                </span>
                                <span className="perm-col">{getDiff(permsBefore.can_post_discussions, permsAfter.can_post_discussions)}</span>
                                <span className="perm-col">{getDiff(permsBefore.can_invite_members, permsAfter.can_invite_members)}</span>
                                <span className="perm-col">{getDiff(permsBefore.can_manage_settings, permsAfter.can_manage_settings)}</span>
                                <div className="action-col">
                                    <button className="revert-btn" onClick={() => handleRevertChange(uid)}>
                                        ↩ Revert
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <button className="save-changes-btn" onClick={saveAllChanges}>
                💾 Save {changedUsers.length} Change{changedUsers.length > 1 ? 's' : ''}
            </button>
        </div>
    );

    // ---- TABS ----
    const renderManageMembersTab = () => (
        <div className="settings-section">
            <h3 className="section-title">Permissions</h3>
            <div className="member-controls">
                <input
                    type="text"
                    placeholder="Search user..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="search-input"
                />
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="dropdown">
                    <option value="all">All Roles</option>
                    {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
            </div>
            {changedUsers.length > 0 && renderChangedUsersPreview()}
            <div className="settings-table-container">
                <div className="settings-row header">
                    <span className="username-col">User</span>
                    <span className="role-col">Role</span>
                    <span className="perm-col">Post</span>
                    <span className="perm-col">Invite</span>
                    <span className="perm-col">Settings</span>
                    <span className="action-col"></span>
                </div>
                <div className="settings-table-scroll">
                    {filteredMembers.map(renderPermissionsRow)}
                </div>
            </div>
        </div>
    );
    const renderAppearanceTab = () => (
        <div className="settings-section">
            <h3 className="section-title">Appearance Settings</h3>
            <div className="toggle-row">
                <label>Theme:</label>
                <select
                    className="dropdown"
                    value={settingsUi.theme}
                    onChange={e => setSettingsUi(prev => ({ ...prev, theme: e.target.value }))}
                >
                    <option value="glass">Glass</option>
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="neon">Neon Pulse</option>
                </select>
            </div>
        </div>
    );
    const renderPostingRulesTab = () => (
        <div className="settings-section">
            <h3 className="section-title">Posting Rules</h3>
            <textarea
                className="announcement-box"
                rows="6"
                placeholder="Write your community posting rules here..."
                value={settingsUi.postingRules || ''}
                onChange={e => setSettingsUi(prev => ({ ...prev, postingRules: e.target.value }))}
            />
        </div>
    );
    const renderIntegrationsTab = () => (
        <div className="settings-section">
            <h3 className="section-title">Third-party Integrations</h3>
            <div className="toggle-row">
                <label>Enable Zapier/Webhooks:</label>
                <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={settingsUi.integrations}
                        onChange={e => setSettingsUi(prev => ({ ...prev, integrations: e.target.checked }))}
                    />
                    <span className="toggle-slider" />
                </label>
            </div>
        </div>
    );
    const renderSecurityTab = () => (
        <div className="settings-section">
            <h3 className="section-title">Security Settings</h3>
            <div className="toggle-row">
                <label>Enable 2FA:</label>
                <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={settingsUi.twoFactorAuth}
                        onChange={e => setSettingsUi(prev => ({ ...prev, twoFactorAuth: e.target.checked }))}
                    />
                    <span className="toggle-slider" />
                </label>
            </div>
            <div className="toggle-row">
                <label>Private Community:</label>
                <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={settingsUi.privateCommunity}
                        onChange={e => setSettingsUi(prev => ({ ...prev, privateCommunity: e.target.checked }))}
                    />
                    <span className="toggle-slider" />
                </label>
            </div>
        </div>
    );
    const renderAnnouncementsTab = () => (
        <div className="settings-section">
            <h3 className="section-title">Community Announcement</h3>
            <textarea
                className="announcement-box"
                rows="6"
                placeholder="Write an announcement to broadcast to all members..."
                value={settingsUi.announcement}
                onChange={e => setSettingsUi(prev => ({ ...prev, announcement: e.target.value }))}
            />
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Manage Members': return renderManageMembersTab();
            case 'Appearance': return renderAppearanceTab();
            case 'Posting Rules': return renderPostingRulesTab();
            case 'Integrations': return renderIntegrationsTab();
            case 'Security': return renderSecurityTab();
            case 'Announcements': return renderAnnouncementsTab();
            default: return null;
        }
    };

    return (
        <div className="community-card community-settings-wrapper">
            <div className="settings-header">
                <h2>⚙️ Community Settings</h2>
                <button className="back-btn" onClick={onBack}>← Back</button>
            </div>
            <div className="tab-row">
                {TABS.map(tab => (
                    <div
                        key={tab}
                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab(tab);
                            window.history.replaceState(null, '', `#settings=${encodeURIComponent(tab)}`);
                        }}
                    >
                        {tab}
                    </div>
                ))}
            </div>
            {renderTabContent()}
        </div>
    );
};

export default CommunitySettings;
