import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * QueueModule – Cấu hình BullMQ + Redis bằng ConfigService để đảm bảo
 * biến môi trường được load đúng từ ConfigModule trước khi kết nối Redis.
 * Hỗ trợ cả REDIS_URL (Upstash / Redis Cloud) lẫn REDIS_HOST + REDIS_PORT.
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');

        const connection = redisUrl
          ? {
              url: redisUrl,
              tls: redisUrl.startsWith('rediss://')
                ? { rejectUnauthorized: false }
                : undefined,
              maxRetriesPerRequest: null,
            }
          : {
              host: configService.get<string>('REDIS_HOST', 'localhost'),
              port: configService.get<number>('REDIS_PORT', 6379),
              maxRetriesPerRequest: null,
            };

        return {
          connection,
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
            removeOnComplete: { count: 100 }, // Giữ tối đa 100 job đã done
            removeOnFail: { count: 200 }, // Giữ tối đa 200 job failed
          },
        };
      },
      inject: [ConfigService],
    }),

    // Đăng ký hàng đợi email
    BullModule.registerQueue({
      name: 'email',
    }),
  ],

  providers: [],

  exports: [BullModule],
})
export class QueueModule {}
