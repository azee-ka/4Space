// CustomIcons.js
import React from "react";

// Neon‐cyan & green palettes (balanced mix)
const DARK_PALETTE = {
  color:  "#00CFFF",            // medium cyan
  accent: "#00E5A3",            // soft green
  glow:   "#00E5A3",
  icon:   "#00CFFF",
  gray:   "#23272e",
  text:   "#ffffff",
  bubble: "rgba(0,207,255,0.1)",
};
const LIGHT_PALETTE = {
  color:  "#3399FF",
  accent: "#33CC99",
  glow:   "#33CC99",
  icon:   "#0070c0",
  gray:   "#23272e",
  text:   "#23272e",
  bubble: "rgba(51,153,255,0.1)",
};
const getPalette = (mode) => (mode === "light" ? LIGHT_PALETTE : DARK_PALETTE);

const glowFilter = (color, mode) =>
  mode === "light" ? {} : { filter: `drop-shadow(0 0 8px ${color}33)` };

// ========== ICONS ==========

// TIMELINE
export function TimelineIcon({ size = 36, color, accent, mode = "dark" }) {
  const palette = getPalette(mode);
  color = color || palette.color;
  accent = accent || palette.accent;

  const pts = [
    [12, 48],
    [24, 32],
    [36, 48],
    [52, 40],
  ];

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="tlGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={accent} />
        </linearGradient>
      </defs>
      <path
        d={pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ")}
        stroke="url(#tlGrad)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        style={glowFilter(accent, mode)}
      />
      {pts.map(([cx, cy], i) => (
        <g key={i}>
          <circle
            cx={cx}
            cy={cy}
            r="7"
            fill="none"
            stroke={accent}
            strokeWidth="1.5"
            opacity="0.3"
            style={glowFilter(accent, mode)}
          />
          <circle
            cx={cx}
            cy={cy}
            r="4"
            fill={i === 0 ? color : accent}
            stroke={palette.text}
            strokeWidth="1"
          />
        </g>
      ))}
    </svg>
  );
}

// MESSAGES
export function MessagesIcon({ size = 36, color, accent, mode = "dark" }) {
  const palette = getPalette(mode);
  color = color || palette.color;
  accent = accent || palette.accent;

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="msgGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.text} stopOpacity="0.13" />
          <stop offset="100%" stopColor={palette.text} stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="msgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={accent} />
        </linearGradient>
      </defs>

      <g style={glowFilter(accent, mode)} transform="translate(0 -5)">
        {/* Bubble background with glow */}
        <path
          d="M 18 16 h 28 a 18 18 0 0 1 9 9 v 25 a 12 12 0 0 1 -9 9 h -14 l -8 2 v -7 h -8 a 22 22 0 0 1 -9 -9 v -20 a 11 11 0 0 1 9 -9 z"
          fill="url(#msgGlass)"
          stroke="url(#msgGrad)"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Inner wave path */}
        <path
          d="M22 36 Q28 42 34 36 Q40 30 46 36"
          stroke="url(#msgGrad)"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}



