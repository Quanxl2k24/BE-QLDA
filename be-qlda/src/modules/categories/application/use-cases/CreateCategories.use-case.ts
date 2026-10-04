import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from '../../domain/repositories/categories.repository';

@Injectable()
export class CreateCategoriesUseCase {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}
  async execute(body: {
    name: string;
    slug: string;
    status: string;
    description?: string;
    parentId?: string;
  }) {
    const category = await this.categoriesRepository.createCategory(body);
    return {
      message: 'hello',
    };
  }
}
