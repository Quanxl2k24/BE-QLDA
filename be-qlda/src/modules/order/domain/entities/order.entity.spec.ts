import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@/common/enums/order.enum';
import { OrderEntity } from './order.entity';
import { OrderItemEntity } from './order-item.entity';

describe('OrderEntity State Machine & Domain Rules', () => {
  const dummyAddress = {
    recipientName: 'Nguyễn Văn A',
    phone: '0987654321',
    province: 'Hà Nội',
    district: 'Cầu Giấy',
    ward: 'Dịch Vọng',
    street: 'Số 10 Phạm Văn Đồng',
  };

  const dummyItem = new OrderItemEntity(
    'item-1',
    'order-1',
    'Bánh Trung Thu Thập Cẩm',
    100000,
    2,
    200000,
    new Date(),
    'variant-1',
    'Hộp 1 cái',
    'KD-TC-01',
  );

  const createOrderWithStatus = (status: OrderStatus) =>
    new OrderEntity(
      'order-1',
      'user-1',
      'ORD-TEST-001',
      status,
      200000,
      0,
      0,
      200000,
      dummyAddress,
      new Date(),
      new Date(),
      null,
      [dummyItem],
    );

  it('nên cho phép hủy khi đơn ở trạng thái PENDING hoặc CONFIRMED', () => {
    const pendingOrder = createOrderWithStatus(OrderStatus.PENDING);
    expect(pendingOrder.canCancel).toBe(true);

    const confirmedOrder = createOrderWithStatus(OrderStatus.CONFIRMED);
    expect(confirmedOrder.canCancel).toBe(true);

    const processingOrder = createOrderWithStatus(OrderStatus.PROCESSING);
    expect(processingOrder.canCancel).toBe(false);

    const shippingOrder = createOrderWithStatus(OrderStatus.SHIPPING);
    expect(shippingOrder.canCancel).toBe(false);

    const deliveredOrder = createOrderWithStatus(OrderStatus.DELIVERED);
    expect(deliveredOrder.canCancel).toBe(false);
  });

  it('State Machine: chuyển trạng thái hợp lệ từ PENDING -> CONFIRMED -> PROCESSING -> SHIPPING -> DELIVERED', () => {
    const pendingOrder = createOrderWithStatus(OrderStatus.PENDING);
    expect(pendingOrder.canTransitionTo(OrderStatus.CONFIRMED)).toBe(true);
    expect(pendingOrder.canTransitionTo(OrderStatus.CANCELLED)).toBe(true);
    expect(pendingOrder.canTransitionTo(OrderStatus.DELIVERED)).toBe(false);

    const confirmedOrder = createOrderWithStatus(OrderStatus.CONFIRMED);
    expect(confirmedOrder.canTransitionTo(OrderStatus.PROCESSING)).toBe(true);
    expect(confirmedOrder.canTransitionTo(OrderStatus.CANCELLED)).toBe(true);

    const processingOrder = createOrderWithStatus(OrderStatus.PROCESSING);
    expect(processingOrder.canTransitionTo(OrderStatus.SHIPPING)).toBe(true);

    const shippingOrder = createOrderWithStatus(OrderStatus.SHIPPING);
    expect(shippingOrder.canTransitionTo(OrderStatus.DELIVERED)).toBe(true);
  });

  it('State Machine: ném BadRequestException nếu chuyển đổi trạng thái phi lý', () => {
    const deliveredOrder = createOrderWithStatus(OrderStatus.DELIVERED);
    expect(() => deliveredOrder.validateTransitionTo(OrderStatus.PENDING)).toThrow(
      BadRequestException,
    );

    const cancelledOrder = createOrderWithStatus(OrderStatus.CANCELLED);
    expect(() => cancelledOrder.validateTransitionTo(OrderStatus.DELIVERED)).toThrow(
      BadRequestException,
    );
  });

  it('tính toán đúng tổng số lượng sản phẩm totalQuantity', () => {
    const order = createOrderWithStatus(OrderStatus.PENDING);
    expect(order.totalQuantity).toBe(2);
  });
});
