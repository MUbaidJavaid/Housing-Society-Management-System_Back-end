import cron, { ScheduledTask } from 'node-cron';
import { Types } from 'mongoose';
import logger from '../core/logger';
import Installment, {
  InstallmentStatus,
  InstallmentType,
} from '../Installment/models/models-installment';
import InstallmentPlan from '../Installment/models/models-installment-plan';
import InstallmentPlanDetail from '../Installment/models/models-installment-plan-detail';
import File, { FileStatus } from '../File/models/models-file';
import Notification from '../Notification/models/models-notification';
import { CRON_CONFIG } from './cron-config';

let installmentTask: ScheduledTask | null = null;
let overdueTask: ScheduledTask | null = null;

/**
 * Calculate the due date for a specific occurrence based on the file's booking date
 * and the plan's total months to determine frequency.
 */
function calculateDueDate(bookingDate: Date, occurrence: number, _totalMonths: number): Date {
  const dueDate = new Date(bookingDate);
  // Each occurrence represents a month increment from the booking date
  // occurrence 1 = bookingDate, occurrence 2 = bookingDate + 1 month, etc.
  const monthsToAdd = occurrence - 1;
  dueDate.setMonth(dueDate.getMonth() + monthsToAdd);
  return dueDate;
}

/**
 * Calculate the installment amount based on the plan detail configuration.
 * Uses percentageAmount if > 0, otherwise falls back to fixedAmount.
 */
function calculateAmount(
  percentageAmount: number,
  fixedAmount: number,
  fileTotalAmount: number
): number {
  if (percentageAmount > 0) {
    return (fileTotalAmount * percentageAmount) / 100;
  }
  return fixedAmount;
}

/**
 * Determine the installment type based on the occurrence and total months.
 */
function determineInstallmentType(occurrence: number, totalMonths: number): InstallmentType {
  if (occurrence === 1) {
    return InstallmentType.DOWN_PAYMENT;
  }
  if (totalMonths <= 12) {
    return InstallmentType.MONTHLY;
  }
  if (totalMonths <= 48 && totalMonths % 3 === 0) {
    return InstallmentType.QUARTERLY;
  }
  return InstallmentType.MONTHLY;
}

/**
 * Generate due installments for all active files linked to active installment plans.
 * For each file, checks which plan detail occurrences are missing and creates
 * installment records for those whose due date is on or before today.
 */
