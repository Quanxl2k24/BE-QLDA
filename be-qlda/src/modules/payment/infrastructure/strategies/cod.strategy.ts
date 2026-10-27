import { Injectable } from '@nestjs/common';
import {
  IPaymentStrategy,
  PaymentProcessingResult,
  ProcessPaymentInput,
} from '../../domain/payment-strategy.interface';

@Injectable()
export class CodPaymentStrategy implements IPaymentStrategy {
  readonly method = 'COD';

  async processPayment(
    input: ProcessPaymentInput,
  ): Promise<PaymentProcessingResult> {
    return {
      success: true,
      method: this.method,
      status: 'PENDING',
      transactionCode: `COD-${input.orderCode}`,
      message: 'Đặt hàng thành công theo hình thức thanh toán khi nhận hàng (COD)',
    };
  }
}
