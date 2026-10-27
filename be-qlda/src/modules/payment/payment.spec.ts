import { BadRequestException } from '@nestjs/common';
import { CodPaymentStrategy } from './infrastructure/strategies/cod.strategy';
import { PaymentFactory } from './application/payment.factory';

describe('Payment Strategy & Factory', () => {
  let codStrategy: CodPaymentStrategy;
  let factory: PaymentFactory;

  beforeEach(() => {
    codStrategy = new CodPaymentStrategy();
    factory = new PaymentFactory(codStrategy);
  });

  it('CodPaymentStrategy: xử lý thanh toán COD trả về status PENDING và method COD', async () => {
    const result = await codStrategy.processPayment({
      orderId: 'order-1',
      orderCode: 'ORD-TEST-123',
      amount: 500000,
      userId: 'user-1',
    });

    expect(result.success).toBe(true);
    expect(result.method).toBe('COD');
    expect(result.status).toBe('PENDING');
    expect(result.transactionCode).toBe('COD-ORD-TEST-123');
  });

  it('PaymentFactory: lấy thành công CodPaymentStrategy khi truyền COD', () => {
    const strategy = factory.getStrategy('COD');
    expect(strategy).toBeDefined();
    expect(strategy.method).toBe('COD');
  });

  it('PaymentFactory: ném BadRequestException nếu truyền phương thức online chưa hỗ trợ (ví dụ: MOMO, VNPAY)', () => {
    expect(() => factory.getStrategy('MOMO')).toThrow(BadRequestException);
    expect(() => factory.getStrategy('VNPAY')).toThrow(BadRequestException);
  });
});
