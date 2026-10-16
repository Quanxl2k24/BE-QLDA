import { Injectable } from '@nestjs/common';
import {
  CartRepository,
  PaginatedCartResult,
} from '../../domain/repositories/cart.repository';
import { GetCartCursorDto } from '../../presentation/dto/get-cart.dto';

@Injectable()
export class GetCartItem {
  constructor(private readonly cartRepository: CartRepository) {}

  async execute(
    userId: string,
    dto: GetCartCursorDto,
  ): Promise<PaginatedCartResult> {
    const limit = dto.limit ?? 10;
    return await this.cartRepository.getCartItemsWithCursor({
      userId,
      cursor: dto.cursor,
      limit,
    });
  }
}

