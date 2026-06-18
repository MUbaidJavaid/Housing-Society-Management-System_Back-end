import { Types } from 'mongoose';
import Attendance from '../models/models-attendance';
import Geofence from '../models/models-geofence';
import {
  AttendanceQueryParams,
  AttendanceSummary,
  CreateGeofenceDto,
  LocationDto,
  SocietySummary,
  UpdateGeofenceDto,
} from '../types/types-attendance';

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const attendanceService = {
  /**
   * Check in a staff member
   */
  async checkIn(
    staffId: Types.ObjectId,
    societyId: string,
    location: LocationDto,
    geofenceId?: string,
    shiftName?: string
  ): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existing = await Attendance.findOne({
      staffId,
      date: today,
      isDeleted: false,
    });

    if (existing) {
      throw new Error('Already checked in for today');
    }

    let withinGeofence = false;
    let resolvedGeofenceId: Types.ObjectId | undefined;

    if (geofenceId) {
      withinGeofence = await attendanceService.isWithinGeofence(
        location.latitude,
        location.longitude,
        geofenceId
      );
      resolvedGeofenceId = new Types.ObjectId(geofenceId);
    }

    const attendance = await Attendance.create({
      staffId,
      societyId: new Types.ObjectId(societyId),
      date: today,
      checkInTime: new Date(),
      checkInLocation: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      },
      isWithinGeofence: withinGeofence,
      geofenceId: resolvedGeofenceId,
      shiftName,
      status: 'present',
    });

    const record = await Attendance.findById(attendance._id)
      .populate('staffId', 'firstName lastName email')
      .populate('societyId', 'name');

    return record;
  },

  /**
   * Check out a staff member
   */
  async checkOut(
    staffId: Types.ObjectId,
    location: LocationDto
  ): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      staffId,
      date: today,
      isDeleted: false,
      checkOutTime: { $exists: false },
    });

    if (!attendance) {
      throw new Error('No active check-in found for today');
    }

    const checkOutTime = new Date();
    const checkInTime = attendance.checkInTime;
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    const standardHours = 8;
    const overtimeHours = totalHours > standardHours
      ? parseFloat((totalHours - standardHours).toFixed(2))
      : 0;

    // Determine status based on hours
    let status = attendance.status;
    if (totalHours < 4) {
      status = 'half-day';
    }

    const updated = await Attendance.findByIdAndUpdate(
      attendance._id,
      {
        $set: {
          checkOutTime,
          checkOutLocation: {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
          },
          totalHours,
          overtimeHours,
          status,
        },
      },
      { new: true }
    )
      .populate('staffId', 'firstName lastName email')
      .populate('societyId', 'name');

    return updated;
  },

  /**
   * Get attendance records with pagination and filters
   */
  async getAttendance(params: AttendanceQueryParams): Promise<{
    records: any[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const {
      page = 1,
      limit = 20,
      staffId,
      societyId,
      status,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { isDeleted: false };

    if (staffId) {
      query.staffId = new Types.ObjectId(staffId);
    }
    if (societyId) {
      query.societyId = new Types.ObjectId(societyId);
    }
    if (status) {
      query.status = status;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const [records, total] = await Promise.all([
      Attendance.find(query)
        .populate('staffId', 'firstName lastName email')
        .populate('societyId', 'name')
        .skip(skip)
        .limit(limit)
        .sort(sort),
      Attendance.countDocuments(query),
    ]);

    return {
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get attendance by ID
   */
  async getAttendanceById(id: string): Promise<any> {
    const attendance = await Attendance.findById(id)
      .populate('staffId', 'firstName lastName email')
      .populate('societyId', 'name')
      .populate('geofenceId', 'name latitude longitude radius');

    if (!attendance || attendance.isDeleted) {
      throw new Error('Attendance record not found');
    }

    return attendance;
  },

  /**
   * Get monthly summary for a staff member
   */
  async getSummary(
    staffId: string,
    month: number,
    year: number
  ): Promise<AttendanceSummary> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const records = await Attendance.find({
      staffId: new Types.ObjectId(staffId),
      date: { $gte: startDate, $lte: endDate },
      isDeleted: false,
    }).lean();

    const summary: AttendanceSummary = {
      staffId,
      month,
      year,
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      leave: 0,
      holiday: 0,
      totalHours: 0,
      overtimeHours: 0,
    };

    for (const record of records) {
      switch (record.status) {
        case 'present':
          summary.present++;
          break;
        case 'absent':
          summary.absent++;
          break;
        case 'late':
          summary.late++;
          break;
        case 'half-day':
          summary.halfDay++;
          break;
        case 'leave':
          summary.leave++;
          break;
        case 'holiday':
          summary.holiday++;
          break;
      }
      summary.totalHours += record.totalHours || 0;
      summary.overtimeHours += record.overtimeHours || 0;
    }

    summary.totalHours = parseFloat(summary.totalHours.toFixed(2));
    summary.overtimeHours = parseFloat(summary.overtimeHours.toFixed(2));

    return summary;
  },

  /**
   * Get society-wide attendance summary for a given date
   */
  async getSocietySummary(
    societyId: string,
    date: string
  ): Promise<SocietySummary> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const records = await Attendance.find({
      societyId: new Types.ObjectId(societyId),
      date: { $gte: targetDate, $lt: nextDay },
      isDeleted: false,
    })
      .populate('staffId', 'firstName lastName email')
      .lean();

    const presentCount = records.filter(
      (r) => r.status === 'present' || r.status === 'late'
    ).length;
    const absentCount = records.filter((r) => r.status === 'absent').length;
    const lateCount = records.filter((r) => r.status === 'late').length;

    return {
      societyId,
      date: targetDate.toISOString().split('T')[0],
      totalStaff: records.length,
      presentCount,
      absentCount,
      lateCount,
      records,
    };
  },

  /**
   * Create a geofence
   */
  async createGeofence(
    data: CreateGeofenceDto,
    userId: Types.ObjectId
  ): Promise<any> {
    const geofence = await Geofence.create({
      name: data.name,
      societyId: new Types.ObjectId(data.societyId),
      latitude: data.latitude,
      longitude: data.longitude,
      radius: data.radius || 100,
      createdBy: userId,
    });

    return geofence;
  },

  /**
   * Get geofences for a society
   */
  async getGeofences(societyId: string): Promise<any[]> {
    const geofences = await Geofence.find({
      societyId: new Types.ObjectId(societyId),
      isDeleted: false,
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return geofences;
  },

  /**
   * Update a geofence
   */
  async updateGeofence(
    id: string,
    data: UpdateGeofenceDto,
    _userId: Types.ObjectId
  ): Promise<any> {
    const geofence = await Geofence.findById(id);
    if (!geofence || geofence.isDeleted) {
      throw new Error('Geofence not found');
    }

    const updated = await Geofence.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');

    return updated;
  },

  /**
   * Soft delete a geofence
   */
  async deleteGeofence(id: string, _userId: Types.ObjectId): Promise<boolean> {
    const geofence = await Geofence.findById(id);
    if (!geofence || geofence.isDeleted) {
      throw new Error('Geofence not found');
    }

    await Geofence.findByIdAndUpdate(id, {
      $set: { isDeleted: true, deletedAt: new Date(), isActive: false },
    });

    return true;
  },

  /**
   * Check if coordinates are within a geofence
   */
  async isWithinGeofence(
    lat: number,
    lng: number,
    geofenceId: string
  ): Promise<boolean> {
    const geofence = await Geofence.findById(geofenceId);
    if (!geofence || geofence.isDeleted || !geofence.isActive) {
      throw new Error('Geofence not found or inactive');
    }

    const distance = calculateDistance(
      lat,
      lng,
      geofence.latitude,
      geofence.longitude
    );

    return distance <= geofence.radius;
  },
};
