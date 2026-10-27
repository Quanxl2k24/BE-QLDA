import { Module } from '@nestjs/common';
import { OrderController } from './persentation/controllers/order.controller';
import { CreateOrderUseCase } from './application/use-case/create-order.use-case';
import { GetOrderDetailUseCase } from './application/use-case/get-order-detail.use-case';
import { GetMyOrdersUseCase } from './application/use-case/get-my-orders.use-case';
import { CancelOrderUseCase } from './application/use-case/cancel-order.use-case';
import { UpdateOrderStatusUseCase } from './application/use-case/update-order-status.use-case';
import { AdminGetOrdersUseCase } from './application/use-case/admin-get-orders.use-case';
import { OrderRepository } from './domain/repositories/order.repository';
import { PrismaOrderRepository } from './infrastructure/repositories/prisma-order.repository';
import { PaymentModule } from '../payment/payment.module';
import { QueueModule } from '@/share/quece/quece.module';

@Module({
  imports: [PaymentModule, QueueModule],
  controllers: [OrderController],
  providers: [
    {
      provide: OrderRepository,
      useClass: PrismaOrderRepository,
    },
    CreateOrderUseCase,
    GetOrderDetailUseCase,
    GetMyOrdersUseCase,
    CancelOrderUseCase,
    UpdateOrderStatusUseCase,
    AdminGetOrdersUseCase,
  ],
  exports: [OrderRepository, CreateOrderUseCase],
})
export class OrderModule {}
