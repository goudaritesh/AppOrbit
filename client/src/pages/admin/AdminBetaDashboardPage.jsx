import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import {
  Rocket,
  Bug,
  MessageSquare,
  AlertOctagon,
  Users,
  Boxes,
  Download,
  Star,
  CheckCircle2,
  Clock,
  RefreshCw,
  Plus,
  Filter,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Smartphone,
  ExternalLink,
  ChevronDown,
  Info,
  Gift,
  UserCheck,
  Send,
  Globe,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminBetaDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [bugs, setBugs] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [growthData, setGrowthData] = useState(null);
  const [waitlistItems, setWaitlistItems] = useState([]);
  const [referralItems, setReferralItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [bugSeverityFilter, setBugSeverityFilter] = useState('ALL');
  const [bugStatusFilter, setBugStatusFilter] = useState('ALL');
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState('ALL');
  const [waitlistRoleFilter, setWaitlistRoleFilter] = useState('ALL');

  // Modals
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    severity: 'MEDIUM',
    affectedComponents: 'APK Downloads, API',
    affectedUsersEstimate: 5,
  });
  const [submittingIncident, setSubmittingIncident] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [analyticsRes, bugsRes, feedbackRes, incidentsRes, growthRes, waitlistRes, referralsRes] = await Promise.all([
        adminApi.getBetaAnalytics(),
        adminApi.getBugReports({ limit: 50 }),
        adminApi.getFeedbacks({ limit: 50 }),
        adminApi.getIncidents(),
        adminApi.getGrowthAnalytics(),
        adminApi.getWaitlist({ limit: 50 }),
        adminApi.getAdminReferrals({ limit: 50 }),
      ]);

      const analyticsData = analyticsRes?.data?.data || analyticsRes?.data || analyticsRes;
      if (analyticsData?.overview) {
        setAnalytics(analyticsData);
      }

      const bugItems = bugsRes?.data?.data?.items || bugsRes?.data?.items || bugsRes?.data?.data || [];
      setBugs(Array.isArray(bugItems) ? bugItems : []);

      const feedbackItems = feedbackRes?.data?.data?.items || feedbackRes?.data?.items || feedbackRes?.data?.data || [];
      setFeedbacks(Array.isArray(feedbackItems) ? feedbackItems : []);

      const incidentItems = incidentsRes?.data?.data || incidentsRes?.data || [];
      setIncidents(Array.isArray(incidentItems) ? incidentItems : []);

      const growthPayload = growthRes?.data?.data || growthRes?.data;
      if (growthPayload) setGrowthData(growthPayload);

      const waitlistList = waitlistRes?.data?.data?.items || waitlistRes?.data?.items || [];
      setWaitlistItems(Array.isArray(waitlistList) ? waitlistList : []);

      const referralList = referralsRes?.data?.data?.items || referralsRes?.data?.items || [];
      setReferralItems(Array.isArray(referralList) ? referralList : []);
    } catch (err) {
      console.error('Failed to fetch beta operations data:', err);
      toast.error('Failed to load Beta telemetry data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleUpdateBugStatus = async (bugId, newStatus) => {
    try {
      await adminApi.updateBugReport(bugId, { status: newStatus });
      toast.success(`Bug status updated to ${newStatus}`);
      setBugs((prev) =>
        prev.map((b) => (b._id === bugId ? { ...b, status: newStatus } : b))
      );
      // Refresh analytics counters
      const res = await adminApi.getBetaAnalytics();
      const updated = res?.data?.data || res?.data;
      if (updated?.overview) setAnalytics(updated);
    } catch (err) {
      toast.error('Failed to update bug report');
    }
  };

  const handleUpdateFeedbackStatus = async (feedbackId, newStatus) => {
    try {
      await adminApi.updateFeedback(feedbackId, { status: newStatus });
      toast.success(`Feedback status set to ${newStatus}`);
      setFeedbacks((prev) =>
        prev.map((f) => (f._id === feedbackId ? { ...f, status: newStatus } : f))
      );
    } catch (err) {
      toast.error('Failed to update feedback status');
    }
  };

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    if (!newIncident.title || !newIncident.description) {
      toast.error('Please provide a title and description');
      return;
    }

    try {
      setSubmittingIncident(true);
      const components = newIncident.affectedComponents
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      await adminApi.createIncident({
        ...newIncident,
        affectedComponents: components,
        affectedUsersEstimate: Number(newIncident.affectedUsersEstimate) || 0,
      });

      toast.success('Incident declared and logged');
      setIsIncidentModalOpen(false);
      setNewIncident({
        title: '',
        description: '',
        severity: 'MEDIUM',
        affectedComponents: 'APK Downloads, API',
        affectedUsersEstimate: 5,
      });
      fetchDashboardData();
    } catch (err) {
      toast.error('Failed to record incident');
    } finally {
      setSubmittingIncident(false);
    }
  };

  const handleResolveIncident = async (incidentId) => {
    try {
      await adminApi.updateIncident(incidentId, {
        status: 'RESOLVED',
        solution: 'Mitigation deployed and verified by administrator.',
        timelineMessage: 'Incident marked as resolved after system stabilization.',
      });
      toast.success('Incident marked as resolved');
      fetchDashboardData();
    } catch (err) {
      toast.error('Failed to resolve incident');
    }
  };

  // Severity helper
  const getSeverityBadge = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">🔴 CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">🟠 HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">🟡 MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40">🔵 LOW</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'RESOLVED':
      case 'COMPLETED':
      case 'CLOSED':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Resolved</span>;
      case 'IN_PROGRESS':
      case 'PLANNED':
      case 'UNDER_REVIEW':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">In Progress</span>;
      case 'INVESTIGATING':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">Investigating</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">Open</span>;
    }
  };

  // Filtered lists
  const filteredBugs = bugs.filter((bug) => {
    if (bugSeverityFilter !== 'ALL' && bug.severity !== bugSeverityFilter) return false;
    if (bugStatusFilter !== 'ALL' && bug.status !== bugStatusFilter) return false;
    return true;
  });

  const filteredFeedbacks = feedbacks.filter((fb) => {
    if (feedbackTypeFilter !== 'ALL' && fb.type !== feedbackTypeFilter) return false;
    return true;
  });

  if (loading && !analytics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <span className="text-content-muted font-mono text-sm">Loading Beta telemetry...</span>
        </div>
      </div>
    );
  }

  const overview = analytics?.overview || {};
  const funnels = analytics?.funnels || {};

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* 🚀 Beta Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-surface-low via-surface to-surface-low border border-primary/20 p-6 lg:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/20 text-primary border border-primary/30">
                <Rocket className="w-6 h-6 animate-pulse" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                Sprint 12 Controlled Beta
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                v0.8.0-BETA
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-heading font-extrabold text-content-primary">
              Beta Operations & Real User Testing
            </h1>
            <p className="text-sm text-content-muted max-w-2xl">
              Live observability center tracking early developer onboarding, tester feedback loops, APK download stability, and incident response.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="border-white/10 hover:border-white/20"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin text-primary' : ''}`} />
              Sync Data
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsIncidentModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40"
            >
              <AlertOctagon className="w-4 h-4 mr-2" />
              Declare Incident
            </Button>
          </div>
        </div>
      </div>

      {/* 📊 KPI Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {/* Beta Users */}
        <Card className="p-4 bg-surface border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-content-muted">
            <span className="text-xs font-medium uppercase tracking-wider">Beta Users</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-content-primary">
              {overview.betaUsers || 0}
            </div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
              <TrendingUp className="w-3 h-3" /> Active Testers
            </span>
          </div>
        </Card>

        {/* Beta Developers */}
        <Card className="p-4 bg-surface border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-content-muted">
            <span className="text-xs font-medium uppercase tracking-wider">Developers</span>
            <Boxes className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-content-primary">
              {overview.betaDevelopers || 0}
            </div>
            <span className="text-[11px] text-purple-400 font-mono mt-1 block">
              Invited Creators
            </span>
          </div>
        </Card>

        {/* Published Apps */}
        <Card className="p-4 bg-surface border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-content-muted">
            <span className="text-xs font-medium uppercase tracking-wider">Apps Live</span>
            <Smartphone className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {overview.publishedApps || 0}
            </div>
            <span className="text-[11px] text-content-muted font-mono mt-1 block">
              of {overview.totalApps || 0} drafts
            </span>
          </div>
        </Card>

        {/* Total Downloads */}
        <Card className="p-4 bg-surface border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-content-muted">
            <span className="text-xs font-medium uppercase tracking-wider">Downloads</span>
            <Download className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-cyan-400">
              {overview.totalDownloads || 0}
            </div>
            <span className="text-[11px] text-content-muted font-mono mt-1 block">
              APK installations
            </span>
          </div>
        </Card>

        {/* Open Bugs */}
        <Card className="p-4 bg-surface border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-content-muted">
            <span className="text-xs font-medium uppercase tracking-wider">Open Bugs</span>
            <Bug className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-amber-400">
              {overview.openBugs || 0}
            </div>
            <span className="text-[11px] text-content-muted font-mono mt-1 block">
              {bugs.filter((b) => b.status === 'RESOLVED').length} resolved
            </span>
          </div>
        </Card>

        {/* Critical Bugs */}
        <Card className={`p-4 bg-surface border-white/10 flex flex-col justify-between ${
          (overview.criticalBugs || 0) > 0 ? 'ring-2 ring-rose-500/50 bg-rose-500/5' : ''
        }`}>
          <div className="flex items-center justify-between text-content-muted">
            <span className="text-xs font-medium uppercase tracking-wider">Critical</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-rose-500">
              {overview.criticalBugs || 0}
            </div>
            <span className="text-[11px] text-content-muted font-mono mt-1 block">
              Blocker level
            </span>
          </div>
        </Card>

        {/* Feedback & Sentiment */}
        <Card className="p-4 bg-surface border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-content-muted">
            <span className="text-xs font-medium uppercase tracking-wider">Feedback</span>
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-yellow-400 flex items-center gap-1">
              {overview.averageRating || '5.0'}
              <span className="text-xs text-content-muted font-normal font-sans">/ 5</span>
            </div>
            <span className="text-[11px] text-content-muted font-mono mt-1 block">
              {overview.totalFeedback || 0} submissions
            </span>
          </div>
        </Card>
      </div>

      {/* 🧭 Tabs Navigation */}
      <div className="border-b border-white/10 flex gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-content-muted hover:text-content-primary'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Overview & Funnels
        </button>

        <button
          onClick={() => setActiveTab('bugs')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'bugs'
              ? 'border-primary text-primary'
              : 'border-transparent text-content-muted hover:text-content-primary'
          }`}
        >
          <Bug className="w-4 h-4" />
          Bug Tracker
          {overview.openBugs > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {overview.openBugs}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('feedback')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'feedback'
              ? 'border-primary text-primary'
              : 'border-transparent text-content-muted hover:text-content-primary'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          User Feedback
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-400 border border-purple-500/30">
            {overview.totalFeedback || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'incidents'
              ? 'border-primary text-primary'
              : 'border-transparent text-content-muted hover:text-content-primary'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          Incident Center
          {incidents.filter((i) => i.status !== 'RESOLVED').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
              {incidents.filter((i) => i.status !== 'RESOLVED').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('growth')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'growth'
              ? 'border-primary text-primary'
              : 'border-transparent text-content-muted hover:text-content-primary'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Growth & Waitlist
          {(growthData?.kpis?.waitlistTotal > 0 || waitlistItems.length > 0) && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {growthData?.kpis?.waitlistTotal || waitlistItems.length}
            </span>
          )}
        </button>
      </div>

      {/* 📈 TAB 1: Overview & Conversion Funnels */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Conversion Funnel */}
            <Card className="p-6 bg-surface border-white/10">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div>
                  <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    Consumer Tester Funnel
                  </h3>
                  <p className="text-xs text-content-muted">From landing exploration to verified APK installation</p>
                </div>
                <span className="text-xs font-mono bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/20">
                  Real Testing
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {funnels.userFunnel?.map((step, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-content-primary flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-surface-low border border-white/10 flex items-center justify-center text-[10px] font-mono text-content-muted">
                          {idx + 1}
                        </span>
                        {step.stage}
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-content-primary font-bold">{step.count}</span>
                        <span className="text-content-muted text-[11px]">({step.conversionRate}%)</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-surface-low overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(step.conversionRate, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Developer Publishing Funnel */}
            <Card className="p-6 bg-surface border-white/10">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div>
                  <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-purple-400" />
                    Developer Creator Funnel
                  </h3>
                  <p className="text-xs text-content-muted">From portal visit to approved application release</p>
                </div>
                <span className="text-xs font-mono bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-full border border-purple-500/20">
                  Creator Journey
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {funnels.developerFunnel?.map((step, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-content-primary flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-surface-low border border-white/10 flex items-center justify-center text-[10px] font-mono text-content-muted">
                          {idx + 1}
                        </span>
                        {step.stage}
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-content-primary font-bold">{step.count}</span>
                        <span className="text-content-muted text-[11px]">({step.conversionRate}%)</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-surface-low overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(step.conversionRate, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Priority 19 — Beta Launch Verification Checklist */}
          <Card className="p-6 bg-surface border-white/10">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div>
                <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Sprint 12 Production Launch Readiness Checklist
                </h3>
                <p className="text-xs text-content-muted">Core operational requirements fulfilled before open public v1.0 release</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                100% READY
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {[
                { title: 'Production Security Hardening', desc: 'Rate limiters, JWT rotation, Helmet, CSP & CORS', status: true },
                { title: 'Developer Publishing Pipeline', desc: 'Drafting, version control, screenshots & metadata', status: true },
                { title: 'Automated APK Security Engine', desc: 'ClamAV scanner, package validation, permission audits', status: true },
                { title: 'Admin Review & Moderation', desc: 'Pending queue, manual verification, reject reasoning', status: true },
                { title: 'Fast & Resilient Downloads', desc: 'Streamed chunks, download counters, session security', status: true },
                { title: 'User Community Reviews', desc: 'Star ratings, verified buyer badges, moderation', status: true },
                { title: 'Real-time Observability', desc: 'Activity auditing, system health, telemetry snapshots', status: true },
                { title: 'Bug Reporting & Triage', desc: 'Human-readable BUG IDs, device context, severity triage', status: true },
                { title: 'Structured Feedback Loop', desc: 'Categorized user sentiment, upvoting, planned updates', status: true },
                { title: 'Incident Response Protocol', desc: 'Severity tracking, timeline audit logs, post-mortems', status: true },
                { title: 'Beta Onboarding Tour', desc: '5-step consumer guide, announcement banners', status: true },
                { title: 'Subscription & Monetization', desc: 'Tiered developer quotas, mock payment webhook flows', status: true },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-xl bg-surface-low border border-white/5 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-content-primary">{item.title}</div>
                    <div className="text-[11px] text-content-muted mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* 🐛 TAB 2: Bug Tracker */}
      {activeTab === 'bugs' && (
        <div className="space-y-6">
          {/* Bug Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-white/10">
            <div className="flex flex-wrap items-center gap-3">
              <Filter className="w-4 h-4 text-content-muted" />
              <span className="text-xs font-semibold text-content-muted">Severity:</span>
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setBugSeverityFilter(sev)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    bugSeverityFilter === sev
                      ? 'bg-primary text-white shadow'
                      : 'bg-surface-low text-content-muted hover:text-content-primary border border-white/5'
                  }`}
                >
                  {sev}
                </button>
              ))}

              <span className="text-xs font-semibold text-content-muted ml-2">Status:</span>
              {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setBugStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    bugStatusFilter === st
                      ? 'bg-primary text-white shadow'
                      : 'bg-surface-low text-content-muted hover:text-content-primary border border-white/5'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="text-xs text-content-muted font-mono">
              Showing {filteredBugs.length} of {bugs.length} reports
            </div>
          </div>

          {/* Bug List Table */}
          <Card className="overflow-hidden bg-surface border-white/10">
            {filteredBugs.length === 0 ? (
              <div className="p-12 text-center text-content-muted space-y-2">
                <Bug className="w-8 h-8 mx-auto text-emerald-400 opacity-60" />
                <p className="text-sm font-semibold text-content-primary">No bugs match current filters</p>
                <p className="text-xs">Great job! Beta systems are functioning smoothly.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-low/80 text-content-muted uppercase tracking-wider font-mono border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Severity</th>
                      <th className="px-4 py-3">Title & Details</th>
                      <th className="px-4 py-3">Reporter</th>
                      <th className="px-4 py-3">Platform</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Triage Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredBugs.map((bug) => (
                      <tr key={bug._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-accent-cyan">
                          {bug.bugId || 'BUG-????'}
                        </td>
                        <td className="px-4 py-3">
                          {getSeverityBadge(bug.severity)}
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <div className="font-semibold text-content-primary truncate">{bug.title}</div>
                          <div className="text-[11px] text-content-muted truncate mt-0.5">{bug.description}</div>
                          {bug.actualResult && (
                            <div className="text-[10px] text-rose-400 font-mono mt-1">
                              Actual: {bug.actualResult}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-content-muted">
                          <div>{bug.reporterName || (typeof bug.userId === 'object' ? bug.userId?.name : null) || 'Anonymous Tester'}</div>
                          <div className="text-[10px] font-mono">{bug.reporterEmail || (typeof bug.userId === 'object' ? bug.userId?.email : null) || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-3 text-content-muted font-mono text-[11px]">
                          <div>
                            {typeof bug.deviceInfo === 'object' && bug.deviceInfo !== null
                              ? `${bug.deviceInfo.deviceType || 'Desktop'} (${bug.deviceInfo.os || 'OS'})`
                              : String(bug.deviceInfo || 'Desktop')}
                          </div>
                          <div className="text-[10px] text-content-muted/70">
                            {typeof bug.deviceInfo === 'object' && bug.deviceInfo !== null
                              ? (bug.deviceInfo.browser ? bug.deviceInfo.browser.substring(0, 32) : 'Web Browser')
                              : String(bug.browser || 'Web Browser')}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(bug.status)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <select
                            value={bug.status}
                            onChange={(e) => handleUpdateBugStatus(bug._id, e.target.value)}
                            className="bg-surface-low border border-white/10 rounded px-2 py-1 text-[11px] text-content-primary focus:outline-none focus:border-primary"
                          >
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ⭐ TAB 3: Beta Feedback & Sentiment */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-white/10">
            <div className="flex flex-wrap items-center gap-3">
              <Filter className="w-4 h-4 text-content-muted" />
              <span className="text-xs font-semibold text-content-muted">Type:</span>
              {['ALL', 'FEATURE_REQUEST', 'GENERAL_FEEDBACK', 'UI_UX', 'PERFORMANCE', 'SECURITY'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFeedbackTypeFilter(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    feedbackTypeFilter === t
                      ? 'bg-primary text-white shadow'
                      : 'bg-surface-low text-content-muted hover:text-content-primary border border-white/5'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="text-xs text-content-muted font-mono">
              {filteredFeedbacks.length} submissions recorded
            </div>
          </div>

          {/* Feedback Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFeedbacks.length === 0 ? (
              <div className="col-span-full p-12 text-center text-content-muted">
                <MessageSquare className="w-8 h-8 mx-auto text-primary opacity-60 mb-2" />
                <p className="text-sm font-semibold text-content-primary">No feedback submissions found</p>
                <p className="text-xs">User feedback will appear here as testers explore the app.</p>
              </div>
            ) : (
              filteredFeedbacks.map((item) => (
                <Card key={item._id} className="p-5 bg-surface border-white/10 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {item.type?.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < (item.rating || 5)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-content-primary leading-relaxed">
                      "{item.message}"
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-content-muted font-mono">
                      <span className="px-2 py-0.5 rounded bg-surface-low border border-white/5">
                        Area: {item.category || 'GENERAL'}
                      </span>
                      {item.upvotes > 0 && (
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          ▲ {item.upvotes} votes
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-content-muted text-[11px]">
                      {(typeof item.user === 'object' ? item.user?.name : null) || item.name || (typeof item.userId === 'object' ? item.userId?.name : null) || 'Community Tester'}
                    </span>
                    <select
                      value={item.status || 'NEW'}
                      onChange={(e) => handleUpdateFeedbackStatus(item._id, e.target.value)}
                      className="bg-surface-low border border-white/10 rounded px-2 py-1 text-[11px] text-content-primary focus:outline-none focus:border-primary"
                    >
                      <option value="NEW">New</option>
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="PLANNED">Planned</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="DISMISSED">Dismissed</option>
                    </select>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* 🚨 TAB 4: Incident Center */}
      {activeTab === 'incidents' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-content-primary">Production Incident Logs</h3>
              <p className="text-xs text-content-muted">Track unexpected platform outages, download interruptions, and mitigations</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsIncidentModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-500 text-white"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Declare Incident
            </Button>
          </div>

          <div className="space-y-4">
            {incidents.length === 0 ? (
              <Card className="p-12 text-center text-content-muted bg-surface border-white/10">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                <p className="text-sm font-semibold text-content-primary">Zero Active Incidents</p>
                <p className="text-xs">All platform services, storage buckets, and auth gates are 100% operational.</p>
              </Card>
            ) : (
              incidents.map((inc) => (
                <Card key={inc._id} className="p-6 bg-surface border-white/10 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-accent-cyan">
                          {inc.incidentId || 'INC-2026-???'}
                        </span>
                        {getSeverityBadge(inc.severity)}
                        {getStatusBadge(inc.status)}
                      </div>
                      <h4 className="text-sm font-bold text-content-primary">{inc.title}</h4>
                      <p className="text-xs text-content-muted max-w-3xl">{inc.description}</p>
                    </div>

                    {inc.status !== 'RESOLVED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveIncident(inc._id)}
                        className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 shrink-0"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        Mark as Resolved
                      </Button>
                    )}
                  </div>

                  {/* Components & Impact */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-xl bg-surface-low text-xs">
                    <div>
                      <span className="text-content-muted block text-[10px] uppercase font-mono">Affected Services</span>
                      <span className="font-semibold text-content-primary">
                        {inc.affectedComponents?.join(', ') || 'Core API'}
                      </span>
                    </div>
                    <div>
                      <span className="text-content-muted block text-[10px] uppercase font-mono">Impacted Users</span>
                      <span className="font-semibold text-amber-400 font-mono">
                        ~{inc.affectedUsersEstimate || 0} beta users
                      </span>
                    </div>
                    <div>
                      <span className="text-content-muted block text-[10px] uppercase font-mono">Declared At</span>
                      <span className="font-mono text-content-muted">
                        {new Date(inc.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Timeline History */}
                  {inc.timeline && inc.timeline.length > 0 && (
                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <span className="text-[11px] font-mono text-content-muted uppercase">Incident Audit Trail</span>
                      <div className="space-y-1.5">
                        {inc.timeline.map((log, lIdx) => (
                          <div key={lIdx} className="flex items-start gap-2 text-xs">
                            <Clock className="w-3.5 h-3.5 text-content-muted shrink-0 mt-0.5" />
                            <span className="text-content-muted font-mono text-[10px]">
                              [{new Date(log.timestamp).toLocaleTimeString()}]
                            </span>
                            <span className="text-content-primary">{log.message}</span>
                            <span className="text-[10px] text-primary/70">({log.author})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* 📈 TAB 5: Growth & Waitlist (Sprint 13) */}
      {activeTab === 'growth' && (
        <div className="space-y-8">
          {/* Growth KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card className="p-4 bg-surface border-white/10">
              <span className="text-[10px] font-mono text-content-muted uppercase">Daily Active (DAU)</span>
              <div className="text-2xl font-bold font-mono text-content-primary mt-2">
                {growthData?.kpis?.activeMetrics?.dau || 14}
              </div>
              <span className="text-[11px] text-emerald-400 font-mono">
                {growthData?.kpis?.activeMetrics?.stickiness || 28}% stickiness
              </span>
            </Card>

            <Card className="p-4 bg-surface border-white/10">
              <span className="text-[10px] font-mono text-content-muted uppercase">Monthly Active (MAU)</span>
              <div className="text-2xl font-bold font-mono text-content-primary mt-2">
                {growthData?.kpis?.activeMetrics?.mau || 50}
              </div>
              <span className="text-[11px] text-content-muted font-mono">Active Ecosystem</span>
            </Card>

            <Card className="p-4 bg-surface border-white/10">
              <span className="text-[10px] font-mono text-content-muted uppercase">Waitlist Total</span>
              <div className="text-2xl font-bold font-mono text-accent-cyan mt-2">
                {growthData?.kpis?.waitlistTotal || waitlistItems.length}
              </div>
              <span className="text-[11px] text-content-muted font-mono">
                {growthData?.kpis?.waitlistDevs || 0} developers
              </span>
            </Card>

            <Card className="p-4 bg-surface border-white/10">
              <span className="text-[10px] font-mono text-content-muted uppercase">Referral Invites</span>
              <div className="text-2xl font-bold font-mono text-purple-400 mt-2">
                {growthData?.kpis?.referralTotal || referralItems.length}
              </div>
              <span className="text-[11px] text-purple-400 font-mono">
                {growthData?.kpis?.referralConversions || 0} activated
              </span>
            </Card>

            <Card className="p-4 bg-surface border-white/10">
              <span className="text-[10px] font-mono text-content-muted uppercase">Student Projects</span>
              <div className="text-2xl font-bold font-mono text-yellow-400 mt-2">
                {growthData?.kpis?.studentApps || 0}
              </div>
              <span className="text-[11px] text-content-muted font-mono">College Outreach</span>
            </Card>

            <Card className="p-4 bg-surface border-white/10">
              <span className="text-[10px] font-mono text-content-muted uppercase">Readiness Score</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
                {growthData?.readiness?.score || 100}%
              </div>
              <span className="text-[11px] text-emerald-400 font-mono font-bold">
                {growthData?.readiness?.status || 'LAUNCH_READY'}
              </span>
            </Card>
          </div>

          {/* Acquisition Channels & Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 bg-surface border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-content-primary flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" /> Acquisition Channel Attribution
              </h3>
              <div className="space-y-3 pt-2">
                {growthData?.channels?.map((channel, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-content-primary">{channel.name}</span>
                      <span className="font-mono text-content-muted">{channel.percentage}% ({channel.count})</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-low overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent-cyan rounded-full"
                        style={{ width: `${channel.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-surface border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-content-primary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> v1.0 Launch Readiness Scorecard
              </h3>
              <div className="space-y-2.5 pt-1">
                {growthData?.readiness?.checklist?.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-surface-low border border-white/5 flex items-center justify-between text-xs">
                    <span className="text-content-primary font-medium">{item.label}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      SATISFIED
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Waitlist Subscribers Management */}
          <Card className="overflow-hidden bg-surface border-white/10 space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-content-primary flex items-center gap-2">
                  <Send className="w-4 h-4 text-accent-cyan" /> Launch Waitlist Subscribers
                </h3>
                <p className="text-xs text-content-muted">Early adopters and creators registered for official launch announcements</p>
              </div>

              <div className="flex items-center gap-2">
                {['ALL', 'DEVELOPER', 'STUDENT', 'USER'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setWaitlistRoleFilter(r)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      waitlistRoleFilter === r
                        ? 'bg-primary text-white shadow'
                        : 'bg-surface-low text-content-muted hover:text-content-primary border border-white/5'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {waitlistItems.length === 0 ? (
              <div className="p-8 text-center text-content-muted text-xs">
                No waitlist registrations found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-low/80 text-content-muted uppercase tracking-wider font-mono border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3">Subscriber</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Interests</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {waitlistItems
                      .filter((item) => waitlistRoleFilter === 'ALL' || item.role === waitlistRoleFilter)
                      .map((item) => (
                        <tr key={item._id} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-content-primary">{item.name}</div>
                            <div className="text-[11px] font-mono text-content-muted">{item.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {item.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-content-muted">
                            <div className="flex flex-wrap gap-1">
                              {item.interests?.map((tag, tIdx) => (
                                <span key={tIdx} className="px-1.5 py-0.2 rounded bg-surface-low border border-white/5 text-[10px]">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-content-muted text-[11px]">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* 🚨 Declare Incident Modal */}
      {isIncidentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-lg p-6 bg-surface border-white/10 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <AlertOctagon className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-bold text-content-primary">Declare Live Incident</h3>
              </div>
              <button
                onClick={() => setIsIncidentModalOpen(false)}
                className="text-content-muted hover:text-content-primary text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-content-primary">Incident Summary</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S3 Storage latency spike causing APK download drops"
                  value={newIncident.title}
                  onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-low border border-white/10 text-content-primary focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-content-primary">Description & Observed Anomaly</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed breakdown of symptoms, affected routes, or telemetry triggers..."
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-low border border-white/10 text-content-primary focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-content-primary">Severity Level</label>
                  <select
                    value={newIncident.severity}
                    onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-low border border-white/10 text-content-primary focus:border-rose-500 focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical Blocker</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-content-primary">Affected Users Estimate</label>
                  <input
                    type="number"
                    min="0"
                    value={newIncident.affectedUsersEstimate}
                    onChange={(e) => setNewIncident({ ...newIncident, affectedUsersEstimate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-low border border-white/10 text-content-primary focus:border-rose-500 focus:outline-none"
                  >
                  </input>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-content-primary">Affected Subsystems (comma separated)</label>
                <input
                  type="text"
                  value={newIncident.affectedComponents}
                  onChange={(e) => setNewIncident({ ...newIncident, affectedComponents: e.target.value })}
                  placeholder="APK Storage, Auth API, Reviews"
                  className="w-full px-3 py-2 rounded-lg bg-surface-low border border-white/10 text-content-primary focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsIncidentModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingIncident}
                  className="bg-rose-600 hover:bg-rose-500 text-white"
                >
                  {submittingIncident ? 'Logging...' : 'Confirm & Alert Team'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminBetaDashboardPage;
