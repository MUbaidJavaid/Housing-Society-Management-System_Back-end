import { Router } from 'express';
import { userController } from '../auth/controllers/user.controller';
import { authenticate } from '../auth/middleware/auth';

const router: Router = Router();

// Apply global middleware for API routes
// router.use(validateRequestId());
// router.use(validateContentType(['application/json']));

// Protected routes
router.use(authenticate);

// User routes
router.get('/users', userController.getUsers);
router.get('/users/search', userController.searchUsers);
router.post('/users', userController.createUser);
router.get('/users/stats', userController.getUserStats);
router.put('/users/bulk-status', userController.bulkUpdateStatus);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

// Profile routes (current user)
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

export default router;
