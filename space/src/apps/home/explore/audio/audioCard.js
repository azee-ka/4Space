import React from 'react';

const AudioCard = ({ post }) => {
  return (
    <div className="post-card audio-card">
      <audio controls src={post.audio_file}>
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default AudioCard;
