import { Router } from 'express';
import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { marketplaceController } from '../controllers/controller-marketplace';
import {
  validateCreateListing,
  validateGetListings,
  validateMarkAsSold,
  validateToggleFavorite,
  validateUpdateListing,
} from '../validator/validator-marketplace';

const validateRequest = (req: Request, _res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
    }));
    const formattedErrors = errorMessages.map(err => `${err.field}: ${err.message}`).join(', ');
    const error = new Error(`Validation failed: ${formattedErrors}`);
    (error as any).statusCode = 400;
    throw error;
  }
  next();
};

const router: Router = Router();

// ── Special routes (must be before /:id) ──

router.get(
  '/my-listings',
  authenticate,
  marketplaceController.getMyListings
);

router.get(
  '/my-favorites',
  authenticate,
  marketplaceController.getMyFavorites
);

router.get(
  '/popular',
  authenticate,
  marketplaceController.getPopularListings
);

router.get(
  '/stats',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  marketplaceController.getCategoryStats
);

// ── Standard CRUD ──

router.get(
  '/',
  authenticate,
  validateGetListings(),
  validateRequest,
  marketplaceController.getListings
);

router.post(
  '/',
  authenticate,
  validateCreateListing(),
  validateRequest,
  marketplaceController.createListing
);

router.get(
  '/:id',
  authenticate,
  marketplaceController.getListing
);

router.put(
  '/:id',
  authenticate,
  validateUpdateListing(),
  validateRequest,
  marketplaceController.updateListing
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  marketplaceController.deleteListing
);

// ── Action routes ──

router.post(
  '/:id/sold',
  authenticate,
  validateMarkAsSold(),
  validateRequest,
  marketplaceController.markAsSold
);

router.post(
  '/:id/favorite',
  authenticate,
  validateToggleFavorite(),
  validateRequest,
  marketplaceController.toggleFavorite
);

export default router;
