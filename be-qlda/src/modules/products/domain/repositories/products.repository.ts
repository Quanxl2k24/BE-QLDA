import { ProductVariantEntity } from '../entities/product-variants.entity';
import { ProductsEntity } from '../entities/products.entity';

export interface ProductWithVariants {
  product: ProductsEntity;
  variants: ProductVariantEntity[];
}

export interface UpdateProductData {
  name?: string;
  slug?: string;
  categoryId?: string | null;
  description?: string | null;
  brand?: string;
  status?: string;
  variants?: Array<{
    id?: string;
    sku?: string;
    name?: string;
    price?: number;
    originalPrice?: number | null;
    weight?: number | null;
    stock?: number;
    status?: string;
  }>;
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

  abstract findById(id: string): Promise<ProductWithVariants | null>;

  abstract findBySlug(slug: string): Promise<ProductsEntity | null>;

  abstract findDetail(identifier: string): Promise<ProductWithVariants | null>;

  abstract findVariantsBySkus(skus: string[]): Promise<ProductVariantEntity[]>;

  abstract checkCategoryExists(categoryId: string): Promise<boolean>;

  abstract updateProduct(
    id: string,
    data: UpdateProductData,
  ): Promise<ProductWithVariants>;

  abstract delete(id: string): Promise<void>;

  abstract getProducts(params: {
    cursor?: string;
    limit: number;
    categorySlug?: string;
    search?: string;
    status?: string;
  }): Promise<{
    products: ProductWithVariants[];
    nextCursor: string | null;
    hasNextPage: boolean;
  }>;
}
