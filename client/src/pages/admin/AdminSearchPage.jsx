import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import AdminBadge from '../../components/admin/AdminBadge';
import Button from '../../components/ui/Button';
import useDebounce from '../../hooks/useDebounce';
import {
  Search,
  Smartphone,
  Users,
  Code2,
  LifeBuoy,
  ArrowRight,
  RefreshCw,
  PackageCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminSearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 400);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const runSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults(null);
        return;
      }

      try {
        setLoading(true);
        setSearchParams({ q: debouncedQuery.trim() });
        const res = await adminApi.globalSearch(debouncedQuery.trim());
        if (res.data?.success) {
          setResults(res.data.data.results);
        }
      } catch (err) {
        console.error('Global search error:', err);
        toast.error('Failed to execute search');
      } finally {
        setLoading(false);
      }
    };

    runSearch();
  }, [debouncedQuery, setSearchParams]);

  const totalHits =
    (results?.apps?.length || 0) +
    (results?.developers?.length || 0) +
    (results?.users?.length || 0) +
    (results?.tickets?.length || 0);

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Search className="w-7 h-7 text-brand-primary" />
          Global Platform Search
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Search across applications, developer profiles, users, and support tickets from a single unified query.
        </p>
      </div>

      {/* Big Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by app title, developer email, user name, package name, or ticket number..."
          className="w-full bg-surface-secondary border border-border-primary text-base text-white rounded-2xl pl-12 pr-12 py-3.5 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary shadow-sm"
        />
        {loading && (
          <RefreshCw className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-brand-primary animate-spin" />
        )}
      </div>

      {/* Results presentation */}
      {query.trim() && !loading && results && (
        <div className="text-xs text-text-muted font-medium">
          Found <strong>{totalHits}</strong> matching result{totalHits === 1 ? '' : 's'} for "{query}"
        </div>
      )}

      {results && totalHits === 0 && !loading && (
        <div className="p-12 text-center bg-surface-secondary/50 rounded-2xl border border-border-primary">
          <Search className="w-10 h-10 text-text-muted mx-auto mb-2 opacity-50" />
          <h3 className="text-base font-bold text-white">No Matching Records</h3>
          <p className="text-xs text-text-muted mt-1">
            No applications, developers, users, or tickets matched your query "{query}".
          </p>
        </div>
      )}

      {results && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Applications Hits */}
          {results.apps?.length > 0 && (
            <div className="p-5 bg-surface-secondary rounded-xl border border-border-primary space-y-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-border-primary pb-2.5">
                <Smartphone className="w-4 h-4 text-brand-primary" />
                Applications ({results.apps.length})
              </h2>
              <div className="space-y-2">
                {results.apps.map((app) => (
                  <div
                    key={app._id}
                    onClick={() => navigate(`/admin/apps/${app._id}`)}
                    className="p-3 bg-surface-tertiary/70 hover:bg-surface-tertiary rounded-lg border border-border-primary/60 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {app.iconUrl ? (
                        <img src={app.iconUrl} alt={app.title} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center font-bold text-brand-primary text-xs shrink-0">
                          {app.title?.[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-white text-xs truncate group-hover:text-brand-primary transition-colors">
                          {app.title}
                        </div>
                        <div className="text-[10px] text-text-muted truncate">
                          {app.packageName || app.category}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <AdminBadge status={app.status} />
                      <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-white transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Developers Hits */}
          {results.developers?.length > 0 && (
            <div className="p-5 bg-surface-secondary rounded-xl border border-border-primary space-y-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-border-primary pb-2.5">
                <Code2 className="w-4 h-4 text-purple-400" />
                Developers ({results.developers.length})
              </h2>
              <div className="space-y-2">
                {results.developers.map((dev) => (
                  <div
                    key={dev._id}
                    onClick={() => navigate(`/admin/developers/${dev._id}`)}
                    className="p-3 bg-surface-tertiary/70 hover:bg-surface-tertiary rounded-lg border border-border-primary/60 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-bold text-purple-400 text-xs shrink-0">
                        {(dev.fullName || dev.email || 'D')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white text-xs truncate group-hover:text-purple-400 transition-colors">
                          {dev.fullName || dev.name || 'Developer'}
                        </div>
                        <div className="text-[10px] text-text-muted truncate">{dev.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <AdminBadge status={dev.accountStatus || 'ACTIVE'} />
                      <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-white transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users Hits */}
          {results.users?.length > 0 && (
            <div className="p-5 bg-surface-secondary rounded-xl border border-border-primary space-y-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-border-primary pb-2.5">
                <Users className="w-4 h-4 text-blue-400" />
                Users ({results.users.length})
              </h2>
              <div className="space-y-2">
                {results.users.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => navigate('/admin/users')}
                    className="p-3 bg-surface-tertiary/70 hover:bg-surface-tertiary rounded-lg border border-border-primary/60 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-xs shrink-0">
                        {(u.fullName || u.email || 'U')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white text-xs truncate group-hover:text-blue-400 transition-colors">
                          {u.fullName || u.name || 'User'}
                        </div>
                        <div className="text-[10px] text-text-muted truncate">
                          {u.email} • {u.role}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <AdminBadge status={u.accountStatus || 'ACTIVE'} />
                      <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-white transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Support Tickets Hits */}
          {results.tickets?.length > 0 && (
            <div className="p-5 bg-surface-secondary rounded-xl border border-border-primary space-y-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-border-primary pb-2.5">
                <LifeBuoy className="w-4 h-4 text-emerald-400" />
                Support Tickets ({results.tickets.length})
              </h2>
              <div className="space-y-2">
                {results.tickets.map((t) => (
                  <div
                    key={t._id}
                    onClick={() => navigate(`/admin/support/${t._id}`)}
                    className="p-3 bg-surface-tertiary/70 hover:bg-surface-tertiary rounded-lg border border-border-primary/60 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-white text-xs truncate group-hover:text-emerald-400 transition-colors">
                        {t.ticketNumber || `#${t._id.slice(-6).toUpperCase()}`}: {t.subject}
                      </div>
                      <div className="text-[10px] text-text-muted truncate mt-0.5">
                        {t.category} • Priority: {t.priority}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <AdminBadge status={t.status} />
                      <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-white transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminSearchPage;
