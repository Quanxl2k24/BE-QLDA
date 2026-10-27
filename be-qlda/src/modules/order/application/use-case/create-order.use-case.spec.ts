import { Test, TestingModule } from '@nestjs/testing';
import { CreateOrderUseCase } from './create-order.use-case';
import { OrderRepository } from '../../domain/repositories/order.repository';
import { PrismaService } from '@/database/prisma/prisma.services';
import { PaymentFactory } from '@/modules/payment/application/payment.factory';
import { getQueueToken } from '@nestjs/bullmq';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import { OrderStatus } from '@/common/enums/order.enum';
import { PaymentMethod } from '../../persentation/dto/createOrder.dto';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { OrderEntity } from '../../domain/entities/order.entity';

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;
  let mockOrderRepository: { createOrder: jest.Mock };
  let mockPrismaService: {
    cart: { findUnique: jest.Mock };
    productVariant: { findMany: jest.Mock };
    user: { findUnique: jest.Mock };
  };
  let mockPaymentFactory: { getStrategy: jest.Mock };
  let mockRedis: { set: jest.Mock };
  let mockQueue: { add: jest.Mock };

  beforeEach(async () => {
    mockOrderRepository = {
      createOrder: jest.fn(),
    };

    mockPrismaService = {
      cart: { findUnique: jest.fn() },
      productVariant: { findMany: jest.fn() },
      user: { findUnique: jest.fn().mockResolvedValue({ email: 'test@example.com', fullName: 'Nguyen Van A' }) },
    };

    mockPaymentFactory = {
      getStrategy: jest.fn().mockReturnValue({
        method: 'COD',
        processPayment: jest.fn().mockResolvedValue({
          success: true,
          method: 'COD',
          status: 'PENDING',
          transactionCode: 'COD-TEST',
        }),
      }),
    };

    mockRedis = {
      set: jest.fn().mockResolvedValue('OK'),
    };

    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrderUseCase,
        {
          provide: OrderRepository,
          useValue: mockOrderRepository,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PaymentFactory,
          useValue: mockPaymentFactory,
        },
        {
          provide: getRedisConnectionToken(),
          useValue: mockRedis,
        },
        {
          provide: getQueueToken('email'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    useCase = module.get<CreateOrderUseCase>(CreateOrderUseCase);
  });

  const dummyAddress = {
    recipientName: 'Nguyễn Văn A',
    phone: '0987654321',
    province: 'Hà Nội',
    district: 'Cầu Giấy',
    ward: 'Dịch Vọng',
    street: 'Số 123 Cầu Giấy',
  };

  it('chặn double-click bằng Redis Idempotency Lock (ném ConflictException)', async () => {
    mockRedis.set.mockResolvedValue(null); // Không lấy được lock (key đã tồn tại)

    await expect(
      useCase.execute('user-1', {
        shippingAddress: dummyAddress,
        paymentMethod: PaymentMethod.COD,
        items: [{ variantId: 'v-1', quantity: 1 }],
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('tạo đơn hàng COD thành công với luồng Buy Now (mua ngay)', async () => {
    mockPrismaService.productVariant.findMany.mockResolvedValue([
      {
        id: 'v-1',
        sku: 'KD-01',
        name: 'Hộp 2 bánh',
        price: '150000',
        stock: 10,
        status: 'ACTIVE',
        product: { id: 'p-1', name: 'Bánh Kinh Đô', status: 'ACTIVE' },
      },
    ]);

    const createdMockOrder = new OrderEntity(
      'order-1',
      'user-1',
      'ORD-261028-TEST',
      OrderStatus.PENDING,
      150000,
      0,
      0,
      150000,
      dummyAddress,
      new Date(),
      new Date(),
      null,
      [],
      1,
    );
    mockOrderRepository.createOrder.mockResolvedValue(createdMockOrder);

    const result = await useCase.execute('user-1', {
      shippingAddress: dummyAddress,
      paymentMethod: PaymentMethod.COD,
      items: [{ variantId: 'v-1', quantity: 1 }],
    });

    expect(result.order).toBeDefined();
    expect(result.payment.method).toBe('COD');
    expect(result.payment.status).toBe('PENDING');
    expect(mockOrderRepository.createOrder).toHaveBeenCalledTimes(1);
    expect(mockOrderRepository.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        totalAmount: 150000,
        subtotal: 150000,
        paymentMethod: 'COD',
      }),
    );
  });

  it('ném BadRequestException nếu sản phẩm yêu cầu vượt quá tồn kho', async () => {
    mockPrismaService.productVariant.findMany.mockResolvedValue([
      {
        id: 'v-1',
        sku: 'KD-01',
        name: 'Hộp 2 bánh',
        price: '150000',
        stock: 2, // Chỉ còn 2
        status: 'ACTIVE',
        product: { id: 'p-1', name: 'Bánh Kinh Đô', status: 'ACTIVE' },
      },
    ]);

    await expect(
      useCase.execute('user-1', {
        shippingAddress: dummyAddress,
        paymentMethod: PaymentMethod.COD,
        items: [{ variantId: 'v-1', quantity: 5 }], // Đặt 5
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
