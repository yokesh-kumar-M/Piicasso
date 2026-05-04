import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ModeContext } from '../context/ModeContext';

const Logo = ({ className }) => {
  const { mode } = useContext(ModeContext);
  const isSecurityMode = mode === 'security';

  return (
    <Link
      to="/"
      className={`select-none flex items-baseline ${className}`}
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <span
        className="font-black tracking-tighter text-white"
        style={{ fontSize: '1.2em' }}
      >
        P
      </span>
      <span
        className={`font-black tracking-tighter transition-colors duration-500 ${
          isSecurityMode
            ? 'text-security-red drop-shadow-[0_0_8px_rgba(225,29,72,0.5)]'
            : 'text-user-cobalt drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]'
        }`}
        style={{ fontSize: '1.2em' }}
      >
        II
      </span>
      <span
        className="font-black tracking-tighter text-white"
        style={{ fontSize: '1.2em' }}
      >
        CASSO
      </span>
    </Link>
  );
};

export default Logo;
