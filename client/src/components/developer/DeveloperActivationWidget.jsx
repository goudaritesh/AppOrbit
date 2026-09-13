import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  Rocket,
  UserCheck,
  FilePlus,
  UploadCloud,
  Send,
} from 'lucide-react';

export const DeveloperActivationWidget = ({ apps = [], profile = {} }) => {
  const hasProfile = Boolean(profile?.bio || profile?.githubUrl || profile?.portfolioUrl);
  const hasApp = apps.length > 0;
  const hasApk = apps.some((app) => app.currentVersion || app.versions?.length > 0);
  const hasSubmitted = apps.some((app) =>
    ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED'].includes(app.status)
  );

  const steps = [
    {
      id: 1,
      title: 'Create Account',
      description: 'Join the AppOrbit developer ecosystem',
      completed: true,
      link: null,
      icon: <UserCheck className="w-4 h-4" />,
    },
    {
      id: 2,
      title: 'Complete Profile',
      description: 'Add your developer bio, avatar & links',
      completed: hasProfile,
      link: '/developer/profile',
      icon: <UserCheck className="w-4 h-4" />,
    },
    {
      id: 3,
      title: 'Add App Details',
      description: 'Name, description, icon & screenshots',
      completed: hasApp,
      link: '/developer/apps/create',
      icon: <FilePlus className="w-4 h-4" />,
    },
    {
      id: 4,
      title: 'Upload Android APK',
      description: 'Upload your verified package binary',
      completed: hasApk,
      link: hasApp ? `/developer/apps/${apps[0]._id}/versions` : '/developer/apps/create',
      icon: <UploadCloud className="w-4 h-4" />,
    },
    {
      id: 5,
      title: 'Submit for Review',
      description: 'Publish your app to the public marketplace',
      completed: hasSubmitted,
      link: hasApp ? `/developer/apps/${apps[0]._id}` : '/developer/apps/create',
      icon: <Send className="w-4 h-4" />,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const percentComplete = Math.round((completedCount / steps.length) * 100);

  // If all 5 steps are finished, developer is fully activated!
  if (completedCount === 5) {
    return (
      <Card className="p-4 bg-gradient-to-r from-emerald-500/10 via-surface to-surface border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-content-primary flex items-center gap-2">
              <span>Creator Status: 100% Activated</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400">
                LIVE
              </span>
            </div>
            <p className="text-xs text-content-muted">
              You're a verified AppOrbit creator! Keep updating your apps and monitor live downloads.
            </p>
          </div>
        </div>

        <Link to="/developer/apps/create">
          <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs">
            + Publish Another App
          </Button>
        </Link>
      </Card>
    );
  }

  // Next action step
  const nextStep = steps.find((s) => !s.completed);

  return (
    <Card className="p-6 bg-surface border-white/10 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-content-primary">
              First App Activation Journey
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-primary/20 text-primary border border-primary/30">
              {percentComplete}% Complete
            </span>
          </div>
          <p className="text-xs text-content-muted max-w-xl">
            Complete your onboarding steps to put your application in front of real Android users and beta testers.
          </p>
        </div>

        {nextStep && nextStep.link && (
          <Link to={nextStep.link}>
            <Button variant="primary" size="sm" className="text-xs">
              Continue: {nextStep.title}
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        )}
      </div>

      {/* Progress Bar */}
      <div className="h-2 rounded-full bg-surface-low overflow-hidden border border-white/5">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent-cyan rounded-full transition-all duration-500"
          style={{ width: `${percentComplete}%` }}
        />
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`p-3 rounded-xl border transition-all flex flex-col justify-between space-y-2 ${
              step.completed
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-surface-low border-white/5 opacity-80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-content-muted">
                Step {step.id}
              </span>
              {step.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Circle className="w-4 h-4 text-content-muted/40" />
              )}
            </div>

            <div>
              <h4 className={`text-xs font-semibold ${step.completed ? 'text-content-primary' : 'text-content-muted'}`}>
                {step.title}
              </h4>
              <p className="text-[10px] text-content-muted mt-0.5 leading-tight">
                {step.description}
              </p>
            </div>

            {!step.completed && step.link && (
              <Link
                to={step.link}
                className="text-[11px] font-semibold text-primary hover:text-accent-cyan flex items-center gap-1 pt-1"
              >
                Start now <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default DeveloperActivationWidget;
