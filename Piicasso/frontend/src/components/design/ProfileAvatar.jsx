import React from 'react';

const ringStyle = {
  boxShadow: '0 0 0 2px var(--ink-0), 0 0 0 3px var(--accent-700)',
};

export default function ProfileAvatar({ user, size = 32, onClick }) {
  const style = {
    ...ringStyle,
    cursor: onClick ? 'pointer' : 'default',
  };

  if (user?.profile_picture) {
    return (
      <img
        src={user.profile_picture}
        alt="Profile"
        onClick={onClick}
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
  }

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '?';

  return (
    <div
      onClick={onClick}
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
