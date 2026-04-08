// In-memory rate limiter for login brute-force protection
// Resets on server restart — acceptable for this use case

const loginAttempts = new Map();

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

// Cleanup stale entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of loginAttempts.entries()) {
      if (now - data.lastAttempt > LOCK_DURATION_MS * 2) {
        loginAttempts.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

export function checkRateLimit(ip) {
  const now = Date.now();
  const data = loginAttempts.get(ip);

  if (!data) return { allowed: true };

  // If locked and lock hasn't expired
  if (data.count >= MAX_ATTEMPTS) {
    const elapsed = now - data.lastAttempt;
    if (elapsed < LOCK_DURATION_MS) {
      const remainingMs = LOCK_DURATION_MS - elapsed;
      const remainingMin = Math.ceil(remainingMs / 60000);
      return { allowed: false, remainingMin };
    }
    // Lock expired — reset
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedAttempt(ip) {
  const now = Date.now();
  const data = loginAttempts.get(ip) || { count: 0, lastAttempt: now };
  data.count += 1;
  data.lastAttempt = now;
  loginAttempts.set(ip, data);
}

export function resetAttempts(ip) {
  loginAttempts.delete(ip);
}
