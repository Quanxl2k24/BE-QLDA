import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    let retries = 5;
    const retryDelayMs = 2000;

    while (retries > 0) {
      try {
        await this.$connect();
        this.logger.log('PrismaService connected to the database successfully');
        return;
      } catch (error: any) {
        retries -= 1;
        this.logger.warn(
          `Kết nối database chưa thành công (Database serverless đang khởi động). Thử lại sau 2s... (còn ${retries} lần thử). Lỗi: ${error.message}`,
        );

        if (retries === 0) {
          this.logger.error('Không thể kết nối đến cơ sở dữ liệu sau 5 lần thử.', error);
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
