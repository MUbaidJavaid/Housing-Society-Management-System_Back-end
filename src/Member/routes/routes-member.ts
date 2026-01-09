import { authenticate, requireRole, UserRole } from '@/auth';
import { Router } from 'express';
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

export default router;
