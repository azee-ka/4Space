import React from "react";
import ImageWrapper from '../../../../utils/imageWrapper/imageWrapper';
import "./visualPostsGrid.css";

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
  </div>
);

export default VisualGridTile;
