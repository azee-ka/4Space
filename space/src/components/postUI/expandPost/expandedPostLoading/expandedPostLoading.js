import './expandedPostLoading.css';

import React from 'react';

const ExpandedPostComment = () => {
    return (
        <div className='expanded-post-per-comment'>
            <div className='expanded-post-comments-info'>
                <div className='expanded-post-commenting-user-info'>
                    <div className='expanded-post-commenting-user-profile-picture'>
                        <div className='expanded-post-commenting-user-profile-picture-inner'>
                        </div>
                    </div>
                    <div className='expanded-post-commenting-user-username'>
                        <div className='expanded-post-commenting-user-username-loading-state'>

                        </div>
                        <div className='expanded-post-commenting-user-username-loading-state-2'>

                        </div>
                    </div>
                </div>
            </div>
            <div className='expanded-post-comments-text'>
                <div className='expanded-post-comments-text-inner'>
                </div>
            </div>
        </div>
    );
}

const ExpandedPostLoading = () => {

    return (
        <div className='expanded-post-loading'>
            <div className='expanded-post-overlay-user-info-comments-container'>
                <div className='expanded-post-overlay-user-info-comments-container-inner'>
                    <div className='expanded-post-overlay-user-info'>
                        <div className='expanded-post-overlay-user-info-profile-picture-contatiner'>
                            <div className='expanded-post-overlay-user-info-profile-picture-contatiner-inner'>
                            </div>
                        </div>
                        <div className='expanded-post-overlay-user-info-text-contatiner'>
                            <div className='expanded-post-commenting-user-username'>
                                <div className='expanded-post-commenting-user-username-loading-state'>

                                </div>
                                <div className='expanded-post-commenting-user-username-loading-state-2'>

                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='expanded-post-overlay-comments'>
                        <div className='expanded-post-overlay-comments-innner'>


                            {Array.from({ length: 6 }, (_, index) => (
                                <ExpandedPostComment key={index} />
                            ))}




                        </div>
                    </div>
                    <div className='expanded-post-comment-post-container'>
                        <div className={`expanded-post-comment-post-button`}>

                        </div>
                        <div className='expanded-post-comment-post-container-inner'>

                        </div>
                    </div>
                </div>
            </div>
            <div className='expanded-post-overlay-post-info-img-container'>
                <div className='expanded-post-overlay-post-info-container'>
                    <div className='expanded-post-overlay-post-info-container-inner'>
                        <div className='expanded-post-overlay-post-creation-time'>
                        </div>
                        <div className='expanded-post-overlay-post-info-likes-unlikes-comments-count'>

                        </div>
                    </div>
                </div>
                <div className='expanded-post-overlay-img-container'>
                </div>
            </div>
            <div className='expanded-post-overlay-interaction-container'>

            </div>
        </div>
    );
}

export default ExpandedPostLoading;