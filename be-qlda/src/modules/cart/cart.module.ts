import { Module } from '@nestjs/common';
import { AddToCartUseCase } from './application/use-case/AddToCart.use-case';
import { CartController } from './presentation/controllers/cart.controller';
import { CartRepository } from './domain/repositories/cart.repository';
import { PrismaCartRepository } from './infrastructure/repositories/prisma-cart.repository';
import { GetCartItem } from './application/use-case/GetCartItem.use-case';
import { UpdateCartItemUseCase } from './application/use-case/UpdateCartItem.use-case';
import { ClearCartUseCase } from './application/use-case/ClearCart.use-case';

@Module({
  controllers: [CartController],
  providers: [
    AddToCartUseCase,
    GetCartItem,
    UpdateCartItemUseCase,
    ClearCartUseCase,
    {
      provide: CartRepository,
      useClass: PrismaCartRepository,
    },
  ],
  exports: [CartRepository],
})
export class CartModule {}
