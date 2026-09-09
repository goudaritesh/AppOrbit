import React from 'react';
import Badge from '../ui/Badge';

const STATUS_MAP = {
  DRAFT: { label: 'Draft', variant: 'neutral' },
  PENDING_REVIEW: { label: 'Pending Review', variant: 'warning' },
  APPROVED: { label: 'Approved', variant: 'info' },
  PUBLISHED: { label: 'Published', variant: 'published' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
  SUSPENDED: { label: 'Suspended', variant: 'destructive' },
  ARCHIVED: { label: 'Archived', variant: 'neutral' },
};

export const ApplicationStatusBadge = ({ status, size = 'sm' }) => {
  const config = STATUS_MAP[status] || { label: status || 'Unknown', variant: 'neutral' };

  return (
    <Badge variant={config.variant} size={size} dot>
      {config.label}
    </Badge>
  );
};

export default ApplicationStatusBadge;
