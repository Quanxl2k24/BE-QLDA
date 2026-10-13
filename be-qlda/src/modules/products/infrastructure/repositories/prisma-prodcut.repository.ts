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
import { ProductImageEntity } from '../../domain/entities/product-image.entity';

const PRODUCT_INCLUDE = {
  images: {
    where: { variantId: null },
    orderBy: { sortOrder: 'asc' as const },
  },
  variants: {
    include: {
      images: {
        orderBy: { sortOrder: 'asc' as const },
      },
    },
  },
};

@Injectable()
export class PrismaProduct implements ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapImageEntity(
    img: Prisma.ProductImageGetPayload<{}>,
  ): ProductImageEntity {
    return new ProductImageEntity(
      img.id,
      img.productId,
      img.imageUrl,
      img.sortOrder,
      img.isThumbnail,
      img.createdAt,
      img.publicId,
      img.variantId,
    );
  }

  private mapProductEntity(
    product: Prisma.ProductGetPayload<{}>,
    images: ProductImageEntity[] = [],
  ): ProductsEntity {
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
      images,
    );
  }

  private mapVariantEntity(
    variant: Prisma.ProductVariantGetPayload<{}>,
    images: ProductImageEntity[] = [],
  ): ProductVariantEntity {
    return new ProductVariantEntity(
      variant.id,
      variant.productId,
      variant.sku,
      variant.name,
      Number(variant.price),
      variant.stock,
      variant.status,
      variant.createdAt,
      variant.updatedAt,
      variant.originalPrice !== null ? Number(variant.originalPrice) : null,
      variant.weight,
      images,
    );
  }

  async findById(id: string): Promise<ProductWithVariants | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });

    if (!product || product.deletedAt) return null;

    const productImages = (product.images || []).map((img) =>
      this.mapImageEntity(img),
    );
    const productEntity = this.mapProductEntity(product, productImages);

    const variantEntities = (product.variants || []).map((v) => {
      const variantImages = (v.images || []).map((img) =>
        this.mapImageEntity(img),
      );
      return this.mapVariantEntity(v, variantImages);
    });

    return {
      product: productEntity,
      variants: variantEntities,
    };
  }

  async findDetail(identifier: string): Promise<ProductWithVariants | null> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        identifier,
      );

    const product = await this.prisma.product.findFirst({
      where: {
        deletedAt: null,
        ...(isUuid ? { id: identifier } : { slug: identifier }),
      },
      include: PRODUCT_INCLUDE,
    });

    if (!product) return null;

    const productImages = (product.images || []).map((img) =>
      this.mapImageEntity(img),
    );
    const productEntity = this.mapProductEntity(product, productImages);

    const variantEntities = (product.variants || []).map((v) => {
      const variantImages = (v.images || []).map((img) =>
        this.mapImageEntity(img),
      );
      return this.mapVariantEntity(v, variantImages);
    });

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

      // Cập nhật danh sách ảnh chung của sản phẩm (variantId = null) nếu có truyền images
      if (data.images !== undefined) {
        await tx.productImage.deleteMany({
          where: {
            productId: id,
            variantId: null,
          },
        });

        if (data.images.length > 0) {
          await tx.productImage.createMany({
            data: data.images.map((img) => ({
              productId: id,
              variantId: null,
              imageUrl: img.imageUrl,
              publicId: img.publicId ?? null,
              isThumbnail: img.isThumbnail ?? false,
              sortOrder: img.sortOrder ?? 0,
            })),
          });
        }
      }

      if (data.variants && data.variants.length > 0) {
        for (const variant of data.variants) {
          if (variant.id) {
            const variantUpdateData: Prisma.ProductVariantUpdateInput = {};
            if (variant.sku !== undefined) variantUpdateData.sku = variant.sku;
            if (variant.name !== undefined)
              variantUpdateData.name = variant.name;
            if (variant.price !== undefined)
              variantUpdateData.price = variant.price;
            if (variant.originalPrice !== undefined)
              variantUpdateData.originalPrice = variant.originalPrice;
            if (variant.weight !== undefined)
              variantUpdateData.weight = variant.weight;
            if (variant.stock !== undefined)
              variantUpdateData.stock = variant.stock;
            if (variant.status !== undefined)
              variantUpdateData.status = variant.status;

            await tx.productVariant.update({
              where: { id: variant.id },
              data: variantUpdateData,
            });

            // Cập nhật danh sách ảnh riêng của biến thể này nếu có truyền variant.images
            if (variant.images !== undefined) {
              await tx.productImage.deleteMany({
                where: { variantId: variant.id },
              });

              if (variant.images.length > 0) {
                await tx.productImage.createMany({
                  data: variant.images.map((img) => ({
                    productId: id,
                    variantId: variant.id,
                    imageUrl: img.imageUrl,
                    publicId: img.publicId ?? null,
                    isThumbnail: img.isThumbnail ?? false,
                    sortOrder: img.sortOrder ?? 0,
                  })),
                });
              }
            }
          } else {
            const createdVariant = await tx.productVariant.create({
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

            // Lưu ảnh cho biến thể mới tạo nếu có
            if (variant.images && variant.images.length > 0) {
              await tx.productImage.createMany({
                data: variant.images.map((img) => ({
                  productId: id,
                  variantId: createdVariant.id,
                  imageUrl: img.imageUrl,
                  publicId: img.publicId ?? null,
                  isThumbnail: img.isThumbnail ?? false,
                  sortOrder: img.sortOrder ?? 0,
                })),
              });
            }
          }
        }
      }

      const updated = await tx.product.findUniqueOrThrow({
        where: { id },
        include: PRODUCT_INCLUDE,
      });

      const productImages = (updated.images || []).map((img) =>
        this.mapImageEntity(img),
      );
      const productEntity = this.mapProductEntity(updated, productImages);

      const variantEntities = (updated.variants || []).map((v) => {
        const variantImages = (v.images || []).map((img) =>
          this.mapImageEntity(img),
        );
        return this.mapVariantEntity(v, variantImages);
      });

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
    images?: Array<{
      imageUrl: string;
      publicId?: string;
      isThumbnail?: boolean;
      sortOrder?: number;
    }>;
    variants?: Array<{
      sku: string;
      name: string;
      price: number;
      originalPrice?: number;
      weight?: number;
      stock?: number;
      status?: string;
      images?: Array<{
        imageUrl: string;
        publicId?: string;
        isThumbnail?: boolean;
        sortOrder?: number;
      }>;
    }>;
  }): Promise<ProductWithVariants | null> {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Tạo Product kèm các ảnh chung của sản phẩm (variantId = null)
      const createdProduct = await tx.product.create({
        data: {
          name: data.name,
          slug: data.slug,
          categoryId: data.categoryId ?? null,
          description: data.description ?? null,
          brand: data.brand,
          status: data.status ?? 'ACTIVE',
          images:
            data.images && data.images.length > 0
              ? {
                  create: data.images.map((img) => ({
                    imageUrl: img.imageUrl,
                    publicId: img.publicId ?? null,
                    isThumbnail: img.isThumbnail ?? false,
                    sortOrder: img.sortOrder ?? 0,
                    variantId: null,
                  })),
                }
              : undefined,
        },
        include: {
          images: {
            where: { variantId: null },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      // 2. Tạo từng biến thể (ProductVariant) kèm ảnh riêng của biến thể đó (nếu có)
      const createdVariants: Array<
        Prisma.ProductVariantGetPayload<{
          include: { images: true };
        }>
      > = [];

      if (data.variants && data.variants.length > 0) {
        for (const v of data.variants) {
          const variant = await tx.productVariant.create({
            data: {
              productId: createdProduct.id,
              sku: v.sku,
              name: v.name,
              price: v.price,
              originalPrice: v.originalPrice ?? null,
              weight: v.weight ?? null,
              stock: v.stock ?? 0,
              status: v.status ?? 'ACTIVE',
            },
          });

          let variantImages: Prisma.ProductImageGetPayload<{}>[] = [];
          if (v.images && v.images.length > 0) {
            await tx.productImage.createMany({
              data: v.images.map((img) => ({
                productId: createdProduct.id,
                variantId: variant.id,
                imageUrl: img.imageUrl,
                publicId: img.publicId ?? null,
                isThumbnail: img.isThumbnail ?? false,
                sortOrder: img.sortOrder ?? 0,
              })),
            });

            variantImages = await tx.productImage.findMany({
              where: { variantId: variant.id },
              orderBy: { sortOrder: 'asc' },
            });
          }

          createdVariants.push({
            ...variant,
            images: variantImages,
          });
        }
      }

      // Map sang Domain Entities
      const productImages = (createdProduct.images || []).map((img) =>
        this.mapImageEntity(img),
      );
      const productEntity = this.mapProductEntity(
        createdProduct,
        productImages,
      );

      const variantEntities = createdVariants.map((v) => {
        const variantImages = (v.images || []).map((img) =>
          this.mapImageEntity(img),
        );
        return this.mapVariantEntity(v, variantImages);
      });

      return {
        product: productEntity,
        variants: variantEntities,
      };
    });
  }

  async findBySlug(slug: string): Promise<ProductsEntity | null> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        images: {
          where: { variantId: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!product) return null;

    const productImages = (product.images || []).map((img) =>
      this.mapImageEntity(img),
    );

    return this.mapProductEntity(product, productImages);
  }

  async findVariantsBySkus(skus: string[]): Promise<ProductVariantEntity[]> {
    if (!skus || skus.length === 0) return [];

    const variants = await this.prisma.productVariant.findMany({
      where: {
        sku: { in: skus },
      },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return variants.map((v) => {
      const variantImages = (v.images || []).map((img) =>
        this.mapImageEntity(img),
      );
      return this.mapVariantEntity(v, variantImages);
    });
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
      include: PRODUCT_INCLUDE,
    });

    const hasNextPage = records.length > limit;

    if (hasNextPage) {
      records.pop();
    }

    const nextCursor =
      hasNextPage && records.length > 0 ? records[records.length - 1].id : null;

    const products: ProductWithVariants[] = records.map((item) => {
      const productImages = (item.images || []).map((img) =>
        this.mapImageEntity(img),
      );
      const productEntity = this.mapProductEntity(item, productImages);

      const variantEntities = (item.variants || []).map((v) => {
        const variantImages = (v.images || []).map((img) =>
          this.mapImageEntity(img),
        );
        return this.mapVariantEntity(v, variantImages);
      });

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
