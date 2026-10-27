export class OrderItemEntity {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly productName: string,
    public readonly unitPrice: number,
    public readonly quantity: number,
    public readonly totalPrice: number,
    public readonly createdAt: Date,
    public readonly variantId?: string | null,
    public readonly variantName?: string | null,
    public readonly sku?: string | null,
  ) {}
}
