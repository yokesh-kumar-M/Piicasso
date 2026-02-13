import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ className }) => {
  return (
    <Link to="/" className={`font-logo uppercase no-underline select-none ${className}`}>
      <span className="text-white">PII</span>
      <span className="text-netflix-red">CASSO</span>
    </Link>
  );
};

export default Logo;
