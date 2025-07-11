// src/pages/profile/myProfile/social/tabs/collectionsMyTab/MyCollectionsTab.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient
} from '@tanstack/react-query';
import {
  fetchMyCollections,
  fetchCollectionItemsByType,
  createCollection
} from '../../../../../../services/collections';
import { MY_COLLECTIONS, COLLECTION_ITEMS } from '../../../../../../services/queryKeys';
import { searchUsers } from '../../../../../../services/user';
import Modal from '../../../../../../components/modal/Modal';
import './collectionsMyTab.css';
import Masonry from 'react-masonry-css';
import VisualGridTile from '../../../../../../apps/home/explore/visual/exploreVisualPostCard';
import { usePostContext } from '../../../../../../context/PostContext';
import { ExpandPostProvider } from '../../../../../../components/postUI/expandPost/expandPostContext';
import ThreadPostCard from '../../../../../../apps/home/explore/thread/threadPostCard';

const PAGE_SIZE = 20;
const tabOptions = [
  { key: 'col_visual', label: 'Visual' },
  { key: 'col_thread', label: 'Thread' },
  { key: 'col_comments', label: 'Comments' },
  { key: 'col_replies', label: 'Replies' },
  { key: 'col_exchange', label: 'Exchange' }
];


const modelMap = {
  col_visual: 'visualpost',
  col_thread: 'threadpost',
  col_comments: 'comment',
  col_replies: 'exchangereply',
  col_exchange: 'exchangepost'
};


const defaultColTab = tabOptions[0].key;

