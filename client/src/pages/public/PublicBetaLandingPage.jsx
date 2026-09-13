import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import {
  Rocket,
  ShieldCheck,
  Smartphone,
  Users,
  Boxes,
  Download,
  Star,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  Lock,
  Zap,
  Globe,
  Award,
  ChevronRight,
  Send,
  Heart,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const PublicBetaLandingPage = () => {
  const [featuredApps, setFeaturedApps] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);

  // Countdown to v1.0 Launch (30 days target)
  const [timeLeft, setTimeLeft] = useState({
    days: 28,
    hours: 14,
    minutes: 36,
    seconds: 45,
  });

  // Waitlist Form State
  const [waitlistData, setWaitlistData] = useState({
    name: '',
    email: '',
    role: 'DEVELOPER',
    interests: [],
    feedback: '',
  });
  const [submittingWaitlist, setSubmittingWaitlist] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  useEffect(() => {
    fetchFeatured();

    // Timer tick
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchFeatured = async () => {
    try {
      setLoadingApps(true);
      const res = await adminApi.getFeaturedApps(6);
      const items = res?.data?.data || res?.data || [];
      setFeaturedApps(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Failed to load featured apps:', err);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleInterestToggle = (tag) => {
    setWaitlistData((prev) => ({
      ...prev,
      interests: prev.interests.includes(tag)
        ? prev.interests.filter((t) => t !== tag)
        : [...prev.interests, tag],
    }));
  };

  const handleJoinWaitlist = async (e) => {
    e.preventDefault();
    if (!waitlistData.name || !waitlistData.email) {
      toast.error('Please provide your name and email');
      return;
    }

    try {
      setSubmittingWaitlist(true);
      const res = await adminApi.joinWaitlist(waitlistData);
      toast.success(res?.data?.message || 'Reserved your spot on the Launch Waitlist!');
      setWaitlistSuccess(true);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to join waitlist';
      toast.error(msg);
    } finally {
      setSubmittingWaitlist(false);
    }
  };

  const availableTags = [
    'Flutter Apps',
    'Student Projects',
    'AI Tools',
    'Open Source',
    'Productivity',
    'Games',
  ];

  return (
    <div className="min-h-screen bg-background text-content-primary space-y-24 pb-20 overflow-hidden">
      {/* 🚀 Hero Section */}
      <section className="relative pt-12 lg:pt-20 px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-primary/20 via-purple-600/10 to-accent-cyan/15 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-surface-low/80 border border-primary/30 text-xs font-mono backdrop-blur-md shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-primary font-bold">Public Beta v0.8.0-BETA</span>
          <span className="text-content-muted">|</span>
          <span className="text-content-muted">Open Testing Program</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-heading font-extrabold tracking-tight text-content-primary max-w-4xl mx-auto leading-tight">
          Your Apps Deserve to Be{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-accent-cyan">
            Discovered.
          </span>
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-content-muted max-w-2xl mx-auto leading-relaxed">
          AppOrbit is the open distribution platform where independent developers showcase their applications and users discover, explore, and download verified Android APKs.
        </p>

        {/* Primary CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link to="/explore">
            <Button variant="primary" size="lg" className="shadow-xl shadow-primary/25 group">
              <Smartphone className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
              Explore Apps
            </Button>
          </Link>
          <Link to="/developer/apps/create">
            <Button variant="outline" size="lg" className="border-white/10 hover:border-primary/50">
              <Rocket className="w-5 h-5 mr-2 text-accent-cyan" />
              Publish Your App
            </Button>
          </Link>
        </div>

        {/* ⏳ Official Launch Countdown Timer */}
        <div className="pt-8 max-w-xl mx-auto">
          <div className="p-4 rounded-2xl bg-surface/60 border border-white/10 backdrop-blur-md shadow-2xl space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-content-muted flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-accent-cyan" />
              Official AppOrbit v1.0 Public Launch Countdown
            </span>
            <div className="grid grid-cols-4 gap-3 text-center pt-2">
              <div className="p-3 rounded-xl bg-surface-low border border-white/5">
                <span className="text-2xl lg:text-3xl font-bold font-mono text-content-primary block">
                  {timeLeft.days}
                </span>
                <span className="text-[10px] text-content-muted uppercase font-mono">Days</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-low border border-white/5">
                <span className="text-2xl lg:text-3xl font-bold font-mono text-content-primary block">
                  {timeLeft.hours}
                </span>
                <span className="text-[10px] text-content-muted uppercase font-mono">Hours</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-low border border-white/5">
                <span className="text-2xl lg:text-3xl font-bold font-mono text-content-primary block">
                  {timeLeft.minutes}
                </span>
                <span className="text-[10px] text-content-muted uppercase font-mono">Minutes</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-low border border-white/5">
                <span className="text-2xl lg:text-3xl font-bold font-mono text-accent-cyan block">
                  {timeLeft.seconds}
                </span>
                <span className="text-[10px] text-content-muted uppercase font-mono">Seconds</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 💡 What is AppOrbit? Section */}
      <section className="px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl lg:text-3xl font-heading font-extrabold text-content-primary">
            Why AppOrbit Exists
          </h2>
          <p className="text-sm text-content-muted max-w-xl mx-auto">
            Traditional app stores bury independent creators under massive corporate ad budgets. We built a platform that puts project quality, transparent security, and community first.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-surface border-white/10 space-y-3 hover:border-primary/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-content-primary">Life Beyond the Laptop</h3>
            <p className="text-xs text-content-muted leading-relaxed">
              Don't let your weekend projects, college capstones, or hackathon apps sit forgotten on GitHub. Give them a home where real users can install and review them.
            </p>
          </Card>

          <Card className="p-6 bg-surface border-white/10 space-y-3 hover:border-accent-cyan/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-content-primary">Automated APK Verification</h3>
            <p className="text-xs text-content-muted leading-relaxed">
              Every uploaded binary undergoes automated ClamAV antivirus inspection, SHA-256 fingerprinting, and Android permission analysis before reaching the catalog.
            </p>
          </Card>

          <Card className="p-6 bg-surface border-white/10 space-y-3 hover:border-emerald-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-content-primary">Direct Developer Connection</h3>
            <p className="text-xs text-content-muted leading-relaxed">
              Engage with early adopters who genuinely care. Receive structured bug reports, feature requests, and community upvotes directly in your developer console.
            </p>
          </Card>
        </div>
      </section>

      {/* 👥 For Developers vs For Users */}
      <section className="px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* For Developers */}
          <Card className="p-8 bg-gradient-to-b from-surface via-surface to-surface-low border-purple-500/20 shadow-xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Rocket className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-extrabold text-content-primary">For Independent Developers</h3>
                <span className="text-xs font-mono text-purple-400">Launch & Iterate Fast</span>
              </div>
            </div>

            <ul className="space-y-3 text-xs text-content-muted">
              {[
                'Zero $25 account gatekeeping fees — publish your apps instantly',
                'Detailed telemetry: download counters, ratings & retention insights',
                'Fast approval turnaround with clear security reviewer notes',
                'College & Hackathon tags to highlight academic accomplishments',
                'Earn extra publishing quota by referring other developer peers',
              ].map((point, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <Link to="/developer" className="block pt-2">
              <Button variant="primary" size="sm" className="w-full">
                Go to Developer Console <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </Card>

          {/* For Users */}
          <Card className="p-8 bg-gradient-to-b from-surface via-surface to-surface-low border-cyan-500/20 shadow-xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-extrabold text-content-primary">For Android Explorers</h3>
                <span className="text-xs font-mono text-cyan-400">Discover What's Next</span>
              </div>
            </div>

            <ul className="space-y-3 text-xs text-content-muted">
              {[
                'Explore unique, indie-crafted Android apps not found anywhere else',
                'One-click direct APK downloads with full permission transparency',
                'Safe installation guarantees verified by our continuous security engine',
                'Write community reviews and directly influence feature roadmaps',
                'Test exciting experimental prototypes from student researchers',
              ].map((point, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <Link to="/explore" className="block pt-2">
              <Button variant="outline" size="sm" className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                Browse Public Catalog <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* 🧭 How It Works (5 Steps) */}
      <section className="px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl lg:text-3xl font-heading font-extrabold text-content-primary">
            How AppOrbit Works
          </h2>
          <p className="text-sm text-content-muted max-w-xl mx-auto">
            From code on your laptop to verified downloads across the world in 5 simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { step: '01', title: 'Register Account', desc: 'Create your developer profile and connect your projects' },
            { step: '02', title: 'Add Metadata', desc: 'Upload screenshots, write descriptions & declare technologies' },
            { step: '03', title: 'Upload APK', desc: 'Drag and drop your Android binary up to 200 MB' },
            { step: '04', title: 'Security Scan', desc: 'Automated antivirus scan, hash generation & permission audit' },
            { step: '05', title: 'Go Live', desc: 'Instant discoverability, user reviews, and download metrics' },
          ].map((item, idx) => (
            <Card key={idx} className="p-5 bg-surface border-white/10 relative space-y-2 flex flex-col justify-between">
              <span className="text-2xl font-black font-mono text-primary/30 block">
                {item.step}
              </span>
              <div>
                <h4 className="text-sm font-bold text-content-primary">{item.title}</h4>
                <p className="text-[11px] text-content-muted mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ⭐ Featured & Student Showcase */}
      <section className="px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl lg:text-3xl font-heading font-extrabold text-content-primary flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-400" />
              Featured Applications & Student Projects
            </h2>
            <p className="text-xs text-content-muted">Handpicked gems currently trending in our public beta catalog</p>
          </div>

          <Link to="/explore" className="text-xs font-semibold text-primary hover:text-accent-cyan flex items-center gap-1 shrink-0">
            View all applications <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingApps ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6 bg-surface border-white/10 animate-pulse h-48" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredApps.slice(0, 6).map((app) => (
              <Card key={app.id} className="p-6 bg-surface border-white/10 hover:border-primary/30 transition-all flex flex-col justify-between space-y-4 group">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-surface-low border border-white/10 flex items-center justify-center text-xl overflow-hidden shrink-0">
                      {app.icon ? (
                        <img src={app.icon} alt={app.name} className="w-full h-full object-cover" />
                      ) : (
                        '📱'
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {app.badge && app.badge !== 'NONE' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {app.badge.replace('_', ' ')}
                        </span>
                      )}
                      {app.isStudentProject && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          🎓 Student
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-content-primary group-hover:text-primary transition-colors">
                      {app.name}
                    </h3>
                    <p className="text-xs text-content-muted line-clamp-2 mt-1">
                      {app.shortDescription}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-content-muted">
                  <div className="flex items-center gap-1 font-mono">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span>{app.ratingAverage ? app.ratingAverage.toFixed(1) : '5.0'}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono">
                    <Download className="w-3.5 h-3.5 text-accent-cyan" />
                    <span>{app.downloadCount || 0} downloads</span>
                  </div>
                  <Link
                    to={`/apps/${app.slug || app.id}`}
                    className="font-semibold text-primary hover:text-accent-cyan"
                  >
                    View Details →
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 📝 Priority 21: Join Official Launch Waitlist */}
      <section id="waitlist" className="px-6 lg:px-8 max-w-4xl mx-auto">
        <Card className="relative p-8 lg:p-12 bg-gradient-to-br from-surface via-surface to-surface-low border-primary/30 shadow-2xl space-y-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center space-y-3 relative z-10">
            <div className="inline-flex p-2.5 rounded-2xl bg-primary/20 text-primary border border-primary/30 mx-auto">
              <Send className="w-6 h-6" />
            </div>
            <h2 className="text-2xl lg:text-4xl font-heading font-extrabold text-content-primary">
              Join the Official v1.0 Launch Waitlist
            </h2>
            <p className="text-xs sm:text-sm text-content-muted max-w-xl mx-auto">
              Be the first to know when AppOrbit transitions to full public release. Get exclusive access to featured promotions, developer webinars, and early ecosystem perks.
            </p>
          </div>

          {waitlistSuccess ? (
            <div className="p-8 text-center bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3 relative z-10">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
              <h3 className="text-lg font-bold text-content-primary">Spot Successfully Reserved!</h3>
              <p className="text-xs text-content-muted max-w-md mx-auto">
                Thank you for supporting independent developer ecosystems. We'll send milestone updates and early access invitations straight to your inbox.
              </p>
            </div>
          ) : (
            <form onSubmit={handleJoinWaitlist} className="space-y-5 relative z-10 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-content-primary">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={waitlistData.name}
                    onChange={(e) => setWaitlistData({ ...waitlistData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-low border border-white/10 text-content-primary focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-content-primary">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="alex@example.com"
                    value={waitlistData.email}
                    onChange={(e) => setWaitlistData({ ...waitlistData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-low border border-white/10 text-content-primary focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-content-primary">I am joining primarily as a:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['DEVELOPER', 'STUDENT', 'USER', 'CREATOR'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setWaitlistData({ ...waitlistData, role: r })}
                      className={`py-2 px-3 rounded-xl font-semibold border transition-all text-xs ${
                        waitlistData.role === r
                          ? 'bg-primary text-white border-primary shadow'
                          : 'bg-surface-low text-content-muted border-white/10 hover:border-white/20'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-content-primary">Interested Areas / Technologies</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleInterestToggle(tag)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                        waitlistData.interests.includes(tag)
                          ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40'
                          : 'bg-surface-low text-content-muted border border-white/5 hover:border-white/20'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-content-primary">What would you love to see in AppOrbit? (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Tell us what features would make this your dream publishing platform..."
                  value={waitlistData.feedback}
                  onChange={(e) => setWaitlistData({ ...waitlistData, feedback: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-low border border-white/10 text-content-primary focus:border-primary focus:outline-none"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={submittingWaitlist}
                className="w-full text-sm font-bold shadow-xl shadow-primary/30"
              >
                {submittingWaitlist ? 'Securing Spot...' : 'Claim Early Access Spot 🚀'}
              </Button>
            </form>
          )}
        </Card>
      </section>

      {/* 📰 Media & Press Callout */}
      <section className="px-6 lg:px-8 max-w-4xl mx-auto text-center space-y-3">
        <p className="text-xs text-content-muted">
          Looking for brand guidelines, founder mission, or press materials?{' '}
          <Link to="/press" className="font-semibold text-primary hover:text-accent-cyan underline">
            Visit the AppOrbit Press Kit →
          </Link>
        </p>
      </section>
    </div>
  );
};

export default PublicBetaLandingPage;
