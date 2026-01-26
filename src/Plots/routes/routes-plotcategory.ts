import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { plotCategoryController } from '../controllers/controller-plotcategory';
import {
  validateBulkUpdateSurcharge,
  validateCalculatePrice,
  validateCreatePlotCategory,
  validateUpdatePlotCategory,
} from '../validators/validator-plotcategory';

const router: Router = Router();

// Public routes
router.get('/', plotCategoryController.getPlotCategories);
router.get('/active', plotCategoryController.getActivePlotCategories);
router.get('/:id', plotCategoryController.getPlotCategory);
router.get('/surcharge-type/:type', plotCategoryController.getCategoriesBySurchargeType);
router.get('/stats/summary', plotCategoryController.getCategoryStatistics);

// Calculation endpoints (public)
router.post(
  '/calculate/price',
  validateCalculatePrice,
  plotCategoryController.calculatePriceWithSurcharge
);
router.post('/calculate/bulk-prices', plotCategoryController.calculateBulkPrices);

// Protected routes (admin only)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreatePlotCategory,
  plotCategoryController.createPlotCategory
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdatePlotCategory,
  plotCategoryController.updatePlotCategory
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  plotCategoryController.deletePlotCategory
);

// Status management routes
router.patch(
  '/:id/toggle-status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  plotCategoryController.toggleCategoryStatus
);

// Bulk operations
router.post(
  '/bulk-update-surcharge',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateBulkUpdateSurcharge,
  plotCategoryController.bulkUpdateSurcharge
);

export default router;