export async function generateDueInstallments(): Promise<number> {
  const startTime = Date.now();
  let totalCreated = 0;

  try {
    logger.info('[InstallmentCron] Starting generateDueInstallments job');

    // Find all active, non-deleted installment plans
    const activePlans = await InstallmentPlan.find({
      isActive: true,
      isDeleted: false,
    }).lean();

    if (activePlans.length === 0) {
      logger.info('[InstallmentCron] No active installment plans found');
      return 0;
    }

    logger.info(`[InstallmentCron] Found ${activePlans.length} active installment plans`);

    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today for comparison

    const systemUserId = new Types.ObjectId(CRON_CONFIG.SYSTEM_USER_ID);

    for (const plan of activePlans) {
      try {
        // Find all active, non-deleted files that reference this plan
        const files = await File.find({
          planId: plan._id,
          status: { $in: [FileStatus.ACTIVE, FileStatus.PENDING] },
          isDeleted: false,
          isActive: true,
        }).lean();

        if (files.length === 0) {
          logger.info(
            `[InstallmentCron] No active files found for plan: ${plan.planName} (${plan._id})`
          );
          continue;
        }

        logger.info(
          `[InstallmentCron] Processing ${files.length} files for plan: ${plan.planName}`
        );

        // Get all plan details for this plan, sorted by occurrence
        const planDetails = await InstallmentPlanDetail.find({
          planId: plan._id,
          isDeleted: false,
        })
          .sort({ occurrence: 1 })
          .lean();

        if (planDetails.length === 0) {
          logger.warn(
            `[InstallmentCron] No plan details found for plan: ${plan.planName} (${plan._id})`
          );
          continue;
        }

        for (const file of files) {
          try {
            // Get existing installments for this file
            const existingInstallments = await Installment.find({
              fileId: file._id,
              isDeleted: false,
            })
              .select('installmentNo')
              .lean();

            const existingOccurrences = new Set(
              existingInstallments.map((inst) => inst.installmentNo)
            );

            for (const detail of planDetails) {
              // Skip if this occurrence already has an installment
              if (existingOccurrences.has(detail.occurrence)) {
                continue;
              }

              // Calculate due date for this occurrence
              const dueDate = calculateDueDate(
                file.bookingDate,
                detail.occurrence,
                plan.totalMonths
              );

              // Only create if the due date is on or before today
              if (dueDate > today) {
                continue;
              }

              // Calculate installment amount
              const amountDue = calculateAmount(
                detail.percentageAmount,
                detail.fixedAmount,
                file.totalAmount
              );

              // Determine installment type
              const installmentType = determineInstallmentType(
                detail.occurrence,
                plan.totalMonths
              );

              // Determine initial status based on due date
              const now = new Date();
              now.setHours(0, 0, 0, 0);
              const status =
                dueDate < now ? InstallmentStatus.OVERDUE : InstallmentStatus.UNPAID;

              // Create the installment record
              const installment = new Installment({
                fileId: file._id,
                memId: file.memId,
                plotId: file.plotId,
                installmentCategoryId: detail.instCatId,
                installmentNo: detail.occurrence,
                installmentTitle: `${plan.planName} - Installment #${detail.occurrence}`,
                installmentType,
                dueDate,
                amountDue,
                lateFeeSurcharge: 0,
                totalPayable: amountDue,
                amountPaid: 0,
                balanceAmount: amountDue,
                status,
                createdBy: systemUserId,
                isDeleted: false,
              });

              await installment.save();
              totalCreated++;

              logger.info(
                `[InstallmentCron] Created installment #${detail.occurrence} for file ${file.fileRegNo} ` +
                  `(amount: ${amountDue}, dueDate: ${dueDate.toISOString()}, status: ${status})`
              );
            }
          } catch (fileError) {
            logger.error(
              `[InstallmentCron] Error processing file ${file.fileRegNo} (${file._id}):`,
              fileError
            );
            // Continue with next file
          }
        }
      } catch (planError) {
        logger.error(
          `[InstallmentCron] Error processing plan ${plan.planName} (${plan._id}):`,
          planError
        );
        // Continue with next plan
      }
    }

    const duration = Date.now() - startTime;
    logger.info(
      `[InstallmentCron] generateDueInstallments completed: ${totalCreated} installments created in ${duration}ms`
    );

    return totalCreated;
  } catch (error) {
    logger.error('[InstallmentCron] Fatal error in generateDueInstallments:', error);
    throw error;
  }
}

/**
 * Mark unpaid or partially paid installments as overdue if their due date has passed.
 * Also calculates and applies late fee surcharges based on days overdue.
 */
