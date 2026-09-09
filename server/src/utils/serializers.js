/**
 * Data Serializer Module (Phase 3 Marketplace Protection)
 * Guarantees that internal database fields, admin notes, APK storage paths,
 * developer emails, and phone numbers are never leaked over public REST APIs.
 */

/**
 * Serializes an Application document into a safe public response representation.
 *
 * @param {Object} app - Mongoose document or plain JS object
 * @returns {Object} Sanitized public app representation
 */
export const serializePublicApp = (app) => {
  if (!app) return null;

  const raw = app.toObject ? app.toObject() : app;

  // Developer object sanitization (strip private credentials)
  let safeDeveloper = null;
  if (raw.developer) {
    if (typeof raw.developer === 'object' && raw.developer._id) {
      safeDeveloper = {
        id: raw.developer._id.toString(),
        name: raw.developer.name || 'Anonymous Developer',
        profileImage: raw.developer.profileImage || '',
        bio: raw.developer.bio || '',
        githubUrl: raw.developer.githubUrl || '',
        portfolioUrl: raw.developer.portfolioUrl || '',
        verificationStatus: raw.verificationStatus || 'UNVERIFIED',
      };
    } else {
      safeDeveloper = { id: raw.developer.toString() };
    }
  }

  // Category object sanitization
  let safeCategory = null;
  if (raw.category) {
    if (typeof raw.category === 'object' && raw.category._id) {
      safeCategory = {
        id: raw.category._id.toString(),
        name: raw.category.name,
        slug: raw.category.slug,
        icon: raw.category.icon || '📱',
        description: raw.category.description || '',
      };
    } else {
      safeCategory = { id: raw.category.toString() };
    }
  }

  return {
    id: raw._id.toString(),
    name: raw.name,
    slug: raw.slug,
    shortDescription: raw.shortDescription,
    description: raw.description,
    icon: raw.icon || '',
    developer: safeDeveloper,
    category: safeCategory,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    platform: raw.platform || 'ANDROID',
    verificationStatus: raw.verificationStatus || 'UNVERIFIED',
    features: Array.isArray(raw.features) ? raw.features : [],
    technologies: Array.isArray(raw.technologies) ? raw.technologies : [],
    screenshots: Array.isArray(raw.screenshots)
      ? raw.screenshots.map((s) => ({
          url: s.url,
          alt: s.alt || '',
          order: s.order || 0,
        }))
      : [],
    demoVideo: raw.demoVideo?.url
      ? {
          type: raw.demoVideo.type || 'youtube',
          url: raw.demoVideo.url,
          provider: raw.demoVideo.provider || 'youtube',
        }
      : null,
    githubUrl: raw.githubUrl || '',
    demoUrl: raw.demoUrl || '',
    currentVersion: raw.currentVersion
      ? {
          id: raw.currentVersion._id ? raw.currentVersion._id.toString() : undefined,
          version: raw.currentVersion.version || raw.currentVersion.versionName || '1.0.0',
          versionName: raw.currentVersion.versionName || raw.currentVersion.version || '1.0.0',
          versionCode: raw.currentVersion.versionCode || 1,
          releaseNotes: raw.currentVersion.releaseNotes || '',
          releaseDate: raw.currentVersion.releaseDate || raw.currentVersion.createdAt || raw.createdAt,
          fileSize:
            typeof raw.currentVersion.fileSize === 'number'
              ? `${(raw.currentVersion.fileSize / (1024 * 1024)).toFixed(1)} MB`
              : raw.currentVersion.fileSize || '20.0 MB',
          fileSizeBytes:
            typeof raw.currentVersion.fileSize === 'number' ? raw.currentVersion.fileSize : null,
          minAndroid: raw.currentVersion.minAndroid || 'Android 8.0 (API 26)',
          securityStatus: raw.currentVersion.securityStatus || 'PASSED',
          sha256: raw.currentVersion.sha256 || raw.currentVersion.fileHash || '',
        }
      : null,
    downloadCount: raw.downloadCount || 0,
    viewCount: raw.viewCount || 0,
    ratingAverage: raw.ratingAverage || 0,
    ratingCount: raw.ratingCount || 0,
    featured: Boolean(raw.featured),
    publishedAt: raw.publishedAt || raw.createdAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
};

/**
 * Serializes a Category document into a safe public response representation.
 *
 * @param {Object} category
 * @returns {Object}
 */
export const serializePublicCategory = (category) => {
  if (!category) return null;
  const raw = category.toObject ? category.toObject() : category;

  return {
    id: raw._id.toString(),
    name: raw.name,
    slug: raw.slug,
    description: raw.description || '',
    icon: raw.icon || '📱',
    image: raw.image || '',
    order: raw.order || 0,
    appCount: raw.appCount || 0,
  };
};

/**
 * Serializes public developer information and their published applications.
 *
 * @param {Object} user - User document
 * @param {Object} profile - DeveloperProfile document (if available)
 * @param {Array} apps - Array of published applications
 * @returns {Object} Public developer profile
 */
export const serializePublicDeveloper = (user, profile = null, apps = []) => {
  if (!user) return null;

  const rawUser = user.toObject ? user.toObject() : user;
  const rawProfile = profile && profile.toObject ? profile.toObject() : profile || {};

  const verificationStatus =
    rawUser.verificationStatus || rawProfile.verificationStatus || 'UNVERIFIED';
  const verificationLevel =
    rawUser.verificationLevel || (verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'UNVERIFIED');

  return {
    id: rawUser._id.toString(),
    name: rawUser.name,
    username:
      rawUser.username ||
      (rawUser.name ? rawUser.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'developer'),
    profileImage: rawUser.profileImage || '',
    bio: rawProfile.developerBio || rawUser.bio || '',
    companyName: rawProfile.companyName || '',
    website: rawProfile.website || '',
    githubProfile: rawProfile.githubProfile || rawUser.githubUrl || '',
    portfolioUrl: rawProfile.portfolioUrl || rawUser.portfolioUrl || '',
    verificationStatus,
    verificationLevel,
    emailVerified: Boolean(rawUser.emailVerified),
    isVerified: Boolean(
      rawUser.isVerified || verificationStatus === 'VERIFIED' || verificationLevel === 'TRUSTED'
    ),
    memberSince: rawUser.createdAt,
    publishedAppsCount: apps.length,
    apps: apps.map(serializePublicApp),
  };
};
