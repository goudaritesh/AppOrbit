import React from 'react';
import { Star } from 'lucide-react';

export const RatingDistribution = ({ distribution = {}, totalRatings = 0 }) => {
  const stars = [5, 4, 3, 2, 1];

  return (
    <div className="flex flex-col space-y-2 w-full max-w-md">
      {stars.map((star) => {
        const count = distribution[star] || 0;
        const percentage = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;

        return (
          <div key={star} className="flex items-center text-xs font-medium text-slate-400">
            <span className="w-4 text-right">{star}</span>
            <Star className="w-3.5 h-3.5 mx-1.5 text-amber-400 fill-amber-400" />
            <div className="flex-1 h-2.5 mx-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="w-10 text-right text-slate-500">{percentage}%</span>
          </div>
        );
      })}
    </div>
  );
};

export default RatingDistribution;
