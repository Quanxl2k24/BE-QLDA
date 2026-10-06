import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategoriesRepository } from '../../domain/repositories/categories.repository';

@Injectable()
export class DeleteCategoryUseCase {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async execute(id: string) {
    if (!id) {
      throw new BadRequestException('Category ID không hợp lệ');
    }

    const category = await this.categoriesRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    const subCategoriesCount =
      await this.categoriesRepository.countSubCategories(id);
    if (subCategoriesCount > 0) {
      throw new BadRequestException(
        'Không thể xóa danh mục đang có danh mục con',
      );
    }

    const productsCount = await this.categoriesRepository.countProducts(id);
    if (productsCount > 0) {
      throw new BadRequestException(
        'Không thể xóa danh mục đang có sản phẩm liên kết',
      );
    }

    await this.categoriesRepository.delete(id);

    return {
      id,
    };
  }
}
