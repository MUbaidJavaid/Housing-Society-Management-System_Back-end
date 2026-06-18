import { Types } from 'mongoose';
import { AppError } from '../../middleware/error.middleware';
import ParkingSpot, { SpotStatus } from '../models/models-parking';
import ParkingPass, { PassStatus } from '../models/models-parking-pass';
import {
  AssignSpotDto,
  CreateSpotDto,
  GetPassesResult,
  GetSpotsResult,
  IssuePassDto,
  ParkingPassType,
  ParkingSpotType,
  ParkingStats,
  PassQueryParams,
  SpotQueryParams,
  UpdateSpotDto,
} from '../types/types-parking';

const toPlainObject = (doc: any): any => {
  const plainObj = doc.toObject ? doc.toObject() : doc;
  if (!plainObj.createdAt && doc.createdAt) plainObj.createdAt = doc.createdAt;
  if (!plainObj.updatedAt && doc.updatedAt) plainObj.updatedAt = doc.updatedAt;
  return plainObj;
};

const spotPopulateFields = [
  { path: 'societyId', select: 'name' },
  { path: 'blockId', select: 'name blockNo' },
  { path: 'assignedTo', select: 'memName memContEmail memContMob' },
  { path: 'assignedPlotId', select: 'plotNo sectorNo blockNo size' },
  { path: 'createdBy', select: 'firstName lastName email' },
];

const passPopulateFields = [
  { path: 'societyId', select: 'name' },
  { path: 'spotId', select: 'spotNumber location spotType' },
  { path: 'issuedBy', select: 'firstName lastName email' },
  { path: 'authorizedBy', select: 'memName memContEmail memContMob' },
];

