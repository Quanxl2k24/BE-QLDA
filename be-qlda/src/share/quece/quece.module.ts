import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * QueueModule – Cấu hình BullMQ + Redis bằng ConfigService để đảm bảo
 * biến môi trường được load đúng từ ConfigModule trước khi kết nối Redis.
 *
 * Exports toàn bộ BullModule để các module khác (MailModule, v.v.)
 * có thể InjectQueue mà không cần registerQueue lại.
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: { count: 100 }, // Giữ tối đa 100 job đã done
          removeOnFail: { count: 200 }, // Giữ tối đa 200 job failed
        },
      }),
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
