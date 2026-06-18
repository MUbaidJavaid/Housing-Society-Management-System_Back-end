import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../auth/types';
import { bulkOperationsController } from '../controllers/controller-bulk-operations';
import {
  validateExport,
  validateImport,
  validateEntityTypeParam,
  validateImportLogQuery,
  validateMongoId,
} from '../validator/validator-bulk-operations';

const router = Router();

// POST /export - Export data (ADMIN, SUPER_ADMIN only)
router.post(
  '/export',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateExport,
  bulkOperationsController.exportData
);

// POST /import - Import data from CSV (ADMIN, SUPER_ADMIN only)
router.post(
  '/import',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateImport,
  bulkOperationsController.importData
);

// GET /templates/:entityType - Get import template (any authenticated user)
router.get(
  '/templates/:entityType',
  authenticate,
  validateEntityTypeParam,
  bulkOperationsController.getImportTemplate
);

// GET /logs - Get import history (ADMIN, SUPER_ADMIN only)
router.get(
  '/logs',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateImportLogQuery,
  bulkOperationsController.getImportLogs
);

// GET /logs/:id - Get single import log (ADMIN, SUPER_ADMIN only)
router.get(
  '/logs/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateMongoId('id'),
  bulkOperationsController.getImportLogById
);

// POST /logs/:id/cancel - Cancel a pending import (ADMIN, SUPER_ADMIN only)
router.post(
  '/logs/:id/cancel',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateMongoId('id'),
  bulkOperationsController.cancelImport
);

export default router;
