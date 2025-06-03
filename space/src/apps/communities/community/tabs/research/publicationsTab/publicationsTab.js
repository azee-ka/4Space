import React, { useEffect, useState } from 'react';
import './publicationsTab.css';
import useApi from '../../../../../../utils/useApi';
import PublicationDetail from './publicationDetail/publicationDetail';

const PublicationsTab = ({ communityId }) => {
  const { callApi } = useApi();
  const [publications, setPublications] = useState([]);
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#publications-my-publications-')) return 'my-publications';
    if (hash.startsWith('#publications-my-publications')) return 'my-publications';
    if (hash.startsWith('#publications-upload')) return 'upload';
    return 'upload'; // fallback default
  });


  const [selected, setSelected] = useState(null);

  const fetchPublications = async () => {
    try {
      const response = await callApi(`community/research/${communityId}/my-publications/`);
      setPublications(response.data);
    } catch (err) {
      console.error('Error fetching publications', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'my-publications') {
      fetchPublications();
    }
  }, [communityId, activeTab]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#publications-my-publications-')) {
      const id = hash.replace('#publications-my-publications-', '');
      const match = publications.find(p => p.id === id);
      if (match) {
        setSelected(match);
      }
    }
  }, [publications]);


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
        `community/research/${communityId}/publications/create/`,
        'POST',
        formData,
        'multipart/form-data'
      );
      setPublications([response.data, ...publications]);
      setTitle('');
      setAbstract('');
      setFile(null);
      setActiveTab('my-publications');
    } catch (err) {
      console.error('Error submitting publication', err);
    } finally {
      setLoading(false);
    }
  };

  return selected ? (
    <PublicationDetail
      publication={selected}
      embedded={true}
      onBack={() => {
        setSelected(null);
        window.location.hash = 'publications-my-publications';
      }}
    />
  ) : (
    <div className="publications-tab">
      <div className="tab-row">
        <button
          className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('upload');
            setSelected(null);
            window.location.hash = 'publications-upload';
          }}

        >
          Upload Publication
        </button>
        <button
          className={`tab-btn ${activeTab === 'my-publications' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('my-publications');
            setSelected(null);
            window.location.hash = 'publications-my-publications';
          }}
        >
          My Publications
        </button>
      </div>

      <h2 className="section-title">
        {activeTab === 'upload'
          ? 'Upload a New Paper'
          : selected
            ? 'Viewing Publication'
            : 'Your Publications in This Community'}
      </h2>

      {activeTab === 'upload' && (
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
      )}

      {activeTab === 'my-publications' && (
        <>
          <div className="publication-list">
            {publications.length === 0 ? (
              <p>No publications found.</p>
            ) : (
              publications.map((pub) => (
                <div
                  className="publication-card"
                  key={pub.id}
                  onClick={() => {
                    setSelected(pub);
                    window.location.hash = `publications-my-publications-${pub.id}`;
                  }}

                >
                  <h4>{pub.title}</h4>
                  <p>{pub.abstract.slice(0, 140)}...</p>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PublicationsTab;
