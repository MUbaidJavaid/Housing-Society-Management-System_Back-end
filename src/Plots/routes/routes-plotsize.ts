import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { plotSizeController } from '../controllers/controller-plotsize';
import {
  validateCalculatePrice,
  validateConvertArea,
  validateCreatePlotSize,
  validateUpdatePlotSize,
} from '../validators/validator-plotsize';

const router: Router = Router();

// Public routes
router.get('/', plotSizeController.getPlotSizes);
router.get('/:id', plotSizeController.getPlotSize);
router.get('/:id/breakdown', plotSizeController.getPriceBreakdown);
router.get('/units/available', plotSizeController.getAreaUnits);
router.get('/stats/summary', plotSizeController.getStatistics);

// Calculation endpoints (public)
router.post('/calculate/price', validateCalculatePrice, plotSizeController.calculatePrice);
router.post('/convert/area', validateConvertArea, plotSizeController.convertArea);

// Protected routes (admin only)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreatePlotSize,
  plotSizeController.createPlotSize
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdatePlotSize,
  plotSizeController.updatePlotSize
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  plotSizeController.deletePlotSize
);

export default router;
