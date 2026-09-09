/**
 * AppOrbit Production Environment Validator (Phase 10)
 * Validates critical environment variables, data types, and security constraints at process boot.
 * Prevents application startup with invalid or insecure configurations.
 */

export const validateEnv = (sourceEnv = process.env, options = {}) => {
  let env = sourceEnv;
  let opts = options;

  // Handle call pattern validateEnv({ exitOnError: true }) vs validateEnv(customEnv, opts)
  if (sourceEnv && (sourceEnv.exitOnError !== undefined || sourceEnv.throwOnError !== undefined) && !sourceEnv.NODE_ENV && !sourceEnv.MONGODB_URI && !sourceEnv.PORT) {
    opts = sourceEnv;
    env = process.env;
  }

  const { exitOnError = true, throwOnError = false } = opts;
  const errors = [];
  const warnings = [];

  const nodeEnv = env.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production';
  const isStaging = nodeEnv === 'staging';
  const isTest = nodeEnv === 'test';

  // 1. Validate NODE_ENV
  const validEnvs = ['development', 'production', 'staging', 'test'];
  if (!validEnvs.includes(nodeEnv)) {
    warnings.push(`NODE_ENV is set to '${nodeEnv}'. Recommended values: ${validEnvs.join(', ')}`);
  }

  // 2. Validate PORT
  const port = parseInt(env.PORT || '5000', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push(`Invalid PORT: '${env.PORT}'. Must be an integer between 1 and 65535.`);
  }

  // 3. Validate MONGODB_URI
  const mongoUri = env.MONGODB_URI;
  if (!mongoUri) {
    errors.push('MONGODB_URI is required.');
  } else if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    errors.push(`MONGODB_URI must start with 'mongodb://' or 'mongodb+srv://'.`);
  }

  // 4. Validate JWT Secrets & Entropy
  const jwtSecret = env.JWT_SECRET;
  const refreshSecret = env.REFRESH_TOKEN_SECRET || env.JWT_REFRESH_SECRET;

  if (!jwtSecret) {
    errors.push('JWT_SECRET is required.');
  } else if ((isProd || isStaging) && jwtSecret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long in production/staging.');
  }

  if (!refreshSecret) {
    errors.push('REFRESH_TOKEN_SECRET (or JWT_REFRESH_SECRET) is required.');
  } else if ((isProd || isStaging) && refreshSecret.length < 32) {
    errors.push('REFRESH_TOKEN_SECRET must be at least 32 characters long in production/staging.');
  }

  if (jwtSecret && refreshSecret && jwtSecret === refreshSecret) {
    warnings.push('JWT_SECRET and REFRESH_TOKEN_SECRET should not be identical for defense-in-depth.');
  }

  // 5. Validate CLIENT_URL
  const clientUrl = env.CLIENT_URL;
  if (!clientUrl) {
    warnings.push(`CLIENT_URL not set; defaulting to 'http://localhost:5173'.`);
  } else {
    try {
      new URL(clientUrl);
    } catch {
      errors.push(`Invalid CLIENT_URL format: '${clientUrl}'. Must be a valid URI.`);
    }

    if (isProd && clientUrl.includes('localhost')) {
      warnings.push(`Production CLIENT_URL is set to localhost ('${clientUrl}'). Verify this is intentional.`);
    }
  }

  // 6. Redis Configuration Validation
  if (process.env.REDIS_URL) {
    try {
      new URL(process.env.REDIS_URL);
    } catch {
      warnings.push(`REDIS_URL is not a standard URL. Ensure it matches 'redis://' or 'rediss://'.`);
    }
  } else if (isProd) {
    warnings.push('REDIS_URL is not defined. Application will operate with in-memory cache/rate-limiting fallback.');
  }

  // 7. Sentry Error Monitoring Validation
  if (process.env.SENTRY_DSN) {
    try {
      new URL(process.env.SENTRY_DSN);
    } catch {
      warnings.push(`Invalid SENTRY_DSN format. Sentry monitoring will be bypassed.`);
    }
  }

  // 8. Storage Configuration Validation
  const storageProvider = process.env.STORAGE_PROVIDER || 'local-private';
  if (storageProvider === 's3') {
    if (!process.env.AWS_S3_BUCKET) errors.push('AWS_S3_BUCKET is required when STORAGE_PROVIDER=s3.');
    if (!process.env.AWS_REGION) errors.push('AWS_REGION is required when STORAGE_PROVIDER=s3.');
  }

  const isValid = errors.length === 0;

  if (!isValid) {
    if (throwOnError) {
      throw new Error(`Environment Configuration Validation Failed: ${errors.join('; ')}`);
    }

    console.error('\n❌ [FATAL] Environment Configuration Validation Failed:');
    errors.forEach((err) => console.error(`  - ${err}`));
    console.error('\nPlease fix the configuration in your .env file before starting the server.\n');

    if (exitOnError && !isTest) {
      process.exit(1);
    }
  } else if (warnings.length > 0 && !isTest) {
    console.warn('\n⚠️ [WARN] Environment Configuration Notices:');
    warnings.forEach((warn) => console.warn(`  - ${warn}`));
    console.warn('');
  }

  return {
    isValid,
    errors,
    warnings,
    environment: nodeEnv,
    port,
    PORT: port,
    NODE_ENV: nodeEnv,
  };
};

export default validateEnv;
