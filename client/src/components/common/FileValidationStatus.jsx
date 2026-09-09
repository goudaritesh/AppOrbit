import React from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

/**
 * FileValidationStatus Component
 * Displays visual validation checkpoints for uploaded files
 */
export const FileValidationStatus = ({
  steps = [
    { label: 'File Size Inspection', status: 'valid' },
    { label: 'File Extension Check', status: 'valid' },
    { label: 'MIME Type Verification', status: 'valid' },
    { label: 'Magic Bytes Binary Signature', status: 'valid' },
    { label: 'Cryptographic SHA-256 Hash', status: 'valid' },
  ],
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-2 p-3.5 rounded-xl bg-surface-base border border-white/5 ${className}`}>
      <span className="text-[11px] font-semibold text-content-primary">
        Security & Format Verification Pipeline
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 text-[11px] font-mono text-content-muted"
          >
            {step.status === 'valid' && (
              <CheckCircle2 className="w-3.5 h-3.5 text-accent-emerald flex-shrink-0" />
            )}
            {step.status === 'invalid' && (
              <AlertCircle className="w-3.5 h-3.5 text-accent-rose flex-shrink-0" />
            )}
            {step.status === 'pending' && (
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin flex-shrink-0" />
            )}
            <span>{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileValidationStatus;