// WORKSPACE
export function WorkspaceIcon({ size = 36, color, accent, mode = "dark" }) {
  const palette = getPalette(mode);
  const base = color  || palette.color;   // cyan
  const acc  = accent || palette.accent;  // green

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      style={glowFilter(acc, mode)}
    >
      <defs>
        <linearGradient id="wsGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={base} />
          <stop offset="100%" stopColor={acc} />
        </linearGradient>
      </defs>

      {/* Background circle with gradient */}
      <circle cx="32" cy="32" r="9" fill="url(#wsGrad)" opacity="0.1" />

      {/* Central circle */}
      <circle
        cx="32"
        cy="32"
        r="6"
        fill={base}
        stroke={acc}
        strokeWidth="2.5"
        style={glowFilter(acc, mode)}
      />

      {/* Node circles */}
      <circle cx="14" cy="12" r="3"   fill={acc} stroke={base} strokeWidth="1" />
      <circle cx="53" cy="43" r="3.3" fill={acc} stroke={base} strokeWidth="1" />
      <circle cx="25" cy="52" r="3"   fill={acc} stroke={base} strokeWidth="1" />
      <circle cx="13" cy="40" r="2.8" fill={acc} stroke={base} strokeWidth="1" />

      {/* Polygon accent shape */}
      <polygon
        points="47,13 52,19 50,27 43,29 39,22 41,15"
        fill="url(#wsGrad)"
        stroke={acc}
        strokeWidth="0.8"
      />

      {/* Connecting lines */}
      <polyline
        points="32,32 22,22 14,12"
        stroke="url(#wsGrad)"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
      <polyline
        points="32,32 43,24 47,13"
        stroke="url(#wsGrad)"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
      <line
        x1="32" y1="32" x2="53" y2="43"
        stroke="url(#wsGrad)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <line
        x1="32" y1="32" x2="25" y2="52"
        stroke="url(#wsGrad)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <polyline
        points="32,32 20,36 13,40"
        stroke="url(#wsGrad)"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />

      {/* Tiny accent dots */}
      <circle cx="24" cy="28" r="0.9" fill={acc} opacity="0.6" />
      <circle cx="41" cy="34" r="0.9" fill={acc} opacity="0.6" />

      {/* Decorative curves */}
      <path
        d="M14 12 Q22 20 32 32"
        stroke="url(#wsGrad)"
        strokeWidth="0.7"
        opacity="0.4"
        fill="none"
      />
      <path
        d="M47 13 Q48 28 53 43"
        stroke="url(#wsGrad)"
        strokeWidth="0.7"
        opacity="0.4"
        fill="none"
      />
    </svg>
  );
}

// DASHBOARD
export function DashboardIcon({ size = 36, color, mode = "dark" }) {
  const palette = getPalette(mode);
  color = color || palette.icon;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      style={glowFilter(color, mode)}
    >
      <defs>
        <linearGradient id="dbFrameF" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={mode === "light" ? "#e6f6fa" : "#001F3F"} />
          <stop offset="100%" stopColor={mode === "light" ? "#baeaf4" : "rgba(0, 83, 87, 0.87)"} />
        </linearGradient>
      </defs>
      <polygon
        points="32,6 58,18 58,46 32,58 6,46 6,18"
        fill="url(#dbFrameF)"
        stroke={color}
        strokeWidth="2"
      />
      <g opacity="0.85">
        <path
          d="M16 44 L28 30 L40 36 L48 20"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          style={glowFilter(color, mode)}
        />
        {[16, 28, 40, 48].map((cx, i) => (
          <circle
            key={i}
            cx={cx}
            cy={[44, 30, 36, 20][i]}
            r="2.5"
            fill={color}
            style={glowFilter(color, mode)}
          />
        ))}
      </g>
    </svg>
  );
}

// EXPLORE
export function ExploreIcon({ size = 36, color, mode = "dark" }) {
  const palette = getPalette(mode);
  color = color || palette.icon;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      style={glowFilter(color, mode)}
    >
      <defs>
        <linearGradient id="expGradF" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={mode === "light" ? "#f0f6ff" : "#001133"} />
          <stop offset="100%" stopColor={mode === "light" ? "#e4f7fe" : "#001bcc"} />
        </linearGradient>
      </defs>
      <circle
        cx="32"
        cy="32"
        r="14"
        fill="none"
        stroke="url(#expGradF)"
        strokeWidth="3"
      />
      <polygon points="32,10 36,30 32,26 28,30" fill={color} />
      <polygon points="54,32 34,28 30,32 34,36" fill={color} />
      <polygon points="32,54 28,34 32,38 36,34" fill={color} />
      <polygon points="10,32 30,36 34,32 30,28" fill={color} />
      <circle
        cx="32"
        cy="32"
        r="5"
        fill={color}
        style={glowFilter(color, mode)}
      />
    </svg>
  );
}

