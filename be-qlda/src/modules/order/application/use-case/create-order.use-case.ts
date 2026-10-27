import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { PrismaService } from '@/database/prisma/prisma.services';
import { Prisma } from '@prisma/client';
import { OrderStatus } from '@/common/enums/order.enum';
import {
  OrderItemInput,
  OrderRepository,
} from '../../domain/repositories/order.repository';
import { CreateOrderDto, PaymentMethod } from '../../persentation/dto/createOrder.dto';
import { PaymentFactory } from '@/modules/payment/application/payment.factory';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';

@Injectable()
export class CreateOrderUseCase {
  private readonly logger = new Logger(CreateOrderUseCase.name);

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly prisma: PrismaService,
    private readonly paymentFactory: PaymentFactory,
    @InjectRedis() private readonly redis: Redis,
    @InjectQueue('email') private readonly emailQueue: Queue,
  ) {}

  /**
   * Sinh mã đơn hàng duy nhất và thân thiện (Ví dụ: ORD-261028-A8F2K1)
   */
  private generateOrderCode(): string {
    const today = new Date();
    const datePart = today.toISOString().slice(2, 10).replace(/-/g, '');
    const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `ORD-${datePart}-${randomPart}`;
  }

  async execute(userId: string, dto: CreateOrderDto) {
    // =========================================================================
    // 1. CHỐNG DOUBLE SUBMIT / SPAM REQUEST (IDEMPOTENCY QUA REDIS)
    // =========================================================================
    const requestHash = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          userId,
          cartItemIds: dto.cartItemIds?.slice().sort(),
          items: dto.items?.slice().sort((a, b) => a.variantId.localeCompare(b.variantId)),
        }),
      )
      .digest('hex');

    const lockKey = `order:idempotency:${userId}:${requestHash}`;
    const acquiredLock = await this.redis.set(lockKey, 'PROCESSING', 'EX', 10, 'NX');

    if (!acquiredLock) {
      throw new ConflictException(
        'Đơn hàng của bạn đang được xử lý, vui lòng không gửi yêu cầu liên tục.',
      );
    }

    try {
      let orderItemsToCreate: OrderItemInput[] = [];
      let cartItemIdsToDelete: string[] | undefined = undefined;

      // =========================================================================
      // 2. TẬP HỢP SẢN PHẨM & LẤY GIÁ 100% TỪ DATABASE (ZERO TRUST FRONTEND)
      // =========================================================================
      if (dto.cartItemIds && dto.cartItemIds.length > 0) {
        // --- LUỒNG A: ĐẶT HÀNG TỪ GIỎ HÀNG ---
        const cart = await this.prisma.cart.findUnique({
          where: { userId },
          include: {
            items: {
              where: { id: { in: dto.cartItemIds } },
              include: {
                variant: {
                  include: {
                    product: {
                      select: { id: true, name: true, status: true },
                    },
                  },
                },
              },
            },
          },
        });

        if (!cart || cart.items.length === 0) {
          throw new NotFoundException(
            'Không tìm thấy sản phẩm hợp lệ trong giỏ hàng để tạo đơn hàng.',
          );
        }

        if (cart.items.length !== dto.cartItemIds.length) {
          throw new BadRequestException(
            'Một số sản phẩm được chọn không còn tồn tại trong giỏ hàng của bạn.',
          );
        }

        for (const item of cart.items) {
          const variant = item.variant;
          if (
            variant.status !== 'ACTIVE' ||
            variant.product?.status !== 'ACTIVE'
          ) {
            throw new BadRequestException(
              `Sản phẩm "${variant.product?.name ?? ''} - ${variant.name}" đã ngừng kinh doanh.`,
            );
          }

          if (item.quantity > variant.stock) {
            throw new BadRequestException(
              `Sản phẩm "${variant.name}" chỉ còn ${variant.stock} sản phẩm trong kho (bạn đặt ${item.quantity}).`,
            );
          }

          const unitPrice = Number(variant.price);
          const totalPrice = Number(
            new Prisma.Decimal(variant.price).mul(item.quantity).toDecimalPlaces(2),
          );

          orderItemsToCreate.push({
            variantId: variant.id,
            productName: variant.product?.name ?? variant.name,
            variantName: variant.name,
            sku: variant.sku,
            unitPrice,
            quantity: item.quantity,
            totalPrice,
          });
        }

        cartItemIdsToDelete = dto.cartItemIds;
      } else if (dto.items && dto.items.length > 0) {
        // --- LUỒNG B: MUA NGAY (BUY NOW) ---
        const variantIds = dto.items.map((i) => i.variantId);
        const variants = await this.prisma.productVariant.findMany({
          where: { id: { in: variantIds } },
          include: {
            product: {
              select: { id: true, name: true, status: true },
            },
          },
        });

        const variantMap = new Map(variants.map((v) => [v.id, v]));

        for (const reqItem of dto.items) {
          const variant = variantMap.get(reqItem.variantId);
          if (!variant) {
            throw new NotFoundException(
              `Không tìm thấy biến thể sản phẩm có ID: ${reqItem.variantId}`,
            );
          }

          if (
            variant.status !== 'ACTIVE' ||
            variant.product?.status !== 'ACTIVE'
          ) {
            throw new BadRequestException(
              `Sản phẩm "${variant.product?.name ?? ''} - ${variant.name}" đã ngừng kinh doanh.`,
            );
          }

          if (reqItem.quantity > variant.stock) {
            throw new BadRequestException(
              `Sản phẩm "${variant.name}" không đủ số lượng tồn kho (còn ${variant.stock}).`,
            );
          }

          const unitPrice = Number(variant.price);
          const totalPrice = Number(
            new Prisma.Decimal(variant.price)
              .mul(reqItem.quantity)
              .toDecimalPlaces(2),
          );

          orderItemsToCreate.push({
            variantId: variant.id,
            productName: variant.product?.name ?? variant.name,
            variantName: variant.name,
            sku: variant.sku,
            unitPrice,
            quantity: reqItem.quantity,
            totalPrice,
          });
        }
      } else {
        throw new BadRequestException(
          'Vui lòng chọn danh sách sản phẩm từ giỏ hàng hoặc danh sách mua ngay.',
        );
      }

      // =========================================================================
      // 3. TÍNH TOÁN TIỀN CHÍNH XÁC (DÙNG PRISMA DECIMAL TRÁNH SAI SỐ FLOAT)
      // =========================================================================
      let subtotalDecimal = new Prisma.Decimal(0);
      for (const item of orderItemsToCreate) {
        subtotalDecimal = subtotalDecimal.add(
          new Prisma.Decimal(item.unitPrice).mul(item.quantity),
        );
      }

      const shippingFeeDecimal = new Prisma.Decimal(0); // Có thể mở rộng tích hợp GHN/GHTK sau
      const discountAmountDecimal = new Prisma.Decimal(0); // Có thể mở rộng Voucher/Coupon sau
      const totalAmountDecimal = subtotalDecimal
        .sub(discountAmountDecimal)
        .add(shippingFeeDecimal);

      const orderCode = this.generateOrderCode();

      // =========================================================================
      // 4. KIỂM TRA PHƯƠNG THỨC THANH TOÁN QUA FACTORY
      // =========================================================================
      const paymentStrategy = this.paymentFactory.getStrategy(
        dto.paymentMethod ?? PaymentMethod.COD,
      );

      // =========================================================================
      // 5. THỰC THI TẠO ĐƠN & ATOMIC INVENTORY DECREMENT QUA REPOSITORY
      // =========================================================================
      const createdOrder = await this.orderRepository.createOrder({
        userId,
        orderCode,
        status: OrderStatus.PENDING,
        subtotal: subtotalDecimal.toNumber(),
        discountAmount: discountAmountDecimal.toNumber(),
        shippingFee: shippingFeeDecimal.toNumber(),
        totalAmount: totalAmountDecimal.toNumber(),
        shippingAddress: dto.shippingAddress,
        note: dto.note,
        paymentMethod: paymentStrategy.method,
        items: orderItemsToCreate,
        cartItemIdsToDelete,
      });

      // =========================================================================
      // 6. XỬ LÝ THANH TOÁN (COD HOẶC ONLINE PAYMENT QUA STRATEGY)
      // =========================================================================
      const paymentResult = await paymentStrategy.processPayment({
        orderId: createdOrder.id,
        orderCode: createdOrder.orderCode,
        amount: createdOrder.totalAmount,
        userId,
      });

      // =========================================================================
      // 7. BẮN ASYNC EVENT VÀO BULLMQ ĐỂ XỬ LÝ GỬI EMAIL CHẠY NỀN
      // =========================================================================
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, fullName: true },
        });

        if (user?.email) {
          await this.emailQueue.add('order-confirmation', {
            to: user.email,
            subject: `[Kinh Đô] Xác nhận đơn hàng #${createdOrder.orderCode}`,
            context: {
              fullName: user.fullName ?? 'Quý khách',
              orderCode: createdOrder.orderCode,
              totalAmount: createdOrder.totalAmount,
              paymentMethod: paymentStrategy.method,
              createdAt: createdOrder.createdAt,
            },
          });
        }
      } catch (queueErr) {
        // Lỗi đẩy queue không làm fail response tạo đơn hàng
        this.logger.error('Lỗi khi đẩy job email xác nhận đơn hàng', queueErr);
      }

      return {
        order: createdOrder,
        payment: paymentResult,
      };
    } finally {
      // Giữ lock trong Redis trong vòng 5 giây để tránh user vô tình click liên tiếp
      // Không xóa ngay để chống duplicate click hoàn toàn
    }
  }
}
