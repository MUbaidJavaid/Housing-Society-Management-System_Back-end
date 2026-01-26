import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { plotController } from '../controllers/controller-plot';
import {
  validateBulkPlotUpdate,
  validateCreatePlot,
  validateGetPlots,
  validatePlotAssignment,
  validatePlotDocuments,
  validatePriceCalculation,
  validateUpdatePlot,
} from '../validators/validator-plot';

const router: Router = Router();

// Public routes
router.get('/', validateGetPlots, plotController.getPlots);
router.get('/types', plotController.getPlotTypes);
router.get('/available', plotController.getAvailablePlots);
router.get('/stats/summary', plotController.getPlotStatistics);
router.get('/search/filter', plotController.searchPlotsWithFilters);
router.get('/:id', plotController.getPlot);
router.get('/registration/:registrationNo', plotController.getPlotByRegistrationNo);
router.get('/project/:projectId', plotController.getPlotsByProject);
router.get('/block/:blockId', plotController.getPlotsByBlock);
router.get('/file/:fileId', plotController.getPlotsByFile);
router.get('/:id/validate-assignment', plotController.validatePlotAssignment);
router.get('/:id/next-actions', plotController.getPlotNextActions);
router.get('/map/:projectId', plotController.getPlotMapData);

// Calculation endpoints
router.post('/calculate-price', validatePriceCalculation, plotController.calculatePlotPrice);

// Protected routes (authenticated users)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MEMBER),
  validateCreatePlot,
  plotController.createPlot
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MEMBER),
  validateUpdatePlot,
  plotController.updatePlot
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  plotController.deletePlot
);

// Plot management routes
router.post(
  '/assign',
  authenticate,
  requireRole(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MEMBER),
  validatePlotAssignment,
  plotController.assignPlotToCustomer
);

router.post(
  '/:id/unassign',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  plotController.unassignPlotFromCustomer
);

router.post(
  '/:id/possession-ready',
  authenticate,
  requireRole(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  plotController.markPossessionReady
);

router.post(
  '/:id/documents',
  authenticate,
  requireRole(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validatePlotDocuments,
  plotController.updatePlotDocuments
);

// Bulk operations
router.post(
  '/bulk-update',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateBulkPlotUpdate,
  plotController.bulkUpdatePlots
);

// Report generation
router.get(
  '/report/inventory/:projectId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MEMBER),
  plotController.generatePlotInventoryReport
);

export default router;
