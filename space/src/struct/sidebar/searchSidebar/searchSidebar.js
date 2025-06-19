import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import './searchSidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClose } from '@fortawesome/free-solid-svg-icons';
import ProfilePicture from '../../../utils/profilePicture/getProfilePicture';
import { searchUsers, fetchSearchHistory, deleteSearchHistoryItem, storeSearchHistoryItem } from '../../../services/search';
import { SEARCH_HISTORY, SEARCH_RESULTS } from '../../../services/queryKeys';
import useDebounce from '../../../hooks/useDebounce';

function SearchSidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearchInput = useDebounce(searchInput, 300);

  // Search query
  const { data: searchResults = [], isFetching: searching } = useQuery({
    queryKey: SEARCH_RESULTS(debouncedSearchInput),
    queryFn: () => searchUsers(debouncedSearchInput),
    enabled: !!debouncedSearchInput,
    staleTime: 0,
  });

  // History query
  const { data: searchHistory = [], refetch: refetchHistory } = useQuery({
    queryKey: SEARCH_HISTORY,
    queryFn: fetchSearchHistory,
    enabled: isOpen && !debouncedSearchInput,
    refetchOnWindowFocus: false,
  });

  // Reset on open/close
  React.useEffect(() => {
    setSearchInput('');
    // History will refetch via enabled above
  }, [isOpen]);

  // Handlers
  const handleDeleteSearchItem = async (user) => {
    await deleteSearchHistoryItem(user.username);
    refetchHistory();
  };

  const handleRedirect = async (user) => {
    if (searchResults.length) {
      await storeSearchHistoryItem(user.username);
      navigate(`/profile/${user.username}`);
    } else {
      // history item
      navigate(`/profile/${user.searched_user.username}`);
    }
    onClose();
  };

  // Data to display: search or history
  const showResults = !!debouncedSearchInput;
  const displayItems = showResults && searchResults.length
    ? searchResults
    : (!showResults ? searchHistory : []);

  return (
    <div className={`search-sidebar-container ${isOpen ? '' : 'close'}`} onClick={(e) => e.stopPropagation()}>
      <div className={`search-sidebar-container-content ${isOpen ? 'open' : ''}`}>
        <div className='search-sidebar-container-content-inner'>
          <div className='search-sidebar-header'>
            <h2>Search</h2>
            <div className='search-sidebar-search-bar'>
              <input
                placeholder='Search...'
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
              <FontAwesomeIcon onClick={() => { setSearchInput(''); }} icon={faClose} />
            </div>
          </div>
          <div className='search-sidebar-results'>
            <div className='search-sidebar-results-inner'>
              {/* Prompt user if nothing typed and sidebar is open */}
              {!debouncedSearchInput && (!searchHistory || searchHistory.length === 0) && (
                <div className="no-results">Type above to search for another user!</div>
              )}

              {/* Show "No results" only if searching and got nothing */}
              {debouncedSearchInput && searchResults.length === 0 && !searching && (
                <div className="no-results">No results found.</div>
              )}

              {/* Results/history */}
              {displayItems.map((item, index) => {
                const isHistory = !debouncedSearchInput;
                const user = isHistory ? item.searched_user : item;
                return (
                  <div
                    key={index}
                    className='search-per-item'
                    onClick={() => handleRedirect(item)}
                  >
                    <div className='search-per-item-inner'>
                      <div className='search-item-info'>
                        <div className='search-item-profile-picture'>
                          <ProfilePicture src={user.profile_picture} />
                        </div>
                        <div className='search-item-username'>
                          {user.username}
                        </div>
                      </div>
                      {isHistory && (
                        <div className='delete-history-search'>
                          <FontAwesomeIcon
                            icon={faClose}
                            onClick={e => {
                              handleDeleteSearchItem(user);
                              e.stopPropagation();
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {searching && <div className="searching-indicator">Searching…</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchSidebar;
