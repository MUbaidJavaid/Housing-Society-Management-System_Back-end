import { Types } from 'mongoose';
import Facility from '../models/models-facility';
import FacilityBooking from '../models/models-facility-booking';
import {
  AvailabilityResult,
  BookingQueryParams,
  BookingStats,
  CreateBookingDto,
  FacilityBookingPlainType,
  GetBookingsResult,
  TimeSlot,
} from '../types/types-facility-booking';

const toPlainObject = (doc: any): FacilityBookingPlainType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;
  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }
  return plainObj as FacilityBookingPlainType;
};

/**
 * Parse HH:mm string to total minutes from midnight
 */
const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Convert minutes from midnight to HH:mm string
 */
const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const facilityBookingService = {
  /**
   * Create a new booking
   */
  async createBooking(
    data: CreateBookingDto,
    userId: Types.ObjectId
  ): Promise<FacilityBookingPlainType> {
    // Validate facility exists and is active
    const facility = await Facility.findById(data.facilityId);
    if (!facility || facility.isDeleted || !facility.isActive) {
      throw new Error('Facility not found or inactive');
    }

    // Validate booking date is in the future
    const bookingDate = new Date(data.bookingDate);
    const now = new Date();
    bookingDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      throw new Error('Booking date cannot be in the past');
    }

    // Validate max advance booking days
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + facility.maxAdvanceBookingDays);
    maxDate.setHours(23, 59, 59, 999);
    if (bookingDate > maxDate) {
      throw new Error(
        `Booking cannot be made more than ${facility.maxAdvanceBookingDays} days in advance`
      );
    }

    // Validate minimum advance booking hours
    if (facility.minAdvanceBookingHours > 0) {
      const bookingDateTime = new Date(data.bookingDate);
      const [startH, startM] = data.startTime.split(':').map(Number);
      bookingDateTime.setHours(startH, startM, 0, 0);
      const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursUntilBooking < facility.minAdvanceBookingHours) {
        throw new Error(
          `Booking must be made at least ${facility.minAdvanceBookingHours} hours in advance`
        );
      }
    }

    // Validate start time < end time
    if (timeToMinutes(data.startTime) >= timeToMinutes(data.endTime)) {
      throw new Error('Start time must be before end time');
    }

    // Check capacity
    if (data.numberOfGuests && facility.capacity && data.numberOfGuests > facility.capacity) {
      throw new Error(`Number of guests exceeds facility capacity of ${facility.capacity}`);
    }

    // Check operating hours
    const dayOfWeek = bookingDate.getDay();
    const operatingDay = facility.operatingHours.find(oh => oh.dayOfWeek === dayOfWeek);
    if (operatingDay) {
      if (operatingDay.isClosed) {
        throw new Error('Facility is closed on this day');
      }
      const startMin = timeToMinutes(data.startTime);
      const endMin = timeToMinutes(data.endTime);
      const openMin = timeToMinutes(operatingDay.openTime);
      const closeMin = timeToMinutes(operatingDay.closeTime);
      if (startMin < openMin || endMin > closeMin) {
        throw new Error(
          `Booking time must be within operating hours: ${operatingDay.openTime} - ${operatingDay.closeTime}`
        );
      }
    }

    // Check availability
    const availability = await this.checkAvailability(
      data.facilityId,
      data.bookingDate,
      data.startTime,
      data.endTime
    );

    if (!availability.available) {
      throw new Error('Time slot is not available. There are conflicting bookings.');
    }

    // Calculate amount
    const durationMinutes = timeToMinutes(data.endTime) - timeToMinutes(data.startTime);
    let totalAmount = 0;
    if (durationMinutes >= 480 && facility.fullDayRate > 0) {
      totalAmount = facility.fullDayRate;
    } else if (durationMinutes >= 240 && facility.halfDayRate > 0) {
      totalAmount = facility.halfDayRate;
    } else if (facility.hourlyRate > 0) {
      totalAmount = (durationMinutes / 60) * facility.hourlyRate;
    }

    const bookingData = {
      facilityId: new Types.ObjectId(data.facilityId),
      memberId: new Types.ObjectId(data.memberId),
      bookingDate: bookingDate,
      startTime: data.startTime,
      endTime: data.endTime,
      purpose: data.purpose,
      numberOfGuests: data.numberOfGuests || 1,
      totalAmount: Math.round(totalAmount * 100) / 100,
      depositAmount: facility.securityDeposit,
      status: facility.requiresApproval ? ('Pending' as const) : ('Confirmed' as const),
      societyId: data.societyId ? new Types.ObjectId(data.societyId) : facility.societyId,
      remarks: data.remarks,
      createdBy: userId,
      modifiedBy: userId,
    };

    const booking = await FacilityBooking.create(bookingData);

    const created = await FacilityBooking.findById(booking._id)
      .populate('facilityId', 'facilityName facilityCode facilityType')
      .populate('memberId', 'memName memNic memPhone')
      .populate('createdBy', 'userName fullName');

    if (!created) {
      throw new Error('Failed to create booking');
    }

    return toPlainObject(created);
  },

  /**
   * Check availability for a facility on a given date/time
   */
  async checkAvailability(
    facilityId: string,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<AvailabilityResult> {
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    const conflicts = await FacilityBooking.find({
      facilityId: new Types.ObjectId(facilityId),
      bookingDate: bookingDate,
      status: { $in: ['Pending', 'Confirmed'] },
      isDeleted: false,
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        },
      ],
    })
      .select('bookingCode startTime endTime status')
      .lean();

    return {
      available: conflicts.length === 0,
      conflicts: conflicts.map(c => ({
        bookingCode: c.bookingCode,
        startTime: c.startTime,
        endTime: c.endTime,
        status: c.status,
      })),
    };
  },

  /**
   * Get available time slots for a facility on a given date
   */
  async getAvailableSlots(facilityId: string, date: string): Promise<TimeSlot[]> {
    const facility = await Facility.findById(facilityId);
    if (!facility || facility.isDeleted || !facility.isActive) {
      throw new Error('Facility not found or inactive');
    }

    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);
    const dayOfWeek = bookingDate.getDay();

    // Get operating hours for this day
    const operatingDay = facility.operatingHours.find(oh => oh.dayOfWeek === dayOfWeek);
    if (!operatingDay || operatingDay.isClosed) {
      return [];
    }

    const openMinutes = timeToMinutes(operatingDay.openTime);
    const closeMinutes = timeToMinutes(operatingDay.closeTime);
    const slotDuration = facility.slotDurationMinutes;

    // Get existing bookings for this date
    const existingBookings = await FacilityBooking.find({
      facilityId: new Types.ObjectId(facilityId),
      bookingDate: bookingDate,
      status: { $in: ['Pending', 'Confirmed'] },
      isDeleted: false,
    })
      .select('startTime endTime')
      .lean();

    const slots: TimeSlot[] = [];
    let currentMinutes = openMinutes;

    while (currentMinutes + slotDuration <= closeMinutes) {
      const slotStart = minutesToTime(currentMinutes);
      const slotEnd = minutesToTime(currentMinutes + slotDuration);

      // Check if this slot conflicts with any existing booking
      const hasConflict = existingBookings.some(booking => {
        const bookingStart = timeToMinutes(booking.startTime);
        const bookingEnd = timeToMinutes(booking.endTime);
        return currentMinutes < bookingEnd && currentMinutes + slotDuration > bookingStart;
      });

      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        available: !hasConflict,
      });

      currentMinutes += slotDuration;
    }

    return slots;
  },

  /**
   * Approve a pending booking
   */
  async approveBooking(
    id: string,
    staffUserId: Types.ObjectId
  ): Promise<FacilityBookingPlainType | null> {
    const booking = await FacilityBooking.findById(id);
    if (!booking || booking.isDeleted) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'Pending') {
      throw new Error('Only pending bookings can be approved');
    }

    const updated = await FacilityBooking.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'Confirmed',
          approvedBy: staffUserId,
          approvedAt: new Date(),
          modifiedBy: staffUserId,
        },
      },
      { new: true }
    )
      .populate('facilityId', 'facilityName facilityCode facilityType')
      .populate('memberId', 'memName memNic memPhone')
      .populate('approvedBy', 'userName fullName');

    return updated ? toPlainObject(updated) : null;
  },

  /**
   * Cancel a booking with deposit refund logic
   */
  async cancelBooking(
    id: string,
    reason: string,
    userId: Types.ObjectId
  ): Promise<FacilityBookingPlainType | null> {
    const booking = await FacilityBooking.findById(id);
    if (!booking || booking.isDeleted) {
      throw new Error('Booking not found');
    }

    if (['Cancelled', 'Completed'].includes(booking.status)) {
      throw new Error(`Booking is already ${booking.status.toLowerCase()}`);
    }

    // Determine deposit refund eligibility
    let depositRefunded = false;
    let depositRefundedAt: Date | undefined;

    if (booking.depositAmount > 0 && booking.paymentStatus === 'paid') {
      const facility = await Facility.findById(booking.facilityId);
      if (facility) {
        const bookingDateTime = new Date(booking.bookingDate);
        const [startH, startM] = booking.startTime.split(':').map(Number);
        bookingDateTime.setHours(startH, startM, 0, 0);
        const hoursUntilBooking =
          (bookingDateTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);

        if (hoursUntilBooking >= facility.cancellationPolicyHours) {
          depositRefunded = true;
          depositRefundedAt = new Date();
        }
      }
    }

    const updated = await FacilityBooking.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'Cancelled',
          cancellationReason: reason,
          cancelledAt: new Date(),
          depositRefunded,
          depositRefundedAt,
          paymentStatus: depositRefunded ? 'refunded' : booking.paymentStatus,
          modifiedBy: userId,
        },
      },
      { new: true }
    )
      .populate('facilityId', 'facilityName facilityCode facilityType')
      .populate('memberId', 'memName memNic memPhone');

    return updated ? toPlainObject(updated) : null;
  },

  /**
   * Mark a booking as completed
   */
  async completeBooking(
    id: string,
    userId: Types.ObjectId
  ): Promise<FacilityBookingPlainType | null> {
    const booking = await FacilityBooking.findById(id);
    if (!booking || booking.isDeleted) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'Confirmed') {
      throw new Error('Only confirmed bookings can be completed');
    }

    // Refund deposit on completion
    const updateData: any = {
      status: 'Completed',
      modifiedBy: userId,
    };

    if (booking.depositAmount > 0 && !booking.depositRefunded) {
      updateData.depositRefunded = true;
      updateData.depositRefundedAt = new Date();
    }

    const updated = await FacilityBooking.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
      .populate('facilityId', 'facilityName facilityCode facilityType')
      .populate('memberId', 'memName memNic memPhone');

    return updated ? toPlainObject(updated) : null;
  },

  /**
   * Get all bookings with pagination
   */
  async getBookings(params: BookingQueryParams): Promise<GetBookingsResult> {
    const {
      page = 1,
      limit = 20,
      facilityId,
      memberId,
      status,
      paymentStatus,
      fromDate,
      toDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { isDeleted: false };

    if (facilityId) {
      query.facilityId = new Types.ObjectId(facilityId);
    }

    if (memberId) {
      query.memberId = new Types.ObjectId(memberId);
    }

    if (status) {
      query.status = status;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (fromDate || toDate) {
      query.bookingDate = {};
      if (fromDate) {
        query.bookingDate.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.bookingDate.$lte = new Date(toDate);
      }
    }

    const [bookings, total] = await Promise.all([
      FacilityBooking.find(query)
        .populate('facilityId', 'facilityName facilityCode facilityType')
        .populate('memberId', 'memName memNic memPhone')
        .populate('approvedBy', 'userName fullName')
        .populate('createdBy', 'userName fullName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      FacilityBooking.countDocuments(query),
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get bookings by member
   */
  async getBookingsByMember(
    memberId: string,
    params: BookingQueryParams
  ): Promise<GetBookingsResult> {
    return this.getBookings({ ...params, memberId });
  },

  /**
   * Get bookings by facility
   */
  async getBookingsByFacility(
    facilityId: string,
    params: BookingQueryParams
  ): Promise<GetBookingsResult> {
    return this.getBookings({ ...params, facilityId });
  },

  /**
   * Get booking by ID
   */
  async getBookingById(id: string): Promise<FacilityBookingPlainType> {
    const booking = await FacilityBooking.findById(id)
      .populate('facilityId', 'facilityName facilityCode facilityType location capacity hourlyRate halfDayRate fullDayRate securityDeposit currency')
      .populate('memberId', 'memName memNic memPhone memEmail')
      .populate('approvedBy', 'userName fullName')
      .populate('createdBy', 'userName fullName')
      .populate('modifiedBy', 'userName fullName');

    if (!booking || booking.isDeleted) {
      throw new Error('Booking not found');
    }

    return toPlainObject(booking);
  },

  /**
   * Get booking stats / dashboard metrics
   */
  async getBookingStats(filters?: {
    facilityId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<BookingStats> {
    const matchQuery: any = { isDeleted: false };

    if (filters?.facilityId) {
      matchQuery.facilityId = new Types.ObjectId(filters.facilityId);
    }

    if (filters?.fromDate || filters?.toDate) {
      matchQuery.bookingDate = {};
      if (filters?.fromDate) {
        matchQuery.bookingDate.$gte = new Date(filters.fromDate);
      }
      if (filters?.toDate) {
        matchQuery.bookingDate.$lte = new Date(filters.toDate);
      }
    }

    const stats = await FacilityBooking.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          pendingBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] },
          },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'Confirmed'] }, 1, 0] },
          },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] },
          },
          rejectedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] },
          },
          noShowBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'NoShow'] }, 1, 0] },
          },
          totalRevenue: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Confirmed', 'Completed']] },
                '$totalAmount',
                0,
              ],
            },
          },
          totalDeposits: { $sum: '$depositAmount' },
          refundedDeposits: {
            $sum: {
              $cond: [{ $eq: ['$depositRefunded', true] }, '$depositAmount', 0],
            },
          },
        },
      },
    ]);

    const facilityStats = await FacilityBooking.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'facilities',
          localField: 'facilityId',
          foreignField: '_id',
          as: 'facility',
        },
      },
      { $unwind: '$facility' },
      {
        $group: {
          _id: '$facility.facilityName',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const statusStats = await FacilityBooking.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const baseStats = stats[0] || {
      totalBookings: 0,
      pendingBookings: 0,
      confirmedBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      rejectedBookings: 0,
      noShowBookings: 0,
      totalRevenue: 0,
      totalDeposits: 0,
      refundedDeposits: 0,
    };

    const byFacility: Record<string, number> = {};
    facilityStats.forEach(stat => {
      byFacility[stat._id] = stat.count;
    });

    const byStatus: Record<string, number> = {};
    statusStats.forEach(stat => {
      byStatus[stat._id] = stat.count;
    });

    return {
      ...baseStats,
      byFacility,
      byStatus,
    };
  },
};
