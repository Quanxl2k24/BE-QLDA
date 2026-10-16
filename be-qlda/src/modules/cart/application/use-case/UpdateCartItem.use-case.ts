import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CartRepository } from '../../domain/repositories/cart.repository';
import { CartItemEntity } from '../../domain/entities/cart-item.entity';
import { UpdateCartItemDto } from '../../presentation/dto/update-cart-item.dto';

export interface UpdateCartItemParams extends UpdateCartItemDto {
  itemId?: string;
}

@Injectable()
export class UpdateCartItemUseCase {
  constructor(private readonly cartRepository: CartRepository) {}

  async execute(
    userId: string,
    params: UpdateCartItemParams,
  ): Promise<CartItemEntity | null> {
    const { itemId, cartItemId, variantId, quantity } = params;

    // 1. Kiểm tra tham số định danh sản phẩm
    const targetItemId = itemId || cartItemId;
    if (!targetItemId && !variantId) {
      throw new BadRequestException(
        'Vui lòng cung cấp ID sản phẩm trong giỏ hàng (cartItemId hoặc variantId)',
      );
    }

    // 2. Tìm giỏ hàng của user
    const cart = await this.cartRepository.findCartByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Giỏ hàng trống hoặc không tồn tại');
    }

    // 3. Tìm cart item trong giỏ hàng của user
    let existingItem: CartItemEntity | null = null;

    if (targetItemId) {
      // Thử tìm theo cartItemId
      const byId = await this.cartRepository.findCartItemById(targetItemId);
      if (byId && byId.cartId === cart.id) {
        existingItem = byId;
      } else {
        // Dự phòng trường hợp targetItemId truyền vào thực chất là variantId
        const byVariant = await this.cartRepository.findCartItem(
          cart.id,
          targetItemId,
        );
        if (byVariant) {
          existingItem = byVariant;
        }
      }
    } else if (variantId) {
      existingItem = await this.cartRepository.findCartItem(cart.id, variantId);
    }

    if (!existingItem) {
      throw new NotFoundException(
        'Sản phẩm không tồn tại trong giỏ hàng của bạn',
      );
    }

    // 4. Nếu số lượng bằng 0, xóa sản phẩm khỏi giỏ hàng
    if (quantity === 0) {
      await this.cartRepository.removeCartItem(existingItem.id);
      return null;
    }

    // 5. Kiểm tra thông tin biến thể sản phẩm & tồn kho
    const variant = await this.cartRepository.findVariantById(
      existingItem.variantId,
    );
    if (!variant) {
      throw new NotFoundException('Biến thể sản phẩm không tồn tại');
    }

    if (variant.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Biến thể sản phẩm hiện không hoạt động hoặc đã ngừng kinh doanh',
      );
    }

    if (variant.stock <= 0) {
      throw new BadRequestException('Sản phẩm đã hết hàng trong kho');
    }

    if (quantity > variant.stock) {
      throw new BadRequestException(
        `Số lượng yêu cầu (${quantity}) vượt quá số lượng tồn kho (${variant.stock})`,
      );
    }

    // 6. Cập nhật số lượng mới cho sản phẩm trong giỏ hàng
    const updatedItem = await this.cartRepository.updateCartItemQuantity(
      existingItem.id,
      quantity,
    );

    return updatedItem;
  }
}
