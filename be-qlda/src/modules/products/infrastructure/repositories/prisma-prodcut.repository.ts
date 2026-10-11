import { PrismaService } from '@/database/prisma/prisma.services';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ProductsRepository,
  ProductWithVariants,
  UpdateProductData,
} from '../../domain/repositories/products.repository';
import { ProductsEntity } from '../../domain/entities/products.entity';
import { ProductVariantEntity } from '../../domain/entities/product-variants.entity';

@Injectable()
export class PrismaProduct implements ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ProductWithVariants | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
      },
    });

    if (!product || product.deletedAt) return null;

    const productEntity = new ProductsEntity(
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

    const variantEntities = (product.variants || []).map(
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

  async checkCategoryExists(categoryId: string): Promise<boolean> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    return !!category;
  }

  async updateProduct(
    id: string,
    data: UpdateProductData,
  ): Promise<ProductWithVariants> {
    return await this.prisma.$transaction(async (tx) => {
      const updateProductData: Prisma.ProductUpdateInput = {};
      if (data.name !== undefined) updateProductData.name = data.name;
      if (data.slug !== undefined) updateProductData.slug = data.slug;
      if (data.description !== undefined)
        updateProductData.description = data.description;
      if (data.brand !== undefined) updateProductData.brand = data.brand;
      if (data.status !== undefined) updateProductData.status = data.status;
      if (data.categoryId !== undefined) {
        updateProductData.category = data.categoryId
          ? { connect: { id: data.categoryId } }
          : { disconnect: true };
      }

      await tx.product.update({
        where: { id },
        data: updateProductData,
      });

      if (data.variants && data.variants.length > 0) {
        for (const variant of data.variants) {
          if (variant.id) {
            const variantUpdateData: Prisma.ProductVariantUpdateInput = {};
            if (variant.sku !== undefined) variantUpdateData.sku = variant.sku;
            if (variant.name !== undefined) variantUpdateData.name = variant.name;
            if (variant.price !== undefined) variantUpdateData.price = variant.price;
            if (variant.originalPrice !== undefined)
              variantUpdateData.originalPrice = variant.originalPrice;
            if (variant.weight !== undefined) variantUpdateData.weight = variant.weight;
            if (variant.stock !== undefined) variantUpdateData.stock = variant.stock;
            if (variant.status !== undefined) variantUpdateData.status = variant.status;

            await tx.productVariant.update({
              where: { id: variant.id },
              data: variantUpdateData,
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId: id,
                sku: variant.sku!,
                name: variant.name!,
                price: variant.price!,
                originalPrice: variant.originalPrice ?? null,
                weight: variant.weight ?? null,
                stock: variant.stock ?? 0,
                status: variant.status ?? 'ACTIVE',
              },
            });
          }
        }
      }

      const updated = await tx.product.findUniqueOrThrow({
        where: { id },
        include: {
          variants: true,
        },
      });

      const productEntity = new ProductsEntity(
        updated.id,
        updated.name,
        updated.slug,
        updated.brand,
        updated.status,
        updated.createdAt,
        updated.updatedAt,
        updated.categoryId,
        updated.description,
        updated.deletedAt,
      );

      const variantEntities = (updated.variants || []).map(
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
    });
  }

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

  async getProducts(params: {
    cursor?: string;
    limit: number;
    categorySlug?: string;
    search?: string;
    status?: string;
  }): Promise<{
    products: ProductWithVariants[];
    nextCursor: string | null;
    hasNextPage: boolean;
  }> {
    const { cursor, limit, categorySlug, search, status } = params;

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
    };

    if (categorySlug) {
      where.category = {
        slug: categorySlug,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const records = await this.prisma.product.findMany({
      where,
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        variants: true,
      },
    });

    const hasNextPage = records.length > limit;

    if (hasNextPage) {
      records.pop();
    }

    const nextCursor =
      hasNextPage && records.length > 0 ? records[records.length - 1].id : null;

    const products: ProductWithVariants[] = records.map((item) => {
      const productEntity = new ProductsEntity(
        item.id,
        item.name,
        item.slug,
        item.brand,
        item.status,
        item.createdAt,
        item.updatedAt,
        item.categoryId,
        item.description,
        item.deletedAt,
      );

      const variantEntities = (item.variants || []).map(
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
    });

    return {
      products,
      nextCursor,
      hasNextPage,
    };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export { PrismaProduct as PrismaProductsRepository };
