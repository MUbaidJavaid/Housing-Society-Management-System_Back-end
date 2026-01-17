import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { cityController } from '../index-city';

const router: Router = Router();

// Public routes
router.get('/', cityController.getCities);
router.get('/all', cityController.getAllCities);
router.get('/state/:stateId', cityController.getCitiesByState);
router.get('/:id', cityController.getCity);

// Protected routes (admin only)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  cityController.createCity
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  cityController.updateCity
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  cityController.deleteCity
);

export default router;
