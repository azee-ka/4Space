import React from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMessageSettings, updateMessageSettings } from '../../../../services/settings';
import './messagesControl.css';

const options = [
    { value: 'allow', label: 'Allow Messages' },
    { value: 'requests', label: 'Requests Only' },
    { value: 'no-requests', label: 'No Requests' },
];

const MessagesControl = () => {
    const queryClient = useQueryClient();

    // Fetch settings (v5 object form)
    const { data, isLoading, isError } = useQuery({
        queryKey: ['messageSettings'],
        queryFn: fetchMessageSettings
    });

    // Local state for editing
    const [settings, setSettings] = React.useState({ followers: null, others: null });

    React.useEffect(() => {
        if (data?.data) {
            setSettings({
                followers: data.data.allow_messages_from_followers || 'requests',
                others: data.data.allow_messages_from_others || 'no-requests',
            });
        }
    }, [data]);

    // Mutation for updating settings (v5 object form)
    const mutation = useMutation({
        mutationFn: updateMessageSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messageSettings'] });
        }
    });

    const handleSettingChange = (group, value) => {
        const newSettings = { ...settings, [group]: value };
        setSettings(newSettings);
        mutation.mutate({
            allow_messages_from_followers: newSettings.followers,
            allow_messages_from_others: newSettings.others,
        });
    };

    const renderOptions = (selectedValue, onChange, groupName) =>
        options.map(option => (
            <label key={option.value} className="control-settings-item">
                {option.label}
                <input
                    type="radio"
                    id={option.value + '-' + groupName}
                    name={groupName}
                    value={option.value}
                    checked={selectedValue === option.value}
                    onChange={() => onChange(option.value)}
                    className="custom-checkbox"
                />
                <span className="custom-checkmark"></span>
            </label>
        ));

    if (isLoading) return <div>Loading…</div>;
    if (isError) return <div>Error loading message settings</div>;

    return (
        <div className="messages-control-settings">
            <section>
                <h3>Your Followers</h3>
                <p>
                    Select whether to allow your followers to send direct messages,
                    permit message requests that require your approval in the Requests tab, or block all messages entirely.
                </p>
                <div className="messages-control-content">
                    {renderOptions(settings.followers, value => handleSettingChange('followers', value), 'followers')}
                </div>
            </section>
            <section>
                <h3>Others</h3>
                <p>
                    Select whether to allow others to send direct messages,
                    permit message requests that appear in the Requests tab for your approval, or block all messages from non-followers.
                </p>
                <div className="messages-control-content">
                    {renderOptions(settings.others, value => handleSettingChange('others', value), 'others')}
                </div>
            </section>
            {mutation.isLoading && <span>Updating…</span>}
            {mutation.isError && <span style={{ color: 'red' }}>Update failed!</span>}
        </div>
    );
}

export default MessagesControl;
