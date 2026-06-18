import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { meetingController } from '../controllers/controller-meeting';
import {
  validateCreateMeeting,
  validateUpdateMeeting,
  validateGetMeetings,
  validateAddAgendaItem,
  validateUpdateMinutes,
  validateRecordAttendance,
  validateAddDecision,
  validateCompleteMeeting,
  validateIdParam,
} from '../validators/validator-meeting';

const router: Router = Router();

// Get all meetings
router.get(
  '/',
  authenticate,
  validateGetMeetings(),
  validateRequest,
  meetingController.getAll
);

// Get meeting by ID
router.get(
  '/:id',
  authenticate,
  validateIdParam(),
  validateRequest,
  meetingController.getById
);

// Create meeting
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateMeeting(),
  validateRequest,
  meetingController.create
);

// Update meeting
router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateMeeting(),
  validateRequest,
  meetingController.update
);

// Delete meeting (soft delete)
router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateIdParam(),
  validateRequest,
  meetingController.delete
);

// Add agenda item
router.post(
  '/:id/agenda',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateAddAgendaItem(),
  validateRequest,
  meetingController.addAgendaItem
);

// Update minutes
router.put(
  '/:id/minutes',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateMinutes(),
  validateRequest,
  meetingController.updateMinutes
);

// Record attendance
router.post(
  '/:id/attendance',
  authenticate,
  validateRecordAttendance(),
  validateRequest,
  meetingController.recordAttendance
);

// Add decision
router.post(
  '/:id/decision',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateAddDecision(),
  validateRequest,
  meetingController.addDecision
);

// Complete meeting
router.post(
  '/:id/complete',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCompleteMeeting(),
  validateRequest,
  meetingController.completeMeeting
);

export default router;
