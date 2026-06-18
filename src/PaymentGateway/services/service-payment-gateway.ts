import crypto from 'crypto';
import { Types } from 'mongoose';
import { AppError } from '../../middleware/error.middleware';
import PaymentTransaction, { IPaymentTransaction } from '../models/models-payment-transaction';
import {
  InitiatePaymentDto,
  PaymentCallbackPayload,
  PaymentInitiationResult,
  PaymentQueryParams,
  PaymentStats,
} from '../types/types-payment-gateway';

/**
 * Generate a unique transaction reference ID
 */
function generateTransactionId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `TXN-${timestamp}-${random}`;
}

/**
 * Format date for JazzCash (YYYYMMDDHHmmss)
 */
function formatJazzCashDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Generate JazzCash secure hash using HMAC-SHA256
 */
function generateJazzCashHash(params: Record<string, string>, integritySalt: string): string {
  // Sort keys alphabetically and concatenate values separated by '&'
  const sortedKeys = Object.keys(params).sort();
  const hashString = integritySalt + '&' + sortedKeys.map(key => params[key]).join('&');
  return crypto.createHmac('sha256', integritySalt).update(hashString).digest('hex');
}

/**
 * Generate Easypaisa hash
 */
function generateEasypaisaHash(params: Record<string, string>, hashKey: string): string {
  const sortedKeys = Object.keys(params).sort();
  const hashString = sortedKeys.map(key => params[key]).join('&');
  return crypto.createHmac('sha256', hashKey).update(hashString).digest('hex');
}

