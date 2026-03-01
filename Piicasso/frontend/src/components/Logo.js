import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ className }) => {
  return (
    <Link to="/" className={`font-logo uppercase no-underline select-none flex items-baseline ${className}`}>
      <span
        className="text-white font-black tracking-tighter"
        style={{ fontSize: '1.2em' }}
      >
        PII
      </span>
      <span
        className="text-netflix-red font-medium tracking-[0.1em] ml-0.5 opacity-90"
        style={{ fontSize: '0.9em' }}
      >
        CASSO
      </span>
    </Link>
  );
};

export default Logo;
