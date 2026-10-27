import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderRepository } from '../../domain/repositories/order.repository';
import { OrderEntity } from '../../domain/entities/order.entity';

@Injectable()
export class GetOrderDetailUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(
    identifier: string,
    currentUserId: string,
    isAdmin: boolean = false,
  ): Promise<OrderEntity> {
    // Tìm kiếm theo UUID id hoặc theo orderCode
    let order: OrderEntity | null = null;
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        identifier,
      );

    if (isUuid) {
      order = await this.orderRepository.findById(identifier);
    } else {
      order = await this.orderRepository.findByOrderCode(identifier);
    }

    if (!order) {
      throw new NotFoundException(
        `Không tìm thấy đơn hàng với thông tin: ${identifier}`,
      );
    }

    // Bảo mật: Người dùng chỉ được xem đơn hàng của chính mình (trừ khi là Admin)
    if (!isAdmin && order.userId !== currentUserId) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập thông tin đơn hàng này.',
      );
    }

    return order;
  }
}
