import { Injectable } from '@nestjs/common';
import {
  CartRepository,
  CartTotalsResult,
} from '../../domain/repositories/cart.repository';
import { CartTotalsQueryDto } from '../../presentation/dto/totalCart.dto';

@Injectable()
export class TotalCartUseCase {
  constructor(private readonly cartRepository: CartRepository) {}

  async execute(
    userId: string,
    query?: CartTotalsQueryDto,
  ): Promise<CartTotalsResult> {
    return await this.cartRepository.totalCart({
      userId,
      itemIds: query?.itemIds,
    });
  }
}

