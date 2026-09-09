import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import AdminBadge from '../../components/admin/AdminBadge';
import Button from '../../components/ui/Button';
import {
  ArrowLeft,
  LifeBuoy,
  Send,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminSupportDetailPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchTicketDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getSupportTicketById(ticketId);
      if (res.data?.success) {
        setTicket(res.data.data.ticket);
        setMessages(res.data.data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load support ticket:', err);
      toast.error('Failed to load support ticket details');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicketDetails();
  }, [fetchTicketDetails]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      setSending(true);
      const res = await adminApi.addTicketMessage(ticketId, {
        message: replyText.trim()
      });
      if (res.data?.success) {
        setMessages((prev) => [...prev, res.data.data.message]);
        setReplyText('');
        toast.success('Reply sent successfully');
        if (ticket.status === 'WAITING_FOR_USER' || ticket.status === 'OPEN') {
          // Refresh ticket state
          fetchTicketDetails();
        }
      }
    } catch (err) {
      console.error('Send message error:', err);
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      const res = await adminApi.updateTicketStatus(ticketId, { status: newStatus });
      if (res.data?.success) {
        toast.success(`Ticket status updated to ${newStatus}`);
        setTicket((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Status change error:', err);
      toast.error('Failed to update ticket status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      const res = await adminApi.updateTicketStatus(ticketId, { priority: newPriority });
      if (res.data?.success) {
        toast.success(`Ticket priority set to ${newPriority}`);
        setTicket((prev) => ({ ...prev, priority: newPriority }));
      }
    } catch (err) {
      console.error('Priority update error:', err);
      toast.error('Failed to update priority');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <RefreshCw className="w-8 h-8 text-brand-primary animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-white mb-2">Ticket Not Found</h2>
        <Button variant="outline" onClick={() => navigate('/admin/support')}>
          Return to Support Tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-primary/80 pb-4">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/admin/support')}
            className="text-text-muted hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Tickets
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-brand-primary">
                {ticket.ticketNumber || `#${ticket._id.slice(-6).toUpperCase()}`}
              </span>
              <AdminBadge status={ticket.status} />
              <AdminBadge status={ticket.priority} />
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-tertiary text-text-muted border border-border-primary">
                {ticket.category}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">{ticket.subject}</h1>
          </div>
        </div>

        {/* Quick status & priority toggles */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span>Status:</span>
            <select
              value={ticket.status}
              disabled={updatingStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-surface-secondary border border-border-primary text-xs font-semibold text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-brand-primary"
            >
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="WAITING_FOR_USER">WAITING_FOR_USER</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span>Priority:</span>
            <select
              value={ticket.priority}
              onChange={(e) => handlePriorityChange(e.target.value)}
              className="bg-surface-secondary border border-border-primary text-xs font-semibold text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-brand-primary"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat / Messages Panel */}
        <div className="lg:col-span-3 flex flex-col bg-surface-secondary rounded-xl border border-border-primary min-h-[600px] overflow-hidden">
          {/* Messages Container */}
          <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[620px]">
            {/* Original Ticket Description as first entry */}
            <div className="p-4 rounded-xl bg-surface-tertiary/70 border border-border-primary/60">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-primary" />
                  {ticket.createdBy?.fullName || ticket.createdBy?.name || 'Submitter'} ({ticket.userType})
                </span>
                <span className="text-text-muted flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(ticket.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-text-secondary whitespace-pre-wrap">
                {ticket.description}
              </div>
            </div>

            {/* Conversation Messages */}
            {messages.map((msg, idx) => {
              const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'SUPPORT_AGENT'].includes(msg.senderRole);
              return (
                <div
                  key={msg._id || idx}
                  className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-2xl rounded-2xl p-4 text-sm ${
                      isAdmin
                        ? 'bg-brand-primary text-white rounded-tr-none'
                        : 'bg-surface-tertiary text-text-primary rounded-tl-none border border-border-primary/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs mb-1 opacity-80">
                      <span className="font-semibold">
                        {msg.sender?.fullName || msg.sender?.name || (isAdmin ? 'Support Team' : 'User')}
                      </span>
                      <span>•</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="whitespace-pre-wrap">{msg.message}</div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-border-primary bg-surface-tertiary/40">
            <div className="flex gap-3">
              <textarea
                rows={3}
                required
                placeholder="Type your official response to this ticket..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 bg-surface-secondary border border-border-primary text-sm text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary resize-none"
              />
              <div className="flex flex-col justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  loading={sending}
                  className="h-11 px-5 flex items-center gap-2"
                >
                  <span>Send</span>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* User / Ticket Sidebar Details */}
        <div className="space-y-4">
          <div className="p-5 bg-surface-secondary rounded-xl border border-border-primary space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-border-primary pb-3">
              Ticket Information
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-text-muted block mb-0.5">Created By</span>
                <span className="font-semibold text-white">
                  {ticket.createdBy?.fullName || ticket.createdBy?.name || 'N/A'}
                </span>
                <div className="text-text-muted truncate">{ticket.createdBy?.email}</div>
              </div>

              <div>
                <span className="text-text-muted block mb-0.5">Role</span>
                <span className="font-semibold text-brand-accent uppercase">{ticket.userType}</span>
              </div>

              <div>
                <span className="text-text-muted block mb-0.5">Category</span>
                <span className="font-medium text-white">{ticket.category}</span>
              </div>

              <div>
                <span className="text-text-muted block mb-0.5">Assigned Agent</span>
                <span className="font-medium text-white">
                  {ticket.assignedTo?.fullName || ticket.assignedTo?.name || 'Unassigned'}
                </span>
              </div>

              <div>
                <span className="text-text-muted block mb-0.5">Created Date</span>
                <span className="text-text-secondary">{new Date(ticket.createdAt).toLocaleString()}</span>
              </div>

              <div>
                <span className="text-text-muted block mb-0.5">Last Updated</span>
                <span className="text-text-secondary">{new Date(ticket.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSupportDetailPage;
