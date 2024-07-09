import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './searchSidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClose, faSearch } from '@fortawesome/free-solid-svg-icons';
import API_BASE_URL from '../../../../../config';
import GetConfig from '../../../../../general/components/Authentication/utils/config';
import { useAuthState } from '../../../../../general/components/Authentication/utils/AuthProvider';
import ProfilePicture from '../../../../../general/utils/profilePicture/getProfilePicture';

function SearchSidebar({ isOpen }) {
    const { token } = useAuthState();
    const config = GetConfig(token);
    const navigate = useNavigate();

    const [searchInput, setSearchInput] = useState('');
    const [searhQueryResults, setSearchQueryResults] = useState([]);

    const [searchHistory, setSearchHistory] = useState([]);

    const handleGetSearchHistory = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}api/components/search-history/history/`, config);
            console.log(response.data);
            setSearchHistory(response.data);
        } catch (error) {
            console.error('Error', error);
        }
    };

    useEffect(() => {
        handleGetSearchHistory();
    }, []);

    const handleDeleteSearchItem = async (user) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}api/components/search-history/delete/${user.id}/`, config);
            console.log(response.data);
            handleGetSearchHistory();
        } catch (error) {
            console.error('Error', error);
        }
    };


    useEffect(() => {
        setSearchInput('');
        setSearchQueryResults([]);
        if(isOpen) {
            handleGetSearchHistory();
        }
    }, [isOpen])

    const handleInputChange = (e) => {
        const inputValue = e.target.value;
        setSearchInput(inputValue);

        if (inputValue !== "") {
            handleSubmitSearch(inputValue);
        } else {
            setSearchQueryResults([]);
        }
    };

    const handleSubmitSearch = async (searchQuery) => {
        try {
            const response = await axios.get(`${API_BASE_URL}api/components/search/user-search/?query=${searchQuery}`, config);
            console.log(response.data);
            setSearchQueryResults(response.data);
        } catch (error) {
            console.error('Error', error);
        }
    };

    // search-history/

    const handleRedirect = async (user) => {
        console.log('user', user)
        if (searhQueryResults.length !== 0) {
            try {
                const response = await axios.post(`${API_BASE_URL}api/components/search-history/store/${user.id}/`, null, config);
                console.log(response.data);
                navigate(`/timeline/profile/${user.username}`);
            } catch (error) {
                console.error('Error', error);
            }
        } else {
            navigate(`/timeline/profile/${user.searched_user.username}`);
        }
    };


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
                                onChange={(e) => handleInputChange(e)}
                            />
                            <FontAwesomeIcon onClick={() => { setSearchInput(''); setSearchQueryResults([]); }} icon={faClose} />
                        </div>
                    </div>
                    <div className='search-sidebar-results'>
                        <div className='search-sidebar-results-inner'>
                            {(searhQueryResults.length === 0 ? searchHistory : searhQueryResults).map((item, index) => (
                                <div key={index} className='search-per-item' onClick={() => handleRedirect(item)}>
                                    {/* <Link to={`/timeline/profile/${item.username}`}> */}
                                    <div className='search-per-item-inner'>
                                        <div className='search-item-info'>
                                            <div className='search-item-profile-picture'>
                                                <ProfilePicture src={searhQueryResults.length === 0 ? item.searched_user.profile_picture : item.profile_picture} />
                                            </div>
                                            <div className='search-item-username'>
                                                {searhQueryResults.length === 0 ? item.searched_user.username : item.username}
                                            </div>
                                        </div>
                                        {searhQueryResults.length === 0 &&
                                            <div className='delete-history-search'>
                                                <FontAwesomeIcon icon={faClose} onClick={(e) => { handleDeleteSearchItem(item); e.stopPropagation() }} />
                                            </div>
                                        }
                                    </div>
                                    {/* </Link> */}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SearchSidebar;
