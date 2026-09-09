/**
 * NoSQL Injection Sanitization Middleware (Phase 10)
 * Recursively cleans query parameters, request bodies, and route params by removing
 * malicious MongoDB operator injection patterns (e.g. $where, $gt, $ne, or dot-notation keys).
 */

function sanitizeObject(target) {
  if (!target || typeof target !== 'object') return target;

  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      if (typeof target[i] === 'object' && target[i] !== null) {
        sanitizeObject(target[i]);
      }
    }
    return target;
  }

  for (const key of Object.keys(target)) {
    // Prohibit keys starting with $ or containing dots (MongoDB operators / path pollution)
    if (key.startsWith('$') || key.includes('.')) {
      delete target[key];
    } else if (typeof target[key] === 'object' && target[key] !== null) {
      sanitizeObject(target[key]);
      if (Object.keys(target[key]).length === 0 && !Array.isArray(target[key])) {
        delete target[key];
      }
    }
  }

  return target;
}

export const mongoSanitizer = (req, _res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
};

export default mongoSanitizer;
