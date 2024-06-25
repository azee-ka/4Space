import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import './albumsPage.css';
import axios from "axios";
import API_BASE_URL from "../../../../general/components/Authentication/utils/apiConfig";
import { useAuthState } from "../../../../general/components/Authentication/utils/AuthProvider";
import GetConfig from "../../../../general/components/Authentication/utils/config";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';

const AlbumsPage = () => {
    const navigate = useNavigate();

    const { token } = useAuthState();
    const config = GetConfig(token);
    const [albums, setAlbums] = useState([]);

    const fetchAlbums = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/apps/photos/get-albums/`, config);
            setAlbums(response.data);
            console.log(response.data);
        } catch (error) {
            console.error('Error fetching photos:', error);
        }
    };

    useEffect(() => {
        fetchAlbums();
    }, []);


    const handleCreateAlbum = async () => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/apps/photos/create-album/`, null, config);
            console.log(response.data);
            navigate(`/photos/album/${response.data.id}`);
        } catch (error) {
            console.error('Error fetching photos:', error);
        }
    };

    const handleButtonsRedirect = (type) => {
        if (type === 'create') {
            handleCreateAlbum();
        } else if (type === 'sort') {
            console.log('sort')
        }
    };

    const handleAlbumClick = (album_uuid) => {
        navigate(`/photos/album/${album_uuid}`);
    }

    const handleClickAlbumMoreMenu = (e) => {
        e.stopPropagation();
    }

    return (
        <div className="albums-page">
            <div className="albums-page-inner">
                <div className="albums-page-header">
                    <div className="albums-page-header-inner">
                        <h2>Albums</h2>
                        <div className="albums-create-btns">
                            <button onClick={() => handleButtonsRedirect('create')}>Create album</button>
                            <button onClick={() => handleButtonsRedirect('sort')}>Sort Albums</button>
                        </div>
                    </div>
                </div>
                <div className="albums-page-content">
                    <div className="albums-page-content-inner">
                        <div className="albums-grid">
                            {albums.map((album, index) => (
                                <div key={index} className="album-item">
                                    <div className="album-item-inner" onClick={() => handleAlbumClick(album.id)} >
                                        <div className="album-cover-photo">
                                            <div className="album-more-menu">
                                                <FontAwesomeIcon icon={faEllipsisV} onClick={(e) => handleClickAlbumMoreMenu(e)}/>
                                            </div>
                                            {album.thumbnail &&
                                                <img src={`${API_BASE_URL}${album.thumbnail}`} />
                                            }
                                        </div>
                                        <div className="album-title">
                                            <p>{album.name.length > 30 ? `${album.name.slice(0, 30)}...` : album.name}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AlbumsPage;