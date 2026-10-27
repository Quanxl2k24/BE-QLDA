import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@/common/enums/order.enum';
import { OrderItemEntity } from './order-item.entity';

export interface ShippingAddress {
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  note?: string | null;
}

export interface OrderPaymentInfo {
  id: string;
  method: string;
  status: string;
  amount: number;
  transactionCode?: string | null;
  paidAt?: Date | null;
}

export interface OrderStatusHistoryInfo {
  id: string;
  status: string;
  note?: string | null;
  changedBy?: string | null;
  createdAt: Date;
}

export class OrderEntity {
  public readonly totalQuantity: number;

  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly orderCode: string,
    public readonly status: OrderStatus | string,
    public readonly subtotal: number,
    public readonly discountAmount: number = 0,
    public readonly shippingFee: number = 0,
    public readonly totalAmount: number = 0,
    public readonly shippingAddress: ShippingAddress,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly note?: string | null,
    public readonly items: OrderItemEntity[] = [],
    totalQuantity?: number,
    public readonly payment?: OrderPaymentInfo | null,
    public readonly histories?: OrderStatusHistoryInfo[],
  ) {
    this.totalQuantity =
      totalQuantity ??
      this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get isPending(): boolean {
    return this.status === OrderStatus.PENDING;
  }

  get isConfirmed(): boolean {
    return this.status === OrderStatus.CONFIRMED;
  }

  get isProcessing(): boolean {
    return this.status === OrderStatus.PROCESSING;
  }

  get isShipping(): boolean {
    return this.status === OrderStatus.SHIPPING;
  }

  get isDelivered(): boolean {
    return this.status === OrderStatus.DELIVERED;
  }

  get isCancelled(): boolean {
    return this.status === OrderStatus.CANCELLED;
  }

  get isRefunded(): boolean {
    return this.status === OrderStatus.REFUNDED;
  }

  get canCancel(): boolean {
    return (
      this.status === OrderStatus.PENDING ||
      this.status === OrderStatus.CONFIRMED
    );
  }

  /**
   * Định nghĩa ma trận chuyển đổi trạng thái hợp lệ (State Machine Transition Rules)
   */
  canTransitionTo(nextStatus: OrderStatus): boolean {
    const validTransitions: Record<string, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPING, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPING]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    const allowed = validTransitions[this.status] || [];
    return allowed.includes(nextStatus);
  }

  validateTransitionTo(nextStatus: OrderStatus): void {
    if (!this.canTransitionTo(nextStatus)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái đơn hàng từ "${this.status}" sang "${nextStatus}".`,
      );
    }
  }
}

export { OrderItemEntity };
