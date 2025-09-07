import { ItemWithVotes } from "@/types";

/**
 * Calculate Wilson score confidence interval lower bound
 * This is used for ranking items with keep/cut votes
 */
export function calculateWilsonScore(
    positiveVotes: number,
    totalVotes: number,
    confidence: number = 1.96 // 95% confidence
): number {
    if (totalVotes === 0) return 0;

    const phat = positiveVotes / totalVotes;
    const n = totalVotes;
    const z = confidence;

    const denominator = 1 + (z * z) / n;
    const center = phat + (z * z) / (2 * n);
    const margin = z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * n)) / n);

    return (center - margin) / denominator;
}

/**
 * Rank items using Wilson score lower bound
 * Items with fewer than 3 votes are deprioritized
 */
export function rankItems(items: ItemWithVotes[]): ItemWithVotes[] {
    return items
        .map((item) => ({
            ...item,
            wilsonLower: calculateWilsonScore(item.keep, item.total),
        }))
        .sort((a, b) => {
            // If both have < 3 votes, sort by keep count then created_at
            if (a.total < 3 && b.total < 3) {
                if (a.keep !== b.keep) return b.keep - a.keep;
                return (
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime()
                );
            }

            // If only one has < 3 votes, prioritize the one with more votes
            if (a.total < 3) return 1;
            if (b.total < 3) return -1;

            // Both have >= 3 votes, sort by Wilson score
            return b.wilsonLower - a.wilsonLower;
        });
}

/**
 * Generate a secure random token for batch URLs
 * Uses base58 encoding (no ambiguous characters like 0, O, I, l)
 */
export function generateBatchToken(length: number = 12): string {
    const alphabet =
        "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let result = "";

    for (let i = 0; i < length; i++) {
        result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }

    return result;
}

/**
 * Generate a voter key (UUID) for anonymous voting
 */
export function generateVoterKey(): string {
    return crypto.randomUUID();
}

/**
 * Shuffle array with a deterministic seed
 * Used to show items in consistent random order per voter
 */
export function shuffleWithSeed<T>(array: T[], seed: string): T[] {
    const shuffled = [...array];
    let hash = 0;

    // Simple hash function
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    // Use the hash as seed for shuffling
    for (let i = shuffled.length - 1; i > 0; i--) {
        hash = (hash * 9301 + 49297) % 233280; // Simple LCG
        const j = Math.floor((hash / 233280) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

/**
 * Check if a batch is expired
 */
export function isBatchExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
}

/**
 * Transform Cloudinary URL for thumbnail
 */
export function getCloudinaryThumbnail(
    url: string,
    width: number = 600
): string {
    if (!url.includes("cloudinary.com")) return url;

    // Insert transformation parameters
    const parts = url.split("/upload/");
    if (parts.length !== 2) return url;

    const transformations = `q_auto,f_auto,w_${width}`;
    return `${parts[0]}/upload/${transformations}/${parts[1]}`;
}
