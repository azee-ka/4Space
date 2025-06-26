// ConnectorOverlay.jsx
import React from 'react';

export default function ConnectorOverlay({ connectors }) {
  // Full-cover SVG overlay inside .ed-comments-tree
  return (
    <svg
      className="connector-overlay"
      width="100%"
      height="100%"
    >
      {connectors.map(({ x1, y1, x2, y2 }, i) => {
        // elbow radius in px
        const elbow = 8;
        // determine direction for horizontal branch
        const dir = x2 - x1 < 0 ? -1 : 1;
        const cx = x1 + dir * elbow;
        const cy = y1 + elbow;
        const path = [
          `M ${x1},${y1}`,                                  // start at parent bottom-left
          `L ${x1},${cy}`,                                  // down to elbow start
          `Q ${x1},${cy + elbow} ${cx},${cy + elbow}`,     // rounded corner
          `L ${cx},${y2}`,                                  // down to child top
          `L ${x2},${y2}`                                   // horizontal into child
        ].join(' ');
        return (
          <path
            key={i}
            d={path}
            fill="none"
            stroke="var(--ed-line)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}
