import { LRUCache } from 'lru-cache';

type RateLimitOptions = {
    interval: number; // Time window in ms
    uniqueTokenPerInterval: number; // Max requests per interval
};

export function rateLimit(options: RateLimitOptions) {
    const tokenCache = new LRUCache({
        max: options.uniqueTokenPerInterval || 500,
        ttl: options.interval || 60000,
        ttlResolution: 1000,
    });

    return {
        check: (limit: number, token: string) =>
            new Promise<void>((resolve, reject) => {
                const tokenCount = (tokenCache.get(token) as number[]) || [0];
                if (tokenCount[0] === 0) {
                    tokenCache.set(token, [1]);
                    resolve();
                } else {
                    tokenCount[0] += 1;
                    tokenCache.set(token, tokenCount);
                    if (tokenCount[0] <= limit) {
                        resolve();
                    } else {
                        reject(new Error('Rate limit exceeded'));
                    }
                }
            }),
    };
}
