import { AuthRequest } from '@/auth';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middleware/error.middleware';
import {
  AssignComplaintDto,
  BulkStatusUpdateDto,
  ComplaintQueryParams,
  complaintService,
  CreateComplaintDto,
  EscalateComplaintDto,
  ResolveComplaintDto,
  UpdateComplaintDto,
} from '../index-complaint';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const complaintController = {
  /**
   * Create new complaint
   */
  createComplaint: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateComplaintDto = req.body;

      // Validate required fields
      if (!createData.memId?.trim()) {
        throw new AppError(400, 'Member ID is required');
      }
      if (!createData.compCatId?.trim()) {
        throw new AppError(400, 'Complaint category is required');
      }
      if (!createData.compTitle?.trim()) {
        throw new AppError(400, 'Complaint title is required');
      }
      if (!createData.compDescription?.trim()) {
        throw new AppError(400, 'Complaint description is required');
      }

      const complaint = await complaintService.createComplaint(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: complaint,
        message: 'Complaint created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get complaint by ID
   */
  getComplaint: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const complaint = await complaintService.getComplaintById(id);

      if (!complaint || complaint.isDeleted) {
        throw new AppError(404, 'Complaint not found');
      }

      res.json({
        success: true,
        data: complaint,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all complaints
   */
  getComplaints: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: ComplaintQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        memId: req.query.memId as string,
        fileId: req.query.fileId as string,
        compCatId: req.query.compCatId as string,
        statusId: req.query.statusId as string,
        assignedTo: req.query.assignedTo as string,
        compPriority: req.query.compPriority as any,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
        slaBreached: req.query.slaBreached ? req.query.slaBreached === 'true' : undefined,
        isEscalated: req.query.isEscalated ? req.query.isEscalated === 'true' : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await complaintService.getComplaints(queryParams);

      res.json({
        success: true,
        data: {
          complaints: result.complaints,
          statistics: result.statistics,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update complaint
   */
  updateComplaint: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData: UpdateComplaintDto = req.body;

      const updatedComplaint = await complaintService.updateComplaint(
        id,
        updateData,
        req.user.userId
      );

      if (!updatedComplaint) {
        throw new AppError(404, 'Complaint not found');
      }

      res.json({
        success: true,
        data: updatedComplaint,
        message: 'Complaint updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete complaint
   */
  deleteComplaint: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const deleted = await complaintService.deleteComplaint(id, req.user.userId);

      if (!deleted) {
        throw new AppError(404, 'Complaint not found');
      }

      res.json({
        success: true,
        message: 'Complaint deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get complaints by member
   */
  getComplaintsByMember: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memberId = req.params.memberId as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const complaints = await complaintService.getComplaintsByMember(memberId, limit);

      res.json({
        success: true,
        data: complaints,
        total: complaints.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get complaints by file
   */
  getComplaintsByFile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fileId = req.params.fileId as string;

      const complaints = await complaintService.getComplaintsByFile(fileId);

      res.json({
        success: true,
        data: complaints,
        total: complaints.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Assign complaint to staff
   */
  assignComplaint: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const assignData: AssignComplaintDto = req.body;

      if (!assignData.assignedTo?.trim()) {
        throw new AppError(400, 'Staff member ID is required for assignment');
      }

      const complaint = await complaintService.assignComplaint(id, assignData, req.user.userId);

      if (!complaint) {
        throw new AppError(404, 'Complaint not found');
      }

      res.json({
        success: true,
        data: complaint,
        message: 'Complaint assigned successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Resolve complaint
   */
  resolveComplaint: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const resolveData: ResolveComplaintDto = req.body;

      if (!resolveData.resolutionNotes?.trim()) {
        throw new AppError(400, 'Resolution notes are required');
      }

      const complaint = await complaintService.resolveComplaint(id, resolveData, req.user.userId);

      if (!complaint) {
        throw new AppError(404, 'Complaint not found');
      }

      res.json({
        success: true,
        data: complaint,
        message: 'Complaint resolved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Escalate complaint
   */
  escalateComplaint: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const escalateData: EscalateComplaintDto = req.body;

      if (
        !escalateData.escalationLevel ||
        escalateData.escalationLevel < 1 ||
        escalateData.escalationLevel > 5
      ) {
        throw new AppError(400, 'Escalation level must be between 1 and 5');
      }

      if (!escalateData.notes?.trim()) {
        throw new AppError(400, 'Escalation notes are required');
      }

      const complaint = await complaintService.escalateComplaint(id, escalateData, req.user.userId);

      if (!complaint) {
        throw new AppError(404, 'Complaint not found');
      }

      res.json({
        success: true,
        data: complaint,
        message: 'Complaint escalated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Bulk update complaint statuses
   */
  bulkUpdateComplaintStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const bulkData: BulkStatusUpdateDto = req.body;

      if (
        !bulkData.complaintIds ||
        !Array.isArray(bulkData.complaintIds) ||
        bulkData.complaintIds.length === 0
      ) {
        throw new AppError(400, 'Complaint IDs are required and must be a non-empty array');
      }

      if (!bulkData.statusId?.trim()) {
        throw new AppError(400, 'Status ID is required');
      }

      const result = await complaintService.bulkUpdateComplaintStatus(bulkData, req.user.userId);

      res.json({
        success: true,
        data: result,
        message: `Successfully updated ${result.modified} of ${result.matched} complaints`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get complaint statistics
   */
  getComplaintStatistics: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filter: any = {};

      // Apply filters if provided
      if (req.query.memId) filter.memId = req.query.memId;
      if (req.query.compCatId) filter.compCatId = req.query.compCatId;
      if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
      if (req.query.fromDate) {
        filter.compDate = { $gte: new Date(req.query.fromDate as string) };
      }
      if (req.query.toDate) {
        filter.compDate = filter.compDate || {};
        filter.compDate.$lte = new Date(req.query.toDate as string);
      }

      const statistics = await complaintService.getComplaintStatistics(filter);

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get dashboard statistics
   */
  getDashboardStats: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await complaintService.getDashboardStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get overdue complaints
   */
  getOverdueComplaints: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const complaints = await complaintService.getOverdueComplaints();

      res.json({
        success: true,
        data: complaints,
        total: complaints.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get complaints needing follow-up
   */
  getComplaintsNeedingFollowUp: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const complaints = await complaintService.getComplaintsNeedingFollowUp();

      res.json({
        success: true,
        data: complaints,
        total: complaints.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Add attachment to complaint
   */
  addAttachment: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const { attachmentPath } = req.body;

      if (!attachmentPath?.trim()) {
        throw new AppError(400, 'Attachment path is required');
      }

      const complaint = await complaintService.addAttachment(id, attachmentPath, req.user.userId);

      if (!complaint) {
        throw new AppError(404, 'Complaint not found');
      }

      res.json({
        success: true,
        data: complaint,
        message: 'Attachment added successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Remove attachment from complaint
   */
  removeAttachment: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const { attachmentPath } = req.body;

      if (!attachmentPath?.trim()) {
        throw new AppError(400, 'Attachment path is required');
      }

      const complaint = await complaintService.removeAttachment(
        id,
        attachmentPath,
        req.user.userId
      );

      if (!complaint) {
        throw new AppError(404, 'Complaint not found');
      }

      res.json({
        success: true,
        data: complaint,
        message: 'Attachment removed successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get complaints by assigned staff
   */
  getComplaintsByAssignedStaff: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const staffId = req.params.staffId as string;

      const complaints = await complaintService.getComplaintsByAssignedStaff(staffId);

      res.json({
        success: true,
        data: complaints,
        total: complaints.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get member complaint summary
   */
  getMemberComplaintSummary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memberId = req.params.memberId as string;

      const summary = await complaintService.getMemberComplaintSummary(memberId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
