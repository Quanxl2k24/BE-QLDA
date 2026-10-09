import { ProductStatus } from '@/common/enums/product.enum';

export class ProductsEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly brand: string,
    public readonly status: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly categoryId?: string | null,
    public readonly description?: string | null,
    public readonly deletedAt?: Date | null,
  ) {}

  get isDeleted(): boolean {
    return this.deletedAt !== null && this.deletedAt !== undefined;
  }

  get isActive(): boolean {
    return this.status === ProductStatus.ACTIVE && !this.isDeleted;
  }
}
