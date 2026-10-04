import { Module } from '@nestjs/common';
import { CategoriesController } from './persentation/controllers/categories.controller';
import { CreateCategoriesUseCase } from './application/use-cases/CreateCategories.use-case';
import { CategoriesRepository } from './domain/repositories/categories.repository';
import { PrismaCategoriesRepository } from './infrastructure/repositories/prisma-categories.repository';

@Module({
  controllers: [CategoriesController],
  providers: [
    CreateCategoriesUseCase,
    {
      provide: CategoriesRepository,
      useClass: PrismaCategoriesRepository,
    },
  ],
})
export class CategoriesModule {}
