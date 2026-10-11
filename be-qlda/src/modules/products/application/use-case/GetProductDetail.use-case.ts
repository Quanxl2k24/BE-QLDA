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
export class GetProductDetailUseCase {
  private readonly logger = new Logger(GetProductDetailUseCase.name);

  constructor(
    private readonly productsRepository: ProductsRepository,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async execute(identifier: string) {
    if (!identifier || identifier.trim() === '') {
      throw new BadRequestException('ID hoặc slug sản phẩm không hợp lệ');
    }

    const cleanIdentifier = identifier.trim();
    const cacheKey = `products:detail:${cleanIdentifier}`;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      this.logger.warn(`Redis get cache error: ${err}`);
    }

    const product = await this.productsRepository.findDetail(cleanIdentifier);
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    try {
      // Cache trong 5 phút (300 giây)
      await this.redis.set(cacheKey, JSON.stringify(product), 'EX', 300);
    } catch (err) {
      this.logger.warn(`Redis set cache error: ${err}`);
    }

    return product;
  }
}
