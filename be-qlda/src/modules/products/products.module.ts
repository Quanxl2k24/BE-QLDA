import { Module } from '@nestjs/common';
import { ProductsController } from './persentation/controllers/products.controller';
import { CreateProductUseCase } from './application/use-case/CreateProduct.use-case';
import { ProductsRepository } from './domain/repositories/products.repository';
import { PrismaProduct } from './infrastructure/repositories/prisma-prodcut.repository';

@Module({
  controllers: [ProductsController],
  providers: [
    CreateProductUseCase,
    {
      provide: ProductsRepository,
      useClass: PrismaProduct,
    },
  ],
  exports: [ProductsRepository],
})
export class ProductsModule {}
