import React from 'react';

/**
 * Reusable skeleton loading components for better perceived performance (3.3 fix).
 */

const SkeletonPulse = ({ className = '' }) => (
  <div className={`animate-pulse bg-zinc-800 rounded ${className}`} />
);

export const SkeletonCard = () => (
  <div className="bg-[#141414] border border-zinc-800 rounded-lg p-4 space-y-3">
    <SkeletonPulse className="h-4 w-3/4" />
    <SkeletonPulse className="h-3 w-1/2" />
    <SkeletonPulse className="h-3 w-full" />
    <SkeletonPulse className="h-3 w-2/3" />
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-2">
    <div className="flex gap-4 pb-2 border-b border-zinc-800">
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonPulse key={i} className="h-4 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, row) => (
      <div key={row} className="flex gap-4 py-2">
        {Array.from({ length: cols }).map((_, col) => (
          <SkeletonPulse key={col} className="h-3 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonProfile = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-4">
      <SkeletonPulse className="h-16 w-16 rounded-full" />
      <div className="space-y-2 flex-1">
        <SkeletonPulse className="h-5 w-48" />
        <SkeletonPulse className="h-3 w-32" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
);

export const SkeletonDashboard = () => (
  <div className="space-y-6">
    {/* Stats row */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-[#141414] border border-zinc-800 rounded-lg p-4">
          <SkeletonPulse className="h-3 w-20 mb-2" />
          <SkeletonPulse className="h-8 w-16" />
        </div>
      ))}
    </div>
    {/* Content */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
);

export const SkeletonChat = () => (
  <div className="space-y-3 p-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
        <SkeletonPulse className={`h-10 rounded-lg ${i % 2 === 0 ? 'w-2/3' : 'w-1/2'}`} />
      </div>
    ))}
  </div>
);

export default SkeletonPulse;
