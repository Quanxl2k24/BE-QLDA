import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderRepository } from '../../domain/repositories/order.repository';
import { OrderEntity } from '../../domain/entities/order.entity';

@Injectable()
export class CancelOrderUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(
    orderId: string,
    currentUserId: string,
    reason?: string,
    isAdmin: boolean = false,
  ): Promise<OrderEntity> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng cần hủy.');
    }

    // Bảo mật: Người dùng chỉ được hủy đơn hàng của chính mình (hoặc Admin hủy)
    if (!isAdmin && order.userId !== currentUserId) {
      throw new ForbiddenException('Bạn không có quyền hủy đơn hàng này.');
    }

    return await this.orderRepository.cancelOrder(
      orderId,
      currentUserId,
      reason ?? (isAdmin ? 'Quản trị viên hủy đơn hàng' : 'Khách hàng hủy đơn'),
    );
  }
}
