import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { ProductsRepository } from '../../domain/repositories/products.repository';
import { UpdateProductDto } from '../../persentation/dto/update-product.dto';

@Injectable()
export class UpdateProductUseCase {
  private readonly logger = new Logger(UpdateProductUseCase.name);

  constructor(
    private readonly productsRepository: ProductsRepository,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async execute(id: string, dto: UpdateProductDto) {
    if (!id) {
      throw new BadRequestException('ID sản phẩm không hợp lệ');
    }

    // 1. Kiểm tra sản phẩm tồn tại
    const existing = await this.productsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    // 2. Kiểm tra slug nếu có cập nhật slug mới
    if (dto.slug && dto.slug !== existing.product.slug) {
      const productWithSlug = await this.productsRepository.findBySlug(
        dto.slug,
      );
      if (productWithSlug && productWithSlug.id !== id) {
        throw new ConflictException('Đường dẫn thân thiện (slug) đã tồn tại');
      }
    }

    // 3. Kiểm tra danh mục nếu có cập nhật categoryId
    if (dto.categoryId) {
      const categoryExists =
        await this.productsRepository.checkCategoryExists(dto.categoryId);
      if (!categoryExists) {
        throw new NotFoundException('Danh mục không tồn tại');
      }
    }

    // 4. Kiểm tra danh sách biến thể nếu có cập nhật
    if (dto.variants && dto.variants.length > 0) {
      const existingVariantIds = new Set(existing.variants.map((v) => v.id));

      // Kiểm tra trùng SKU trong chính payload gửi lên
      const inputSkus = dto.variants
        .map((v) => v.sku)
        .filter((sku): sku is string => Boolean(sku));

      const uniqueInputSkus = new Set(inputSkus);
      if (uniqueInputSkus.size !== inputSkus.length) {
        throw new BadRequestException(
          'Mã SKU giữa các biến thể trong danh sách cập nhật không được trùng nhau',
        );
      }

      // Xác thực từng biến thể
      for (const variantDto of dto.variants) {
        if (variantDto.id) {
          // Biến thể cập nhật phải thuộc về sản phẩm này
          if (!existingVariantIds.has(variantDto.id)) {
            throw new BadRequestException(
              `Biến thể với ID ${variantDto.id} không thuộc về sản phẩm này`,
            );
          }
        } else {
          // Biến thể thêm mới phải có đầy đủ sku, name và price
          if (
            !variantDto.sku ||
            !variantDto.name ||
            variantDto.price === undefined
          ) {
            throw new BadRequestException(
              'Biến thể thêm mới yêu cầu đầy đủ các thông tin: sku, name và price',
            );
          }
        }
      }

      // Kiểm tra trùng SKU với các biến thể khác trong database
      if (inputSkus.length > 0) {
        const foundVariants =
          await this.productsRepository.findVariantsBySkus(inputSkus);

        for (const found of foundVariants) {
          // Nếu SKU này đã tồn tại ở một biến thể khác (khác ID biến thể đang cập nhật)
          const matchingDto = dto.variants.find((v) => v.sku === found.sku);
          if (matchingDto && matchingDto.id !== found.id) {
            throw new ConflictException(
              `Mã SKU (${found.sku}) đã tồn tại trong hệ thống`,
            );
          }
        }
      }
    }

    // 5. Cập nhật sản phẩm
    const updated = await this.productsRepository.updateProduct(id, dto);

    // 6. Xóa cache danh sách sản phẩm trên Redis để đảm bảo dữ liệu mới nhất
    try {
      const keys = await this.redis.keys('products:list:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (err) {
      this.logger.warn(`Redis cache invalidation error: ${err}`);
    }

    return updated;
  }
}
