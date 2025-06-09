// CustomFuturisticIcons.js
import React from 'react';

const glowFilter = (color) => ({ filter: `drop-shadow(0 0 3px ${color}66)` });

export function DashboardIcon({ size = 24, color = '#00f0ff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={glowFilter(color)}>
      {/* Three glowing bars */}
      <rect x="3" y="12" width="3" height="9" fill={color} opacity="0.2" />
      <rect x="10.5" y="8" width="3" height="13" fill={color} opacity="0.2" />
      <rect x="18" y="4" width="3" height="17" fill={color} opacity="0.2" />

      <rect x="3" y="12" width="3" height="9" stroke={color} strokeWidth="1.2" fill="none" />
      <rect x="10.5" y="8" width="3" height="13" stroke={color} strokeWidth="1.2" fill="none" />
      <rect x="18" y="4" width="3" height="17" stroke={color} strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export function TimelineIcon({ size = 24, color = '#00f0ff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={glowFilter(color)}>
      {/* Horizontal line */}
      <line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      {/* Nodes */}
      <circle cx="6" cy="12" r="2" fill={color} />
      <circle cx="12" cy="12" r="2.5" fill={color} opacity="0.8" />
      <circle cx="18" cy="12" r="2" fill={color} />
    </svg>
  );
}

export function ExploreIcon({ size = 24, color = '#00f0ff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={glowFilter(color)}>
      {/* Compass circle */}
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.2" />
      {/* Compass needle */}
      <polygon points="12,4 13.5,12 12,20 10.5,12" fill={color} opacity="0.9" />
      <circle cx="12" cy="12" r="1.5" fill={color} stroke={color} strokeWidth="0.8" />
    </svg>
  );
}

export function MessagesIcon({ size = 24, color = '#00f0ff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={glowFilter(color)}>
      {/* Chat bubble */}
      <path
        d="M4 4h16v12H7l-3 3V4z"
        stroke={color}
        strokeWidth="1.2"
        fill="none"
        strokeLinejoin="round"
      />
      {/* Lines */}
      <line x1="8" y1="8" x2="16" y2="8" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <line x1="8" y1="12" x2="14" y2="12" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function CreateIcon({ size = 24, color = '#00f0ff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={glowFilter(color)}>
      {/* Circle background */}
      <circle cx="12" cy="12" r="10" fill={color} opacity="0.15" />
      {/* Plus */}
      <line x1="12" y1="6" x2="12" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="6" y1="12" x2="18" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ProjectsIcon({ size = 24, color = '#00f0ff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={glowFilter(color)}>
      {/* Three connected hexagons */}
      <polygon
        points="6,4 10,4 12,8 10,12 6,12 4,8"
        stroke={color}
        strokeWidth="1.2"
        fill="none"
      />
      <polygon
        points="14,4 18,4 20,8 18,12 14,12 12,8"
        stroke={color}
        strokeWidth="1.2"
        fill="none"
      />
      <polygon
        points="10,14 14,14 16,18 14,22 10,22 8,18"
        stroke={color}
        strokeWidth="1.2"
        fill="none"
      />
      {/* Connections */}
      <line x1="10" y1="12" x2="12" y2="14" stroke={color} strokeWidth="1" />
      <line x1="14" y1="12" x2="12" y2="14" stroke={color} strokeWidth="1" />
    </svg>
  );
}

export function LibraryIcon({ size = 24, color = '#00f0ff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={glowFilter(color)}>
      {/* Three book spines */}
      <rect x="4" y="4" width="4" height="16" stroke={color} strokeWidth="1.2" fill="none" />
      <rect x="10" y="4" width="4" height="16" stroke={color} strokeWidth="1.2" fill="none" />
      <rect x="16" y="4" width="4" height="16" stroke={color} strokeWidth="1.2" fill="none" />
      {/* Top highlight */}
      <line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

export function RepoIcon({ size = 24, color = '#00f0ff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={glowFilter(color)}>
      {/* Central node */}
      <circle cx="12" cy="12" r="2" fill={color} />
      {/* Branches */}
      <line x1="12" y1="4" x2="12" y2="10" stroke={color} strokeWidth="1.2" />
      <line x1="12" y1="14" x2="12" y2="20" stroke={color} strokeWidth="1.2" />
      <line x1="4" y1="12" x2="10" y2="12" stroke={color} strokeWidth="1.2" />
      <line x1="14" y1="12" x2="20" y2="12" stroke={color} strokeWidth="1.2" />
      {/* End nodes */}
      <circle cx="12" cy="4" r="1.5" fill={color} />
      <circle cx="12" cy="20" r="1.5" fill={color} />
      <circle cx="4" cy="12" r="1.5" fill={color} />
      <circle cx="20" cy="12" r="1.5" fill={color} />
    </svg>
  );
}

export function ToolsIcon({ size = 24, color = '#00f0ff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={glowFilter(color)}>
      {/* Wrench */}
      <path
        d="M5 19l4-4m0 0L5 11m4 4h6m6-6l-4 4m0 0l4 4m-4-4H9"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SettingsIcon({ size = 24, color = '#00f0ff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={glowFilter(color)}>
      {/* Gear */}
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.2" />
      {[...Array(8)].map((_, i) => {
        const angle = (i * 45) * (Math.PI / 180);
        const x1 = 12 + Math.cos(angle) * 5;
        const y1 = 12 + Math.sin(angle) * 5;
        const x2 = 12 + Math.cos(angle) * 7;
        const y2 = 12 + Math.sin(angle) * 7;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth="1"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

export function ProfileIcon({ size = 24, color = '#00f0ff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={glowFilter(color)}>
      {/* Head */}
      <circle cx="12" cy="8" r="3" fill={color} />
      {/* Shoulders */}
      <path
        d="M5 20c0-4 7-6 7-6s7 2 7 6"
        stroke={color}
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SearchIcon({ size = 24, color = '#00f0ff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={glowFilter(color)}>
      {/* Lens */}
      <circle cx="11" cy="11" r="6" stroke={color} strokeWidth="1.2" />
      {/* Handle */}
      <line x1="16" y1="16" x2="21" y2="21" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