export const paymentGatewayService = {
  /**
   * Initiate a new payment transaction
   */
  async initiatePayment(
    data: InitiatePaymentDto,
    userId?: Types.ObjectId
  ): Promise<PaymentInitiationResult> {
    const transactionId = generateTransactionId();

    // Create the transaction record
    const transaction = await PaymentTransaction.create({
      transactionId,
      societyId: new Types.ObjectId(data.societyId),
      memberId: new Types.ObjectId(data.memberId),
      billId: data.billId ? new Types.ObjectId(data.billId) : undefined,
      installmentId: data.installmentId ? new Types.ObjectId(data.installmentId) : undefined,
      amount: data.amount,
      currency: data.currency || 'PKR',
      gateway: data.gateway,
      status: 'pending',
      payerName: data.payerName,
      payerPhone: data.payerPhone,
      payerEmail: data.payerEmail,
      paymentMethod: data.paymentMethod,
      description: data.description,
      callbackUrl: data.callbackUrl,
      returnUrl: data.returnUrl,
      metadata: data.metadata,
      createdBy: userId,
    });

    let result: PaymentInitiationResult = {
      transactionId: transaction.transactionId,
      status: transaction.status,
    };

    switch (data.gateway) {
      case 'jazzcash': {
        const merchantId = process.env.JAZZCASH_MERCHANT_ID || '';
        const password = process.env.JAZZCASH_PASSWORD || '';
        const integritySalt = process.env.JAZZCASH_INTEGRITY_SALT || '';
        const sandboxUrl = process.env.JAZZCASH_SANDBOX_URL || 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/';
        const returnUrl = data.returnUrl || data.callbackUrl || process.env.JAZZCASH_RETURN_URL || '';

        const now = new Date();
        const expiry = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour expiry

        const formParams: Record<string, string> = {
          pp_Version: '1.1',
          pp_TxnType: 'MWALLET',
          pp_Language: 'EN',
          pp_MerchantID: merchantId,
          pp_SubMerchantID: '',
          pp_Password: password,
          pp_BankID: '',
          pp_ProductID: '',
          pp_TxnRefNo: transactionId,
          pp_Amount: String(Math.round(data.amount * 100)), // Amount in paisa
          pp_TxnCurrency: data.currency || 'PKR',
          pp_TxnDateTime: formatJazzCashDate(now),
          pp_BillReference: data.billId || transactionId,
          pp_Description: data.description || 'HSMS Payment',
          pp_TxnExpiryDateTime: formatJazzCashDate(expiry),
          pp_ReturnURL: returnUrl,
          ppmpf_1: data.payerPhone || '',
          ppmpf_2: data.payerName || '',
          ppmpf_3: data.payerEmail || '',
          ppmpf_4: data.societyId,
          ppmpf_5: data.memberId,
        };

        // Generate secure hash
        const secureHash = generateJazzCashHash(formParams, integritySalt);
        formParams.pp_SecureHash = secureHash;

        result.paymentUrl = sandboxUrl;
        result.formParams = formParams;

        // Update transaction status to processing
        await PaymentTransaction.findByIdAndUpdate(transaction._id, {
          $set: { status: 'processing' },
        });
        result.status = 'processing';
        break;
      }

      case 'easypaisa': {
        const storeId = process.env.EASYPAISA_STORE_ID || '';
        const hashKey = process.env.EASYPAISA_HASH_KEY || '';
        const sandboxUrl = process.env.EASYPAISA_SANDBOX_URL || 'https://easypay.easypaisa.com.pk/easypay/Index.jsf';
        const postBackUrl = data.callbackUrl || process.env.EASYPAISA_POSTBACK_URL || '';

        const formParams: Record<string, string> = {
          storeId,
          orderId: transactionId,
          transactionAmount: String(data.amount),
          transactionType: 'MA',
          mobileAccountNo: data.payerPhone || '',
          emailAddress: data.payerEmail || '',
          postBackURL: postBackUrl,
        };

        // Generate hash
        const hash = generateEasypaisaHash(formParams, hashKey);
        formParams.encryptedHashRequest = hash;

        result.paymentUrl = sandboxUrl;
        result.formParams = formParams;

        // Update transaction status to processing
        await PaymentTransaction.findByIdAndUpdate(transaction._id, {
          $set: { status: 'processing' },
        });
        result.status = 'processing';
        break;
      }

      case 'bank_transfer': {
        // For bank transfer, just create the record; admin will verify manually
        result.formParams = {
          bankName: process.env.BANK_NAME || 'Habib Bank Limited',
          accountTitle: process.env.BANK_ACCOUNT_TITLE || 'HSMS Society Account',
          accountNumber: process.env.BANK_ACCOUNT_NUMBER || '',
          iban: process.env.BANK_IBAN || '',
          branchCode: process.env.BANK_BRANCH_CODE || '',
          referenceNumber: transactionId,
        };
        break;
      }

      case 'manual': {
        // Manual payment - just create the record for admin verification
        break;
      }

      case 'stripe': {
        // Stripe integration placeholder - can be extended
        result.formParams = {
          note: 'Stripe integration pending configuration',
          transactionId,
        };
        break;
      }
    }

    return result;
  },

  /**
   * Handle payment gateway callback/webhook
   */
  async handleCallback(
    gateway: string,
    payload: PaymentCallbackPayload
  ): Promise<IPaymentTransaction | null> {
    let transactionId: string | undefined;
    let newStatus: 'completed' | 'failed' = 'failed';
    let gatewayTransactionId: string | undefined;

    switch (gateway) {
      case 'jazzcash': {
        transactionId = payload.pp_TxnRefNo;
        gatewayTransactionId = payload.pp_RetrievalReferenceNo;
        const responseCode = payload.pp_ResponseCode;

        // Verify the secure hash
        const integritySalt = process.env.JAZZCASH_INTEGRITY_SALT || '';
        if (integritySalt && payload.pp_SecureHash) {
          const receivedHash = payload.pp_SecureHash;
          const paramsForHash = { ...payload };
          delete paramsForHash.pp_SecureHash;

          const calculatedHash = generateJazzCashHash(paramsForHash, integritySalt);
          if (calculatedHash !== receivedHash) {
            throw new AppError(400, 'Invalid secure hash - possible tampering detected');
          }
        }

        // JazzCash response code '000' means success
        if (responseCode === '000') {
          newStatus = 'completed';
        }
        break;
      }

      case 'easypaisa': {
        transactionId = payload.orderId;
        gatewayTransactionId = payload.transactionId;
        const responseCode = payload.responseCode;

        // Verify hash
        const hashKey = process.env.EASYPAISA_HASH_KEY || '';
        if (hashKey && payload.encryptedHashRequest) {
          const receivedHash = payload.encryptedHashRequest;
          const paramsForHash = { ...payload };
          delete paramsForHash.encryptedHashRequest;

          const calculatedHash = generateEasypaisaHash(paramsForHash, hashKey);
          if (calculatedHash !== receivedHash) {
            throw new AppError(400, 'Invalid hash - possible tampering detected');
          }
        }

        // Easypaisa response code '0000' means success
        if (responseCode === '0000') {
          newStatus = 'completed';
        }
        break;
      }

      default:
        throw new AppError(400, `Unsupported gateway callback: ${gateway}`);
    }

    if (!transactionId) {
      throw new AppError(400, 'Transaction reference not found in callback payload');
    }

    const transaction = await PaymentTransaction.findOne({
      transactionId,
      isDeleted: false,
    });

    if (!transaction) {
      throw new AppError(404, `Transaction not found: ${transactionId}`);
    }

    // Only update if the transaction is still in pending/processing state
    if (!['pending', 'processing'].includes(transaction.status)) {
      return transaction;
    }

    const updateData: any = {
      status: newStatus,
      gatewayTransactionId,
      gatewayResponse: payload,
    };

    if (newStatus === 'failed') {
      updateData.failureReason = payload.pp_ResponseMessage || payload.responseMessage || 'Payment failed';
    }

    const updatedTransaction = await PaymentTransaction.findByIdAndUpdate(
      transaction._id,
      { $set: updateData },
      { new: true }
    );

    return updatedTransaction;
  },

  /**
   * Verify a transaction status
   */
  async verifyTransaction(transactionId: string): Promise<IPaymentTransaction | null> {
    const transaction = await PaymentTransaction.findOne({
      transactionId,
      isDeleted: false,
    })
      .populate('societyId', 'name')
      .populate('memberId', 'firstName lastName memNic')
      .populate('createdBy', 'firstName lastName email');

    if (!transaction) {
      return null;
    }

    return transaction;
  },

  /**
   * Get transactions with pagination and filtering
   */
  async getTransactions(params: PaymentQueryParams): Promise<{
    transactions: IPaymentTransaction[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const {
      page = 1,
      limit = 20,
      societyId,
      memberId,
      status,
      gateway,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { isDeleted: false };

    if (societyId) query.societyId = new Types.ObjectId(societyId);
    if (memberId) query.memberId = new Types.ObjectId(memberId);
    if (status) query.status = status;
    if (gateway) query.gateway = gateway;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      PaymentTransaction.find(query)
        .populate('societyId', 'name')
        .populate('memberId', 'firstName lastName memNic')
        .populate('createdBy', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort(sort),
      PaymentTransaction.countDocuments(query),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get a transaction by its MongoDB ID
   */
  async getTransactionById(id: string): Promise<IPaymentTransaction | null> {
    const transaction = await PaymentTransaction.findById(id)
      .populate('societyId', 'name')
      .populate('memberId', 'firstName lastName memNic')
      .populate('createdBy', 'firstName lastName email');

    if (!transaction || transaction.isDeleted) return null;
    return transaction;
  },

  /**
   * Initiate a refund for a completed transaction
   */
  async refundTransaction(
    id: string,
    amount: number | undefined,
    reason: string | undefined,
    userId: Types.ObjectId
  ): Promise<IPaymentTransaction | null> {
    const transaction = await PaymentTransaction.findById(id);

    if (!transaction || transaction.isDeleted) {
      throw new AppError(404, 'Transaction not found');
    }

    if (transaction.status !== 'completed') {
      throw new AppError(400, 'Only completed transactions can be refunded');
    }

    if ((transaction.status as string) === 'refunded') {
      throw new AppError(400, 'Transaction has already been refunded');
    }

    const refundAmount = amount || transaction.amount;

    if (refundAmount > transaction.amount) {
      throw new AppError(400, 'Refund amount cannot exceed the transaction amount');
    }

    const updatedTransaction = await PaymentTransaction.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'refunded',
          refundAmount,
          refundDate: new Date(),
          metadata: {
            ...(transaction.metadata || {}),
            refundReason: reason,
            refundedBy: userId,
          },
        },
      },
      { new: true }
    )
      .populate('societyId', 'name')
      .populate('memberId', 'firstName lastName memNic')
      .populate('createdBy', 'firstName lastName email');

    return updatedTransaction;
  },

  /**
   * Get payment statistics for a society
   */
  async getPaymentStats(societyId: string): Promise<PaymentStats> {
    const matchStage: any = {
      isDeleted: false,
      societyId: new Types.ObjectId(societyId),
    };

    const [statusStats, gatewayStats] = await Promise.all([
      PaymentTransaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),
      PaymentTransaction.aggregate([
        { $match: { ...matchStage, status: 'completed' } },
        {
          $group: {
            _id: '$gateway',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const stats: PaymentStats = {
      totalCollected: 0,
      totalPending: 0,
      totalFailed: 0,
      totalRefunded: 0,
      totalTransactions: 0,
      byGateway: {},
    };

    for (const item of statusStats) {
      stats.totalTransactions += item.count;
      switch (item._id) {
        case 'completed':
          stats.totalCollected = item.totalAmount;
          break;
        case 'pending':
        case 'processing':
          stats.totalPending += item.totalAmount;
          break;
        case 'failed':
          stats.totalFailed = item.totalAmount;
          break;
        case 'refunded':
          stats.totalRefunded = item.totalAmount;
          break;
      }
    }

    for (const item of gatewayStats) {
      stats.byGateway[item._id] = {
        count: item.count,
        amount: item.totalAmount,
      };
    }

    return stats;
  },
};
