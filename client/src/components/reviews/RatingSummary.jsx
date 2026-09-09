import React from 'react';
import RatingStars from './RatingStars';

export const RatingSummary = ({ averageRating = 0, ratingCount = 0 }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
      <div className="text-5xl font-black text-white tracking-tight">
        {Number(averageRating).toFixed(1)}
      </div>
      <div className="mt-2">
        <RatingStars rating={Math.round(averageRating)} size="lg" />
      </div>
      <div className="mt-2 text-sm text-slate-400 font-medium">
        {ratingCount.toLocaleString()} {ratingCount === 1 ? 'verified rating' : 'verified ratings'}
      </div>
    </div>
  );
};

export default RatingSummary;
