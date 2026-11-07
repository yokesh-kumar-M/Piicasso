import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * CinematicTransition — Provides smooth page transitions between routes.
 * Maintains instantaneous client navigation without flashing blocking loading bars.
 */
const CinematicTransition = ({ children }) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setDisplayLocation(location);
    }
  }, [location, displayLocation.pathname]);

  return (
    <div className="relative flex h-full w-full flex-1 flex-col">
      <div className="flex h-full w-full flex-1 flex-col">{children(displayLocation)}</div>
    </div>
  );
};

export default CinematicTransition;
