import Redis from 'ioredis';
import { config } from '../config/index.js';

class RedisStorage {
  private client: Redis | null = null;

  constructor() {
    if (config.redisUrl) {
      try {
        this.client = new Redis(config.redisUrl);
        console.log('✅ Redis connected for OTP storage');
      } catch (error) {
        console.error('❌ Redis connection failed:', error);
      }
    }
  }

  isAvailable(): boolean {
    return this.client !== null && this.client.status === 'ready';
  }

  async setOTP(phone: string, hashedOtp: string, ttlSeconds: number): Promise<void> {
    if (!this.client) throw new Error('Redis not available');
    
    await this.client.setex(`otp:${phone}`, ttlSeconds, hashedOtp);
  }

  async getOTP(phone: string): Promise<string | null> {
    if (!this.client) throw new Error('Redis not available');
    
    return await this.client.get(`otp:${phone}`);
  }

  async deleteOTP(phone: string): Promise<void> {
    if (!this.client) throw new Error('Redis not available');
    
    await this.client.del(`otp:${phone}`);
  }

  async incrementAttempts(phone: string): Promise<number> {
    if (!this.client) throw new Error('Redis not available');
    
    const key = `otp:attempts:${phone}`;
    const attempts = await this.client.incr(key);
    
    // Set expiry on first increment
    if (attempts === 1) {
      await this.client.expire(key, config.otp.ttlMinutes * 60);
    }
    
    return attempts;
  }

  async getAttempts(phone: string): Promise<number> {
    if (!this.client) throw new Error('Redis not available');
    
    const attempts = await this.client.get(`otp:attempts:${phone}`);
    return attempts ? parseInt(attempts, 10) : 0;
  }

  async setLock(phone: string, ttlSeconds: number): Promise<void> {
    if (!this.client) throw new Error('Redis not available');
    
    await this.client.setex(`otp:locked:${phone}`, ttlSeconds, '1');
  }

  async isLocked(phone: string): Promise<boolean> {
    if (!this.client) throw new Error('Redis not available');
    
    const locked = await this.client.get(`otp:locked:${phone}`);
    return locked === '1';
  }

  async clearAttempts(phone: string): Promise<void> {
    if (!this.client) throw new Error('Redis not available');
    
    await this.client.del(`otp:attempts:${phone}`);
    await this.client.del(`otp:locked:${phone}`);
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }
}

export const redisStorage = new RedisStorage();
