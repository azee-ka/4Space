import React from "react";
import ImageWrapper from '../../../../utils/imageWrapper/imageWrapper';
import "./exploreVisualPostCard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLayerGroup } from "@fortawesome/free-solid-svg-icons";

const VisualGridTile = ({ post, onClick }) => (
  <div
    className="visual-grid-tile"
    onClick={onClick}
    tabIndex={0}
    role="button"
    style={{ cursor: "pointer" }}
  >
      <ImageWrapper
        src={post?.thumbnail?.file}
        alt="Visual post"
        className="visual-masonry-img"
        loading="lazy"
      />
    {post.media_files_count > 1 && (
      <span className="visual-multi-stack-icon">
        <FontAwesomeIcon icon={faLayerGroup} className="icon-style" />
      </span>
    )}
  </div>
);

export default VisualGridTile;