// SEARCH
export function SearchIcon({ size = 36, color, mode = "dark" }) {
  const palette = getPalette(mode);
  color = color || palette.icon;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none"
         style={glowFilter(color, mode)}>
      <defs>
        <linearGradient id="srchGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color}/>
          <stop offset="100%" stopColor={palette.accent}/>
        </linearGradient>
      </defs>
      <circle cx="28" cy="28" r="18" stroke="url(#srchGrad)" strokeWidth="3"/>
      <line x1="42" y1="42" x2="56" y2="56" stroke="url(#srchGrad)" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="34" cy="22" r="3" fill={palette.accent} />
    </svg>
  );
}

// CREATE
export function CreateIcon({ size = 36, color, mode = "dark" }) {
  const palette = getPalette(mode);
  color = color || palette.icon;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none"
         style={glowFilter(color, mode)}>
      <defs>
        <linearGradient id="crtGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color}/>
          <stop offset="100%" stopColor={palette.accent}/>
        </linearGradient>
      </defs>
      <polygon points="16,50 22,56 54,24 48,18" fill="url(#crtGrad)"/>
      <rect x="12" y="12" width="8" height="28" fill={palette.bubble} stroke={palette.accent} strokeWidth="2"/>
      {[14,18,22,26,30,34].map((y, i) => (
        <line key={i} x1="12" y1={y} x2="20" y2={y} stroke={palette.accent} strokeWidth="1"/>
      ))}
    </svg>
  );
}

// PROJECTS
export function ProjectsIcon({ size = 36, color, mode = "dark" }) {
  const palette = getPalette(mode);
  color = color || palette.icon;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none"
         style={glowFilter(color, mode)}>
      <defs>
        <linearGradient id="prjBgF" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.color}/>
          <stop offset="100%" stopColor={palette.accent}/>
        </linearGradient>
      </defs>
      <rect
        x="12"
        y="28"
        width="16"
        height="10"
        rx="2"
        fill="url(#prjBgF)"
        stroke={color}
        strokeWidth="2"
      />
      <rect
        x="36"
        y="18"
        width="16"
        height="10"
        rx="2"
        fill="url(#prjBgF)"
        stroke={color}
        strokeWidth="2"
      />
      <rect
        x="20"
        y="42"
        width="24"
        height="12"
        rx="2"
        fill="url(#prjBgF)"
        stroke={color}
        strokeWidth="2"
      />
      <line x1="20" y1="28" x2="20" y2="18" stroke={color} strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2"/>
      <line x1="44" y1="28" x2="44" y2="18" stroke={color} strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2"/>
      <polyline points="20,42 20,38 44,38" stroke={color} strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2"/>
    </svg>
  );
}

// LIBRARY
export function LibraryIcon({ size = 36, color, mode = "dark" }) {
  const palette = getPalette(mode);
  color = color || palette.icon;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      style={glowFilter(color, mode)}
    >
      <defs>
        <linearGradient id="lib1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.accent} />
          <stop offset="100%" stopColor={palette.color} />
        </linearGradient>
        <linearGradient id="lib2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={palette.glow} />
        </linearGradient>
        <linearGradient id="lib3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.color} />
          <stop offset="100%" stopColor={palette.bubble} />
        </linearGradient>
      </defs>
      <g>
        <rect x="12" y="16" width="8" height="32" rx="1" fill="url(#lib1)" />
        <path d="M12,16 h8 l-3,6 h-2 z" fill="rgba(255,255,255,0.16)" />
      </g>
      <g>
        <rect x="28" y="14" width="8" height="34" rx="1" fill="url(#lib2)" />
        <path d="M28,14 h8 l-3,6 h-2 z" fill="rgba(255,255,255,0.13)" />
      </g>
      <g>
        <rect x="44" y="18" width="8" height="30" rx="1" fill="url(#lib3)" />
        <path d="M44,18 h8 l-3,6 h-2 z" fill="rgba(255,255,255,0.13)" />
      </g>
      <line
        x1="12"
        y1="22"
        x2="52"
        y2="22"
        stroke="#FFF"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// REPO
export function RepoIcon({ size = 36, color, mode = "dark" }) {
  const palette = getPalette(mode);
  color = color || palette.icon;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none"
         style={glowFilter(color, mode)}>
      <defs>
        <linearGradient id="rpGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color}/>
          <stop offset="100%" stopColor={palette.accent}/>
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="6" fill="url(#rpGrad)"/>
      <line x1="32" y1="8" x2="32" y2="26" stroke="url(#rpGrad)" strokeWidth="3"/>
      <line x1="32" y1="38" x2="32" y2="56" stroke="url(#rpGrad)" strokeWidth="3"/>
      <line x1="8" y1="32" x2="26" y2="32" stroke="url(#rpGrad)" strokeWidth="3"/>
      <line x1="38" y1="32" x2="56" y2="32" stroke="url(#rpGrad)" strokeWidth="3"/>
      <circle cx="32" cy="8" r="4" fill="url(#rpGrad)"/>
      <circle cx="32" cy="56" r="4" fill="url(#rpGrad)"/>
      <circle cx="8" cy="32" r="4" fill="url(#rpGrad)"/>
      <circle cx="56" cy="32" r="4" fill="url(#rpGrad)"/>
    </svg>
  );
}

