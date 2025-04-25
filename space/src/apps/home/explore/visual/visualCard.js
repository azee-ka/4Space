import React, { useState } from 'react';
import VideoPlayer from '../../../../components/videoPlayer/videoPlayer';
import RenderText from '../../../../utils/autoCompleteInput/renderText';

const VisualCard = ({ post }) => {
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

    const renderMediaContent = () => {
        const mediaFile = post?.media_files?.[currentMediaIndex];
        // console.log(mediaFile);
        if (!mediaFile) return null;

        if (mediaFile.media_type === 'video') {
            return <VideoPlayer mediaFile={mediaFile} />;
        } else {
            return <img src={`${mediaFile.file}`} alt={mediaFile.id} />;
        }
    };

  return (
    <div className="post-card visual-card">
      {renderMediaContent()}
      <RenderText text={post.content} />
    </div>
  );
};

export default VisualCard;