export const parkingService = {
  // ── Spot Operations ──

  async createSpot(data: CreateSpotDto, userId: Types.ObjectId): Promise<ParkingSpotType> {
    const spotData: any = {
      ...data,
      societyId: new Types.ObjectId(data.societyId),
      blockId: data.blockId ? new Types.ObjectId(data.blockId) : undefined,
      assignedTo: data.assignedTo ? new Types.ObjectId(data.assignedTo) : undefined,
      assignedPlotId: data.assignedPlotId ? new Types.ObjectId(data.assignedPlotId) : undefined,
      createdBy: userId,
    };

    const spot = await ParkingSpot.create(spotData);
    const populated = await ParkingSpot.findById(spot._id).populate(spotPopulateFields);

    if (!populated) {
      throw new AppError(500, 'Failed to create parking spot');
    }

    return toPlainObject(populated);
  },

  async getSpots(params: SpotQueryParams): Promise<GetSpotsResult> {
    const {
      page = 1,
      limit = 20,
      search,
      societyId,
      spotType,
      status,
      isOccupied,
      isAvailableForRent,
      blockId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const query: any = { isDeleted: false };

    if (search) {
      query.$or = [
        { spotNumber: { $regex: search, $options: 'i' } },
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    if (societyId) query.societyId = new Types.ObjectId(societyId);
    if (spotType) query.spotType = spotType;
    if (status) query.status = status;
    if (isOccupied !== undefined) query.isOccupied = isOccupied;
    if (isAvailableForRent !== undefined) query.isAvailableForRent = isAvailableForRent;
    if (blockId) query.blockId = new Types.ObjectId(blockId);

    const skip = (page - 1) * limit;
    const sortObj: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [spots, total] = await Promise.all([
      ParkingSpot.find(query)
        .populate(spotPopulateFields)
        .sort(sortObj)
        .skip(skip)
        .limit(limit),
      ParkingSpot.countDocuments(query),
    ]);

    return {
      items: spots.map(toPlainObject),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getSpotById(id: string): Promise<ParkingSpotType | null> {
    const spot = await ParkingSpot.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    }).populate(spotPopulateFields);

    if (!spot) return null;
    return toPlainObject(spot);
  },

  async updateSpot(id: string, data: UpdateSpotDto, _userId: Types.ObjectId): Promise<ParkingSpotType | null> {
    const updateData: any = { ...data };

    if (data.blockId) {
      updateData.blockId = new Types.ObjectId(data.blockId);
    }

    const spot = await ParkingSpot.findOneAndUpdate(
      { _id: new Types.ObjectId(id), isDeleted: false },
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate(spotPopulateFields);

    if (!spot) return null;
    return toPlainObject(spot);
  },

  async deleteSpot(id: string, _userId: Types.ObjectId): Promise<ParkingSpotType | null> {
    const spot = await ParkingSpot.findOneAndUpdate(
      { _id: new Types.ObjectId(id), isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!spot) return null;
    return toPlainObject(spot);
  },

  async assignSpot(spotId: string, data: AssignSpotDto, _userId: Types.ObjectId): Promise<ParkingSpotType | null> {
    const spot = await ParkingSpot.findOne({
      _id: new Types.ObjectId(spotId),
      isDeleted: false,
    });

    if (!spot) return null;

    if (spot.isOccupied && spot.assignedTo) {
      throw new AppError(400, 'Spot is already assigned. Unassign it first.');
    }

    if (spot.status !== SpotStatus.ACTIVE) {
      throw new AppError(400, `Cannot assign a spot with status "${spot.status}".`);
    }

    spot.assignedTo = new Types.ObjectId(data.memberId);
    spot.vehicleNumber = data.vehicleNumber;
    spot.assignedPlotId = data.plotId ? new Types.ObjectId(data.plotId) : undefined;
    spot.isOccupied = true;

    await spot.save();

    const populated = await ParkingSpot.findById(spot._id).populate(spotPopulateFields);
    return populated ? toPlainObject(populated) : null;
  },

  async unassignSpot(spotId: string, _userId: Types.ObjectId): Promise<ParkingSpotType | null> {
    const spot = await ParkingSpot.findOne({
      _id: new Types.ObjectId(spotId),
      isDeleted: false,
    });

    if (!spot) return null;

    if (!spot.assignedTo) {
      throw new AppError(400, 'Spot is not currently assigned.');
    }

    spot.assignedTo = undefined;
    spot.vehicleNumber = undefined;
    spot.assignedPlotId = undefined;
    spot.isOccupied = false;

    await spot.save();

    const populated = await ParkingSpot.findById(spot._id).populate(spotPopulateFields);
    return populated ? toPlainObject(populated) : null;
  },

  async toggleRentAvailability(spotId: string, price?: number): Promise<ParkingSpotType | null> {
    const spot = await ParkingSpot.findOne({
      _id: new Types.ObjectId(spotId),
      isDeleted: false,
    });

    if (!spot) return null;

    spot.isAvailableForRent = !spot.isAvailableForRent;
    if (spot.isAvailableForRent && price !== undefined) {
      spot.rentPrice = price;
    }
    if (!spot.isAvailableForRent) {
      spot.rentPrice = undefined;
    }

    await spot.save();

    const populated = await ParkingSpot.findById(spot._id).populate(spotPopulateFields);
    return populated ? toPlainObject(populated) : null;
  },

  // ── Pass Operations ──

  async issuePass(data: IssuePassDto, userId: Types.ObjectId): Promise<ParkingPassType> {
    const passData: any = {
      ...data,
      societyId: new Types.ObjectId(data.societyId),
      spotId: data.spotId ? new Types.ObjectId(data.spotId) : undefined,
      authorizedBy: data.authorizedBy ? new Types.ObjectId(data.authorizedBy) : undefined,
      validFrom: new Date(data.validFrom),
      validUntil: new Date(data.validUntil),
      issuedBy: userId,
    };

    const pass = await ParkingPass.create(passData);
    const populated = await ParkingPass.findById(pass._id).populate(passPopulateFields);

    if (!populated) {
      throw new AppError(500, 'Failed to issue parking pass');
    }

    return toPlainObject(populated);
  },

  async getPasses(params: PassQueryParams): Promise<GetPassesResult> {
    const {
      page = 1,
      limit = 20,
      search,
      societyId,
      purpose,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const query: any = { isDeleted: false };

    if (search) {
      query.$or = [
        { issuedTo: { $regex: search, $options: 'i' } },
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { passCode: { $regex: search, $options: 'i' } },
      ];
    }

    if (societyId) query.societyId = new Types.ObjectId(societyId);
    if (purpose) query.purpose = purpose;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const sortObj: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [passes, total] = await Promise.all([
      ParkingPass.find(query)
        .populate(passPopulateFields)
        .sort(sortObj)
        .skip(skip)
        .limit(limit),
      ParkingPass.countDocuments(query),
    ]);

    return {
      items: passes.map(toPlainObject),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getPassById(id: string): Promise<ParkingPassType | null> {
    const pass = await ParkingPass.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    }).populate(passPopulateFields);

    if (!pass) return null;
    return toPlainObject(pass);
  },

  async verifyPass(passCode: string): Promise<ParkingPassType | null> {
    const pass = await ParkingPass.findOne({
      passCode: passCode.toUpperCase(),
      isDeleted: false,
    }).populate(passPopulateFields);

    if (!pass) return null;

    // Check if pass is still valid
    const now = new Date();
    if (pass.status !== PassStatus.ACTIVE) {
      return null;
    }
    if (now > pass.validUntil) {
      pass.status = PassStatus.EXPIRED;
      await pass.save();
      return null;
    }

    return toPlainObject(pass);
  },

  async cancelPass(id: string, _userId: Types.ObjectId): Promise<ParkingPassType | null> {
    const pass = await ParkingPass.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    });

    if (!pass) return null;

    if (pass.status !== PassStatus.ACTIVE) {
      throw new AppError(400, `Cannot cancel a pass with status "${pass.status}".`);
    }

    pass.status = PassStatus.CANCELLED;
    await pass.save();

    const populated = await ParkingPass.findById(pass._id).populate(passPopulateFields);
    return populated ? toPlainObject(populated) : null;
  },

  async expireOldPasses(): Promise<number> {
    const now = new Date();

    const result = await ParkingPass.updateMany(
      {
        isDeleted: false,
        status: PassStatus.ACTIVE,
        validUntil: { $lt: now },
      },
      {
        $set: { status: PassStatus.EXPIRED },
      }
    );

    return result.modifiedCount;
  },

  // ── Stats ──

  async getParkingStats(societyId: string): Promise<ParkingStats> {
    const matchQuery: any = {
      isDeleted: false,
      societyId: new Types.ObjectId(societyId),
    };

    const [spotStats, spotTypeCounts, activePassCount] = await Promise.all([
      ParkingSpot.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalSpots: { $sum: 1 },
            occupiedSpots: { $sum: { $cond: ['$isOccupied', 1, 0] } },
            maintenanceSpots: {
              $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] },
            },
          },
        },
      ]),
      ParkingSpot.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$spotType', count: { $sum: 1 } } },
      ]),
      ParkingPass.countDocuments({
        isDeleted: false,
        societyId: new Types.ObjectId(societyId),
        status: PassStatus.ACTIVE,
        validUntil: { $gte: new Date() },
      }),
    ]);

    const stats = spotStats[0] || { totalSpots: 0, occupiedSpots: 0, maintenanceSpots: 0 };
    const bySpotType: Record<string, number> = {};
    spotTypeCounts.forEach((item: any) => {
      bySpotType[item._id] = item.count;
    });

    return {
      totalSpots: stats.totalSpots,
      occupiedSpots: stats.occupiedSpots,
      availableSpots: stats.totalSpots - stats.occupiedSpots - stats.maintenanceSpots,
      maintenanceSpots: stats.maintenanceSpots,
      activeVisitorPasses: activePassCount,
      bySpotType,
    };
  },
};
