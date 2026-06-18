import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { vendorService } from '../services/service-vendor';
import {
  VendorQueryParams,
  WorkOrderQueryParams,
  ContractQueryParams,
  InvoiceQueryParams,
} from '../types/types-vendor';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const vendorController = {
  // ============ Vendor Profile ============

  registerVendor: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const vendor = await vendorService.registerVendor(req.body, req.user.userId);

      res.status(201).json({
        success: true,
        data: vendor,
        message: 'Vendor registered successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getAllVendors: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const queryParams: VendorQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        vendorType: req.query.vendorType as string,
        status: req.query.status as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await vendorService.getAllVendors(queryParams);

      res.json({
        success: true,
        data: {
          vendors: result.vendors,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getVendorById: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const vendor = await vendorService.getVendorById(id);

      res.json({
        success: true,
        data: vendor,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  updateVendor: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const vendor = await vendorService.updateVendor(id, req.body, req.user.userId);

      if (!vendor) {
        throw new AppError(404, 'Vendor not found');
      }

      res.json({
        success: true,
        data: vendor,
        message: 'Vendor updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  verifyVendor: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const vendor = await vendorService.verifyVendor(id, req.user.userId);

      if (!vendor) {
        throw new AppError(404, 'Vendor not found');
      }

      res.json({
        success: true,
        data: vendor,
        message: 'Vendor verified successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  suspendVendor: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const vendor = await vendorService.suspendVendor(id, req.user.userId);

      if (!vendor) {
        throw new AppError(404, 'Vendor not found');
      }

      res.json({
        success: true,
        data: vendor,
        message: 'Vendor suspended successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  rateVendor: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const { rating } = req.body;

      const vendor = await vendorService.rateVendor(id, rating, req.user.userId);

      if (!vendor) {
        throw new AppError(404, 'Vendor not found');
      }

      res.json({
        success: true,
        data: vendor,
        message: 'Vendor rated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  // ============ Work Order ============

  createWorkOrder: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const workOrder = await vendorService.createWorkOrder(req.body, req.user.userId);

      res.status(201).json({
        success: true,
        data: workOrder,
        message: 'Work order created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getAllWorkOrders: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const queryParams: WorkOrderQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        societyId: req.query.societyId as string,
        status: req.query.status as string,
        category: req.query.category as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await vendorService.getAllWorkOrders(queryParams);

      res.json({
        success: true,
        data: {
          workOrders: result.workOrders,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getWorkOrderById: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const workOrder = await vendorService.getWorkOrderById(id);

      res.json({
        success: true,
        data: workOrder,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  updateWorkOrder: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const workOrder = await vendorService.updateWorkOrder(id, req.body, req.user.userId);

      if (!workOrder) {
        throw new AppError(404, 'Work order not found');
      }

      res.json({
        success: true,
        data: workOrder,
        message: 'Work order updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  deleteWorkOrder: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const deleted = await vendorService.deleteWorkOrder(id, req.user.userId);

      if (!deleted) {
        throw new AppError(404, 'Work order not found');
      }

      res.json({
        success: true,
        message: 'Work order deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  submitBid: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const workOrderId = req.params.id as string;
      const { vendorId, amount, proposal } = req.body;

      const workOrder = await vendorService.submitBid(workOrderId, vendorId, amount, proposal);

      if (!workOrder) {
        throw new AppError(404, 'Work order not found');
      }

      res.json({
        success: true,
        data: workOrder,
        message: 'Bid submitted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  reviewBid: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const workOrderId = req.params.id as string;
      const { bidIndex, status } = req.body;

      const workOrder = await vendorService.reviewBid(
        workOrderId,
        bidIndex,
        status,
        req.user.userId
      );

      if (!workOrder) {
        throw new AppError(404, 'Work order not found');
      }

      res.json({
        success: true,
        data: workOrder,
        message: 'Bid reviewed successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  awardWorkOrder: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const workOrderId = req.params.id as string;
      const { vendorId } = req.body;

      const workOrder = await vendorService.awardWorkOrder(
        workOrderId,
        vendorId,
        req.user.userId
      );

      if (!workOrder) {
        throw new AppError(404, 'Work order not found');
      }

      res.json({
        success: true,
        data: workOrder,
        message: 'Work order awarded successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  completeWorkOrder: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const workOrderId = req.params.id as string;
      const { completionNotes } = req.body;

      const workOrder = await vendorService.completeWorkOrder(
        workOrderId,
        completionNotes || '',
        req.user.userId
      );

      if (!workOrder) {
        throw new AppError(404, 'Work order not found');
      }

      res.json({
        success: true,
        data: workOrder,
        message: 'Work order completed successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  // ============ Contract ============

  createContract: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const contract = await vendorService.createContract(req.body, req.user.userId);

      res.status(201).json({
        success: true,
        data: contract,
        message: 'Contract created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getAllContracts: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const queryParams: ContractQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        vendorId: req.query.vendorId as string,
        societyId: req.query.societyId as string,
        status: req.query.status as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await vendorService.getAllContracts(queryParams);

      res.json({
        success: true,
        data: {
          contracts: result.contracts,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getContractById: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const contract = await vendorService.getContractById(id);

      res.json({
        success: true,
        data: contract,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  updateContract: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const contract = await vendorService.updateContract(id, req.body, req.user.userId);

      if (!contract) {
        throw new AppError(404, 'Contract not found');
      }

      res.json({
        success: true,
        data: contract,
        message: 'Contract updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  terminateContract: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const { reason } = req.body;

      const contract = await vendorService.terminateContract(id, reason, req.user.userId);

      if (!contract) {
        throw new AppError(404, 'Contract not found');
      }

      res.json({
        success: true,
        data: contract,
        message: 'Contract terminated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  renewContract: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const { newEndDate } = req.body;

      const contract = await vendorService.renewContract(id, newEndDate, req.user.userId);

      if (!contract) {
        throw new AppError(404, 'Contract not found');
      }

      res.json({
        success: true,
        data: contract,
        message: 'Contract renewed successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  addPerformanceReview: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const { rating, comments } = req.body;

      const contract = await vendorService.addPerformanceReview(
        id,
        rating,
        comments,
        req.user.userId
      );

      if (!contract) {
        throw new AppError(404, 'Contract not found');
      }

      res.json({
        success: true,
        data: contract,
        message: 'Performance review added successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  // ============ Invoice ============

  submitInvoice: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const invoice = await vendorService.submitInvoice(req.body, req.user.userId);

      res.status(201).json({
        success: true,
        data: invoice,
        message: 'Invoice submitted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getAllInvoices: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const queryParams: InvoiceQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        vendorId: req.query.vendorId as string,
        societyId: req.query.societyId as string,
        status: req.query.status as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await vendorService.getAllInvoices(queryParams);

      res.json({
        success: true,
        data: {
          invoices: result.invoices,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getInvoiceById: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const invoice = await vendorService.getInvoiceById(id);

      res.json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  approveInvoice: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const invoice = await vendorService.approveInvoice(id, req.user.userId);

      if (!invoice) {
        throw new AppError(404, 'Invoice not found');
      }

      res.json({
        success: true,
        data: invoice,
        message: 'Invoice approved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  rejectInvoice: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const { reason } = req.body;

      const invoice = await vendorService.rejectInvoice(id, reason, req.user.userId);

      if (!invoice) {
        throw new AppError(404, 'Invoice not found');
      }

      res.json({
        success: true,
        data: invoice,
        message: 'Invoice rejected successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  markInvoicePaid: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const { paymentReference } = req.body;

      const invoice = await vendorService.markInvoicePaid(id, paymentReference, req.user.userId);

      if (!invoice) {
        throw new AppError(404, 'Invoice not found');
      }

      res.json({
        success: true,
        data: invoice,
        message: 'Invoice marked as paid successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
