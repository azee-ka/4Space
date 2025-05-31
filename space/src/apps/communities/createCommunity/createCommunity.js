// CreateCommunity.jsx
import React, { useEffect, useState } from 'react';
import './createCommunity.scss';
import useApi from '../../../utils/useApi';
import { useNavigate } from 'react-router-dom';
import { useCreateCommunityContext } from '../../../context/CreateCommunityContext';
import { FaTimes } from 'react-icons/fa';

const CreateCommunity = () => {
  const { callApi } = useApi();
  const navigate = useNavigate();

      const { closeCreateCommunityOverlay: onClose } = useCreateCommunityContext();
  

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: '',
    type: 'general',
    visibility: 'public',
    allow_custom_tabs: true,
    restricted_to_org_members: false,
    banner: null,
    logo: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);


      useEffect(() => {
          window.history.pushState(null, '', '/communities/create');
      }, []);


  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const formDataToSend = new FormData();
    for (const key in formData) {
      if (formData[key] !== null && formData[key] !== undefined) {
        formDataToSend.append(key, formData[key]);
      }
    }

    try {
      const response = await callApi('community/create/', 'POST', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
      navigate(`/communities/c/${response.data.community_id}/`);
      onClose();
    } catch (err) {
      setError(err?.message || 'An error occurred.');
    }

    setLoading(false);
  };

  return (
    <div className='create-community-wrapper' onClick={() => onClose()}>
      <div className="create-community-container" onClick={(e) => e.stopPropagation()} >
        <button className="create-community-close-btn" onClick={onClose}>
          <FaTimes className="icon-style" />
        </button>

      <h2 className="create-community-title">Create Community</h2>
      <form className="create-community-form" onSubmit={handleSubmit}>
        <section className="create-community-section">
          <div className="create-community-group">
            <label>Community Name *</label>
            <input name="name" value={formData.name} onChange={handleChange} required disabled={loading} />
          </div>
          <div className="create-community-group">
            <label>Slug (optional)</label>
            <input name="slug" value={formData.slug} onChange={handleChange} disabled={loading} />
          </div>
        </section>

        <section className="create-community-section">
          <div className="create-community-group">
            <label>Category</label>
            <input name="category" value={formData.category} onChange={handleChange} disabled={loading} />
          </div>
          <div className="create-community-group">
            <label>Type</label>
            <select name="type" value={formData.type} onChange={handleChange} disabled={loading}>
              <option value="general">General</option>
              <option value="tech">Tech</option>
              <option value="education">Education</option>
              <option value="social">Social</option>
            </select>
          </div>
          <div className="create-community-group">
            <label>Visibility</label>
            <select name="visibility" value={formData.visibility} onChange={handleChange} disabled={loading}>
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="invite">Invite Only</option>
            </select>
          </div>
        </section>

        <section className="create-community-section toggles">
          <div className="create-community-toggle">
            <input type="checkbox" id="customTabs" name="allow_custom_tabs" checked={formData.allow_custom_tabs} onChange={handleChange} />
            <label htmlFor="customTabs">Allow Custom Tabs</label>
          </div>
          <div className="create-community-toggle">
            <input type="checkbox" id="orgOnly" name="restricted_to_org_members" checked={formData.restricted_to_org_members} onChange={handleChange} />
            <label htmlFor="orgOnly">Restrict to Organization Members</label>
          </div>
        </section>

        <section className="create-community-section uploads">
          <div className="create-community-group">
            <label>Upload Logo</label>
            <input type="file" name="logo" accept="image/*" onChange={handleChange} />
          </div>
          <div className="create-community-group">
            <label>Upload Banner</label>
            <input type="file" name="banner" accept="image/*" onChange={handleChange} />
          </div>
        </section>

        <div className="create-community-group full">
          <label>Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows="5" disabled={loading} />
        </div>

        {error && <div className="create-community-form-error">{error}</div>}
        {success && <div className="create-community-form-success">Community created successfully!</div>}

        <button type="submit" className="create-community-submit-button" disabled={loading}>
          {loading ? 'Creating...' : 'Create Community'}
        </button>
      </form>
    </div>

    </div>
  );
};

export default CreateCommunity;