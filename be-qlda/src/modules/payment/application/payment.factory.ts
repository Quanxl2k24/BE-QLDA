import { BadRequestException, Injectable } from '@nestjs/common';
import { IPaymentStrategy } from '../domain/payment-strategy.interface';
import { CodPaymentStrategy } from '../infrastructure/strategies/cod.strategy';

@Injectable()
export class PaymentFactory {
  private readonly strategies = new Map<string, IPaymentStrategy>();

  constructor(private readonly codStrategy: CodPaymentStrategy) {
    this.registerStrategy(this.codStrategy);
  }

  registerStrategy(strategy: IPaymentStrategy): void {
    this.strategies.set(strategy.method.toUpperCase(), strategy);
  }

  getStrategy(method: string): IPaymentStrategy {
    const normalizedMethod = method.toUpperCase();
    const strategy = this.strategies.get(normalizedMethod);
    if (!strategy) {
      throw new BadRequestException(
        `Phương thức thanh toán "${method}" hiện tại chưa được hỗ trợ hoặc đang trong quá trình phát triển tích hợp. Vui lòng chọn phương thức COD.`,
      );
    }
    return strategy;
  }
}
