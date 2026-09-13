import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import AdminBadge from '../../components/admin/AdminBadge';
import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminStatCard from '../../components/admin/AdminStatCard';
import Button from '../../components/ui/Button';
import { MessageSquare, AlertCircle, Clock, CheckCircle2, User, ArrowRight, LifeBuoy } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminSupportPage = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    priority: 'ALL',
    category: 'ALL'
  });

  const fetchTickets = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        search: filters.search || undefined,
        status: filters.status !== 'ALL' ? filters.status : undefined,
        priority: filters.priority !== 'ALL' ? filters.priority : undefined,
        category: filters.category !== 'ALL' ? filters.category : undefined
      };
      const res = await adminApi.getSupportTickets(params);
      if (res.success) {
        setTickets(res.data.tickets || []);
        setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      }
    } catch (err) {
      console.error('Failed to load support tickets:', err);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => {
    fetchTickets(1);
  }, [fetchTickets]);

  const columns = [
    {
      key: 'ticketNumber',
      label: 'Ticket #',
      render: (t) => (
        <span className="font-mono font-bold text-xs text-brand-primary">
          {t.ticketNumber || `#${t._id.slice(-6).toUpperCase()}`}
        </span>
      )
    },
    {
      key: 'user',
      label: 'Created By',
      render: (t) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-surface-tertiary flex items-center justify-center font-bold text-xs text-white">
            {(t.createdBy?.fullName || t.createdBy?.name || t.createdBy?.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-white text-xs">
              {t.createdBy?.fullName || t.createdBy?.name || 'User'}
            </div>
            <div className="text-[10px] text-text-muted">
              {t.createdBy?.email} • <span className="uppercase text-brand-accent">{t.userType}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (t) => (
        <div className="max-w-xs">
          <div className="font-medium text-white text-xs truncate" title={t.subject}>
            {t.subject}
          </div>
          <div className="text-[10px] text-text-muted truncate mt-0.5">
            {t.description}
          </div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (t) => (
        <span className="text-[11px] font-semibold text-text-secondary bg-surface-tertiary px-2 py-0.5 rounded border border-border-primary">
          {t.category}
        </span>
      )
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (t) => <AdminBadge status={t.priority} />
    },
    {
      key: 'status',
      label: 'Status',
      render: (t) => <AdminBadge status={t.status} />
    },
    {
      key: 'assignedTo',
      label: 'Assignee',
      render: (t) => (
        <span className="text-xs text-text-muted">
          {t.assignedTo?.fullName || t.assignedTo?.name || 'Unassigned'}
        </span>
      )
    },
    {
      key: 'date',
      label: 'Created',
      render: (t) => (
        <span className="text-xs text-text-secondary">
          {new Date(t.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (t) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`/admin/support/${t._id}`)}
          className="text-xs py-1 px-2.5 h-auto flex items-center gap-1"
        >
          <span>Open</span>
          <ArrowRight className="w-3 h-3" />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <LifeBuoy className="w-7 h-7 text-brand-primary" />
          Support Helpdesk & Ticketing
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Manage support requests from developers and public users, assign representatives, and track resolution timelines.
        </p>
      </div>

      {/* Ticket Table */}
      <AdminDataTable
        columns={columns}
        data={tickets}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => fetchTickets(page)}
        searchPlaceholder="Search by ticket #, subject, or submitter..."
        searchValue={filters.search}
        onSearchChange={(val) => setFilters((prev) => ({ ...prev, search: val }))}
        filterSlot={
          <div className="flex gap-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="bg-surface-tertiary border border-border-primary text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_USER">Waiting for User</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
              className="bg-surface-tertiary border border-border-primary text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-primary"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
              className="bg-surface-tertiary border border-border-primary text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-primary"
            >
              <option value="ALL">All Categories</option>
              <option value="TECHNICAL">Technical</option>
              <option value="PAYMENT">Payment</option>
              <option value="ACCOUNT">Account</option>
              <option value="APPLICATION">Application</option>
              <option value="APK_UPLOAD">APK Upload</option>
              <option value="SECURITY">Security</option>
              <option value="SUBSCRIPTION">Subscription</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        }
      />
    </div>
  );
};

export default AdminSupportPage;