export async function markOverdueInstallments(): Promise<number> {
  const startTime = Date.now();
  let totalUpdated = 0;

  try {
    logger.info('[InstallmentCron] Starting markOverdueInstallments job');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all installments that are past due and still unpaid or partially paid
    const overdueInstallments = await Installment.find({
      dueDate: { $lt: today },
      status: { $in: [InstallmentStatus.UNPAID, InstallmentStatus.PARTIALLY_PAID] },
      isDeleted: false,
    });

    if (overdueInstallments.length === 0) {
      logger.info('[InstallmentCron] No overdue installments found');
      return 0;
    }

    logger.info(
      `[InstallmentCron] Found ${overdueInstallments.length} installments to mark as overdue`
    );

    for (const installment of overdueInstallments) {
      try {
        const dueDate = new Date(installment.dueDate);
        const diffTime = Math.abs(today.getTime() - dueDate.getTime());
        const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Calculate late fee surcharge
        const calculatedFee =
          installment.amountDue * CRON_CONFIG.LATE_FEE_DAILY_RATE * daysOverdue;
        const maxFee = installment.amountDue * CRON_CONFIG.LATE_FEE_MAX_PERCENTAGE;
        const lateFeeSurcharge = Math.min(calculatedFee, maxFee);

        // Update the installment
        installment.lateFeeSurcharge = lateFeeSurcharge;
        installment.totalPayable = installment.amountDue + lateFeeSurcharge;
        installment.balanceAmount = installment.totalPayable - installment.amountPaid;
        installment.status = InstallmentStatus.OVERDUE;

        await installment.save();
        totalUpdated++;

        logger.info(
          `[InstallmentCron] Marked installment ${installment._id} as overdue ` +
            `(daysOverdue: ${daysOverdue}, lateFee: ${lateFeeSurcharge.toFixed(2)}, ` +
            `balance: ${installment.balanceAmount.toFixed(2)})`
        );
      } catch (updateError) {
        logger.error(
          `[InstallmentCron] Error updating installment ${installment._id}:`,
          updateError
        );
        // Continue with next installment
      }
    }

    const duration = Date.now() - startTime;
    logger.info(
      `[InstallmentCron] markOverdueInstallments completed: ${totalUpdated} installments updated in ${duration}ms`
    );

    return totalUpdated;
  } catch (error) {
    logger.error('[InstallmentCron] Fatal error in markOverdueInstallments:', error);
    throw error;
  }
}

/**
 * Send reminder notifications for installments that are due within REMINDER_DAYS_BEFORE days
 * and are still unpaid.
 */
