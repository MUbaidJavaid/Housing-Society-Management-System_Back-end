import { Router } from 'express';
import { authenticate } from '../../auth/middleware/auth';
import { requireSuperAdmin } from '../../middleware/tenant.middleware';
import * as ctrl from '../controllers/controller-super-admin';

const router = Router();

// All routes require authentication + Super Admin role
router.use(authenticate, requireSuperAdmin);

// ── Platform Analytics ──
router.get('/stats', ctrl.getPlatformStats);
router.get('/health', ctrl.getSocietiesHealth);

// ── Society (Tenant) Management ──
router.post('/societies', ctrl.createSociety);
router.get('/societies', ctrl.listSocieties);
router.get('/societies/:id', ctrl.getSocietyDetail);
router.patch('/societies/:id', ctrl.updateSociety);
router.delete('/societies/:id', ctrl.deleteSociety);

// ── Global User Management ──
router.get('/users', ctrl.listAllUsers);

// ── Impersonation ──
router.post('/impersonate', ctrl.impersonateUser);

// ── Subscription Plans ──
router.post('/plans', ctrl.createSubscriptionPlan);
router.get('/plans', ctrl.listSubscriptionPlans);
router.patch('/plans/:id', ctrl.updateSubscriptionPlan);

// ── Audit Logs ──
router.get('/audit-logs', ctrl.getGlobalAuditLogs);

export default router;
