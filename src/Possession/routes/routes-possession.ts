import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { possessionController } from '../controllers/controller-possession';
import {
  validateBulkStatusUpdate,
  validateCollectorUpdate,
  validateCreatePossession,
  validateGetPossessions,
  validateHandoverCertificate,
  validateReportGeneration,
  validateStatusTransition,
  validateSurveyUpdate,
  validateUpdatePossession,
} from '../validators/validator-possession';

const router: Router = Router();

// Public routes (some may need authentication)
router.get('/', validateGetPossessions, possessionController.getPossessions);
router.get('/stats/summary', possessionController.getPossessionStatistics);
router.get('/overdue', possessionController.getOverduePossessions);
router.get('/pending', possessionController.getPendingPossessions);
router.get('/search/location', possessionController.searchPossessionsNearLocation);
router.get('/:id', possessionController.getPossession);
router.get('/code/:code', possessionController.getPossessionByCode);
router.get('/file/:fileId', possessionController.getPossessionsByFile);
router.get('/plot/:plotId', possessionController.getPossessionsByPlot);
router.get('/status/:status', possessionController.getPossessionsByStatus);
router.get('/csr/:csrId', possessionController.getPossessionsByCSR);
router.get('/:id/timeline', possessionController.getPossessionTimeline);
router.get('/:id/validate-handover', possessionController.validateHandover);
router.get('/:id/allowed-statuses', possessionController.getAllowedNextStatuses);
router.get('/:id/check-letter', possessionController.checkLetterCollected);

// Protected routes (authenticated users)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreatePossession,
  possessionController.createPossession
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdatePossession,
  possessionController.updatePossession
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  possessionController.deletePossession
);

// Status management routes
router.patch(
  '/:id/status',
  authenticate,
  requireRole(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateStatusTransition,
  possessionController.updatePossessionStatus
);

router.patch(
  '/:id/collector',
  authenticate,
  requireRole(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCollectorUpdate,
  possessionController.updateCollectorInfo
);

router.patch(
  '/:id/survey',
  authenticate,
  requireRole(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateSurveyUpdate,
  possessionController.updateSurveyInfo
);

// Report generation
router.post(
  '/report/generate',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MEMBER),
  validateReportGeneration,
  possessionController.generatePossessionReport
);

// Bulk operations
router.post(
  '/bulk/status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateBulkStatusUpdate,
  possessionController.bulkUpdatePossessionStatus
);

// Certificate generation
router.post(
  '/certificate/generate',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateHandoverCertificate,
  possessionController.generateHandoverCertificate
);

export default router;
