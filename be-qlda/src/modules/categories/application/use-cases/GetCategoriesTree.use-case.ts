import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from '../../domain/repositories/categories.repository';

@Injectable()
export class GetCategoriesTreeUseCase {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async execute() {
    const data = await this.categoriesRepository.getCategoriesTree();
    return {
      message: 'Lấy danh sách cây danh mục thành công',
      data,
    };
  }
}
