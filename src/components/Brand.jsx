// The product's mark (a small original calendar glyph on a rounded square) and the helper behind the user avatar.
// Shared by the calendar's app bar, the sign-in page and the admin console.

// `size` is the width and height in pixels. Decorative: the name is always printed next to it.
function BrandMark({ size = 34 }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="brand-mark-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5b7cff" />
          <stop offset="1" stopColor="#2a43c4" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#brand-mark-fill)" />
      <rect x="7" y="9" width="18" height="16" rx="3" fill="none" stroke="#fff" strokeWidth="1.8" />
      <path d="M7 14h18" stroke="#fff" strokeWidth="1.8" />
      <path d="M12 6.5v4M20 6.5v4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="10.5" y="17" width="3" height="3" rx=".8" fill="#fff" />
      <rect x="15" y="17" width="3" height="3" rx=".8" fill="#fff" opacity=".7" />
      <rect x="19.5" y="17" width="3" height="3" rx=".8" fill="#fff" opacity=".45" />
    </svg>
  );
}

// "Maria Papadopoulou" -> "MP", "alice" -> "AL": the letters shown in a user's avatar.
function initialsOf(name) {
  const parts = String(name || "?").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
  return letters.toUpperCase();
}
