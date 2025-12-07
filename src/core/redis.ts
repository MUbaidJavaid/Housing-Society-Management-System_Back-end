// src/core/redis.ts
import Redis from 'ioredis';
import config from '../config';
import { AppLogger } from './logger';

const logger = new AppLogger('Redis');

class RedisClient {
  private static instance: RedisClient;
  private client: Redis;

  private constructor() {
    this.client = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy: times => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.setupEventListeners();
  }

  static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  private setupEventListeners(): void {
    this.client.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    this.client.on('error', error => {
      logger.error('Redis connection error:', error);
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });
  }

  async set(key: string, value: string | number | object, expiry?: number): Promise<void> {
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

    if (expiry) {
      await this.client.setex(key, expiry, stringValue);
    } else {
      await this.client.set(key, stringValue);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
    logger.info('Redis disconnected gracefully');
  }

  getClient(): Redis {
    return this.client;
  }
}

export const redisClient = RedisClient.getInstance();
