import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

/**
 * AppOrbit High-Concurrency Load Testing Simulator (Phase 10)
 * Evaluates throughput, latency distribution (P50, P95, P99), and concurrency stability.
 */
export async function runLoadTest({ totalRequests = 100, concurrency = 10 } = {}) {
  console.log('===============================================================');
  console.log('   APPORBIT — PRODUCTION CONCURRENCY & LOAD TEST SUITE        ');
  console.log(`   Target: ${BASE_URL} | Total: ${totalRequests} | Concurrency: ${concurrency}`);
  console.log('===============================================================\n');

  const testEndpoints = [
    { name: 'Health Check', url: `${BASE_URL}/health` },
    { name: 'Readiness Probe', url: `${BASE_URL}/health/ready` },
    { name: 'Popular Apps Feed', url: `${BASE_URL}/apps/popular?limit=4` },
    { name: 'Trending Apps Feed', url: `${BASE_URL}/apps/trending?limit=4` },
    { name: 'Search Query', url: `${BASE_URL}/search?q=PulseGuard` },
    { name: 'Categories List', url: `${BASE_URL}/categories` },
  ];

  const latencies = [];
  let successful = 0;
  let failed = 0;

  const startTime = Date.now();

  async function executeRequest(index) {
    const endpoint = testEndpoints[index % testEndpoints.length];
    const reqStart = Date.now();
    try {
      const res = await fetch(endpoint.url);
      const reqDuration = Date.now() - reqStart;
      latencies.push(reqDuration);

      if (res.status >= 200 && res.status < 400) {
        successful++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  // Execute in batches up to concurrency limit
  const queue = Array.from({ length: totalRequests }, (_, i) => i);
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const taskIndex = queue.shift();
      if (taskIndex !== undefined) {
        await executeRequest(taskIndex);
      }
    }
  });

  await Promise.all(workers);

  const totalTimeSeconds = (Date.now() - startTime) / 1000;
  latencies.sort((a, b) => a - b);

  const getPercentile = (p) => {
    const idx = Math.min(latencies.length - 1, Math.floor((p / 100) * latencies.length));
    return latencies[idx] || 0;
  };

  const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1));
  const p50 = getPercentile(50);
  const p90 = getPercentile(90);
  const p95 = getPercentile(95);
  const p99 = getPercentile(99);
  const throughput = Math.round(totalRequests / totalTimeSeconds);

  console.log('--- Load Test Results ---');
  console.log(`✓ Total Requests:      ${totalRequests}`);
  console.log(`✓ Successful:          ${successful} (${((successful / totalRequests) * 100).toFixed(1)}%)`);
  console.log(`✓ Failed:              ${failed}`);
  console.log(`✓ Total Time:          ${totalTimeSeconds.toFixed(2)}s`);
  console.log(`✓ Throughput:          ${throughput} req/sec`);
  console.log(`✓ Mean Latency:        ${avgLatency}ms`);
  console.log(`✓ Median Latency (P50): ${p50}ms`);
  console.log(`✓ P90 Latency:         ${p90}ms`);
  console.log(`✓ P95 Latency:         ${p95}ms`);
  console.log(`✓ P99 Latency:         ${p99}ms\n`);

  const passed = failed === 0 && p95 < 1500;
  if (passed) {
    console.log('🚀 [LOAD TEST] Benchmark passed acceptable production thresholds.');
  } else {
    console.warn('⚠️ [LOAD TEST] Latencies or error rates exceeded production thresholds.');
  }

  return {
    totalRequests,
    successful,
    failed,
    throughput,
    avgLatency,
    p50,
    p95,
    p99,
    passed,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runLoadTest()
    .then((res) => process.exit(res.passed ? 0 : 1))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
