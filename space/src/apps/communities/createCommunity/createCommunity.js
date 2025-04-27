import React, { useState } from 'react';
import './createCommunity.css';
import useApi from '../../../utils/useApi';

const TABS = [
    "Projects",
    "Events",
    "Resources",
    "Funding",
    "Tasks",
    "Notebook",
    "Assignments",
    "Grades",
    "Whitepapers"
];

const CreateCommunity = () => {
    const { callApi } = useApi();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        visibility: 'public',
        selectedTabs: [],
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value,
        }));
    };

    const toggleTabSelection = (tab) => {
        setFormData(prevState => {
            const isSelected = prevState.selectedTabs.includes(tab);
            return {
                ...prevState,
                selectedTabs: isSelected
                    ? prevState.selectedTabs.filter(t => t !== tab)
                    : [...prevState.selectedTabs, tab]
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        const formDataToSend = {
            name: formData.name.trim(),
            description: formData.description.trim(),
            visibility: formData.visibility,
            selected_tabs: formData.selectedTabs,
        };
        try {
            const response = await callApi('community/create/', 'POST', formDataToSend);
            console.log('Community created:', response.data);
            setSuccess(true);
            setFormData({
                name: '',
                description: '',
                visibility: 'public',
                selectedTabs: [],
            });
        } catch (err) {
            console.error('Error creating community:', err);
            setError(err?.message || 'Unknown error occurred.');
        }        

        setLoading(false);
    };

    return (
        <div className="create-community-page">
            <div className="create-community-header">
                <h2>Create Community</h2>
            </div>

            <form className="create-community-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Community Name *</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter community name"
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Enter a short description"
                        rows="4"
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label>Visibility</label>
                    <select
                        name="visibility"
                        value={formData.visibility}
                        onChange={handleInputChange}
                        disabled={loading}
                    >
                        <option value="public">Public (Everyone can join)</option>
                        <option value="private">Private (Invite Only)</option>
                        <option value="hidden">Hidden (Unlisted)</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Optional Tabs</label>
                    <div className="tabs-selection">
                        {TABS.map((tab) => (
                            <div
                                key={tab}
                                className={`tab-option ${formData.selectedTabs.includes(tab) ? 'active' : ''}`}
                                onClick={() => toggleTabSelection(tab)}
                                style={{ pointerEvents: loading ? 'none' : 'auto' }}
                            >
                                {tab}
                            </div>
                        ))}
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">🎉 Community Created Successfully!</div>}

                <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Community'}
                </button>
            </form>
        </div>
    );
};

export default CreateCommunity;