// TOOLS
export function ToolsIcon({ size = 36, color, mode = "dark" }) {
  const palette = getPalette(mode);
  color = color || palette.icon;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none"
         style={glowFilter(color, mode)}>
      <defs>
        <linearGradient id="toolsGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color}/>
          <stop offset="100%" stopColor={palette.accent}/>
        </linearGradient>
      </defs>
      <path d="M18 48l12-12m0 0L18 24" stroke="url(#toolsGrad)" strokeWidth="4" strokeLinecap="round"/>
      <path d="M30 36h16" stroke="url(#toolsGrad)" strokeWidth="4" strokeLinecap="round"/>
      <rect x="44" y="38" width="4" height="16" fill="url(#toolsGrad)"/>
      <polygon points="44,38 40,34 48,34 44,38" fill={palette.accent}/>
    </svg>
  );
}

// SETTINGS
export function SettingsIcon({ size = 36, color, mode = "dark" }) {
  const palette = getPalette(mode);
  color = color || palette.icon;
  const teeth = [...Array(8)].map((_, i) => {
    const angle = (i * 45) * (Math.PI / 180);
    const x1 = 32 + Math.cos(angle) * 18;
    const y1 = 32 + Math.sin(angle) * 18;
    const x2 = 32 + Math.cos(angle) * 24;
    const y2 = 32 + Math.sin(angle) * 24;
    return (
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="url(#stGrad)" strokeWidth="2" strokeLinecap="round"/>
    );
  });
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none"
         style={glowFilter(color, mode)}>
      <defs>
        <linearGradient id="stGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color}/>
          <stop offset="100%" stopColor={palette.accent}/>
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="8" fill="none" stroke="url(#stGrad)" strokeWidth="3"/>
      {teeth}
    </svg>
  );
}

// PROFILE
export function ProfileIcon({ size = 36, color, mode = "dark" }) {
  const palette = getPalette(mode);
  color = color || palette.icon;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none"
         style={glowFilter(color, mode)}>
      <defs>
        <linearGradient id="pfGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color}/>
          <stop offset="100%" stopColor={palette.accent}/>
        </linearGradient>
      </defs>
      <circle cx="32" cy="20" r="8" fill="url(#pfGrad)"/>
      <path d="M12 56c0-12 20-16 20-16s20 4 20 16"
            stroke="url(#pfGrad)" strokeWidth="3" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

// ======= Extra icons (SunIcon, MoonIcon, etc) =======
export const SunIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffc045" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" fill={filled ? "#ffc045" : "none"} />
    <g stroke="#ffc045">
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </g>
  </svg>
);

export const MoonIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#92caff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79z" fill={filled ? "#92caff" : "none"} />
  </svg>
);

export const SystemIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#83ecff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" fill={"none"} />
    <line x1="2" y1="11" x2="22" y2="11" />
    <line x1="12" y1="17" x2="12" y2="17" />
  </svg>
);


