// src/communities/community/tabs/research/publicationsTab
import React, { useEffect, useState } from 'react';
import './publicationsTab.css';
import PublicationDetail from './publicationDetail/publicationDetail';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMyPublications, uploadPublication } from '../../../../../../services/communities';
import { MY_PUBLICATIONS } from '../../../../../../services/queryKeys';

const PublicationsTab = ({ communitySlug }) => {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [file, setFile] = useState(null);

  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#publications-my-publications-')) return 'my-publications';
    if (hash.startsWith('#publications-my-publications')) return 'my-publications';
    if (hash.startsWith('#publications-upload')) return 'upload';
    return 'upload'; // fallback default
  });

  const [selected, setSelected] = useState(null);

  // Fetch publications (React Query)
  const { data: publications = [], refetch, isLoading } = useQuery({
    queryKey: MY_PUBLICATIONS(communitySlug),
    queryFn: () => fetchMyPublications(communitySlug),
    enabled: activeTab === 'my-publications',
  });

  // Upload mutation
  const mutation = useMutation({
    mutationFn: ({ title, abstract, file }) =>{
      console.log('SUBMITTING FILE:', file);
      uploadPublication({ communitySlug, title, abstract, file })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(MY_PUBLICATIONS(communitySlug));
      setTitle('');
      setAbstract('');
      setFile(null);
      setActiveTab('my-publications');
      window.location.hash = 'publications-my-publications';
    },
  });

  // Detail selection based on hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#publications-my-publications-')) {
      const id = hash.replace('#publications-my-publications-', '');
      const match = publications.find(p => String(p.id) === String(id));
      if (match) setSelected(match);
    } else {
      setSelected(null);
    }
  }, [publications, activeTab]);

  // Tab switching sync with hash
  useEffect(() => {
    if (activeTab === 'my-publications') window.location.hash = 'publications-my-publications';
    if (activeTab === 'upload') window.location.hash = 'publications-upload';
  }, [activeTab]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('SUBMIT HANDLER:', { file });
    if (!file) {
      return;
    }
    mutation.mutate({ title, abstract, file });
  };

  if (selected) {
    return (
      <PublicationDetail
        publication={selected}
        embedded={true}
        onBack={() => {
          setSelected(null);
          window.location.hash = 'publications-my-publications';
        }}
      />
    );
  }

  return (
    <div className="community-home-card publications-tab">
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
            disabled={mutation.isLoading}
          />
          <textarea
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            placeholder="Write a short abstract"
            required
            disabled={mutation.isLoading}
          />
          <label className="custom-file-upload">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
              required
              disabled={mutation.isLoading}
            />
            {file ? file.name : 'Choose PDF File'}
          </label>
          <button type="submit" disabled={mutation.isLoading || !file}>
            {mutation.isLoading ? 'Uploading...' : 'Upload'}
          </button>
          {mutation.isError && (
            <div className="publication-form-error">
              {mutation.error?.response?.data?.detail || mutation.error?.message || 'Failed to upload.'}
            </div>
          )}
        </form>
      )}

      {activeTab === 'my-publications' && (
        <div className="publication-list">
          {isLoading ? (
            <p>Loading...</p>
          ) : publications.length === 0 ? (
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
      )}
    </div>
  );
};

export default PublicationsTab;
