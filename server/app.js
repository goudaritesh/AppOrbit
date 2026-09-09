import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import apiRouter from './src/routes/index.js';
import healthRoutes from './src/routes/healthRoutes.js';
import requestCorrelation from './src/middleware/requestCorrelation.js';
import mongoSanitizer from './src/middleware/mongoSanitizer.js';
import { notFoundHandler } from './src/middleware/notFoundHandler.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { maintenanceMiddleware } from './src/middleware/maintenanceMiddleware.js';
import { getSitemapXml, getRobotsTxt } from './src/controllers/sitemapController.js';

const app = express();

// Trust reverse proxies (important for rate limiting and secure cookies behind proxies)
app.set('trust proxy', 1);

// Attach Request Correlation ID & Performance Timer
app.use(requestCorrelation);

/* ==========================================================================
   1. DEFENSE-IN-DEPTH SECURITY HEADERS (Helmet)
   ========================================================================== */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'https:', 'wss:', 'ws:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", 'https:'],
        frameSrc: ["'self'", 'https://www.youtube.com', 'https://player.vimeo.com', 'https://api.razorpay.com'],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    frameguard: { action: 'sameorigin' },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

/* ==========================================================================
   2. CORS CONFIGURATION
   ========================================================================== */
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error(`CORS origin '${origin}' not allowed by policy`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id', 'X-Cache', 'RateLimit-Limit', 'RateLimit-Remaining'],
};

app.use(cors(corsOptions));

/* ==========================================================================
   3. HTTP REQUEST LOGGING (Morgan)
   ========================================================================== */
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

/* ==========================================================================
   4. RATE LIMITING (express-rate-limit)
   ========================================================================== */
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 1000, // Max requests per windowMs
  standardHeaders: true, // Return standard RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: {
    success: false,
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  skip: (req) => {
    if (process.env.NODE_ENV === 'test') return true;
    const ip = req.ip || req.connection?.remoteAddress || '';
    return ip === '127.0.0.1' || ip === '::1' || ip.includes('127.0.0.1') || ip.endsWith('127.0.0.1');
  },
});

// Apply rate limiting to all /api and /api/v1 routes
app.use('/api', limiter);
app.use('/api/v1', limiter);

/* ==========================================================================
   5. BODY PARSING, COOKIES & NOSQL INJECTION DEFENSE
   ========================================================================== */
app.use(
  express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitizer);

/* ==========================================================================
   6. API ROUTES & MAINTENANCE
   ========================================================================== */
// SEO Endpoints (root & /api aliases)
app.get('/sitemap.xml', getSitemapXml);
app.get('/robots.txt', getRobotsTxt);
app.get('/api/sitemap.xml', getSitemapXml);
app.get('/api/robots.txt', getRobotsTxt);

// Direct root health endpoints (/health, /health/live, /health/ready)
app.use('/health', healthRoutes);

app.use(maintenanceMiddleware);

// Primary and Versioned API endpoints
app.use('/api', apiRouter);
app.use('/api/v1', apiRouter);

/* ==========================================================================
   7. 404 & GLOBAL ERROR HANDLING
   ========================================================================== */
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
