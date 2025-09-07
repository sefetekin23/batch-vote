import { Redis } from "@upstash/redis";

// Create Redis client (optional for MVP)
let redis: Redis | null = null;

if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
) {
    redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
}

export { redis };

/**
 * Rate limiting for votes
 * Returns true if request should be allowed, false if rate limited
 */
export async function checkVoteRateLimit(
    token: string,
    ip: string,
    voterKey: string
): Promise<{ allowed: boolean; remaining?: number }> {
    if (!redis) {
        // If Redis is not configured, allow all requests
        return { allowed: true };
    }

    try {
        const key = `vote:${token}:${ip}`;
        const dailyKey = `daily:${token}:${voterKey}`;

        // Check per-IP rate limit (1 request/sec, burst of 5)
        const current = await redis.incr(key);
        if (current === 1) {
            await redis.expire(key, 1); // 1 second window
        }

        if (current > 5) {
            return { allowed: false, remaining: 0 };
        }

        // Check daily limit per voter (2x the number of items in batch)
        // For now, we'll use a reasonable default of 100 votes per day
        const dailyCount = await redis.incr(dailyKey);
        if (dailyCount === 1) {
            await redis.expire(dailyKey, 86400); // 24 hours
        }

        if (dailyCount > 100) {
            return { allowed: false, remaining: 0 };
        }

        return { allowed: true, remaining: 5 - current };
    } catch (error) {
        console.error("Rate limit check failed:", error);
        // If Redis fails, allow the request
        return { allowed: true };
    }
}

/**
 * Simple in-memory rate limiting fallback
 */
const memoryStore = new Map<string, { count: number; resetTime: number }>();

export function checkMemoryRateLimit(
    key: string,
    limit: number,
    windowMs: number
): boolean {
    const now = Date.now();
    const record = memoryStore.get(key);

    if (!record || now > record.resetTime) {
        memoryStore.set(key, { count: 1, resetTime: now + windowMs });
        return true;
    }

    if (record.count >= limit) {
        return false;
    }

    record.count++;
    return true;
}