// CHAT BUBBLE
export const ChatIcon = ({ style = {}, color, mode = null, ...props }) => {
    let resolvedColor = color;
    if (!resolvedColor && mode === 'dark') resolvedColor = '#fff';
    if (!resolvedColor && mode === 'light') resolvedColor = '#23272e';
    return (
        <svg
            {...props}
            className="chat-icon"
            style={{ color: resolvedColor, ...style }}
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="none"
        >
            <path
                d="M2.25 12c0 4.556 4.682 8.25 9.75 8.25 1.038 0 2.064-.126 3.03-.373a1.125 1.125 0 0 1 .642.04l3.283 1.19a.563.563 0 0 0 .748-.715l-.913-3.166A1.125 1.125 0 0 1 19.5 15c.995-1.387 1.5-2.927 1.5-4.5C21 6.548 16.418 2.25 12 2.25S2.25 6.548 2.25 12z"
                fill="currentColor"
            />
            <circle cx="8.5" cy="12" r="1" fill="#fff" />
            <circle cx="12" cy="12" r="1" fill="#fff" />
            <circle cx="15.5" cy="12" r="1" fill="#fff" />
        </svg>
    );
};






// NOTIFICATION
export function NotificationsIcon({ size = 36, color, accent, mode = "dark" }) {
  const palette = getPalette(mode);
  color = color || palette.icon;
  accent = accent || palette.accent;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      style={glowFilter(accent, mode)}
    >
      <defs>
        <linearGradient id="notifGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={accent} />
        </linearGradient>
      </defs>
      {/* Bell Body */}
      <g transform="scale(1.25) translate(-3.5 -4.4)">
  <path
    d="M28 6c-11 0-14.5 10-14.5 20v9c0 4.5-3 9-5.5 10h41c-2.5-1-5.5-5.5-5.5-10v-9c0-10-3.5-20-15.5-20z"
    fill="url(#notifGrad)"
    stroke={accent}
    strokeWidth="2"
    style={glowFilter(accent, mode)}
  />
</g>

      {/* Clapper */}
      <circle
        cx="32"
        cy="60"
        r="4"
        fill={accent}
        stroke={palette.text}
        strokeWidth="1"
        style={glowFilter(accent, mode)}
      />
    </svg>
  );
}






export function NineDotIcon({ size = 36, color, accent, mode = "dark" }) {
  const palette = getPalette(mode);
  color = color || palette.icon;
  accent = accent || palette.accent;

  const positions = [16, 32, 48];

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <g transform="scale(1.45) translate(-10.5 -10.5)">
        {positions.map((cx, i) =>
          positions.map((cy, j) => (
            <circle
              key={`${i}-${j}`}
              cx={cx}
              cy={cy}
              r="4.5"
              fill={color}
              stroke={accent}
              strokeWidth="1.2"
              style={glowFilter(accent, mode)}
            />
          ))
        )}
      </g>
    </svg>
  );
}





export function ControlCenterIcon({ size = 36, color, accent, mode = "dark" }) {
  const palette = getPalette(mode);
  color = color || palette.icon;
  accent = accent || palette.accent;

  const trackColor = mode === "light" ? "#444" : "#ddd";

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <g transform="scale(1.2) translate(-6 -6)">
        {/* Slider Tracks */}
        {[16, 32, 48].map((x, i) => (
          <line
            key={`track-${i}`}
            x1={x}
            y1={8}
            x2={x}
            y2={56}
            stroke={trackColor}
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.85"
          />
        ))}

        {/* Slider Handles */}
        <circle
          cx="16"
          cy="22"
          r="6"
          fill={color}
          stroke={accent}
          strokeWidth="1.5"
          style={glowFilter(accent, mode)}
        />
        <circle
          cx="32"
          cy="36"
          r="6"
          fill={color}
          stroke={accent}
          strokeWidth="1.5"
          style={glowFilter(accent, mode)}
        />
        <circle
          cx="48"
          cy="28"
          r="6"
          fill={color}
          stroke={accent}
          strokeWidth="1.5"
          style={glowFilter(accent, mode)}
        />
      </g>
    </svg>
  );
}


