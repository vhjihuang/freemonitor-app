import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        // 创建 Redis 客户端
        const redisClient = new Redis({
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD', undefined),
          db: config.get<number>('REDIS_DB', 0),
        });

        // 添加错误处理
        redisClient.on('error', (err) => {
          console.error('Redis连接错误:', err);
        });

        // 添加连接成功日志
        redisClient.on('connect', () => {
          console.log('✅ Redis连接成功');
        });



        return {
          throttlers: [
            {
              ttl: 60000, // 60秒内 (以毫秒为单位)
              limit: config.get<number>('API_RATE_LIMIT', 100), // 最多100次请求
            },
          ],
          storage: {
            get: async (key: string) => {
              const value = await redisClient.get(key);
              return value ? parseInt(value, 10) : null;
            },
            set: async (key: string, value: number, ttl: number) => {
              await redisClient.setex(key, Math.ceil(ttl / 1000), value.toString());
            },
            increment: async (key: string, ttl: number) => {
              const value = await redisClient.incr(key);
              // 如果是新键，设置过期时间
              if (value === 1) {
                await redisClient.expire(key, Math.ceil(ttl / 1000));
              }
              
              // 返回符合ThrottlerStorageRecord接口的对象
              return {
                totalHits: value,
                timeToExpire: ttl,
                isBlocked: false,
                timeToBlockExpire: 0
              };
            },
          },
        };
      },
    }),
  ],
  providers: [],
  exports: [ThrottlerModule],
})
export class CustomThrottlerModule {}