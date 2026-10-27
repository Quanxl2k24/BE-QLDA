import { Injectable } from '@nestjs/common';
import {
  FindMyOrdersParams,
  OrderRepository,
  PaginatedOrdersResult,
} from '../../domain/repositories/order.repository';

@Injectable()
export class GetMyOrdersUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(params: FindMyOrdersParams): Promise<PaginatedOrdersResult> {
    return await this.orderRepository.findMyOrders(params);
  }
}
