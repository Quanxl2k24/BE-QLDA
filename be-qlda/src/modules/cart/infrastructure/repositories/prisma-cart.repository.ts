import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.services';
import { Prisma } from '@prisma/client';
import {
  CartRepository,
  GetCartItemsParams,
  PaginatedCartResult,
} from '../../domain/repositories/cart.repository';
import { CartEntity } from '../../domain/entities/cart.entity';
import {
  CartItemEntity,
  CartItemVariant,
} from '../../domain/entities/cart-item.entity';

type VariantWithDetails = Prisma.ProductVariantGetPayload<{
  include: {
    product: {
      select: {
        id: true;
        name: true;
        slug: true;
        status: true;
        images: {
          select: { imageUrl: true };
        };
      };
    };
    images: {
      select: { imageUrl: true };
    };
  };
}>;

type CartItemWithDetails = Prisma.CartItemGetPayload<{
  include: {
    variant: {
      include: {
        product: {
          select: {
            id: true;
            name: true;
            slug: true;
            status: true;
            images: {
              select: { imageUrl: true };
            };
          };
        };
        images: {
          select: { imageUrl: true };
        };
      };
    };
  };
}>;

@Injectable()
export class PrismaCartRepository implements CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapVariantInfo(variant: VariantWithDetails): CartItemVariant {
    const imageUrl =
      variant.images?.[0]?.imageUrl ??
      variant.product?.images?.[0]?.imageUrl ??
      null;

    const status =
      variant.product?.status !== 'ACTIVE' ? 'INACTIVE' : variant.status;

