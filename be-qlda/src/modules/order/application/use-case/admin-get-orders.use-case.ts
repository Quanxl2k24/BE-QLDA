import { Injectable } from '@nestjs/common';
import {
  FindAdminOrdersParams,
  OrderRepository,
  PaginatedOrdersResult,
} from '../../domain/repositories/order.repository';

@Injectable()
export class AdminGetOrdersUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(params: FindAdminOrdersParams): Promise<PaginatedOrdersResult> {
    return await this.orderRepository.findAllOrders(params);
  }
}
