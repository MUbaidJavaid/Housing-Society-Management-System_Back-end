// Export types
export * from './types/types-meeting';

// Export models
export { default as MeetingModel } from './models/models-meeting';

// Export services
export { meetingService } from './services/service-meeting';

// Export controllers
export { meetingController } from './controllers/controller-meeting';

// Export routes
export { default as meetingRoutes } from './routes/routes-meeting';

// Export validators
export {
  validateCreateMeeting,
  validateUpdateMeeting,
  validateGetMeetings,
  validateAddAgendaItem,
  validateUpdateMinutes,
  validateRecordAttendance,
  validateAddDecision,
  validateCompleteMeeting,
  validateIdParam as validateMeetingIdParam,
} from './validators/validator-meeting';
