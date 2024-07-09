// VideoPlayer.js
import React, { useEffect, useRef } from 'react';
import './videoPlayer.css'; // You may create a separate CSS file for styling if needed
import API_BASE_URL from '../../../../config';

const VideoPlayer = ({ mediaFile, onEnded, playable, url }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const handleLoad = () => {
      if (videoRef.current) {
        videoRef.current.addEventListener('ended', onEnded);
      }
    };


    const handleFullscreenChange = () => {
      if (document.fullscreenElement === videoRef.current) {
        // Video is in fullscreen mode, update styles accordingly
        videoRef.current.classList.add('fullscreen-video');
      } else {
        // Video is not in fullscreen mode, remove fullscreen styles
        videoRef.current.classList.remove('fullscreen-video');
      }
    };

    if (playable && videoRef.current) {
      if (videoRef.current.readyState >= 1) {
        // Video is already loaded
        handleLoad();
      } else {
        videoRef.current.addEventListener('loadeddata', handleLoad);
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('ended', onEnded);
        videoRef.current.removeEventListener('loadeddata', handleLoad);
      }
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [mediaFile.key, playable]);

  // const handleFullScreen = () => {
  //   if (videoRef.current && playable) {
  //     if (document.fullscreenElement) {
  //       document.exitFullscreen();
  //     } else {
  //       videoRef.current.requestFullscreen();
  //     }
  //   }
  // };


  return (
  <div className={`video-container${!playable ? '-non-playable' : ''}`}>
        <video
          ref={videoRef}
          controls={playable}
          controlsList="nodownload"
        >
          <source src={`${!url ? API_BASE_URL : ''}${mediaFile.file}`} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {!playable && mediaFile.media_type === 'mp4' && (
          <div className="play-overlay">
            ▶
          </div>
        )}
      </div>
  );
};

export default VideoPlayer;
