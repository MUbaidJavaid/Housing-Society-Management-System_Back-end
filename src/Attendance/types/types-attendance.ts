export interface LocationDto {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface CheckInDto {
  staffId?: string;
  societyId: string;
  location: LocationDto;
  geofenceId?: string;
  shiftName?: string;
}

export interface CheckOutDto {
  staffId?: string;
  location: LocationDto;
}

export interface CreateGeofenceDto {
  name: string;
  societyId: string;
  latitude: number;
  longitude: number;
  radius?: number;
}

export interface UpdateGeofenceDto {
  name?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  isActive?: boolean;
}

export interface AttendanceQueryParams {
  page?: number;
  limit?: number;
  staffId?: string;
  societyId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AttendanceSummary {
  staffId: string;
  month: number;
  year: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  leave: number;
  holiday: number;
  totalHours: number;
  overtimeHours: number;
}

export interface SocietySummary {
  societyId: string;
  date: string;
  totalStaff: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  records: any[];
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
