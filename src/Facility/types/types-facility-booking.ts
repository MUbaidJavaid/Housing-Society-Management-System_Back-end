import { Types } from 'mongoose';
import { BookingStatusEnum, PaymentStatusEnum } from '../models/models-facility-booking';

export interface FacilityBookingPlainType {
  _id: Types.ObjectId;
  facilityId: Types.ObjectId;
  memberId: Types.ObjectId;
  bookingCode: string;
  bookingDate: Date;
  startTime: string;
  endTime: string;
  duration: number;
  purpose?: string;
  numberOfGuests: number;
  totalAmount: number;
  depositAmount: number;
  depositRefunded: boolean;
  depositRefundedAt?: Date;
  paymentStatus: PaymentStatusEnum;
  paymentReference?: string;
  status: BookingStatusEnum;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  cancellationReason?: string;
  cancelledAt?: Date;
  remarks?: string;
  societyId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  facility?: any;
  member?: any;
}

export interface CreateBookingDto {
  facilityId: string;
  memberId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  purpose?: string;
  numberOfGuests?: number;
  remarks?: string;
  societyId?: string;
}

export interface BookingQueryParams {
  page?: number;
  limit?: number;
  facilityId?: string;
  memberId?: string;
  status?: BookingStatusEnum;
  paymentStatus?: PaymentStatusEnum;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetBookingsResult {
  bookings: FacilityBookingPlainType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AvailabilityResult {
  available: boolean;
  conflicts: Array<{
    bookingCode: string;
    startTime: string;
    endTime: string;
    status: string;
  }>;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface BookingStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  rejectedBookings: number;
  noShowBookings: number;
  totalRevenue: number;
  totalDeposits: number;
  refundedDeposits: number;
  byFacility: Record<string, number>;
  byStatus: Record<string, number>;
}
