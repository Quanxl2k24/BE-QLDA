import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.services';
import { Prisma } from '@prisma/client';
import { OrderStatus } from '@/common/enums/order.enum';
import {
  CreateOrderRepoInput,
  FindAdminOrdersParams,
  FindMyOrdersParams,
  OrderRepository,
  PaginatedOrdersResult,
} from '../../domain/repositories/order.repository';
import {
  OrderEntity,
  OrderItemEntity,
  ShippingAddress,
} from '../../domain/entities/order.entity';

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    items: true;
    payment: true;
    orderStatusHistories: {
      orderBy: { createdAt: 'desc' };
    };
  };
}>;

@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToOrderEntity(order: OrderWithRelations): OrderEntity {
    const items = order.items.map(
      (item) =>
        new OrderItemEntity(
          item.id,
          item.orderId,
          item.productName,
          Number(item.unitPrice),
          item.quantity,
          Number(item.totalPrice),
          item.createdAt,
          item.variantId,
          item.variantName,
          item.sku,
        ),
    );

    const payment = order.payment
      ? {
          id: order.payment.id,
          method: order.payment.method,
          status: order.payment.status,
          amount: Number(order.payment.amount),
          transactionCode: order.payment.transactionCode,
          paidAt: order.payment.paidAt,
        }
      : null;

    const histories = order.orderStatusHistories.map((h) => ({
      id: h.id,
      status: h.status,
      note: h.note,
      changedBy: h.changedBy,
      createdAt: h.createdAt,
    }));

    return new OrderEntity(
      order.id,
      order.userId,
      order.orderCode,
      order.status as OrderStatus,
      Number(order.subtotal),
      Number(order.discountAmount),
      Number(order.shippingFee),
      Number(order.totalAmount),
      order.shippingAddress as unknown as ShippingAddress,
      order.createdAt,
      order.updatedAt,
      order.note,
      items,
      undefined,
      payment,
      histories,
    );
  }

  async createOrder(input: CreateOrderRepoInput): Promise<OrderEntity> {
    // 1. CHỐNG DEADLOCK: Sắp xếp items theo variantId tăng dần
    // Đảm bảo mọi transaction đồng thời luôn lock kho theo đúng 1 thứ tự cố định
    const sortedItems = [...input.items].sort((a, b) =>
      a.variantId.localeCompare(b.variantId),
    );

    return await this.prisma.$transaction(
      async (tx) => {
        // 2. ATOMIC STOCK DECREMENT: Trừ kho trực tiếp ở DB với điều kiện stock >= quantity
        for (const item of sortedItems) {
          const updateResult = await tx.productVariant.updateMany({
            where: {
              id: item.variantId,
              stock: { gte: item.quantity },
              status: 'ACTIVE',
            },
            data: {
              stock: { decrement: item.quantity },
            },
          });

          if (updateResult.count === 0) {
            throw new BadRequestException(
              `Sản phẩm "${item.productName}${item.variantName ? ` - ${item.variantName}` : ''}" đã hết hàng hoặc không đủ số lượng tồn kho.`,
            );
          }
        }

        // 3. TẠO RECORD ORDER KÈM ITEMS, PAYMENT, VÀ LỊCH SỬ TRẠNG THÁI
        const createdOrder = await tx.order.create({
          data: {
            userId: input.userId,
            orderCode: input.orderCode,
            status: input.status,
            subtotal: new Prisma.Decimal(input.subtotal),
            discountAmount: new Prisma.Decimal(input.discountAmount),
            shippingFee: new Prisma.Decimal(input.shippingFee),
            totalAmount: new Prisma.Decimal(input.totalAmount),
            shippingAddress: input.shippingAddress as unknown as Prisma.InputJsonValue,
            note: input.note,
            items: {
              create: input.items.map((item) => ({
                variantId: item.variantId,
                productName: item.productName,
                variantName: item.variantName ?? null,
                sku: item.sku ?? null,
                unitPrice: new Prisma.Decimal(item.unitPrice),
                quantity: item.quantity,
                totalPrice: new Prisma.Decimal(item.totalPrice),
              })),
            },
            payment: {
              create: {
                method: input.paymentMethod,
                status: 'PENDING',
                amount: new Prisma.Decimal(input.totalAmount),
                transactionCode:
                  input.paymentMethod === 'COD'
                    ? `COD-${input.orderCode}`
                    : null,
              },
            },
            orderStatusHistories: {
              create: {
                status: input.status,
                note: `Khởi tạo đơn hàng (${input.paymentMethod})`,
                changedBy: input.userId,
              },
            },
          },
          include: {
            items: true,
            payment: true,
            orderStatusHistories: {
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        // 4. XÓA ITEMS KHỎI GIỎ HÀNG NẾU ĐẶT HÀNG TỪ GIỎ
        if (
          input.cartItemIdsToDelete &&
          input.cartItemIdsToDelete.length > 0
        ) {
          await tx.cartItem.deleteMany({
            where: {
              id: { in: input.cartItemIdsToDelete },
              cart: { userId: input.userId },
            },
          });
        }

        return this.mapToOrderEntity(createdOrder);
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        timeout: 10000,
      },
    );
  }

  async findById(id: string): Promise<OrderEntity | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        payment: true,
        orderStatusHistories: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return order ? this.mapToOrderEntity(order) : null;
  }

  async findByOrderCode(orderCode: string): Promise<OrderEntity | null> {
    const order = await this.prisma.order.findUnique({
      where: { orderCode },
      include: {
        items: true,
        payment: true,
        orderStatusHistories: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return order ? this.mapToOrderEntity(order) : null;
  }

  async findMyOrders(
    params: FindMyOrdersParams,
  ): Promise<PaginatedOrdersResult> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(50, Math.max(1, params.limit ?? 10));
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      userId: params.userId,
      ...(params.status ? { status: params.status } : {}),
    };

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          payment: true,
          orderStatusHistories: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
    ]);

    return {
      orders: orders.map((o) => this.mapToOrderEntity(o)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllOrders(
    params: FindAdminOrdersParams,
  ): Promise<PaginatedOrdersResult> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 10));
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.userId ? { userId: params.userId } : {}),
      ...(params.fromDate || params.toDate
        ? {
            createdAt: {
              ...(params.fromDate ? { gte: params.fromDate } : {}),
              ...(params.toDate ? { lte: params.toDate } : {}),
            },
          }
        : {}),
      ...(params.search
        ? {
            OR: [
              { orderCode: { contains: params.search, mode: 'insensitive' } },
              {
                user: {
                  OR: [
                    {
                      fullName: {
                        contains: params.search,
                        mode: 'insensitive',
                      },
                    },
                    {
                      phone: { contains: params.search, mode: 'insensitive' },
                    },
                    {
                      email: { contains: params.search, mode: 'insensitive' },
                    },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          payment: true,
          orderStatusHistories: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
    ]);

    return {
      orders: orders.map((o) => this.mapToOrderEntity(o)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async cancelOrder(
    orderId: string,
    changedBy?: string,
    reason?: string,
  ): Promise<OrderEntity> {
    return await this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: {
            items: true,
            payment: true,
            orderStatusHistories: true,
          },
        });

        if (!order) {
          throw new NotFoundException('Không tìm thấy đơn hàng cần hủy.');
        }

        const domainOrder = this.mapToOrderEntity(order);
        if (!domainOrder.canCancel) {
          throw new BadRequestException(
            `Đơn hàng đang ở trạng thái "${order.status}", không thể thực hiện hủy đơn.`,
          );
        }

        // 1. Cập nhật trạng thái đơn hàng sang CANCELLED
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.CANCELLED },
          include: {
            items: true,
            payment: true,
            orderStatusHistories: {
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        // 2. HOÀN KHO AN TOÀN (Rollback inventory)
        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stock: { increment: item.quantity },
              },
            });
          }
        }

        // 3. Ghi log lịch sử trạng thái
        await tx.orderStatusHistory.create({
          data: {
            orderId,
            status: OrderStatus.CANCELLED,
            note: reason ?? 'Người dùng yêu cầu hủy đơn hàng',
            changedBy: changedBy ?? null,
          },
        });

        // 4. Nếu có payment PENDING thì cập nhật CANCELLED
        if (order.payment && order.payment.status === 'PENDING') {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: { status: 'CANCELLED' },
          });
        }

        // Refresh lại lịch sử
        const refreshed = await tx.order.findUnique({
          where: { id: orderId },
          include: {
            items: true,
            payment: true,
            orderStatusHistories: {
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        return this.mapToOrderEntity(refreshed!);
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );
  }

  async updateStatus(
    orderId: string,
    newStatus: OrderStatus,
    changedBy?: string,
    note?: string,
  ): Promise<OrderEntity> {
    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          payment: true,
          orderStatusHistories: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng cần cập nhật.');
      }

      const domainOrder = this.mapToOrderEntity(order);
      // Validate chuyển đổi trạng thái bằng domain state machine
      domainOrder.validateTransitionTo(newStatus);

      // Nếu chuyển sang DELIVERED và là COD -> Cập nhật Payment thành PAID
      if (
        newStatus === OrderStatus.DELIVERED &&
        order.payment &&
        order.payment.method === 'COD' &&
        order.payment.status === 'PENDING'
      ) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            status: 'PAID',
            paidAt: new Date(),
          },
        });
      }

      // Cập nhật Order status
      await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });

      // Ghi lịch sử trạng thái
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: newStatus,
          note: note ?? `Chuyển trạng thái sang ${newStatus}`,
          changedBy: changedBy ?? null,
        },
      });

      const updated = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          payment: true,
          orderStatusHistories: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      return this.mapToOrderEntity(updated!);
    });
  }
}
