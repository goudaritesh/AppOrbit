import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import Button from '../ui/Button';

/**
 * Reusable Error Message Component
 *
 * @param {object} props
 * @param {string} [props.title='Something went wrong']
 * @param {string} [props.message='An unexpected error occurred while loading content.']
 * @param {Function} [props.onRetry]
 * @param {string} [props.className='']
 */
export const ErrorMessage = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading content.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl bg-surface-elevated/80 border border-accent-rose/30 p-6 sm:p-8 flex flex-col items-center text-center max-w-md mx-auto shadow-glass ${className}`}
      role="alert"
    >
      <div className="w-12 h-12 rounded-xl bg-accent-rose/10 border border-accent-rose/20 flex items-center justify-center text-accent-rose mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-bold text-content-primary mb-1 font-heading">{title}</h4>
      <p className="text-xs text-content-muted leading-relaxed mb-6">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          icon={<RotateCcw className="w-3.5 h-3.5" />}
          onClick={onRetry}
        >
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorMessage;
