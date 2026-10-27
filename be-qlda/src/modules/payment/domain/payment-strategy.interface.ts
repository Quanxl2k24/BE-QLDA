export interface PaymentProcessingResult {
  success: boolean;
  method: string;
  status: string; // PENDING, PAID, FAILED
  transactionCode?: string | null;
  paymentUrl?: string | null;
  message?: string;
}

export interface ProcessPaymentInput {
  orderId: string;
  orderCode: string;
  amount: number;
  userId: string;
  clientIp?: string;
  returnUrl?: string;
}

export interface IPaymentStrategy {
  readonly method: string;
  processPayment(input: ProcessPaymentInput): Promise<PaymentProcessingResult>;
  verifyWebhook?(payload: any): Promise<any>;
}
