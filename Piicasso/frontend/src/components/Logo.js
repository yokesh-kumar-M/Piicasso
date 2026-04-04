import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ModeContext } from '../context/ModeContext';

const Logo = ({ className }) => {
  const { mode } = useContext(ModeContext);
  const isSecurityMode = mode === 'security';

  return (
    <Link to="/" className={`font-logo uppercase no-underline select-none flex items-baseline ${className}`}>
      <span
        className="font-black tracking-tighter text-white"
        style={{ fontSize: '1.2em' }}
      >
        PII
      </span>
      <span
        className={`font-medium tracking-[0.1em] ml-0.5 transition-colors duration-500 ${isSecurityMode ? 'text-security-red drop-shadow-[0_0_8px_rgba(229,9,20,0.5)]' : 'text-user-cobalt drop-shadow-[0_0_8px_rgba(37,99,235,0.5)]'}`}
        style={{ fontSize: '0.9em' }}
      >
        CASSO
      </span>
    </Link>
  );
};

export default Logo;