import React from 'react';

const SkeletonLoader = ({ className = '' }) => (
  <div className={`animate-pulse bg-zinc-800 rounded ${className}`} />
);

export const HistorySkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <SkeletonLoader className="w-12 h-12 rounded-full" />
        <div>
          <SkeletonLoader className="h-6 w-40 mb-2" />
          <SkeletonLoader className="h-4 w-56" />
        </div>
      </div>
      <SkeletonLoader className="h-10 w-10 rounded-lg" />
    </div>
    <div className="bg-dark-bg border border-zinc-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-zinc-800">
        <SkeletonLoader className="h-6 w-full" />
      </div>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="p-4 border-b border-zinc-800 flex items-center gap-4">
          <SkeletonLoader className="h-4 w-32" />
          <SkeletonLoader className="h-6 w-20 rounded-full" />
          <SkeletonLoader className="h-4 w-24" />
          <SkeletonLoader className="h-4 w-24" />
          <SkeletonLoader className="h-4 w-16" />
          <SkeletonLoader className="h-4 w-16" />
        </div>
      ))}
    </div>
  </div>
);

export default SkeletonLoader;
