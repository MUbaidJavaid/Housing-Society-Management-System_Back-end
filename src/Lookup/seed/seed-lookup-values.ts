import { SeedItem } from '../types/types-lookup-value';
import { lookupValueService } from '../services/service-lookup-value';
import { logger } from '../../logger';

export const SEED_DATA: SeedItem[] = [
  // ==================== POSSESSION_STATUS ====================
  { category: 'possession_status', code: 'REQUESTED', label: 'Requested', colorCode: '#3B82F6', sequence: 1, isDefault: true, isSystem: true },
  { category: 'possession_status', code: 'SURVEYED', label: 'Surveyed', colorCode: '#8B5CF6', sequence: 2, isSystem: true },
  { category: 'possession_status', code: 'READY', label: 'Ready', colorCode: '#10B981', sequence: 3, isSystem: true },
  { category: 'possession_status', code: 'HANDED_OVER', label: 'Handed Over', colorCode: '#059669', sequence: 4, isSystem: true },
  { category: 'possession_status', code: 'CANCELLED', label: 'Cancelled', colorCode: '#EF4444', sequence: 5, isSystem: true },
  { category: 'possession_status', code: 'ON_HOLD', label: 'On Hold', colorCode: '#F59E0B', sequence: 6, isSystem: true },

  // ==================== TRANSFER_STATUS ====================
  { category: 'transfer_status', code: 'PENDING', label: 'Pending', colorCode: '#F59E0B', sequence: 1, isDefault: true, isSystem: true },
  { category: 'transfer_status', code: 'UNDER_REVIEW', label: 'Under Review', colorCode: '#3B82F6', sequence: 2, isSystem: true },
  { category: 'transfer_status', code: 'APPROVED', label: 'Approved', colorCode: '#10B981', sequence: 3, isSystem: true },
  { category: 'transfer_status', code: 'REJECTED', label: 'Rejected', colorCode: '#EF4444', sequence: 4, isSystem: true },
  { category: 'transfer_status', code: 'COMPLETED', label: 'Completed', colorCode: '#059669', sequence: 5, isSystem: true },
  { category: 'transfer_status', code: 'CANCELLED', label: 'Cancelled', colorCode: '#6B7280', sequence: 6, isSystem: true },
  { category: 'transfer_status', code: 'ON_HOLD', label: 'On Hold', colorCode: '#F59E0B', sequence: 7, isSystem: true },
  { category: 'transfer_status', code: 'DOCUMENTS_REQUIRED', label: 'Documents Required', colorCode: '#8B5CF6', sequence: 8, isSystem: true },
  { category: 'transfer_status', code: 'FEE_PENDING', label: 'Fee Pending', colorCode: '#F97316', sequence: 9, isSystem: true },

  // ==================== DEFAULTER_STATUS ====================
  { category: 'defaulter_status', code: 'WARNING', label: 'Warning', colorCode: '#F59E0B', sequence: 1, isDefault: true, isSystem: true },
  { category: 'defaulter_status', code: 'SUSPENDED', label: 'Suspended', colorCode: '#EF4444', sequence: 2, isSystem: true },
  { category: 'defaulter_status', code: 'LEGAL_ACTION', label: 'Legal Action', colorCode: '#DC2626', sequence: 3, isSystem: true },
  { category: 'defaulter_status', code: 'RESOLVED', label: 'Resolved', colorCode: '#10B981', sequence: 4, isSystem: true },

  // ==================== COMPLAINT_PRIORITY ====================
  { category: 'complaint_priority', code: 'LOW', label: 'Low', colorCode: '#10B981', sequence: 1, isSystem: true },
  { category: 'complaint_priority', code: 'MEDIUM', label: 'Medium', colorCode: '#F59E0B', sequence: 2, isDefault: true, isSystem: true },
  { category: 'complaint_priority', code: 'HIGH', label: 'High', colorCode: '#EF4444', sequence: 3, isSystem: true },
  { category: 'complaint_priority', code: 'EMERGENCY', label: 'Emergency', colorCode: '#DC2626', sequence: 4, isSystem: true },

  // ==================== COMPLAINT_STATUS ====================
  { category: 'complaint_status', code: 'OPEN', label: 'Open', colorCode: '#3B82F6', sequence: 1, isDefault: true, isSystem: true },
  { category: 'complaint_status', code: 'IN_PROGRESS', label: 'In Progress', colorCode: '#F59E0B', sequence: 2, isSystem: true },
  { category: 'complaint_status', code: 'RESOLVED', label: 'Resolved', colorCode: '#10B981', sequence: 3, isSystem: true },
  { category: 'complaint_status', code: 'CLOSED', label: 'Closed', colorCode: '#6B7280', sequence: 4, isSystem: true },
  { category: 'complaint_status', code: 'REJECTED', label: 'Rejected', colorCode: '#EF4444', sequence: 5, isSystem: true },
  { category: 'complaint_status', code: 'REOPENED', label: 'Reopened', colorCode: '#8B5CF6', sequence: 6, isSystem: true },
  { category: 'complaint_status', code: 'ON_HOLD', label: 'On Hold', colorCode: '#F59E0B', sequence: 7, isSystem: true },

  // ==================== INSTALLMENT_STATUS ====================
  { category: 'installment_status', code: 'UNPAID', label: 'Unpaid', colorCode: '#EF4444', sequence: 1, isDefault: true, isSystem: true },
  { category: 'installment_status', code: 'PARTIALLY_PAID', label: 'Partially Paid', colorCode: '#F59E0B', sequence: 2, isSystem: true },
  { category: 'installment_status', code: 'PAID', label: 'Paid', colorCode: '#10B981', sequence: 3, isSystem: true },
  { category: 'installment_status', code: 'OVERDUE', label: 'Overdue', colorCode: '#DC2626', sequence: 4, isSystem: true },
  { category: 'installment_status', code: 'CANCELLED', label: 'Cancelled', colorCode: '#6B7280', sequence: 5, isSystem: true },
  { category: 'installment_status', code: 'REFUNDED', label: 'Refunded', colorCode: '#8B5CF6', sequence: 6, isSystem: true },

  // ==================== INSTALLMENT_TYPE ====================
  { category: 'installment_type', code: 'MONTHLY', label: 'Monthly', colorCode: '#3B82F6', sequence: 1, isDefault: true, isSystem: true },
  { category: 'installment_type', code: 'QUARTERLY', label: 'Quarterly', colorCode: '#6366F1', sequence: 2, isSystem: true },
  { category: 'installment_type', code: 'HALF_YEARLY', label: 'Half-Yearly', colorCode: '#8B5CF6', sequence: 3, isSystem: true },
  { category: 'installment_type', code: 'YEARLY', label: 'Yearly', colorCode: '#A855F7', sequence: 4, isSystem: true },
  { category: 'installment_type', code: 'BALLOON', label: 'Balloon', colorCode: '#EC4899', sequence: 5, isSystem: true },
  { category: 'installment_type', code: 'DOWN_PAYMENT', label: 'Down Payment', colorCode: '#14B8A6', sequence: 6, isSystem: true },
  { category: 'installment_type', code: 'POSSESSION_FEE', label: 'Possession Fee', colorCode: '#F97316', sequence: 7, isSystem: true },
  { category: 'installment_type', code: 'BALLOTING_FEE', label: 'Balloting Fee', colorCode: '#06B6D4', sequence: 8, isSystem: true },
  { category: 'installment_type', code: 'UTILITY_CHARGES', label: 'Utility Charges', colorCode: '#84CC16', sequence: 9, isSystem: true },
  { category: 'installment_type', code: 'DEVELOPMENT_CHARGES', label: 'Development Charges', colorCode: '#EAB308', sequence: 10, isSystem: true },
  { category: 'installment_type', code: 'LEGAL_FEE', label: 'Legal Fee', colorCode: '#F43F5E', sequence: 11, isSystem: true },
  { category: 'installment_type', code: 'TRANSFER_FEE', label: 'Transfer Fee', colorCode: '#0EA5E9', sequence: 12, isSystem: true },
  { category: 'installment_type', code: 'OTHER', label: 'Other', colorCode: '#6B7280', sequence: 13, isSystem: true },

  // ==================== PAYMENT_MODE ====================
  { category: 'payment_mode', code: 'CASH', label: 'Cash', colorCode: '#10B981', sequence: 1, isDefault: true, isSystem: true },
  { category: 'payment_mode', code: 'BANK_TRANSFER', label: 'Bank Transfer', colorCode: '#3B82F6', sequence: 2, isSystem: true },
  { category: 'payment_mode', code: 'CHEQUE', label: 'Cheque', colorCode: '#6366F1', sequence: 3, isSystem: true },
  { category: 'payment_mode', code: 'ONLINE_PAYMENT', label: 'Online Payment', colorCode: '#8B5CF6', sequence: 4, isSystem: true },
  { category: 'payment_mode', code: 'CREDIT_CARD', label: 'Credit Card', colorCode: '#EC4899', sequence: 5, isSystem: true },
  { category: 'payment_mode', code: 'DEBIT_CARD', label: 'Debit Card', colorCode: '#F97316', sequence: 6, isSystem: true },
  { category: 'payment_mode', code: 'MOBILE_WALLET', label: 'Mobile Wallet', colorCode: '#14B8A6', sequence: 7, isSystem: true },
  { category: 'payment_mode', code: 'OTHER', label: 'Other', colorCode: '#6B7280', sequence: 8, isSystem: true },

  // ==================== FILE_STATUS ====================
  { category: 'file_status', code: 'ACTIVE', label: 'Active', colorCode: '#10B981', sequence: 1, isDefault: true, isSystem: true },
  { category: 'file_status', code: 'PENDING', label: 'Pending', colorCode: '#F59E0B', sequence: 2, isSystem: true },
  { category: 'file_status', code: 'CANCELLED', label: 'Cancelled', colorCode: '#EF4444', sequence: 3, isSystem: true },
  { category: 'file_status', code: 'MERGED', label: 'Merged', colorCode: '#8B5CF6', sequence: 4, isSystem: true },
  { category: 'file_status', code: 'CLOSED', label: 'Closed', colorCode: '#6B7280', sequence: 5, isSystem: true },
  { category: 'file_status', code: 'SUSPENDED', label: 'Suspended', colorCode: '#DC2626', sequence: 6, isSystem: true },
  { category: 'file_status', code: 'TRANSFERRED', label: 'Transferred', colorCode: '#3B82F6', sequence: 7, isSystem: true },
  { category: 'file_status', code: 'DISPUTED', label: 'Disputed', colorCode: '#F43F5E', sequence: 8, isSystem: true },

  // ==================== PLOT_TYPE ====================
  { category: 'plot_type', code: 'RESIDENTIAL', label: 'Residential', colorCode: '#3B82F6', sequence: 1, isDefault: true, isSystem: true },
  { category: 'plot_type', code: 'COMMERCIAL', label: 'Commercial', colorCode: '#8B5CF6', sequence: 2, isSystem: true },
  { category: 'plot_type', code: 'INDUSTRIAL', label: 'Industrial', colorCode: '#6B7280', sequence: 3, isSystem: true },
  { category: 'plot_type', code: 'AGRICULTURAL', label: 'Agricultural', colorCode: '#10B981', sequence: 4, isSystem: true },
  { category: 'plot_type', code: 'CORNER', label: 'Corner', colorCode: '#F59E0B', sequence: 5, isSystem: true },
  { category: 'plot_type', code: 'PARK_FACING', label: 'Park Facing', colorCode: '#14B8A6', sequence: 6, isSystem: true },
  { category: 'plot_type', code: 'MAIN_BOULEVARD', label: 'Main Boulevard', colorCode: '#EC4899', sequence: 7, isSystem: true },
  { category: 'plot_type', code: 'STANDARD', label: 'Standard', colorCode: '#6366F1', sequence: 8, isSystem: true },

  // ==================== PROJECT_STATUS ====================
  { category: 'project_status', code: 'PLANNING', label: 'Planning', colorCode: '#3B82F6', sequence: 1, isDefault: true, isSystem: true },
  { category: 'project_status', code: 'UNDER_DEVELOPMENT', label: 'Under Development', colorCode: '#F59E0B', sequence: 2, isSystem: true },
  { category: 'project_status', code: 'COMPLETED', label: 'Completed', colorCode: '#10B981', sequence: 3, isSystem: true },
  { category: 'project_status', code: 'ON_HOLD', label: 'On Hold', colorCode: '#6B7280', sequence: 4, isSystem: true },
  { category: 'project_status', code: 'CANCELLED', label: 'Cancelled', colorCode: '#EF4444', sequence: 5, isSystem: true },

  // ==================== PROJECT_TYPE ====================
  { category: 'project_type', code: 'RESIDENTIAL', label: 'Residential', colorCode: '#3B82F6', sequence: 1, isDefault: true, isSystem: true },
  { category: 'project_type', code: 'COMMERCIAL', label: 'Commercial', colorCode: '#8B5CF6', sequence: 2, isSystem: true },
  { category: 'project_type', code: 'INDUSTRIAL', label: 'Industrial', colorCode: '#6B7280', sequence: 3, isSystem: true },
  { category: 'project_type', code: 'MIXED_USE', label: 'Mixed Use', colorCode: '#14B8A6', sequence: 4, isSystem: true },
  { category: 'project_type', code: 'AGRICULTURAL', label: 'Agricultural', colorCode: '#10B981', sequence: 5, isSystem: true },

  // ==================== VISITOR_PURPOSE ====================
  { category: 'visitor_purpose', code: 'PERSONAL', label: 'Personal', colorCode: '#3B82F6', sequence: 1, isDefault: true, isSystem: true },
  { category: 'visitor_purpose', code: 'BUSINESS', label: 'Business', colorCode: '#8B5CF6', sequence: 2, isSystem: true },
  { category: 'visitor_purpose', code: 'DELIVERY', label: 'Delivery', colorCode: '#F97316', sequence: 3, isSystem: true },
  { category: 'visitor_purpose', code: 'MAINTENANCE', label: 'Maintenance', colorCode: '#EAB308', sequence: 4, isSystem: true },
  { category: 'visitor_purpose', code: 'GOVERNMENT', label: 'Government', colorCode: '#6366F1', sequence: 5, isSystem: true },
  { category: 'visitor_purpose', code: 'EMERGENCY', label: 'Emergency', colorCode: '#EF4444', sequence: 6, isSystem: true },
  { category: 'visitor_purpose', code: 'OTHER', label: 'Other', colorCode: '#6B7280', sequence: 7, isSystem: true },

  // ==================== VISITOR_STATUS ====================
  { category: 'visitor_status', code: 'PENDING', label: 'Pending', colorCode: '#F59E0B', sequence: 1, isDefault: true, isSystem: true },
  { category: 'visitor_status', code: 'APPROVED', label: 'Approved', colorCode: '#10B981', sequence: 2, isSystem: true },
  { category: 'visitor_status', code: 'CHECKED_IN', label: 'Checked In', colorCode: '#3B82F6', sequence: 3, isSystem: true },
  { category: 'visitor_status', code: 'CHECKED_OUT', label: 'Checked Out', colorCode: '#6B7280', sequence: 4, isSystem: true },
  { category: 'visitor_status', code: 'REJECTED', label: 'Rejected', colorCode: '#EF4444', sequence: 5, isSystem: true },
  { category: 'visitor_status', code: 'EXPIRED', label: 'Expired', colorCode: '#9CA3AF', sequence: 6, isSystem: true },
  { category: 'visitor_status', code: 'CANCELLED', label: 'Cancelled', colorCode: '#DC2626', sequence: 7, isSystem: true },

  // ==================== VEHICLE_TYPE ====================
  { category: 'vehicle_type', code: 'CAR', label: 'Car', colorCode: '#3B82F6', sequence: 1, isDefault: true, isSystem: true },
  { category: 'vehicle_type', code: 'MOTORCYCLE', label: 'Motorcycle', colorCode: '#F59E0B', sequence: 2, isSystem: true },
  { category: 'vehicle_type', code: 'BICYCLE', label: 'Bicycle', colorCode: '#10B981', sequence: 3, isSystem: true },
  { category: 'vehicle_type', code: 'OTHER', label: 'Other', colorCode: '#6B7280', sequence: 4, isSystem: true },

  // ==================== BILL_TYPE_CATEGORY ====================
  { category: 'bill_type_category', code: 'UTILITY', label: 'Utility', colorCode: '#3B82F6', sequence: 1, isDefault: true, isSystem: true },
  { category: 'bill_type_category', code: 'ADMINISTRATIVE', label: 'Administrative', colorCode: '#8B5CF6', sequence: 2, isSystem: true },
  { category: 'bill_type_category', code: 'PENALTY', label: 'Penalty', colorCode: '#EF4444', sequence: 3, isSystem: true },
  { category: 'bill_type_category', code: 'TAX', label: 'Tax', colorCode: '#F59E0B', sequence: 4, isSystem: true },
  { category: 'bill_type_category', code: 'FEE', label: 'Fee', colorCode: '#14B8A6', sequence: 5, isSystem: true },
  { category: 'bill_type_category', code: 'OTHER', label: 'Other', colorCode: '#6B7280', sequence: 6, isSystem: true },

  // ==================== BILL_STATUS ====================
  { category: 'bill_status', code: 'PENDING', label: 'Pending', colorCode: '#F59E0B', sequence: 1, isDefault: true, isSystem: true },
  { category: 'bill_status', code: 'PAID', label: 'Paid', colorCode: '#10B981', sequence: 2, isSystem: true },
  { category: 'bill_status', code: 'PARTIALLY_PAID', label: 'Partially Paid', colorCode: '#F97316', sequence: 3, isSystem: true },
  { category: 'bill_status', code: 'OVERDUE', label: 'Overdue', colorCode: '#EF4444', sequence: 4, isSystem: true },
  { category: 'bill_status', code: 'CANCELLED', label: 'Cancelled', colorCode: '#6B7280', sequence: 5, isSystem: true },
  { category: 'bill_status', code: 'DISPUTED', label: 'Disputed', colorCode: '#DC2626', sequence: 6, isSystem: true },

  // ==================== RELATION_TYPE ====================
  { category: 'relation_type', code: 'SON', label: 'Son', sequence: 1, isSystem: true },
  { category: 'relation_type', code: 'DAUGHTER', label: 'Daughter', sequence: 2, isSystem: true },
  { category: 'relation_type', code: 'WIFE', label: 'Wife', sequence: 3, isSystem: true },
  { category: 'relation_type', code: 'HUSBAND', label: 'Husband', sequence: 4, isSystem: true },
  { category: 'relation_type', code: 'FATHER', label: 'Father', sequence: 5, isSystem: true },
  { category: 'relation_type', code: 'MOTHER', label: 'Mother', sequence: 6, isSystem: true },
  { category: 'relation_type', code: 'BROTHER', label: 'Brother', sequence: 7, isSystem: true },
  { category: 'relation_type', code: 'SISTER', label: 'Sister', sequence: 8, isSystem: true },
  { category: 'relation_type', code: 'UNCLE', label: 'Uncle', sequence: 9, isSystem: true },
  { category: 'relation_type', code: 'AUNT', label: 'Aunt', sequence: 10, isSystem: true },
  { category: 'relation_type', code: 'GRANDFATHER', label: 'Grandfather', sequence: 11, isSystem: true },
  { category: 'relation_type', code: 'GRANDMOTHER', label: 'Grandmother', sequence: 12, isSystem: true },
  { category: 'relation_type', code: 'OTHER', label: 'Other', sequence: 13, isDefault: true, isSystem: true },

  // ==================== DEV_CATEGORY ====================
  { category: 'dev_category', code: 'INFRASTRUCTURE', label: 'Infrastructure', colorCode: '#3B82F6', sequence: 1, isDefault: true, isSystem: true },
  { category: 'dev_category', code: 'CONSTRUCTION', label: 'Construction', colorCode: '#F59E0B', sequence: 2, isSystem: true },
  { category: 'dev_category', code: 'LEGAL', label: 'Legal', colorCode: '#8B5CF6', sequence: 3, isSystem: true },
  { category: 'dev_category', code: 'PLANNING', label: 'Planning', colorCode: '#6366F1', sequence: 4, isSystem: true },
  { category: 'dev_category', code: 'SERVICES', label: 'Services', colorCode: '#14B8A6', sequence: 5, isSystem: true },
  { category: 'dev_category', code: 'COMPLETION', label: 'Completion', colorCode: '#10B981', sequence: 6, isSystem: true },

  // ==================== DEV_PHASE ====================
  { category: 'dev_phase', code: 'PRE_CONSTRUCTION', label: 'Pre-Construction', colorCode: '#3B82F6', sequence: 1, isDefault: true, isSystem: true },
  { category: 'dev_phase', code: 'CONSTRUCTION', label: 'Construction', colorCode: '#F59E0B', sequence: 2, isSystem: true },
  { category: 'dev_phase', code: 'POST_CONSTRUCTION', label: 'Post-Construction', colorCode: '#8B5CF6', sequence: 3, isSystem: true },
  { category: 'dev_phase', code: 'COMPLETION', label: 'Completion', colorCode: '#10B981', sequence: 4, isSystem: true },

  // ==================== FACILITY_TYPE ====================
  { category: 'facility_type', code: 'COMMUNITY_HALL', label: 'Community Hall', colorCode: '#3B82F6', sequence: 1, isDefault: true, isSystem: true },
  { category: 'facility_type', code: 'SWIMMING_POOL', label: 'Swimming Pool', colorCode: '#06B6D4', sequence: 2, isSystem: true },
  { category: 'facility_type', code: 'GYM', label: 'Gym', colorCode: '#EF4444', sequence: 3, isSystem: true },
  { category: 'facility_type', code: 'SPORTS_COURT', label: 'Sports Court', colorCode: '#10B981', sequence: 4, isSystem: true },
  { category: 'facility_type', code: 'PARK', label: 'Park', colorCode: '#84CC16', sequence: 5, isSystem: true },
  { category: 'facility_type', code: 'BBQ_AREA', label: 'BBQ Area', colorCode: '#F97316', sequence: 6, isSystem: true },
  { category: 'facility_type', code: 'MEETING_ROOM', label: 'Meeting Room', colorCode: '#8B5CF6', sequence: 7, isSystem: true },
  { category: 'facility_type', code: 'PARKING', label: 'Parking', colorCode: '#6B7280', sequence: 8, isSystem: true },
  { category: 'facility_type', code: 'OTHER', label: 'Other', colorCode: '#9CA3AF', sequence: 9, isSystem: true },

  // ==================== BOOKING_STATUS ====================
  { category: 'booking_status', code: 'PENDING', label: 'Pending', colorCode: '#F59E0B', sequence: 1, isDefault: true, isSystem: true },
  { category: 'booking_status', code: 'CONFIRMED', label: 'Confirmed', colorCode: '#10B981', sequence: 2, isSystem: true },
  { category: 'booking_status', code: 'CANCELLED', label: 'Cancelled', colorCode: '#EF4444', sequence: 3, isSystem: true },
  { category: 'booking_status', code: 'COMPLETED', label: 'Completed', colorCode: '#6B7280', sequence: 4, isSystem: true },
  { category: 'booking_status', code: 'NO_SHOW', label: 'No Show', colorCode: '#DC2626', sequence: 5, isSystem: true },
  { category: 'booking_status', code: 'REJECTED', label: 'Rejected', colorCode: '#F43F5E', sequence: 6, isSystem: true },
];

/**
 * Seeds lookup values into the database.
 * Checks if values already exist (by category+code) and only inserts missing values.
 * Uses a system user ID for createdBy.
 * Logs count of created vs skipped.
 */
export async function seedLookupValues(): Promise<void> {
  try {
    console.log('Seeding lookup values...');
    const result = await lookupValueService.seed(SEED_DATA);
    console.log(
      `Lookup values seeding complete: ${result.created} created, ${result.skipped} skipped (already existed)`
    );

    if (result.created > 0) {
      logger.info(`Lookup values seeded: ${result.created} created, ${result.skipped} skipped`);
    }
  } catch (error: any) {
    console.error('Error seeding lookup values:', error.message);
    logger.error('Failed to seed lookup values:', error);
    // Don't throw - seeding failure should not prevent app startup
  }
}
