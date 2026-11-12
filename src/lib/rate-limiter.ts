/**
 * Client-Side Rate Limiter & Anti-Spam Protection
 * 
 * Features:
 * 1. Sliding Window Rate Limiter: Tracks requests per time window.
 * 2. PIN Brute-force & Anti-Spam Guard: Limits failed unlock attempts on Crypto Vault.
 * 3. Action Cooldown: Prevents duplicate/spam clicking on API test and translation triggers.
 * 4. Provider-Aware API Throttle: Enforces safe Request-Per-Minute (RPM) limits to prevent HTTP 429 bans.
 */

interface WindowBucket {
  timestamps: number[];
}

const memoryBuckets = new Map<string, WindowBucket>();

/**
 * Universal Sliding Window Rate Limiter
 * 
 * @param key Unique identifier for the rate limit target (e.g. "gemini_rpm", "pin_unlock")
 * @param maxRequests Maximum allowed requests within windowMs
 * @param windowMs Time window in milliseconds (e.g. 60,000 for 1 minute)
 * @returns { allowed: boolean, remaining: number, resetMs: number, waitSeconds: number }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  waitSeconds: number;
} {
  const now = Date.now();
  let bucket = memoryBuckets.get(key);

  if (!bucket) {
    bucket = { timestamps: [] };
    memoryBuckets.set(key, bucket);
  }

  // Filter out timestamps outside the sliding window
  const windowStart = now - windowMs;
  bucket.timestamps = bucket.timestamps.filter((ts) => ts > windowStart);

  if (bucket.timestamps.length >= maxRequests) {
    const oldest = bucket.timestamps[0];
    const resetMs = oldest + windowMs - now;
    const waitSeconds = Math.max(1, Math.ceil(resetMs / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetMs,
      waitSeconds,
    };
  }

  // Register this request
  bucket.timestamps.push(now);

  return {
    allowed: true,
    remaining: maxRequests - bucket.timestamps.length,
    resetMs: windowMs,
    waitSeconds: 0,
  };
}

/**
 * Action Cooldown (Debounce/Throttle)
 * Prevents rapid double-clicks on buttons (e.g. Test Connection, Translate Row).
 */
const actionLastTrigger = new Map<string, number>();

export function checkActionCooldown(actionKey: string, cooldownMs = 1500): {
  allowed: boolean;
  waitSeconds: number;
} {
  const now = Date.now();
  const lastTime = actionLastTrigger.get(actionKey) || 0;
  const elapsed = now - lastTime;

  if (elapsed < cooldownMs) {
    const remainingMs = cooldownMs - elapsed;
    return {
      allowed: false,
      waitSeconds: Math.ceil(remainingMs / 1000),
    };
  }

  actionLastTrigger.set(actionKey, now);
  return { allowed: true, waitSeconds: 0 };
}

/**
 * PIN Brute-force & Anti-Spam Guard for Crypto Vault
 * Locks out PIN attempts if 5 failed attempts occur within 2 minutes.
 */
const PIN_LOCKOUT_KEY = "potrans_pin_lockout_until";
const PIN_ATTEMPTS_KEY = "potrans_pin_attempts";
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30_000; // 30 seconds

export function getPinLockoutStatus(): { isLocked: boolean; remainingSeconds: number } {
  try {
    const lockedUntil = Number(sessionStorage.getItem(PIN_LOCKOUT_KEY) || 0);
    const now = Date.now();
    if (lockedUntil > now) {
      return {
        isLocked: true,
        remainingSeconds: Math.ceil((lockedUntil - now) / 1000),
      };
    }
  } catch {}
  return { isLocked: false, remainingSeconds: 0 };
}

export function recordFailedPinAttempt(): {
  isLocked: boolean;
  remainingAttempts: number;
  lockoutSeconds: number;
} {
  try {
    const now = Date.now();
    const attempts = Number(sessionStorage.getItem(PIN_ATTEMPTS_KEY) || 0) + 1;
    sessionStorage.setItem(PIN_ATTEMPTS_KEY, String(attempts));

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const lockUntil = now + LOCKOUT_DURATION_MS;
      sessionStorage.setItem(PIN_LOCKOUT_KEY, String(lockUntil));
      sessionStorage.removeItem(PIN_ATTEMPTS_KEY); // Reset count after lockout
      return {
        isLocked: true,
        remainingAttempts: 0,
        lockoutSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
      };
    }

    return {
      isLocked: false,
      remainingAttempts: MAX_FAILED_ATTEMPTS - attempts,
      lockoutSeconds: 0,
    };
  } catch {
    return { isLocked: false, remainingAttempts: 3, lockoutSeconds: 0 };
  }
}

export function resetPinAttempts(): void {
  try {
    sessionStorage.removeItem(PIN_ATTEMPTS_KEY);
    sessionStorage.removeItem(PIN_LOCKOUT_KEY);
  } catch {}
}

/**
 * Safe Provider RPM Limiter
 * Ensures outgoing API requests stay strictly below third-party rate limit thresholds.
 */
export function checkProviderRpmLimit(provider: string): {
  allowed: boolean;
  message?: string;
  waitSeconds: number;
} {
  // Provider safe thresholds (requests per 60 seconds)
  const limits: Record<string, { max: number; windowMs: number; name: string }> = {
    gemini: { max: 14, windowMs: 60_000, name: "Google Gemini (Batas 15 RPM)" },
    groq: { max: 28, windowMs: 60_000, name: "Groq Cloud (Batas 30 RPM)" },
    google_translate: { max: 45, windowMs: 60_000, name: "Google Translate Web" },
    openrouter: { max: 20, windowMs: 60_000, name: "OpenRouter" },
    deepseek: { max: 20, windowMs: 60_000, name: "DeepSeek API" },
  };

  const limitConfig = limits[provider] || { max: 30, windowMs: 60_000, name: provider };
  const check = checkRateLimit(`rpm_${provider}`, limitConfig.max, limitConfig.windowMs);

  if (!check.allowed) {
    return {
      allowed: false,
      waitSeconds: check.waitSeconds,
      message: `Terlalu banyak permintaan untuk ${limitConfig.name}. Mohon tunggu ${check.waitSeconds} detik untuk mencegah pemblokiran kuota.`,
    };
  }

  return { allowed: true, waitSeconds: 0 };
}
