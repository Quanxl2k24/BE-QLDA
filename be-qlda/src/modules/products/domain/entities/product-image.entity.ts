export class ProductImageEntity {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly imageUrl: string,
    public readonly sortOrder: number = 0,
    public readonly isThumbnail: boolean = false,
    public readonly createdAt: Date = new Date(),
    public readonly publicId?: string | null,
    public readonly variantId?: string | null,
  ) {}
}
