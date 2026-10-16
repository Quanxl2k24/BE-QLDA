import { CartItemEntity } from './cart-item.entity';

export class CartEntity {
  public readonly totalQuantity: number;
  public readonly totalPrice: number;

  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly items: CartItemEntity[] = [],
    totalQuantity?: number,
    totalPrice?: number,
  ) {
    this.totalQuantity =
      totalQuantity ??
      this.items.reduce((sum, item) => sum + item.quantity, 0);
    this.totalPrice =
      totalPrice ??
      Math.round(
        this.items.reduce((sum, item) => sum + item.subtotal, 0) * 100,
      ) / 100;
  }
}
