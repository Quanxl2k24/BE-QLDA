import { PrismaService } from '@/database/prisma/prisma.services';
import { Injectable } from '@nestjs/common';
import {
  ProductsRepository,
  ProductWithVariants,
} from '../../domain/repositories/products.repository';
import { ProductsEntity } from '../../domain/entities/products.entity';
import { ProductVariantEntity } from '../../domain/entities/product-variants.entity';

@Injectable()
export class PrismaProduct implements ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createProduct(data: {
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
  }): Promise<ProductWithVariants | null> {
    const created = await this.prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        categoryId: data.categoryId ?? null,
        description: data.description ?? null,
        brand: data.brand,
        status: data.status ?? 'ACTIVE',
        variants:
          data.variants && data.variants.length > 0
            ? {
                create: data.variants.map((v) => ({
                  sku: v.sku,
                  name: v.name,
                  price: v.price,
                  originalPrice: v.originalPrice ?? null,
                  weight: v.weight ?? null,
                  stock: v.stock ?? 0,
                  status: v.status ?? 'ACTIVE',
                })),
              }
            : undefined,
      },
      include: {
        variants: true,
      },
    });

    if (!created) return null;

    const productEntity = new ProductsEntity(
      created.id,
      created.name,
      created.slug,
      created.brand,
      created.status,
      created.createdAt,
      created.updatedAt,
      created.categoryId,
      created.description,
      created.deletedAt,
    );

    const variantEntities = (created.variants || []).map(
      (v) =>
        new ProductVariantEntity(
          v.id,
          v.productId,
          v.sku,
          v.name,
          Number(v.price),
          v.stock,
          v.status,
          v.createdAt,
          v.updatedAt,
          v.originalPrice !== null ? Number(v.originalPrice) : null,
          v.weight,
        ),
    );

    return {
      product: productEntity,
      variants: variantEntities,
    };
  }

  async findBySlug(slug: string): Promise<ProductsEntity | null> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
    });

    if (!product) return null;

    return new ProductsEntity(
      product.id,
      product.name,
      product.slug,
      product.brand,
      product.status,
      product.createdAt,
      product.updatedAt,
      product.categoryId,
      product.description,
      product.deletedAt,
    );
  }

  async findVariantsBySkus(skus: string[]): Promise<ProductVariantEntity[]> {
    if (!skus || skus.length === 0) return [];

    const variants = await this.prisma.productVariant.findMany({
      where: {
        sku: { in: skus },
      },
    });

    return variants.map(
      (v) =>
        new ProductVariantEntity(
          v.id,
          v.productId,
          v.sku,
          v.name,
          Number(v.price),
          v.stock,
          v.status,
          v.createdAt,
          v.updatedAt,
          v.originalPrice !== null ? Number(v.originalPrice) : null,
          v.weight,
        ),
    );
  }
}

export { PrismaProduct as PrismaProductsRepository };
