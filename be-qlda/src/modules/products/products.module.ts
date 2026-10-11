import { Module } from '@nestjs/common';
import { ProductsController } from './persentation/controllers/products.controller';
import { CreateProductUseCase } from './application/use-case/CreateProduct.use-case';
import { ProductsRepository } from './domain/repositories/products.repository';
import { PrismaProduct } from './infrastructure/repositories/prisma-prodcut.repository';
import { GetProductsUseCase } from './application/use-case/GetProducts.use-case';
import { UpdateProductUseCase } from './application/use-case/UpdateProduct.use-case';
import { DeleteProductUseCase } from './application/use-case/DeleteProduct.use-case';

@Module({
  controllers: [ProductsController],
  providers: [
    CreateProductUseCase,
    GetProductsUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    {
      provide: ProductsRepository,
      useClass: PrismaProduct,
    },
  ],
  exports: [ProductsRepository],
})
export class ProductsModule {}
