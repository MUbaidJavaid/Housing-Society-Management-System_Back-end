import { Router } from 'express';

import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { memberController } from '../index-member';

const router: Router = Router();

// Public routes
router.get('/', memberController.getMembers);
router.get('/summary', memberController.getMemberSummary);
router.get('/search', memberController.searchMembers);
router.get('/nic/:nic', memberController.getMemberByNic);
router.get('/:id', memberController.getMember);

// Protected routes (admin/moderator for write operations)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  memberController.createMember
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  memberController.updateMember
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  memberController.deleteMember
);

router.post(
  '/:id/unlock',
  authenticate,
  requireRole(UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  memberController.unlockMember
);

export default router;
