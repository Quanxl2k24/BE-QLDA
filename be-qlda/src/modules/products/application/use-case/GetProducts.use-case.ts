import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { ProductsRepository } from '../../domain/repositories/products.repository';
import { GetProductsCursorDto } from '../../persentation/dto/prodcuts.dto';

@Injectable()
export class GetProductsUseCase {
  private readonly logger = new Logger(GetProductsUseCase.name);

  constructor(
    private readonly productsRepository: ProductsRepository,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async execute(dto: GetProductsCursorDto) {
    const limit = dto.limit ?? 10;

    // Cache key dựa theo các query params
    const cacheKey = `products:list:${dto.categorySlug ?? 'all'}:${dto.cursor ?? 'start'}:${limit}:${dto.search ?? ''}:${dto.status ?? ''}`;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      this.logger.warn(`Redis get cache error: ${err}`);
    }

    const result = await this.productsRepository.getProducts({
      cursor: dto.cursor,
      limit,
      categorySlug: dto.categorySlug,
      search: dto.search,
      status: dto.status,
    });

    const response = {
      message: 'Lấy danh sách sản phẩm thành công',
      data: result.products,
      nextCursor: result.nextCursor,
      hasNextPage: result.hasNextPage,
      limit,
    };

    try {
      // Cache 5 phút (300 giây)
      await this.redis.set(cacheKey, JSON.stringify(response), 'EX', 300);
    } catch (err) {
      this.logger.warn(`Redis set cache error: ${err}`);
    }

    return response;
  }
}
