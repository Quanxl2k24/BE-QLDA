import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { ProductsRepository } from '../../domain/repositories/products.repository';

@Injectable()
export class DeleteProductUseCase {
  private readonly logger = new Logger(DeleteProductUseCase.name);

  constructor(
    private readonly productsRepository: ProductsRepository,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async execute(id: string) {
    if (!id) {
      throw new BadRequestException('ID sản phẩm không hợp lệ');
    }

    const existingProduct = await this.productsRepository.findById(id);
    if (!existingProduct || existingProduct.product.isDeleted) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    await this.productsRepository.delete(id);

    // Xóa cache danh sách sản phẩm trên Redis
    try {
      const keys = await this.redis.keys('products:list:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (err) {
      this.logger.warn(`Redis cache invalidation error: ${err}`);
    }

    return {
      id,
    };
  }
}
