import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from '../../domain/repositories/categories.repository';

@Injectable()
export class GetCategoriesUseCase {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}
  async execute(dto: { limit?: number; cursor?: string }) {
    const limit = dto.limit ?? 10;
    const result = await this.categoriesRepository.getCategories({
      cursor: dto.cursor,
      limit,
    });
    const data = result.categories;
    return {
      message: 'Lấy danh sách danh mục thành công',
      data,
      nextCursor: result.nextCursor,
      hasNextPage: result.hasNextPage,
      limit,
    };
  }
}
