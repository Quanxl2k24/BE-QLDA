import { ProductVariantEntity } from '../entities/product-variants.entity';
import { ProductsEntity } from '../entities/products.entity';

export interface ProductWithVariants {
  product: ProductsEntity;
  variants: ProductVariantEntity[];
}

export abstract class ProductsRepository {
  abstract createProduct(data: {
    name: string;
    slug: string;
    categoryId?: string;
    description?: string;
    brand: string;
    status?: string;
    variants?: Array<{
      sku: string;
      name: string;
      price: number;
      originalPrice?: number;
      weight?: number;
      stock?: number;
      status?: string;
    }>;
  }): Promise<ProductWithVariants | null>;

  abstract findBySlug(slug: string): Promise<ProductsEntity | null>;

  abstract findVariantsBySkus(skus: string[]): Promise<ProductVariantEntity[]>;
}
