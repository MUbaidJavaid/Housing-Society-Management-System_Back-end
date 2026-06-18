export interface InitiatePaymentDto {
  societyId: string;
  memberId: string;
  billId?: string;
  installmentId?: string;
  amount: number;
  currency?: string;
  gateway: 'jazzcash' | 'easypaisa' | 'bank_transfer' | 'stripe' | 'manual';
  payerName?: string;
  payerPhone?: string;
  payerEmail?: string;
  paymentMethod?: string;
  description?: string;
  callbackUrl?: string;
  returnUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaymentCallbackPayload {
  [key: string]: any;
}

export interface PaymentQueryParams {
  page?: number;
  limit?: number;
  societyId?: string;
  memberId?: string;
  status?: string;
  gateway?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RefundDto {
  amount?: number;
  reason?: string;
}

export interface JazzCashFormParams {
  pp_Version: string;
  pp_TxnType: string;
  pp_Language: string;
  pp_MerchantID: string;
  pp_SubMerchantID: string;
  pp_Password: string;
  pp_BankID: string;
  pp_ProductID: string;
  pp_TxnRefNo: string;
  pp_Amount: string;
  pp_TxnCurrency: string;
  pp_TxnDateTime: string;
  pp_BillReference: string;
  pp_Description: string;
  pp_TxnExpiryDateTime: string;
  pp_ReturnURL: string;
  pp_SecureHash: string;
  ppmpf_1: string;
  ppmpf_2: string;
  ppmpf_3: string;
  ppmpf_4: string;
  ppmpf_5: string;
}

export interface EasypaisaFormParams {
  storeId: string;
  orderId: string;
  transactionAmount: string;
  transactionType: string;
  mobileAccountNo: string;
  emailAddress: string;
  postBackURL: string;
}

export interface PaymentInitiationResult {
  paymentUrl?: string;
  formParams?: JazzCashFormParams | EasypaisaFormParams | Record<string, string>;
  transactionId: string;
  status: string;
}

export interface PaymentStats {
  totalCollected: number;
  totalPending: number;
  totalFailed: number;
  totalRefunded: number;
  totalTransactions: number;
  byGateway: Record<string, { count: number; amount: number }>;
}
