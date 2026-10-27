import { Injectable } from '@nestjs/common';
import { OrderRepository } from '../../domain/repositories/order.repository';
import { OrderStatus } from '@/common/enums/order.enum';
import { OrderEntity } from '../../domain/entities/order.entity';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(
    orderId: string,
    newStatus: OrderStatus,
    changedBy: string,
    note?: string,
  ): Promise<OrderEntity> {
    return await this.orderRepository.updateStatus(
      orderId,
      newStatus,
      changedBy,
      note,
    );
  }
}
