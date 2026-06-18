import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { bulkOperationsService } from '../services/service-bulk-operations';
import { EntityType, ExportFormat, ImportLogQuery } from '../types/types-bulk-operations';

class BulkOperationsController {
  /**
   * POST /export - Export data
   */
  async exportData(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { entityType, societyId, filters, format } = req.body;

      const result = await bulkOperationsService.exportData(
        entityType as EntityType,
        societyId,
        filters || {},
        (format || 'csv') as ExportFormat
      );

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);

      res.status(200).json({
        success: true,
        message: 'Data exported successfully',
        data: {
          fileName: result.fileName,
          contentType: result.contentType,
          content: result.data,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /import - Import data from CSV
   */
  async importData(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { entityType, societyId, csvData } = req.body;
      const userId = req.user?.userId?.toString();

      if (!userId) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      const result = await bulkOperationsService.importData(
        entityType as EntityType,
        societyId,
        csvData,
        userId
      );

      res.status(200).json({
        success: true,
        message: `Import completed. ${result.success} of ${result.total} records imported successfully.`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /templates/:entityType - Get import template
   */
  async getImportTemplate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { entityType } = req.params;

      const result = bulkOperationsService.getImportTemplate(entityType as EntityType);

      res.status(200).json({
        success: true,
        message: `Template for ${entityType} retrieved successfully`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /logs - Get paginated import logs
   */
  async getImportLogs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: ImportLogQuery = {
        societyId: req.query.societyId as string,
        entityType: req.query.entityType as EntityType,
        status: req.query.status as any,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await bulkOperationsService.getImportLogs(query);

      res.status(200).json({
        success: true,
        message: 'Import logs retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /logs/:id - Get single import log
   */
  async getImportLogById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const result = await bulkOperationsService.getImportLogById(id as string);

      res.status(200).json({
        success: true,
        message: 'Import log retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /logs/:id/cancel - Cancel a pending import
   */
  async cancelImport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId?.toString();

      if (!userId) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      const result = await bulkOperationsService.cancelImport(id as string, userId);

      res.status(200).json({
        success: true,
        message: 'Import cancelled successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const bulkOperationsController = new BulkOperationsController();