export default function MyCollectionsTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const selectedCollection = searchParams.get('collection');

  // — fetch collections for grid + title
  const { data: collections = [], isLoading: loadingCollections } = useQuery({
    queryKey: MY_COLLECTIONS,
    queryFn: fetchMyCollections
  });
  const current = collections.find(c => c.id === selectedCollection);

  // — which sub-tab
  const [activeTab, setActiveTab] = useState(
    searchParams.get('coltab') || defaultColTab
  );
  useEffect(() => {
    setActiveTab(searchParams.get('coltab') || defaultColTab);
  }, [searchParams]);


  const realModel = modelMap[activeTab] || activeTab;
  const isVisual   = realModel === 'visualpost';
  const isThread   = realModel === 'threadpost';
  const isComments = realModel === 'comment';
  const isReplies  = realModel === 'exchangereply';
  const isExchange = realModel === 'exchangepost';


  // — infinite-query for items
  const {
    data: itemsPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loadingItems
  } = useInfiniteQuery({
    queryKey: COLLECTION_ITEMS(selectedCollection, realModel),
    queryFn: ({ pageParam = 0 }) =>
      fetchCollectionItemsByType({
        collectionId: selectedCollection,
        model: realModel,
        pageParam,
        pageSize: PAGE_SIZE
      }),
    getNextPageParam: last => {
      const nxt = last?.next;
      if (!nxt) return undefined;
      return parseInt(
        new URL(nxt, window.location.origin)
          .searchParams.get('offset') || '0',
        10
      );
    },
    enabled: !!selectedCollection
  });
  const items = itemsPages?.pages.flatMap(p => p.results) || [];
  const sentinelRef = useRef(null);
  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage || isFetchingNextPage) return;
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && fetchNextPage(),
      { rootMargin: '200px' }
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);


  // Post expand handler
  const { handleExpandPostOpen } = usePostContext();
  const onExpand = (post, index, postsList) => {
    const currentPath = window.location.pathname + window.location.search + window.location.hash;
    const contentList = postsList.map(p => p.content);
    handleExpandPostOpen(
      post.id,
      contentList.map(p => ({ id: p.id, post_type: p.post_type })),
      currentPath,
      index,
      post.post_type
    );
  };

  // — two‐step modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [inviteEnabled, setInviteEnabled] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    visibility: 'private',
    collaborators: []
  });

  // — open & reset
  const openModal = () => {
    setForm({ title: '', description: '', visibility: 'private', collaborators: [] });
    setInviteEnabled(false);
    setModalStep(1);
    setModalOpen(true);
  };

  // — live user search (≥ 3 chars)
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const { data: suggestions = [], isFetching: searchingUsers } = useQuery({
    queryKey: ['userSearch', userSearchTerm],
    queryFn: () => searchUsers(userSearchTerm),
    enabled: userSearchTerm.length >= 3
  });

  const addCollaborator = user => {
    if (form.collaborators.find(c => c.id === user.id)) return;
    setForm(f => ({
      ...f,
      collaborators: [
        ...f.collaborators,
        { id: user.id, username: user.username, permission: 'read' }
      ]
    }));
    setUserSearchTerm('');
  };
  const removeCollaborator = id => {
    setForm(f => ({
      ...f,
      collaborators: f.collaborators.filter(c => c.id !== id)
    }));
  };
  const updatePermission = (id, permission) => {
    setForm(f => ({
      ...f,
      collaborators: f.collaborators.map(c =>
        c.id === id ? { ...c, permission } : c
      )
    }));
  };

  // — create‐collection mutation
  const createMut = useMutation({
    mutationFn: createCollection,
    onSuccess: () => {
      queryClient.invalidateQueries(MY_COLLECTIONS);
      setModalOpen(false);
    }
  });

  // — primary footer action
  const handlePrimary = () => {
    if (modalStep === 1) {
      if (inviteEnabled) {
        setModalStep(2);
      } else {
        createMut.mutate(form);
      }
    } else {
      createMut.mutate(form);
    }
  };

  const updateSearch = updater => {
    const p = new URLSearchParams(searchParams.toString());
    updater(p);
    setSearchParams(p);
  };


  // Masonry
  const masonryBreakpoints = { default: 3, 1200: 3, 900: 2, 600: 1 };

  return (
    <div className="my-collections-container">

      {selectedCollection ? (
        <>
          <div className="collections-header">
            <h2 className="collection-header-title">
              {current?.title || 'Collection'}
            </h2>
            <button
              className="collections-back-btn"
              onClick={() => updateSearch(p => {
                p.delete('collection'); p.delete('coltab');
              })}
            >← Back to Collections</button>
          </div>

          <div className="my-collections-tabs-header">
            {tabOptions.map(t => (
              <button
                key={t.key}
                className={`my-collections-tab-btn${activeTab === t.key ? ' active' : ''}`}
                onClick={() => updateSearch(p => {
                  p.set('collection', selectedCollection);
                  p.set('coltab', t.key);
                })}
              >{t.label}</button>
            ))}
          </div>

          {loadingItems ? (
            <div className="collections-loading">Loading items…</div>
          ) : items.length === 0 ? (
            <div className="collections-no-data">No items here.</div>
          ) : (
            <div className='collections-list'>

              {isVisual && (
                <div className="my-posts-masonry-wrapper">
                  <Masonry
                    breakpointCols={masonryBreakpoints}
                    className="my-posts-masonry-grid"
                    columnClassName="my-posts-masonry-column"
                  >
                    {items.map((post, idx) => {
                      const thumbnail = post?.content?.thumbnail || null;
                      return (
                        <div key={post.id}>
                          <VisualGridTile
                            post={{
                              id: post.content.id,
                              thumbnail,
                              media_files_count: post.content.media_files_count || 0,
                              post_type: 'Visual',
                            }}
                            onClick={() => onExpand(post.content, idx, items)}
                          />
                        </div>
                      );
                    })}
                  </Masonry>
                </div>
              )}

              {isThread && (
                <div className="my-thread-list">
                  {items.map((post, idx) => (
                    <ExpandPostProvider
                      key={post.content.id}
                      postId={post.content.id}
                      postData={post.content}
                    >
                      <ThreadPostCard postId={post.content.id} index={idx} />
                    </ExpandPostProvider>
                  ))}
                </div>
              )}

              {isComments && (
                <div className="my-comments-list">
                  {items.map(item => (
                    <div key={item.id} className="comment-item">
                      <strong>{item.content.author.username}</strong>
                      <p>{item.content.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {isReplies && (
                <div className="my-replies-list">
                  {items.map(item => (
                    <div key={item.id} className="reply-item">
                      <strong>{item.content.author.username}</strong>
                      <p>{item.content.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {isExchange && (
                <div className="my-exchange-list">
                  {items.map(item => (
                    <div key={item.id} className="exchange-item">
                      <h3>{item.content.title}</h3>
                      <p>{item.content.body}</p>
                    </div>
                  ))}
                </div>
              )}

              <div ref={sentinelRef} className="collections-sentinel" />
              {isFetchingNextPage && (
                <div className="collections-loading-more">Loading more…</div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="collections-header">
            <h2 className="collection-header-title">My Collections</h2>
            <button className="create-btn" onClick={openModal}>
              + Create Collection
            </button>
          </div>

          {loadingCollections ? (
            <p>Loading collections…</p>
          ) : collections.length === 0 ? (
            <p>No collections found.</p>
          ) : (
            <div className="collections-grid">
              {collections.map(col => (
                <div
                  key={col.id}
                  className="collection-tile"
                  onClick={() => updateSearch(p => {
                    p.set('collection', col.id);
                    p.set('coltab', defaultColTab);
                  })}
                >
                  <div className="collection-title">{col.title}</div>
                  <div className="collection-desc">{col.description || 'No description'}</div>
                  <div className="collection-visibility">{col.visibility}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Collection"
        size="md"
        maxWidth="35rem"
        footer={(
          <div className="mycol-form-actions">
            {modalStep === 1 ? (
              <>
                <button
                  type="button"
                  className="mycol-cancel-btn"
                  onClick={() => setModalOpen(false)}
                >Cancel</button>
                <button
                  type="button"
                  className={inviteEnabled ? 'mycol-continue-btn' : 'mycol-submit-btn'}
                  onClick={handlePrimary}
                >
                  {inviteEnabled ? 'Continue' : createMut.isLoading ? 'Creating…' : 'Create'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="mycol-back-btn"
                  onClick={() => setModalStep(1)}
                >Back</button>
                <button
                  type="button"
                  className="mycol-submit-btn"
                  onClick={handlePrimary}
                  disabled={createMut.isLoading}
                >
                  {createMut.isLoading ? 'Creating…' : 'Create'}
                </button>
              </>
            )}
          </div>
        )}
      >
        {modalStep === 1 ? (
          <div className="mycol-step1">
            <div className="mycol-form-group">
              <label htmlFor="col-title" className="mycol-form-label">Title</label>
              <input
                id="col-title"
                type="text"
                placeholder='Title'
                required
                className="mycol-form-input"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="mycol-form-group">
              <label htmlFor="col-desc" className="mycol-form-label">Description</label>
              <textarea
                id="col-desc"
                placeholder='Description'
                className="mycol-form-textarea"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="mycol-form-group">
              <label htmlFor="col-vis" className="mycol-form-label">Visibility</label>
              <select
                id="col-vis"
                className="mycol-form-select"
                value={form.visibility}
                onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))}
              >
                <option value="private">Private</option>
                <option value="followers">Followers</option>
                <option value="public">Public</option>
              </select>
            </div>
            <div className="mycol-options">
              <label className="mycol-options-label">
                <input
                  type="checkbox"
                  checked={inviteEnabled}
                  onChange={e => {
                    const val = e.target.checked;
                    setInviteEnabled(val);
                    if (!val) setForm(f => ({ ...f, collaborators: [] }));
                  }}
                  className="custom-checkbox"
                />
                <span className="custom-checkmark"></span>
                &nbsp;Invite collaborators
              </label>
            </div>
          </div>
        ) : (
          <div className="mycol-step2 collab-group">
            <label className="mycol-form-label">Search & add collaborators</label>
            <input
              type="text"
              placeholder="Type at least 3 chars…"
              value={userSearchTerm}
              onChange={e => setUserSearchTerm(e.target.value)}
              className="mycol-collab-search"
            />
            {searchingUsers && <div className="collab-loading">Searching…</div>}
            {suggestions.length > 0 && (
              <ul className="mycol-collab-suggestions">
                {suggestions.map(u => (
                  <li key={u.id} onClick={() => addCollaborator(u)}>
                    {u.username}
                  </li>
                ))}
              </ul>
            )}
            {form.collaborators.length > 0 && (
              <ul className="mycol-collab-list">
                {form.collaborators.map(c => (
                  <li key={c.id} className="mycol-collab-item">
                    <span className="mycol-collab-name">{c.username}</span>
                    <select
                      className="mycol-collab-permission-select"
                      value={c.permission}
                      onChange={e => updatePermission(c.id, e.target.value)}
                    >
                      <option value="read">Can View</option>
                      <option value="write">Can Edit</option>
                    </select>
                    <button
                      type="button"
                      className="mycol-collab-remove"
                      onClick={() => removeCollaborator(c.id)}
                    >✕</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
