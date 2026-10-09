import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { ProductsRepository } from '../../domain/repositories/products.repository';
import { CreateProductDto } from '../../persentation/dto/prodcuts.dto';

@Injectable()
export class CreateProductUseCase {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async execute(dto: CreateProductDto) {
    // 1. Kiểm tra slug đã tồn tại chưa
    const existingSlug = await this.productsRepository.findBySlug(dto.slug);
    if (existingSlug) {
      throw new ConflictException('Đường dẫn thân thiện (slug) đã tồn tại');
    }

    // 2. Kiểm tra SKU trùng lặp giữa các biến thể trong request và trong DB
    if (dto.variants && dto.variants.length > 0) {
      const skus = dto.variants.map((v) => v.sku);
      const uniqueSkus = new Set(skus);
      if (uniqueSkus.size !== skus.length) {
        throw new BadRequestException(
          'Mã SKU giữa các biến thể không được trùng nhau',
        );
      }

      const existingVariants =
        await this.productsRepository.findVariantsBySkus(skus);
      if (existingVariants && existingVariants.length > 0) {
        const duplicatedSkus = existingVariants.map((v) => v.sku).join(', ');
        throw new ConflictException(
          `Mã SKU (${duplicatedSkus}) đã tồn tại trong hệ thống`,
        );
      }
    }

    // 3. Tạo sản phẩm cùng các biến thể
    const result = await this.productsRepository.createProduct(dto);
    if (!result) {
      throw new BadRequestException('Tạo sản phẩm thất bại');
    }

    return result;
  }
}
