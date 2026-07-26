import React from 'react';

const ringStyle = {
  boxShadow: '0 0 0 2px var(--ink-0), 0 0 0 3px var(--accent-700)',
};

export default function ProfileAvatar({ user, size = 32, onClick }) {
  const style = {
    ...ringStyle,
    cursor: onClick ? 'pointer' : 'default',
  };

  // onClick is optional: this component is used both as a clickable nav
  // avatar (DesignAppShell) and as a purely decorative avatar on the
  // profile page itself. Only apply interactive/keyboard semantics when
  // there's actually a handler to trigger.
  const handleKeyDown = onClick
    ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e);
        }
      }
    : undefined;

  if (user?.profile_picture) {
    const img = (
      <img
        src={user.profile_picture}
        alt="Profile"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          display: 'block',
          ...style,
        }}
      />
    );

    // <img> is a fundamentally non-interactive element per jsx-a11y — the
    // accessible pattern is to wrap it in a real <button>, not attach
    // click/key handlers to the image itself. Reset the button to zero
    // default chrome so it stays visually identical to the bare <img>.
    if (!onClick) return img;

    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          padding: 0,
          border: 'none',
          background: 'transparent',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'block',
          lineHeight: 0,
        }}
      >
        {img}
      </button>
    );
  }

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : '?';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--accent-500)',
        color: 'var(--ink-0)',
        display: 'grid',
        placeItems: 'center',
        fontSize: Math.round(size * 0.38),
        fontWeight: 700,
        letterSpacing: '0.02em',
        fontFamily: 'var(--font-mono)',
        ...style,
      }}
    >
      {initials}
    </div>
  );
}
