import { CartEntity } from '../entities/cart.entity';
import { CartItemEntity, CartItemVariant } from '../entities/cart-item.entity';

export interface GetCartItemsParams {
  userId: string;
  cursor?: string;
  limit: number;
}

export interface PaginatedCartResult {
  cartId: string | null;
  items: CartItemEntity[];
  nextCursor: string | null;
  hasNextPage: boolean;
  totalQuantity: number;
  totalPrice: number;
  totalItems: number;
}

export abstract class CartRepository {
  abstract findVariantById(variantId: string): Promise<CartItemVariant | null>;
  abstract findCartByUserId(userId: string): Promise<CartEntity | null>;
  abstract findCartItem(
    cartId: string,
    variantId: string,
  ): Promise<CartItemEntity | null>;
  abstract findCartItemById(cartItemId: string): Promise<CartItemEntity | null>;
  abstract addToCart(data: {
    userId: string;
    variantId: string;
    quantity: number;
  }): Promise<CartItemEntity>;
  abstract updateCartItemQuantity(
    cartItemId: string,
    quantity: number,
  ): Promise<CartItemEntity>;
  abstract removeCartItem(cartItemId: string): Promise<void>;
  abstract clearCart(userId: string): Promise<number>;
  abstract getCartItemsWithCursor(
    params: GetCartItemsParams,
  ): Promise<PaginatedCartResult>;
}
