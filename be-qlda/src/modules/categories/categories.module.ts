import { Module } from '@nestjs/common';
import { CategoriesController } from './persentation/controllers/categories.controller';
import { CreateCategoriesUseCase } from './application/use-cases/CreateCategories.use-case';
import { CategoriesRepository } from './domain/repositories/categories.repository';
import { PrismaCategoriesRepository } from './infrastructure/repositories/prisma-categories.repository';
import { GetCategoriesUseCase } from './application/use-cases/GetCategories.use-case';
import { GetCategoriesTreeUseCase } from './application/use-cases/GetCategoriesTree.use-case';
import { UpdateCategoryUseCase } from './application/use-cases/UpdateCategory.use-case';

@Module({
  controllers: [CategoriesController],
  providers: [
    CreateCategoriesUseCase,
    GetCategoriesUseCase,
    GetCategoriesTreeUseCase,
    UpdateCategoryUseCase,
    {
      provide: CategoriesRepository,
      useClass: PrismaCategoriesRepository,
    },
  ],
})
export class CategoriesModule {}
