import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Globe,
  GitBranch,
  ExternalLink,
  Calendar,
  Layers,
  ArrowLeft,
  Briefcase,
  Package,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import AppCard from '../../components/apps/AppCard';
import PageLoader from '../../components/common/PageLoader';
import NotFound from '../../components/common/NotFound';
import { getDeveloperProfile } from '../../api/developersApi';
import { formatDate } from '../../utils/formatters';

export const DeveloperProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [developer, setDeveloper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await getDeveloperProfile(id);
        if (res.data?.developer) {
          setDeveloper(res.data.developer);
          document.title = `${res.data.developer.name} — Developer Profile | AppOrbit`;
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error('Failed to load developer profile:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfile();
    }
  }, [id]);

  if (loading) {
    return <PageLoader message="Loading developer profile..." />;
  }

  if (notFound || !developer) {
    return (
      <NotFound
        title="Developer Not Found"
        message="The requested developer profile does not exist or is currently inactive."
      />
    );
  }

  const isVerified = developer.verificationStatus === 'VERIFIED';

  return (
    <div className="max-w-content-max mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[85vh]">
      {/* Back navigation */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-mono text-content-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Developer Hero Profile Header Card */}
      <div className="rounded-3xl bg-surface border border-white/10 p-6 sm:p-10 mb-12 shadow-glass relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start gap-8 relative z-10">
          {/* Avatar */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-surface-elevated border border-white/15 flex items-center justify-center text-4xl shadow-card overflow-hidden flex-shrink-0">
            {developer.profileImage ? (
              <img
                src={developer.profileImage}
                alt={developer.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-heading font-extrabold text-primary text-4xl">
                {developer.name.charAt(0)}
              </span>
            )}
          </div>

          {/* Profile Identity Details */}
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-content-primary">
                {developer.name}
              </h1>
              {isVerified && (
                <Badge variant="published" dot>
                  Verified Developer
                </Badge>
              )}
            </div>

            {developer.companyName && (
              <div className="flex items-center gap-1.5 text-xs text-content-muted">
                <Briefcase className="w-3.5 h-3.5 text-content-dim" />
                <span>{developer.companyName}</span>
              </div>
            )}

            {developer.bio && (
              <p className="text-sm text-content-secondary max-w-2xl leading-relaxed mt-1">
                {developer.bio}
              </p>
            )}

            {/* Links and Metadata */}
            <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-white/5 text-xs font-mono text-content-dim">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-content-muted" />
                <span>Member since {formatDate(developer.memberSince)}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-accent-cyan" />
                <span>{developer.publishedAppsCount} Published Apps</span>
              </div>

              {developer.website && (
                <a
                  href={developer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-primary hover:text-accent-cyan transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span>Website</span>
                </a>
              )}

              {developer.githubProfile && (
                <a
                  href={developer.githubProfile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-primary hover:text-accent-cyan transition-colors"
                >
                  <GitBranch className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Published Applications Section */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div>
            <h2 className="text-2xl font-extrabold font-heading text-content-primary">
              Published Applications
            </h2>
            <p className="text-xs text-content-muted mt-1">
              Public Android packages maintained and distributed by {developer.name}.
            </p>
          </div>
          <span className="text-xs font-mono text-content-dim">
            {developer.apps?.length || 0} Total
          </span>
        </div>

        {developer.apps && developer.apps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {developer.apps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-content-muted bg-surface rounded-2xl border border-white/5">
            This developer has not published any public applications yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperProfilePage;
