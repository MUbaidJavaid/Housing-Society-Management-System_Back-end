import { NextFunction, Request, Response, Router } from 'express';
import { param, validationResult } from 'express-validator';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { AppError } from '../../middleware/error.middleware';
import { fileController } from '../controllers/controller-file';
import {
  validateAdjustFile,
  validateAssignPlot,
  validateBulkUpdateStatus,
  validateCreateFile,
  validateGetFiles,
  validateMemIdParam,
  validateProjIdParam,
  validateTransferFile,
  validateUpdateFile,
} from '../validators/validator-file';

// Create a local validateRequest function
const validateRequest = (req: Request, _res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
    }));

    // Create a formatted error message
    const formattedErrors = errorMessages.map(err => `${err.field}: ${err.message}`).join(', ');
    throw new AppError(400, `Validation failed: ${formattedErrors}`);
  }
  next();
};

const router: Router = Router();

// Public routes
router.get('/search', fileController.searchFiles);
router.get('/statistics', fileController.getFileStatistics);
router.get('/dashboard-summary', fileController.getDashboardSummary);
router.get('/status-summary', fileController.getFilesByStatusSummary);

// Protected routes (Admin/File Officer)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateFile(),
  validateRequest,
  fileController.createFile
);

router.get(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateGetFiles(),
  validateRequest,
  fileController.getFiles
);

router.get(
  '/unballoted',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  fileController.getUnballotedFiles
);

router.get(
  '/reg-no/:fileRegNo',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  fileController.getFileByRegNo
);

router.get(
  '/barcode/:fileBarCode',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  fileController.getFileByBarcode
);

router.get(
  '/member/:memId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateMemIdParam(),
  validateRequest,
  fileController.getFilesByMember
);

router.get(
  '/project/:projId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateProjIdParam(),
  validateRequest,
  fileController.getFilesByProject
);

router.get(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid File ID'),
  validateRequest,
  fileController.getFile
);

router.get(
  '/:fileId/financial-summary',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('fileId').isMongoId().withMessage('Invalid File ID'),
  validateRequest,
  fileController.getFileFinancialSummary
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid File ID'),
  validateUpdateFile(),
  validateRequest,
  fileController.updateFile
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid File ID'),
  validateRequest,
  fileController.deleteFile
);

// Special operations
router.post(
  '/:id/transfer',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid File ID'),
  validateTransferFile(),
  validateRequest,
  fileController.transferFile
);

router.post(
  '/:id/adjust',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid File ID'),
  validateAdjustFile(),
  validateRequest,
  fileController.adjustFile
);

router.post(
  '/:fileId/assign-plot',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('fileId').isMongoId().withMessage('Invalid File ID'),
  validateAssignPlot(),
  validateRequest,
  fileController.assignPlot
);

// Bulk operations
router.post(
  '/bulk/update-status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateBulkUpdateStatus(),
  validateRequest,
  fileController.bulkUpdateStatus
);

export default router;
