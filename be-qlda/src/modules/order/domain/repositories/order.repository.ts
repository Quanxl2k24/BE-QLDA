import { OrderStatus } from '@/common/enums/order.enum';
import { OrderEntity, ShippingAddress } from '../entities/order.entity';

export interface OrderItemInput {
  variantId: string;
  productName: string;
  variantName?: string | null;
  sku?: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface CreateOrderRepoInput {
  userId: string;
  orderCode: string;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  shippingAddress: ShippingAddress;
  note?: string | null;
  paymentMethod: string;
  items: OrderItemInput[];
  cartItemIdsToDelete?: string[];
}

export interface FindMyOrdersParams {
  userId: string;
  status?: OrderStatus | string;
  page?: number;
  limit?: number;
}

export interface FindAdminOrdersParams {
  search?: string; // orderCode, phone, recipientName
  status?: OrderStatus | string;
  userId?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedOrdersResult {
  orders: OrderEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export abstract class OrderRepository {
  abstract createOrder(input: CreateOrderRepoInput): Promise<OrderEntity>;
  abstract findById(id: string): Promise<OrderEntity | null>;
  abstract findByOrderCode(orderCode: string): Promise<OrderEntity | null>;
  abstract findMyOrders(params: FindMyOrdersParams): Promise<PaginatedOrdersResult>;
  abstract findAllOrders(params: FindAdminOrdersParams): Promise<PaginatedOrdersResult>;
  abstract cancelOrder(
    orderId: string,
    changedBy?: string,
    reason?: string,
  ): Promise<OrderEntity>;
  abstract updateStatus(
    orderId: string,
    newStatus: OrderStatus,
    changedBy?: string,
    note?: string,
  ): Promise<OrderEntity>;
}