export async function sendDueReminders(): Promise<number> {
  const startTime = Date.now();
  let totalReminders = 0;

  try {
    logger.info('[InstallmentCron] Starting sendDueReminders job');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reminderDate = new Date(today);
    reminderDate.setDate(reminderDate.getDate() + CRON_CONFIG.REMINDER_DAYS_BEFORE);
    reminderDate.setHours(23, 59, 59, 999);

    // Find unpaid installments due within the reminder window
    const upcomingInstallments = await Installment.find({
      dueDate: { $gte: today, $lte: reminderDate },
      status: InstallmentStatus.UNPAID,
      isDeleted: false,
    })
      .populate('file', 'fileRegNo')
      .populate('member', 'memName')
      .populate('plot', 'plotNo')
      .lean();

    if (upcomingInstallments.length === 0) {
      logger.info('[InstallmentCron] No upcoming installments requiring reminders');
      return 0;
    }

    logger.info(
      `[InstallmentCron] Found ${upcomingInstallments.length} installments due within ${CRON_CONFIG.REMINDER_DAYS_BEFORE} days`
    );

    const systemUserId = new Types.ObjectId(CRON_CONFIG.SYSTEM_USER_ID);

    for (const installment of upcomingInstallments) {
      try {
        const dueDate = new Date(installment.dueDate);
        const daysUntilDue = Math.ceil(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        const fileInfo = (installment as any).file;
        const memberInfo = (installment as any).member;
        const plotInfo = (installment as any).plot;

        const fileRegNo = fileInfo?.fileRegNo || 'N/A';
        const memberName = memberInfo?.memName || 'N/A';
        const plotNo = plotInfo?.plotNo || 'N/A';

        // Create a notification record
        const notification = new Notification({
          title: `Installment Due Reminder - ${installment.installmentTitle}`,
          message:
            `Installment #${installment.installmentNo} for File ${fileRegNo} ` +
            `(Member: ${memberName}, Plot: ${plotNo}) is due in ${daysUntilDue} day(s) ` +
            `on ${dueDate.toLocaleDateString()}. Amount due: ${installment.amountDue.toFixed(2)}.`,
          referenceId: installment._id as Types.ObjectId,
          module: 'Payment',
          createdBy: systemUserId,
          isRead: false,
          isDeleted: false,
        });

        await notification.save();
        totalReminders++;

        logger.info(
          `[InstallmentCron] Sent reminder for installment ${installment._id} ` +
            `(file: ${fileRegNo}, dueIn: ${daysUntilDue} days, amount: ${installment.amountDue})`
        );
      } catch (notifError) {
        logger.error(
          `[InstallmentCron] Error creating reminder for installment ${installment._id}:`,
          notifError
        );
        // Continue with next installment
      }
    }

    const duration = Date.now() - startTime;
    logger.info(
      `[InstallmentCron] sendDueReminders completed: ${totalReminders} reminders sent in ${duration}ms`
    );

    return totalReminders;
  } catch (error) {
    logger.error('[InstallmentCron] Fatal error in sendDueReminders:', error);
    throw error;
  }
}

/**
 * Start all installment-related cron jobs.
 */
export function startInstallmentCron(): void {
  try {
    logger.info('[InstallmentCron] Starting installment cron jobs...');

    // Validate cron schedules
    if (!cron.validate(CRON_CONFIG.INSTALLMENT_SCHEDULE)) {
      logger.error(
        `[InstallmentCron] Invalid INSTALLMENT_SCHEDULE: ${CRON_CONFIG.INSTALLMENT_SCHEDULE}`
      );
      return;
    }

    if (!cron.validate(CRON_CONFIG.OVERDUE_SCHEDULE)) {
      logger.error(
        `[InstallmentCron] Invalid OVERDUE_SCHEDULE: ${CRON_CONFIG.OVERDUE_SCHEDULE}`
      );
      return;
    }

    // Schedule installment generation job (daily at midnight by default)
    installmentTask = cron.schedule(
      CRON_CONFIG.INSTALLMENT_SCHEDULE,
      async () => {
        logger.info('[InstallmentCron] Running scheduled installment generation...');
        try {
          const created = await generateDueInstallments();
          logger.info(`[InstallmentCron] Scheduled generation complete: ${created} created`);

          // Also send reminders after generating installments
          const reminders = await sendDueReminders();
          logger.info(`[InstallmentCron] Scheduled reminders complete: ${reminders} sent`);
        } catch (error) {
          logger.error('[InstallmentCron] Scheduled installment generation failed:', error);
        }
      },
      {
        timezone: process.env.TZ || 'Asia/Karachi',
      }
    );

    // Schedule overdue marking job (daily at 1am by default)
    overdueTask = cron.schedule(
      CRON_CONFIG.OVERDUE_SCHEDULE,
      async () => {
        logger.info('[InstallmentCron] Running scheduled overdue marking...');
        try {
          const updated = await markOverdueInstallments();
          logger.info(`[InstallmentCron] Scheduled overdue marking complete: ${updated} updated`);
        } catch (error) {
          logger.error('[InstallmentCron] Scheduled overdue marking failed:', error);
        }
      },
      {
        timezone: process.env.TZ || 'Asia/Karachi',
      }
    );

    logger.info(
      `[InstallmentCron] Cron jobs started successfully. ` +
        `Installment generation: "${CRON_CONFIG.INSTALLMENT_SCHEDULE}", ` +
        `Overdue marking: "${CRON_CONFIG.OVERDUE_SCHEDULE}"`
    );
  } catch (error) {
    logger.error('[InstallmentCron] Failed to start cron jobs:', error);
  }
}

/**
 * Stop all installment-related cron jobs.
 */
export function stopInstallmentCron(): void {
  try {
    logger.info('[InstallmentCron] Stopping installment cron jobs...');

    if (installmentTask) {
      installmentTask.stop();
      installmentTask = null;
      logger.info('[InstallmentCron] Installment generation task stopped');
    }

    if (overdueTask) {
      overdueTask.stop();
      overdueTask = null;
      logger.info('[InstallmentCron] Overdue marking task stopped');
    }

    logger.info('[InstallmentCron] All cron jobs stopped');
  } catch (error) {
    logger.error('[InstallmentCron] Error stopping cron jobs:', error);
  }
}
