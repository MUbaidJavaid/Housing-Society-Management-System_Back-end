import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { pdfGeneratorService } from '../services/service-pdf-generator';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const pdfGeneratorController = {
  /**
   * Generate a payment receipt
   */
  generateReceipt: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const data = req.body;
      if (!data.societyName || !data.receiptNumber || !data.memberName || !data.amount) {
        throw new AppError(400, 'Missing required fields: societyName, receiptNumber, memberName, amount');
      }

      if (data.uploadToCloud) {
        const result = await pdfGeneratorService.generateAndUpload('receipt', data, data.societyId);
        return res.json({
          success: true,
          data: { html: result.html, url: result.url },
          message: 'Receipt generated successfully',
        });
      }

      const html = pdfGeneratorService.generateReceipt(data);

      return res.json({
        success: true,
        data: { html },
        message: 'Receipt generated successfully',
      });
    } catch (error) {
      return handleError(error, next);
    }
  },

  /**
   * Generate a bill invoice
   */
  generateInvoice: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const data = req.body;
      if (!data.societyName || !data.invoiceNumber || !data.memberName || !data.lineItems) {
        throw new AppError(400, 'Missing required fields: societyName, invoiceNumber, memberName, lineItems');
      }

      if (data.uploadToCloud) {
        const result = await pdfGeneratorService.generateAndUpload('invoice', data, data.societyId);
        return res.json({
          success: true,
          data: { html: result.html, url: result.url },
          message: 'Invoice generated successfully',
        });
      }

      const html = pdfGeneratorService.generateInvoice(data);

      return res.json({
        success: true,
        data: { html },
        message: 'Invoice generated successfully',
      });
    } catch (error) {
      return handleError(error, next);
    }
  },

  /**
   * Generate a PLRA certificate
   */
  generateCertificate: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const data = req.body;
      if (!data.societyName || !data.certificateNumber || !data.memberName || !data.memberCNIC) {
        throw new AppError(400, 'Missing required fields: societyName, certificateNumber, memberName, memberCNIC');
      }

      if (data.uploadToCloud) {
        const result = await pdfGeneratorService.generateAndUpload('certificate', data, data.societyId);
        return res.json({
          success: true,
          data: { html: result.html, url: result.url },
          message: 'Certificate generated successfully',
        });
      }

      const html = pdfGeneratorService.generateCertificate(data);

      return res.json({
        success: true,
        data: { html },
        message: 'Certificate generated successfully',
      });
    } catch (error) {
      return handleError(error, next);
    }
  },

  /**
   * Generate a NOC
   */
  generateNOC: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const data = req.body;
      if (!data.societyName || !data.nocNumber || !data.memberName || !data.memberCNIC || !data.purpose) {
        throw new AppError(400, 'Missing required fields: societyName, nocNumber, memberName, memberCNIC, purpose');
      }

      if (data.uploadToCloud) {
        const result = await pdfGeneratorService.generateAndUpload('noc', data, data.societyId);
        return res.json({
          success: true,
          data: { html: result.html, url: result.url },
          message: 'NOC generated successfully',
        });
      }

      const html = pdfGeneratorService.generateNOC(data);

      return res.json({
        success: true,
        data: { html },
        message: 'NOC generated successfully',
      });
    } catch (error) {
      return handleError(error, next);
    }
  },

  /**
   * Generate an allotment letter
   */
  generateAllotmentLetter: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const data = req.body;
      if (!data.societyName || !data.letterNumber || !data.memberName || !data.memberCNIC || !data.plotNumber) {
        throw new AppError(400, 'Missing required fields: societyName, letterNumber, memberName, memberCNIC, plotNumber');
      }

      if (data.uploadToCloud) {
        const result = await pdfGeneratorService.generateAndUpload('allotment-letter', data, data.societyId);
        return res.json({
          success: true,
          data: { html: result.html, url: result.url },
          message: 'Allotment letter generated successfully',
        });
      }

      const html = pdfGeneratorService.generateAllotmentLetter(data);

      return res.json({
        success: true,
        data: { html },
        message: 'Allotment letter generated successfully',
      });
    } catch (error) {
      return handleError(error, next);
    }
  },

  /**
   * Generate a membership application form
   */
  generateMembershipForm: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const data = req.body;
      if (!data.societyName || !data.applicantName || !data.cnic) {
        throw new AppError(400, 'Missing required fields: societyName, applicantName, cnic');
      }

      if (data.uploadToCloud) {
        const result = await pdfGeneratorService.generateAndUpload('membership-form', data, data.societyId);
        return res.json({
          success: true,
          data: { html: result.html, url: result.url },
          message: 'Membership form generated successfully',
        });
      }

      const html = pdfGeneratorService.generateMembershipForm(data);

      return res.json({
        success: true,
        data: { html },
        message: 'Membership form generated successfully',
      });
    } catch (error) {
      return handleError(error, next);
    }
  },

  /**
   * Generate a property transfer form
   */
  generateTransferForm: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const data = req.body;
      if (!data.societyName || !data.sellerName || !data.sellerCNIC || !data.buyerName || !data.buyerCNIC || !data.plotNumber) {
        throw new AppError(400, 'Missing required fields: societyName, sellerName, sellerCNIC, buyerName, buyerCNIC, plotNumber');
      }

      if (data.uploadToCloud) {
        const result = await pdfGeneratorService.generateAndUpload('transfer-form', data, data.societyId);
        return res.json({
          success: true,
          data: { html: result.html, url: result.url },
          message: 'Transfer form generated successfully',
        });
      }

      const html = pdfGeneratorService.generateTransferForm(data);

      return res.json({
        success: true,
        data: { html },
        message: 'Transfer form generated successfully',
      });
    } catch (error) {
      return handleError(error, next);
    }
  },

  /**
   * Generate an enhanced payment receipt
   */
  generatePaymentReceipt: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const data = req.body;
      if (!data.societyName || !data.receiptNumber || !data.memberName || !data.totalAmount || !data.paymentMode) {
        throw new AppError(400, 'Missing required fields: societyName, receiptNumber, memberName, totalAmount, paymentMode');
      }

      if (data.uploadToCloud) {
        const result = await pdfGeneratorService.generateAndUpload('payment-receipt', data, data.societyId);
        return res.json({
          success: true,
          data: { html: result.html, url: result.url },
          message: 'Payment receipt generated successfully',
        });
      }

      const html = pdfGeneratorService.generatePaymentReceipt(data);

      return res.json({
        success: true,
        data: { html },
        message: 'Payment receipt generated successfully',
      });
    } catch (error) {
      return handleError(error, next);
    }
  },

  /**
   * Generate an installment schedule
   */
  generateInstallmentSchedule: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const data = req.body;
      if (!data.societyName || !data.memberName || !data.plotNumber || !data.schedule) {
        throw new AppError(400, 'Missing required fields: societyName, memberName, plotNumber, schedule');
      }

      if (data.uploadToCloud) {
        const result = await pdfGeneratorService.generateAndUpload('installment-schedule', data, data.societyId);
        return res.json({
          success: true,
          data: { html: result.html, url: result.url },
          message: 'Installment schedule generated successfully',
        });
      }

      const html = pdfGeneratorService.generateInstallmentSchedule(data);

      return res.json({
        success: true,
        data: { html },
        message: 'Installment schedule generated successfully',
      });
    } catch (error) {
      return handleError(error, next);
    }
  },

  /**
   * List available templates
   */
  getTemplates: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const templates = pdfGeneratorService.getTemplates();

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
