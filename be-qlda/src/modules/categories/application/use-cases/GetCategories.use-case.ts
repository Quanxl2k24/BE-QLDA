import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from '../../domain/repositories/categories.repository';

import { CategoriesDto } from '../../persentation/dto/get-categories.dto';

@Injectable()
export class GetCategoriesUseCase {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}
  async execute(dto: CategoriesDto) {
    const limit = dto.limit ?? 10;
    const result = await this.categoriesRepository.getCategories({
      cursor: dto.cursor,
      limit,
      search: dto.search,
      status: dto.status,
      parentId: dto.parentId,
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
