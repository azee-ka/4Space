// components/research/PublicationsTab.jsx
import React, { useEffect, useState } from 'react';
import './publicationsTab.css';
import useApi from '../../../../../../utils/useApi';

const PublicationsTab = ({ communityId }) => {
  const { callApi } = useApi();
  const [publications, setPublications] = useState([]);
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPublications = async () => {
    try {
      const response = await callApi(`communities/research/${communityId}/publications/`);
      setPublications(response.data);
    } catch (err) {
      console.error('Error fetching publications', err);
    }
  };

  useEffect(() => {
    fetchPublications();
  }, [communityId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('abstract', abstract);
    formData.append('file', file);

    setLoading(true);

    try {
      const response = await callApi(
        `communities/research/${communityId}/publications/`,
        'POST',
        formData
      );
      setPublications([response.data, ...publications]);
      setTitle('');
      setAbstract('');
      setFile(null);
    } catch (err) {
      console.error('Error submitting publication', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="publications-tab">
      <div className="header">
        <h2>Research Publications</h2>
      </div>

      <form className="publication-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter publication title"
          required
        />
        <textarea
          value={abstract}
          onChange={(e) => setAbstract(e.target.value)}
          placeholder="Write a short abstract"
          required
        />
       <label className="custom-file-upload">
  <input
    type="file"
    accept="application/pdf"
    onChange={(e) => setFile(e.target.files[0])}
    required
  />
  {file ? file.name : 'Choose PDF File'}
</label>

        <button type="submit" disabled={loading || !file}>
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      <div className="publication-list">
        {publications.map((pub) => (
          <div className="publication-card" key={pub?.id}>
            <h4>{pub?.title}</h4>
            <p>{pub?.abstract}</p>
            {pub?.file?.endsWith('.pdf') ? (
              <iframe
                src={pub.file}
                className="publication-preview"
                title={`Preview - ${pub.title}`}
                frameBorder="0"
              />
            ) : (
              <a href={pub.file} target="_blank" rel="noopener noreferrer">
                Download File
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PublicationsTab;
