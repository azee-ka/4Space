import React, { useRef, useState, useEffect } from 'react';
import { FaPlay, FaPause, FaForward, FaBackward, FaEllipsisV, FaVolumeUp, FaVolumeMute, FaRedo, FaCheck, FaExpand, FaCompress, FaVideo, FaViadeoSquare, FaVideoSlash, FaFileVideo } from 'react-icons/fa';
import './videoPlayer.css';

const VideoPlayer = ({ mediaFile, playable, videoQualities, subtitles, audioTracks }) => {
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [loop, setLoop] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // const [selectedAudioTrack, setSelectedAudioTrack] = useState(audioTracks[0]);
  const [subtitlesVisible, setSubtitlesVisible] = useState(false);
  // const [currentNetworkQuality, setCurrentNetworkQuality] = useState(null);
  // const [selectedQuality, setSelectedQuality] = useState(videoQualities ? videoQualities[0]?.url : mediaFile);

  //   const getNetworkSpeed = () => {
  //     if (navigator.connection && navigator.connection.downlink) {
  //         return navigator.connection.downlink;
  //     }
  //     return null; // Or use a fallback value like `undefined` or a default value (e.g., 2Mbps)
  // };

  // // Use the `getNetworkSpeed` function wherever needed, for example:
  // const networkSpeed = getNetworkSpeed();

  // const getVideoQualityByNetwork = () => {
  //   const speed = networkSpeed;  // Mbps
  //   if (speed > 5) return videoQualities.find(q => q.quality === '1080p')?.url;
  //   if (speed > 2) return videoQualities.find(q => q.quality === '720p')?.url;
  //   if (speed > 1) return videoQualities.find(q => q.quality === '360p')?.url;
  //   return videoQualities.find(q => q.quality === '144p')?.url;
  // };

  // useEffect(() => {
  //   const qualityBasedOnNetwork = getVideoQualityByNetwork();
  //   setCurrentNetworkQuality(qualityBasedOnNetwork);
  // }, [navigator.connection.downlink]);

  // useEffect(() => {
  //   const videoElement = videoRef.current;
  //   if (videoElement && currentNetworkQuality) {
  //     videoElement.src = currentNetworkQuality;
  //     videoElement.load();
  //   }
  // }, [currentNetworkQuality]);

  // const handleQualityChange = (newQuality) => {
  //   setSelectedQuality(newQuality);
  //   const video = videoRef.current;
  //   video.src = newQuality;
  //   video.load();
  // };


  

  useEffect(() => {
    const updateProgress = () => {
      const video = videoRef.current;
      if (video) {
        const progressPercentage = (video.currentTime / video.duration) * 100;
        setProgress(progressPercentage);
      }
    };

    const handlePlay = () => {
      setResetting(false);
      const intervalId = setInterval(updateProgress, 50);

      const handleEnded = () => {
        clearInterval(intervalId);
        setIsPlaying(false);
        setResetting(true);
        setProgress(0);
      };

      const handleSeeked = () => {
        if (videoRef.current && videoRef.current.currentTime === 0) {
          setProgress(0);
          setResetting(true);
        }
      };

      const video = videoRef.current;
      video.addEventListener('ended', handleEnded);
      video.addEventListener('seeked', handleSeeked);

      return () => {
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('seeked', handleSeeked);
        clearInterval(intervalId);
      };
    };

    if(mediaFile.media_type === 'video' || typeof(mediaFile) === 'string') {
      const video = videoRef?.current;
    video.addEventListener('play', handlePlay);

    if (video) {
      video.loop = loop;
    }

    return () => {
      video.removeEventListener('play', handlePlay);
    };
  }
  }, [loop]);
  

  const togglePlay = () => {
    const video = videoRef?.current;
    if (video?.paused) {
      video?.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleLoop = () => {
    const newLoopState = !loop;
    setLoop(newLoopState);
  };

  const toggleFullscreen = () => {
    const videoContainer = videoRef.current?.parentElement;
    if (!document.fullscreenElement) {
      videoContainer.requestFullscreen().catch((err) => console.log(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleMoreMenu = () => {
    setShowVolumeSlider(false);
    setShowMoreMenu(!showMoreMenu);
  };

  const skip = (time) => {
    const video = videoRef.current;
    video.currentTime += time;
  };

  const handleVolumeChange = (event) => {
    const video = videoRef.current;
    const newVolume = event.target.value;
    video.volume = newVolume;
    setVolume(newVolume);
  };

  const handleSpeedChange = (event) => {
    const video = videoRef.current;
    const newSpeed = event.target.value;
    video.playbackRate = newSpeed;
    setSpeed(newSpeed);
  };


  const handleAudioTrackChange = (newTrack) => {
    // setSelectedAudioTrack(newTrack);
    // Implement logic for switching audio tracks
  };

  const toggleSubtitles = () => {
    setSubtitlesVisible(!subtitlesVisible);
    // Implement subtitle toggle logic here, based on the selected subtitle file
  };

  // Handle progress bar click to jump to time
  const handleProgressBarClick = (e) => {
    const progressBar = progressBarRef.current;
    const video = videoRef.current;
    const progressBarWidth = progressBar.offsetWidth;
    const clickX = e.nativeEvent.offsetX;
    const newProgress = (clickX / progressBarWidth) * 100;
    setProgress(newProgress);
    video.currentTime = (newProgress / 100) * video.duration;
  };

  // Handle dragging start (mouse down)
  const handleDragStart = (e) => {
    setIsDragging(true);
    const progressBar = progressBarRef.current;
    const video = videoRef.current;
    const progressBarWidth = progressBar.offsetWidth;
    const clickX = e.nativeEvent.offsetX;
    const newProgress = (clickX / progressBarWidth) * 100;
    setProgress(newProgress);
    video.currentTime = (newProgress / 100) * video.duration;
  };

  // Handle dragging movement (mouse move)
  const handleDragMove = (e) => {
    if (isDragging) {
      const progressBar = progressBarRef.current;
      const video = videoRef.current;
      const progressBarWidth = progressBar.offsetWidth;
      const moveX = e.clientX - progressBar.getBoundingClientRect().left;
      const newProgress = Math.min(Math.max((moveX / progressBarWidth) * 100, 0), 100);
      setProgress(newProgress);
      video.currentTime = (newProgress / 100) * video.duration;
    }
  };

  // Handle drag end (mouse up)
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e) => {
        handleDragMove(e); // Update progress based on mouse move
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleDragEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging]);

  console.log(mediaFile);
  
  return (mediaFile?.media_type === 'video' || typeof(mediaFile) === 'string') ? (
    <div
      className={`video-player-container ${resetting ? 'resetting' : ''}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={(e) => {
        setShowVolumeSlider(false);
        setShowMoreMenu(false);
        togglePlay();
      }}
    >
      {!isPlaying && (
        <div className="center-play-button">
          <FaPlay />
        </div>
      )}
      <video ref={videoRef} src={mediaFile.file ? mediaFile.file : mediaFile} className="video-element" />
      <div
        ref={progressBarRef}
        className="progress-bar"
        style={{ width: `${progress}%`, bottom: hovering ? '40px' : '0px' }}
        onClick={(e) => {
          e.stopPropagation();
          handleProgressBarClick(e);
        }}
        onMouseDown={handleDragStart}
      ></div>
      <div className={`controls-container ${hovering ? 'hover' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="control-buttons">
          <div className="left-controls">
            <button onClick={togglePlay}>
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <button onClick={() => skip(-5)}>
              <FaBackward />
            </button>
            <button onClick={() => skip(5)}>
              <FaForward />
            </button>
          </div>
          <div className="right-controls">
            <div className={`more-menu ${showMoreMenu ? 'show' : ''}`}>
              <div className="menu-item">
                <label>Speed</label>
                <select value={speed} onChange={handleSpeedChange}>
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              </div>
              <div className="menu-item">
                <button onClick={toggleLoop} className={loop ? 'active' : ''}>
                  {loop ? <FaCheck /> : ''} Loop Video
                </button>
              </div>
              {/* <div className="menu-item">
            <label>Quality</label>
            <select value={selectedQuality} onChange={(e) => handleQualityChange(e.target.value)}>
              {videoQualities.map((quality, index) => (
                <option key={index} value={quality.url}>{quality.quality}</option>
              ))}
            </select>
          </div> */}
              <div className="menu-item">
                <label>Skip Frames</label>
                <button onClick={() => {
                  const video = videoRef.current;
                  video.currentTime += 10 / video.frameRate; // Skip 10 frames ahead
                }}>+10 Frames</button>
              </div>

              <div className="menu-item">
                <label>Subtitles</label>
                <button onClick={() => {
                  const video = videoRef.current;
                  if (video.textTracks.length > 0) {
                    const track = video.textTracks[0]; // Assuming first track is subtitles
                    track.mode = track.mode === 'showing' ? 'hidden' : 'showing';
                  }
                }}>Toggle Subtitles</button>
              </div>

              <div className="menu-item">
                <label>Picture-in-Picture</label>
                <button onClick={() => {
                  const video = videoRef.current;
                  if (document.pictureInPictureEnabled && video !== document.pictureInPictureElement) {
                    video.requestPictureInPicture();
                  }
                }}>Enable PiP</button>
              </div>

              <div className="menu-item">
                <label>Filters</label>
                <button onClick={() => {
                  const video = videoRef.current;
                  video.style.filter = video.style.filter === 'sepia(100%)' ? '' : 'sepia(100%)';
                }}>Sepia Filter</button>
              </div>

              <div className="volume-container">
                <button onClick={() => {
                  setShowVolumeSlider(!showVolumeSlider);
                  setShowMoreMenu(false);
                }}>
                  {volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
                </button>
              </div>
              <button onClick={toggleFullscreen}>
                {isFullscreen ? <FaCompress /> : <FaExpand />}
              </button>
              <button onClick={toggleMoreMenu}>
                <FaEllipsisV />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Volume Slider Container */}
      {hovering &&
        <div
          className={`volume-slider-container ${showVolumeSlider ? 'visible' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-slider"
          />
        </div>
      }
    </div>
  ) : (
    <div>
      Error
    </div>
  )
};

export default VideoPlayer;
