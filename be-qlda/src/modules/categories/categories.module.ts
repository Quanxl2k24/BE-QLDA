import { Module } from '@nestjs/common';
import { CategoriesController } from './persentation/controllers/categories.controller';
import { CreateCategoriesUseCase } from './application/use-cases/CreateCategories.use-case';
import { CategoriesRepository } from './domain/repositories/categories.repository';
import { PrismaCategoriesRepository } from './infrastructure/repositories/prisma-categories.repository';
import { GetCategoriesUseCase } from './application/use-cases/GetCategories.use-case';

@Module({
  controllers: [CategoriesController],
  providers: [
    CreateCategoriesUseCase,
    GetCategoriesUseCase,
    {
      provide: CategoriesRepository,
      useClass: PrismaCategoriesRepository,
    },
  ],
})
export class CategoriesModule {}
