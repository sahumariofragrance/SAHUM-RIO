import React from "react";

// Indian national flag (3:2), drawn inline so it looks the same everywhere;
// flag emojis do not render on Windows. Decorative: pair it with text.
const SPOKES = Array.from({ length: 24 }, (_, index) => (index * 360) / 24);

export default function IndiaFlag({ className = "h-3 w-[18px]" }) {
  return (
    <svg viewBox="0 0 900 600" className={className} aria-hidden="true" focusable="false">
      <rect width="900" height="200" fill="#FF9933" />
      <rect y="200" width="900" height="200" fill="#FFFFFF" />
      <rect y="400" width="900" height="200" fill="#138808" />
      <g transform="translate(450 300)" stroke="#000080" fill="none">
        <circle r="70" strokeWidth="12" />
        {SPOKES.map((angle) => (
          <line key={angle} x1="0" y1="0" x2="0" y2="-66" strokeWidth="5" transform={`rotate(${angle})`} />
        ))}
        <circle r="14" fill="#000080" stroke="none" />
      </g>
      <rect width="900" height="600" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="8" />
    </svg>
  );
}
