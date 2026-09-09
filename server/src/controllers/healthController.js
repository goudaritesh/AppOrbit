import mongoose from 'mongoose';
import { cacheService } from '../services/cache/cacheService.js';

const startTime = Date.now();

/**
 * @desc    Basic platform health indicator
 * @route   GET /api/health
 * @access  Public
 */
export const getHealth = async (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    requestId: req.id || null,
  });
};

/**
 * @desc    Kubernetes / Docker Liveness probe (verifies process is executing)
 * @route   GET /api/health/live
 * @access  Public
 */
export const getLiveness = async (req, res) => {
  res.status(200).json({
    status: 'live',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  });
};

/**
 * @desc    Kubernetes / Docker Readiness probe (verifies database, cache & subsystems)
 * @route   GET /api/health/ready
 * @access  Public
 */
export const getReadiness = async (req, res) => {
  const checks = {
    database: { status: 'down', latencyMs: null },
    cache: { status: 'down', provider: 'unknown' },
    memory: { status: 'ok', usedMb: null },
  };

  let isReady = true;

  // 1. Database Connectivity Probe
  try {
    const dbStart = Date.now();
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      checks.database = {
        status: 'connected',
        latencyMs: Date.now() - dbStart,
      };
    } else {
      checks.database.status = 'disconnected';
      isReady = false;
    }
  } catch (err) {
    checks.database = {
      status: 'error',
      message: err.message,
    };
    isReady = false;
  }

  // 2. Cache / Redis Probe
  try {
    const cacheStatus = cacheService.getStatus();
    checks.cache = {
      status: cacheStatus.connected ? 'connected' : 'degraded',
      provider: cacheStatus.provider,
    };
  } catch (err) {
    checks.cache = {
      status: 'error',
      provider: 'none',
      message: err.message,
    };
  }

  // 3. Process Memory
  const mem = process.memoryUsage();
  checks.memory = {
    status: 'ok',
    rssMb: Math.round(mem.rss / (1024 * 1024)),
    heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
  };

  const statusCode = isReady ? 200 : 503;

  res.status(statusCode).json({
    status: isReady ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks,
  });
};

export default {
  getHealth,
  getLiveness,
  getReadiness,
};
