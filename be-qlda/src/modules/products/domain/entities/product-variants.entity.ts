export class ProductVariantEntity {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly sku: string,
    public readonly name: string,
    public readonly price: number,
    public readonly stock: number,
    public readonly status: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly originalPrice?: number | null,
    public readonly weight?: number | null,
  ) {}

  get isOutOfStock(): boolean {
    return this.stock <= 0;
  }

  get isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  get hasDiscount(): boolean {
    return (
      this.originalPrice !== null &&
      this.originalPrice !== undefined &&
      this.originalPrice > this.price
    );
  }
}
