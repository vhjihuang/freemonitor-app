import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        // 使用内存存储替代Redis
        const memoryStorage = new Map<string, { value: number; expiresAt: number }>();

        return {
          throttlers: [
            {
              ttl: 60000, // 60秒内 (以毫秒为单位)
              limit: config.get<number>('API_RATE_LIMIT', 100), // 最多100次请求
            },
          ],
          storage: {
            get: async (key: string) => {
              const record = memoryStorage.get(key);
              if (!record) return null;
              
              // 检查是否过期
              if (Date.now() > record.expiresAt) {
                memoryStorage.delete(key);
                return null;
              }
              
              return record.value;
            },
            set: async (key: string, value: number, ttl: number) => {
              memoryStorage.set(key, {
                value,
                expiresAt: Date.now() + ttl
              });
            },
            increment: async (key: string, ttl: number) => {
              const record = memoryStorage.get(key);
              let value = 1;
              
              if (record && Date.now() <= record.expiresAt) {
                value = record.value + 1;
              }
              
              memoryStorage.set(key, {
                value,
                expiresAt: Date.now() + ttl
              });
              
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