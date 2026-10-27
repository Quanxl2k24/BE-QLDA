import { RedisModule } from '@nestjs-modules/ioredis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');

        if (redisUrl) {
          return {
            type: 'single',
            url: redisUrl,
            options: {
              tls: redisUrl.startsWith('rediss://')
                ? { rejectUnauthorized: false }
                : undefined,
            },
          };
        }

        return {
          type: 'single',
          options: {
            host: config.get<string>('REDIS_HOST', 'localhost'),
            port: config.get<number>('REDIS_PORT', 6379),
          },
        };
      },
    }),
  ],
})
export class Redis {}
