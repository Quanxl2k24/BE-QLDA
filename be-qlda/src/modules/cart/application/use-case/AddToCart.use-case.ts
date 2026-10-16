import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CartRepository } from '../../domain/repositories/cart.repository';
import { AddToCartDto } from '../../presentation/dto/addToCart.dto';
import { CartItemEntity } from '../../domain/entities/cart-item.entity';

@Injectable()
export class AddToCartUseCase {
  constructor(private readonly cartRepository: CartRepository) {}

  async execute(userId: string, dto: AddToCartDto): Promise<CartItemEntity> {
    // 1. Kiểm tra biến thể sản phẩm có tồn tại không
    const variant = await this.cartRepository.findVariantById(dto.variantId);
    if (!variant) {
      throw new NotFoundException('Biến thể sản phẩm không tồn tại');
    }

    // 2. Kiểm tra trạng thái hoạt động của sản phẩm/biến thể
    if (variant.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Biến thể sản phẩm hiện không hoạt động hoặc đã ngừng kinh doanh',
      );
    }

    // 3. Kiểm tra số lượng tồn kho còn hàng hay không
    if (variant.stock <= 0) {
      throw new BadRequestException('Sản phẩm đã hết hàng trong kho');
    }

    // 4. Kiểm tra số lượng cộng dồn với giỏ hàng hiện tại so với tồn kho
    const cart = await this.cartRepository.findCartByUserId(userId);
    let currentInCart = 0;
    if (cart) {
      const existingItem = await this.cartRepository.findCartItem(
        cart.id,
        dto.variantId,
      );
      if (existingItem) {
        currentInCart = existingItem.quantity;
      }
    }

    const totalQuantity = currentInCart + dto.quantity;
    if (totalQuantity > variant.stock) {
      throw new BadRequestException(
        `Số lượng yêu cầu (${totalQuantity}) vượt quá số lượng tồn kho (${variant.stock}). Hiện bạn đã có ${currentInCart} sản phẩm này trong giỏ hàng.`,
      );
    }

    // 5. Thêm/cộng dồn số lượng vào giỏ hàng
    const cartItem = await this.cartRepository.addToCart({
      userId,
      variantId: dto.variantId,
      quantity: dto.quantity,
    });

    if (!cartItem) {
      throw new BadRequestException('Thêm sản phẩm vào giỏ hàng thất bại');
    }

    return cartItem;
  }
}
