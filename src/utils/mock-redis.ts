// src/utils/mock-redis.ts
export class MockRedis {
  status = 'ready';

  on(event: string, callback: Function) {
    // Mock event listeners
    if (event === 'connect') {
      setTimeout(() => callback(), 10);
    }
    return this;
  }

  async ping() {
    return 'PONG';
  }

  async get(_key: string) {
    return null;
  }

  async set(_key: string, _value: string) {
    return 'OK';
  }

  async incr(_key: string) {
    return 1;
  }

  async expire(_key: string, _seconds: number) {
    return 1;
  }

  async quit() {
    return 'OK';
  }

  // Add other methods as needed
}

// Mock Redis functions
export const mockRedisFunctions = {
  incrementKey: async (key: string, _windowMs: number): Promise<number> => {
    console.log(`[MockRedis] incrementKey: ${key}`);
    return 1;
  },

  getRemainingRequests: async (
    key: string,
    maxRequests: number,
    _windowMs: number
  ): Promise<number> => {
    console.log(`[MockRedis] getRemainingRequests: ${key}`);
    return maxRequests;
  },

  getResetTime: async (_key: string, windowMs: number): Promise<number> => {
    return Date.now() + windowMs;
  },
};
