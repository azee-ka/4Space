import React, { useEffect, useState } from "react";
import './settings.css';
import Visiblity from "./tabs/visiblity/visibility";
import Profile from "../profile/profile";
import ProfileAppearance from "./tabs/profileAppearance/profileAppearance";
import BasicInfo from "./tabs/basicInfo/basicInfo";
import NotificationsTab from "./tabs/notifications/notifications";
import MessagesControl from "./tabs/messagesControl/messagesControl";
import UsernameHandleTab from "./tabs/usernameHandle/usernameHandle";


const Placeholder = () => <div style={{ padding: "20px", color: "#ccc" }}>Coming soon...</div>;

const Settings = () => {
    const [isCustomizing, setIsCustomizing] = useState(false);

    const startCustomization = () => setIsCustomizing(true);
    const stopCustomization = () => setIsCustomizing(false);
    const [customizeTargetPage, setCustomizeTargetPage] = useState('');

    const handleStartCustomization = (targetPage) => {
        startCustomization();
        setCustomizeTargetPage(targetPage);
    };

    const [selectedParentIndex, setSelectedParentIndex] = useState(0);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const tabs = {
        'Account & Identity': [
            { label: 'Basic Info', component: <BasicInfo /> },
            { label: 'Username & Handle', component: <UsernameHandleTab /> },
            { label: 'Profile Appearance', component: <ProfileAppearance handleStartCustomization={handleStartCustomization} /> },
            { label: 'Status / Mood', component: <Placeholder /> },
        ],
        'Privacy & Safety': [
            { label: 'Visibility Controls', component: <Visiblity /> },
            { label: 'Blocked & Muted', component: <Placeholder /> },
            { label: 'Tagging & Mentions', component: <Placeholder /> },
            { label: 'Sensitive Content', component: <Placeholder /> },
            { label: 'Search Visibility', component: <Placeholder /> },
        ],
        'Security': [
            { label: 'Password & Login', component: <Placeholder /> },
            { label: 'Two-Factor Auth', component: <Placeholder /> },
            { label: 'Session Control', component: <Placeholder /> },
            { label: 'Security Alerts', component: <Placeholder /> },
        ],
        'Communication': [
            { label: 'Message Controls', component: <MessagesControl /> },
            { label: 'Replies & Comments', component: <Placeholder /> },
            { label: 'Interaction Requests', component: <Placeholder /> },
        ],
        'Notifications': [
            { label: 'In-App', component: <NotificationsTab /> },
            { label: 'Email Alerts', component: <Placeholder /> },
            { label: 'Push Alerts', component: <Placeholder /> },
            { label: 'Quiet Mode', component: <Placeholder /> },
        ],
        'Appearance & Display': [
            { label: 'Themes & Colors', component: <Placeholder /> },
            { label: 'Dark Mode Schedule', component: <Placeholder /> },
            { label: 'Text Size & Spacing', component: <Placeholder /> },
            { label: 'UI Layout', component: <Placeholder /> },
        ],
        'Feed & Discovery': [
            { label: 'Feed Preferences', component: <Placeholder /> },
            { label: 'Muted Topics', component: <Placeholder /> },
            { label: 'AI Recommendation Tuning', component: <Placeholder /> },
        ],
        'Data & Permissions': [
            { label: 'Download Your Data', component: <Placeholder /> },
            { label: 'Ad Preferences', component: <Placeholder /> },
            { label: 'Clear Cache', component: <Placeholder /> },
        ],
        'Accessibility': [
            { label: 'Contrast & Font', component: <Placeholder /> },
            { label: 'Screen Reader', component: <Placeholder /> },
            { label: 'Reduced Motion', component: <Placeholder /> },
        ],
        'Connected Services': [
            { label: 'Social Media Links', component: <Placeholder /> },
            { label: 'App Integrations', component: <Placeholder /> },
            { label: 'API Access', component: <Placeholder /> },
        ],
        'Experimental & AI': [
            { label: 'Beta Features', component: <Placeholder /> },
            { label: 'AI Assistant', component: <Placeholder /> },
        ],
        'Danger Zone': [
            { label: 'Deactivate Account', component: <Placeholder /> },
            { label: 'Delete Account', component: <Placeholder /> },
            { label: 'Reset All Settings', component: <Placeholder /> },
        ]
    };


    const formatHash = (str) => {
        return str.trim().replace(/\s+/g, '-').toLowerCase(); // Replace spaces with dashes and convert to lowercase
    };

    const tabKeys = Object.entries(tabs).flatMap(([sectionKey, sectionItems], parentIndex) =>
        sectionItems.map((item, index) => ({
            hash: `#${formatHash(sectionKey)}-${formatHash(item.label)}`,
            parentIndex,
            index,
        }))
    );



    useEffect(() => {
        const handleHashChange = () => {
            const currentHash = window.location.hash;
            const matchingTab = tabKeys.find((tab) => tab.hash === currentHash);

            if (matchingTab) {
                setSelectedParentIndex(matchingTab.parentIndex);
                setSelectedIndex(matchingTab.index);
            }
        };

        handleHashChange(); // Set the tab on initial load
        window.addEventListener("hashchange", handleHashChange);

        return () => {
            window.removeEventListener("hashchange", handleHashChange);
        };
    }, [tabKeys]);


    const handleTabClick = (parentIndex, index) => {
        setSelectedParentIndex(parentIndex);
        setSelectedIndex(index);

        const selectedTab = tabKeys.find(
            (tab) => tab.parentIndex === parentIndex && tab.index === index
        );
        if (selectedTab) {
            window.location.hash = selectedTab.hash; // Update the URL hash
        }
    };

    return isCustomizing ? (
        <div className="settings-customization-page">
            <button className="exit-customization" onClick={stopCustomization}>
                Exit Customization
            </button>
            <Profile enforceViewType={customizeTargetPage} isCustomizing={true} />
        </div>
    ) : (
        <div className="settings-page">
            <div className="settings-left-panel">
                <input
                    type="text"
                    className="settings-search-bar"
                    placeholder="Search settings..."
                    onChange={(e) => {
                        const search = e.target.value.toLowerCase();
                        const tab = tabKeys.find(tab =>
                            tab.hash.toLowerCase().includes(search)
                        );
                        if (tab) {
                            setSelectedParentIndex(tab.parentIndex);
                            setSelectedIndex(tab.index);
                            window.location.hash = tab.hash;
                        }
                    }}
                />

                {Object.entries(tabs).map(([sectionKey, sectionItems], parentIndex) => (
                    <section key={parentIndex}>
                        <h3>{sectionKey}</h3>
                        <div>
                            {sectionItems.map((item, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleTabClick(parentIndex, index)}
                                    className={`tab-item ${selectedParentIndex === parentIndex && selectedIndex === index ? 'active' : ''}`}
                                >
                                    <p>{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
            <div className="settings-right-panel">
                <h2>Settings</h2>
                {
                    tabs[Object.keys(tabs)[selectedParentIndex]] &&
                    tabs[Object.keys(tabs)[selectedParentIndex]][selectedIndex] &&
                    tabs[Object.keys(tabs)[selectedParentIndex]][selectedIndex]?.component
                }
            </div>
        </div>
    );
};

export default Settings;