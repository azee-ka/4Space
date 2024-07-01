import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './searchSidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
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


    useEffect(() => {
        console.log(searhQueryResults);
    }, [searhQueryResults])

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

    const handleRedirect = (username) => {
        navigate(`/timeline/profile/${username}`);
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
                        </div>
                    </div>
                    <div className='search-sidebar-results'>
                        <div className='search-sidebar-results-inner'>
                            {searhQueryResults.map((item, index) => (
                                <div key={index} className='search-per-item' onClick={() => handleRedirect(item.username)}>
                                    {/* <Link to={`/timeline/profile/${item.username}`}> */}
                                    <div className='search-per-item-inner'>
                                        <div className='search-item-profile-picture'>
                                            <ProfilePicture src={item.profile_picture} />
                                        </div>
                                        <div className='search-item-username'>
                                            {item.username}
                                        </div>
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
