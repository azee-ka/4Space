function WorkspaceIcon({ size = 64, color = "#00f0ff" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 0 6px #00f0ff99)" }}
    >
      {/* Central node with glow */}
      <circle cx="32" cy="32" r="9" fill={color} opacity="0.1" />
      <circle
        cx="32"
        cy="32"
        r="6"
        fill={color}
        stroke="#00f0ffcc"
        strokeWidth="2.5"
        style={{ filter: "drop-shadow(0 0 8px #00f0ffcc)" }}
      />

      {/* Asymmetric futuristic nodes */}
      <circle cx="14" cy="12" r="3" fill={color} />
      <polygon
        points="47,13 52,19 50,27 43,29 39,22 41,15"
        fill={color}
        stroke={color}
        strokeWidth="0.8"
      />
      <circle cx="53" cy="43" r="3.3" fill={color} />
      <circle cx="25" cy="52" r="3" fill={color} />
      <circle cx="13" cy="40" r="2.8" fill={color} />

      {/* Futuristic edges */}
      <polyline points="32,32 22,22 14,12" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <polyline points="32,32 43,24 47,13" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <line x1="32" y1="32" x2="53" y2="43" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
      <line x1="32" y1="32" x2="25" y2="52" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
      <polyline points="32,32 20,36 13,40" stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" />

      {/* Detail dots for depth */}
      <circle cx="24" cy="28" r="0.9" fill={color} opacity="0.6" />
      <circle cx="41" cy="34" r="0.9" fill={color} opacity="0.6" />

      {/* Dynamic subtle curves */}
      <path d="M14 12 Q22 20 32 32" stroke={color} strokeWidth="0.7" opacity="0.4" fill="none" />
      <path d="M47 13 Q48 28 53 43" stroke={color} strokeWidth="0.7" opacity="0.4" fill="none" />
    </svg>
  );
}

export default WorkspaceIcon;
