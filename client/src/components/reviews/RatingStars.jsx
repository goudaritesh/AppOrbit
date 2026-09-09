import React, { useState } from 'react';
import { Star } from 'lucide-react';

export const RatingStars = ({
  rating = 0,
  onChange = null,
  interactive = false,
  size = 'md',
  showScore = false,
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  const starSize = sizeClasses[size] || sizeClasses.md;
  const currentRating = interactive && hoverRating > 0 ? hoverRating : rating;

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= currentRating;
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange && onChange(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`transition-all duration-150 ${
              interactive ? 'cursor-pointer hover:scale-110 focus:outline-none' : 'cursor-default'
            }`}
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <Star
              className={`${starSize} ${
                isFilled
                  ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                  : 'text-slate-600 fill-slate-800'
              }`}
            />
          </button>
        );
      })}
      {showScore && (
        <span className="ml-1.5 text-sm font-semibold text-slate-200">
          {Number(rating).toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
