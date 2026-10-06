import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategoriesRepository } from '../../domain/repositories/categories.repository';
import { UpdateCategoryDto } from '../../persentation/dto/update-category.dto';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async execute(id: string, dto: UpdateCategoryDto) {
    if (!id) {
      throw new BadRequestException('Category ID không hợp lệ');
    }

    const existingCategory = await this.categoriesRepository.findById(id);
    if (!existingCategory) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('Danh mục cha không thể là chính nó');
      }

      const parentCategory = await this.categoriesRepository.findById(
        dto.parentId,
      );
      if (!parentCategory) {
        throw new NotFoundException('Danh mục cha không tồn tại');
      }
    }

    if (dto.slug) {
      const categoryWithSlug = await this.categoriesRepository.findBySlug(
        dto.slug,
      );
      if (categoryWithSlug && categoryWithSlug.id !== id) {
        throw new ConflictException('Slug danh mục đã tồn tại');
      }
    }

    const updatedCategory = await this.categoriesRepository.updateCategory(
      id,
      dto,
    );

    return {
      message: 'Cập nhật danh mục thành công',
      data: updatedCategory,
    };
  }
}
