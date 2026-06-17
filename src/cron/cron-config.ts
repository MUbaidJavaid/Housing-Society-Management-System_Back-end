export const CRON_CONFIG = {
  INSTALLMENT_SCHEDULE: process.env.INSTALLMENT_CRON_SCHEDULE || '0 0 * * *', // daily midnight
  OVERDUE_SCHEDULE: process.env.OVERDUE_CRON_SCHEDULE || '0 1 * * *', // daily 1am
  REMINDER_DAYS_BEFORE: parseInt(process.env.REMINDER_DAYS_BEFORE || '3', 10),
  LATE_FEE_DAILY_RATE: parseFloat(process.env.LATE_FEE_DAILY_RATE || '0.005'),
  LATE_FEE_MAX_PERCENTAGE: parseFloat(process.env.LATE_FEE_MAX_PERCENTAGE || '0.25'),
  SYSTEM_USER_ID: process.env.SYSTEM_USER_ID || '000000000000000000000000',
};
