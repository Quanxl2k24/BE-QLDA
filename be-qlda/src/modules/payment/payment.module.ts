import { Module } from '@nestjs/common';
import { CodPaymentStrategy } from './infrastructure/strategies/cod.strategy';
import { PaymentFactory } from './application/payment.factory';

@Module({
  providers: [CodPaymentStrategy, PaymentFactory],
  exports: [PaymentFactory, CodPaymentStrategy],
})
export class PaymentModule {}
