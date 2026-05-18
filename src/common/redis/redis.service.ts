import { Inject, Injectable, Logger } from '@nestjs/common';

import Redis from 'ioredis';

import Redlock from 'redlock';

type ExclusiveOperation<T> = () => Promise<T>;

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  private readonly redlock: Redlock;
  private readonly DEFAULT_LOCK_TTL = 10000;

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redisClient: Redis,
  ) {
    this.redlock = new Redlock([this.redisClient as unknown as any], {
      retryCount: 5,

      retryDelay: 200,

      retryJitter: 200,
    });
  }

  async performExclusively<T>(
    key: string,

    operation: ExclusiveOperation<T>,

    ttl?: number,
  ): Promise<T> {
    const lockKey = `lock:${key}`;

    const lock: any = await this.redlock.acquire(
      [lockKey],
      ttl ?? this.DEFAULT_LOCK_TTL,
    );

    try {
      return await operation();
    } finally {
      try {
        await lock.release();
      } catch (error) {
        this.logger.error({
          message: `Failed to release lock: ${lockKey}`,
          error,
        });
      }
    }
  }
}
