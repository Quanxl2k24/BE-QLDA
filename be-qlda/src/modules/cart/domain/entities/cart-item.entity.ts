export interface CartItemVariant {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  sku: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  stock: number;
  status: string;
  imageUrl?: string | null;
}

export class CartItemEntity {
  public readonly subtotal: number;
  public readonly originalSubtotal?: number | null;

  constructor(
    public readonly id: string,
    public readonly cartId: string,
    public readonly variantId: string,
    public readonly quantity: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly variant?: CartItemVariant,
    subtotal?: number,
    originalSubtotal?: number | null,
  ) {
    this.subtotal =
      subtotal ??
      (this.variant
        ? Math.round(this.variant.price * this.quantity * 100) / 100
        : 0);
    this.originalSubtotal =
      originalSubtotal !== undefined
        ? originalSubtotal
        : this.variant?.originalPrice
          ? Math.round(this.variant.originalPrice * this.quantity * 100) / 100
          : null;
  }
}