    return {
      id: variant.id,
      productId: variant.productId,
      productName: variant.product?.name ?? '',
      productSlug: variant.product?.slug ?? '',
      sku: variant.sku,
      name: variant.name,
      price: Number(variant.price),
      originalPrice: variant.originalPrice
        ? Number(variant.originalPrice)
        : null,
      stock: variant.stock,
      status,
      imageUrl,
    };
  }

  private mapToCartItemEntity(item: CartItemWithDetails): CartItemEntity {
    const variant = item.variant
      ? this.mapVariantInfo(item.variant)
      : undefined;

    return new CartItemEntity(
      item.id,
      item.cartId,
      item.variantId,
      item.quantity,
      item.createdAt,
      item.updatedAt,
      variant,
    );
  }

  async findVariantById(variantId: string): Promise<CartItemVariant | null> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            images: {
              where: { isThumbnail: true },
              take: 1,
              select: { imageUrl: true },
            },
          },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
          select: { imageUrl: true },
        },
      },
    });

    if (!variant) return null;

    return this.mapVariantInfo(variant);
  }

  async findCartByUserId(userId: string): Promise<CartEntity | null> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    status: true,
                    images: {
                      where: { isThumbnail: true },
                      take: 1,
                      select: { imageUrl: true },
                    },
                  },
                },
                images: {
                  orderBy: { sortOrder: 'asc' },
                  take: 1,
                  select: { imageUrl: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cart) return null;

    return new CartEntity(
      cart.id,
      cart.userId,
      cart.createdAt,
      cart.updatedAt,
      cart.items.map((item) => this.mapToCartItemEntity(item)),
    );
  }

  async findCartItem(
    cartId: string,
    variantId: string,
  ): Promise<CartItemEntity | null> {
    const item = await this.prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId,
          variantId,
        },
      },
      include: {
        variant: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                images: {
                  where: { isThumbnail: true },
                  take: 1,
                  select: { imageUrl: true },
                },
              },
            },
            images: {
              orderBy: { sortOrder: 'asc' },
              take: 1,
              select: { imageUrl: true },
            },
          },
        },
      },
    });

    if (!item) return null;
    return this.mapToCartItemEntity(item);
  }

  async findCartItemById(cartItemId: string): Promise<CartItemEntity | null> {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        variant: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                images: {
                  where: { isThumbnail: true },
                  take: 1,
                  select: { imageUrl: true },
                },
              },
            },
            images: {
              orderBy: { sortOrder: 'asc' },
              take: 1,
              select: { imageUrl: true },
            },
          },
        },
      },
    });

    if (!item) return null;
    return this.mapToCartItemEntity(item);
  }

  async addToCart(data: {
    userId: string;
    variantId: string;
    quantity: number;
  }): Promise<CartItemEntity> {
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Get or create cart for user
      let cart = await tx.cart.findUnique({
        where: { userId: data.userId },
      });

      if (!cart) {
        cart = await tx.cart.create({
          data: {
            userId: data.userId,
          },
        });
      }

      // 2. Upsert cart item
      const cartItem = await tx.cartItem.upsert({
        where: {
          cartId_variantId: {
            cartId: cart.id,
            variantId: data.variantId,
          },
        },
        update: {
          quantity: { increment: data.quantity },
        },
        create: {
          cartId: cart.id,
          variantId: data.variantId,
          quantity: data.quantity,
        },
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  status: true,
                  images: {
                    where: { isThumbnail: true },
                    take: 1,
                    select: { imageUrl: true },
                  },
                },
              },
              images: {
                orderBy: { sortOrder: 'asc' },
                take: 1,
                select: { imageUrl: true },
              },
            },
          },
        },
      });

      // 3. Update cart updatedAt
      await tx.cart.update({
        where: { id: cart.id },
        data: { updatedAt: new Date() },
      });

      return cartItem;
    });

    return this.mapToCartItemEntity(result);
  }

  async updateCartItemQuantity(
    cartItemId: string,
    quantity: number,
  ): Promise<CartItemEntity> {
    const result = await this.prisma.$transaction(async (tx) => {
      const updatedItem = await tx.cartItem.update({
        where: { id: cartItemId },
        data: {
          quantity,
          updatedAt: new Date(),
        },
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  status: true,
                  images: {
                    where: { isThumbnail: true },
                    take: 1,
                    select: { imageUrl: true },
                  },
                },
              },
              images: {
                orderBy: { sortOrder: 'asc' },
                take: 1,
                select: { imageUrl: true },
              },
            },
          },
        },
      });

      await tx.cart.update({
        where: { id: updatedItem.cartId },
        data: { updatedAt: new Date() },
      });

      return updatedItem;
    });

    return this.mapToCartItemEntity(result);
  }

  async removeCartItem(cartItemId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const deletedItem = await tx.cartItem.delete({
        where: { id: cartItemId },
      });

      await tx.cart.update({
        where: { id: deletedItem.cartId },
        data: { updatedAt: new Date() },
      });
    });
  }

  async clearCart(userId: string): Promise<number> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!cart) {
      return 0;
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const deleteResult = await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      await tx.cart.update({
        where: { id: cart.id },
        data: { updatedAt: new Date() },
      });

      return deleteResult.count;
    });

    return result;
  }

  async getCartItemsWithCursor(
    params: GetCartItemsParams,
  ): Promise<PaginatedCartResult> {
    const { userId, cursor, limit } = params;

    // 1. Tìm giỏ hàng của user
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!cart) {
      return {
        cartId: null,
        items: [],
        nextCursor: null,
        hasNextPage: false,
        totalQuantity: 0,
        totalPrice: 0,
        totalItems: 0,
      };
    }

    // 2. Nếu có cursor, xác thực cursor có tồn tại trong giỏ hàng không
    if (cursor) {
      const cursorItem = await this.prisma.cartItem.findFirst({
        where: { id: cursor, cartId: cart.id },
        select: { id: true },
      });
      if (!cursorItem) {
        throw new BadRequestException(
          'Cursor không tồn tại hoặc không thuộc giỏ hàng này',
        );
      }
    }

    // 3. Lấy danh sách sản phẩm phân trang cursor + tổng hợp số lượng & tổng tiền giỏ hàng
    const [records, allSummaryItems] = await Promise.all([
      this.prisma.cartItem.findMany({
        where: { cartId: cart.id },
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  status: true,
                  images: {
                    where: { isThumbnail: true },
                    take: 1,
                    select: { imageUrl: true },
                  },
                },
              },
              images: {
                orderBy: { sortOrder: 'asc' },
                take: 1,
                select: { imageUrl: true },
              },
            },
          },
        },
      }),
      this.prisma.cartItem.findMany({
        where: { cartId: cart.id },
        select: {
          quantity: true,
          variant: {
            select: {
              price: true,
            },
          },
        },
      }),
    ]);

    const hasNextPage = records.length > limit;
    if (hasNextPage) {
      records.pop();
    }

    const nextCursor =
      hasNextPage && records.length > 0 ? records[records.length - 1].id : null;

    const items = records.map((record) => this.mapToCartItemEntity(record));

    let totalQuantity = 0;
    let totalPrice = 0;
    for (const item of allSummaryItems) {
      totalQuantity += item.quantity;
      const unitPrice = Number(item.variant?.price ?? 0);
      totalPrice += item.quantity * unitPrice;
    }
    totalPrice = Math.round(totalPrice * 100) / 100;

    return {
      cartId: cart.id,
      items,
      nextCursor,
      hasNextPage,
      totalQuantity,
      totalPrice,
      totalItems: allSummaryItems.length,
    };
  }
}

