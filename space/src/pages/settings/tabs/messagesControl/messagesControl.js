import React, { useEffect, useState } from "react";
import './messagesControl.css';
import useApi from "../../../../utils/useApi";

const MessagesControl = () => {
    const { callApi } = useApi();
    // State to manage both follower and other settings
    const [settings, setSettings] = useState({
        followers: null,
        others: null,
    });

    // Fetch initial settings from the server (e.g., when the component is mounted)
    const fetchSettings = async () => {
        try {
            const response = await callApi('messages/settings/');
            console.log(response.data);
            if (response.data) {
                setSettings({
                    followers: response.data?.allow_messages_from_followers || 'requests',
                    others: response.data?.allow_messages_from_others || 'no-requests',
                });
            }
        } catch (error) {
            console.error("Error fetching message settings:", error);
        }
    };


    useEffect(() => {
        fetchSettings();
    }, []);

    const options = [
        { value: 'allow', label: 'Allow Messages' },
        { value: 'requests', label: 'Requests Only' },
        { value: 'no-requests', label: 'No Requests' },
    ];

        // Save the settings when the user selects a new option, directly passing the values
    const handleSaveSettings = async (followers, others) => {
        try {
            const data = {
                allow_messages_from_followers: followers,
                allow_messages_from_others: others,
            };
            console.log('Sending data to backend:', data);
            const response = await callApi('messages/settings/', 'POST', data);
            console.log(response.data); // Log the response from the backend
        } catch (error) {
            console.error('Error updating settings:', error);
        }
    };

    // Update settings state and send new values to the backend immediately
    const handleSettingChange = (group, value) => {
        const newSettings = { ...settings, [group]: value };
        setSettings(newSettings);  // Update state optimistically

        // Send the updated values immediately to the backend without waiting for state to re-render
        handleSaveSettings(newSettings.followers, newSettings.others);
    };

    const renderOptions = (selectedValue, onChange, groupName) => (
        options.map(option => (
            <label key={option.value} className="control-settings-item">
                {option.label}
                <input
                    type="radio"
                    id={option.value}
                    name={groupName} // Use a unique name for each section
                    value={option.value}
                    checked={selectedValue === option.value}
                    onChange={() => onChange(option.value)}
                    className="custom-checkbox"
                />
                <span className="custom-checkmark"></span>
            </label>
        ))
    );


    return (
        <div className="messages-control-settings">
            <section>
                <h3>Your Followers</h3>
                <p>Select whether to allow your followers to send direct messages, 
                    permit message requests that require your approval in the Requests tab, or block all messages entirely.
                </p>
                <div className="messages-control-content">
                {renderOptions(settings.followers, (value) => handleSettingChange('followers', value), 'followers')}
                </div>
            </section>
            <section>
                <h3>Others</h3>
                <p>Select whether to allow others to send direct messages, 
                    permit message requests that appear in the Requests tab for your approval, or block all messages from non-followers.
                </p>
                <div className="messages-control-content">
                {renderOptions(settings.others, (value) => handleSettingChange('others', value), 'others')}
                </div>
            </section>
        </div>
    )
}

export default MessagesControl;