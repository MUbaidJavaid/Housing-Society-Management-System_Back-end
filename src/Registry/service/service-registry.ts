import { Types } from 'mongoose';

import Member from '../../Member/models/models-member';
import Plot from '../../Plots/models/models-plot';
import Registry from '../models/models-registry';
import {
  CreateRegistryDto,
  GetRegistriesResult,
  RegistryQueryParams,
  RegistrySearchParams,
  RegistryStatistics,
  RegistryType,
  UpdateRegistryDto,
} from '../types/types-registry';

// Helper function to convert Mongoose document to plain object
const toPlainObject = (doc: any): RegistryType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;

  // Ensure timestamps are included
  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }

  return plainObj as RegistryType;
};

export const registryService = {
  /**
   * Create new registry
   */
  async createRegistry(data: CreateRegistryDto, userId: Types.ObjectId): Promise<RegistryType> {
    // Check if registry number already exists
    const existingRegistry = await Registry.findOne({
      registryNo: data.registryNo.toUpperCase(),
      isDeleted: false,
    });

    if (existingRegistry) {
      throw new Error('Registry number already exists');
    }

    // Check if mutation number already exists
    const existingMutation = await Registry.findOne({
      mutationNo: data.mutationNo.toUpperCase(),
      isDeleted: false,
    });

    if (existingMutation) {
      throw new Error('Mutation number already exists');
    }

    // Check if plot exists
    const plot = await Plot.findById(data.plotId);
    if (!plot || (plot as any).isDeleted) {
      throw new Error('Plot not found');
    }

    // Check if member exists
    const member = await Member.findById(data.memId);
    if (!member || (member as any).isDeleted) {
      throw new Error('Member not found');
    }

    const registryData = {
      ...data,
      registryNo: data.registryNo.toUpperCase(),
      mutationNo: data.mutationNo.toUpperCase(),
      isActive: true,
      registeredBy: userId,
      updatedBy: userId,
    };

    const registry = await Registry.create(registryData);

    // Populate and return the created registry
    const createdRegistry = await Registry.findById(registry._id)
      .populate({
        path: 'plotId',
        select: 'plotNo plotArea plotDimensions',
        populate: [
          { path: 'plotBlockId', select: 'plotBlockName' },
          { path: 'projectId', select: 'projName projCode' },
        ],
      })
      .populate('memId', 'memName memNic mobileNo')
      .populate('registeredBy', 'userName fullName designation')
      .populate('updatedBy', 'userName fullName designation');

    if (!createdRegistry) {
      throw new Error('Failed to create registry');
    }

    return toPlainObject(createdRegistry);
  },

  /**
   * Get registry by ID
   */
  async getRegistryById(id: string): Promise<RegistryType> {
    try {
      const registry = await Registry.findById(id)
        .populate({
        path: 'plotId',
        select: 'plotNo plotArea plotDimensions',
        populate: [
          { path: 'plotBlockId', select: 'plotBlockName' },
          { path: 'projectId', select: 'projName projCode' },
        ],
      })
        .populate('memId', 'memName memNic fatherName mobileNo email address')
        .populate('registeredBy', 'userName fullName designation')
        .populate('updatedBy', 'userName fullName designation')
        .populate('verifiedBy', 'userName fullName designation');

      if (!registry || registry.isDeleted) {
        throw new Error('Registry not found');
      }

      return toPlainObject(registry);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Invalid registry ID');
    }
  },

  /**
   * Find registry by ID (returns null if not found)
   */
  async findRegistryById(id: string): Promise<RegistryType | null> {
    try {
      const registry = await Registry.findById(id);

      if (!registry || registry.isDeleted) return null;
      return toPlainObject(registry);
    } catch (error) {
      return null;
    }
  },

  /**
   * Find registry by registry number
   */
  async findRegistryByNumber(registryNo: string): Promise<RegistryType | null> {
    const registry = await Registry.findOne({
      registryNo: registryNo.toUpperCase(),
      isDeleted: false,
    });

    if (!registry) return null;
    return toPlainObject(registry);
  },

  /**
   * Find registry by mutation number
   */
  async findRegistryByMutationNo(mutationNo: string): Promise<RegistryType | null> {
    const registry = await Registry.findOne({
      mutationNo: mutationNo.toUpperCase(),
      isDeleted: false,
    });

    if (!registry) return null;
    return toPlainObject(registry);
  },

  /**
   * Get registry by registry number
   */
  async getRegistryByNumber(registryNo: string): Promise<RegistryType | null> {
    const registry = await Registry.findOne({
      registryNo: registryNo.toUpperCase(),
      isDeleted: false,
    })
      .populate({
        path: 'plotId',
        select: 'plotNo plotArea plotDimensions',
        populate: [
          { path: 'plotBlockId', select: 'plotBlockName' },
          { path: 'projectId', select: 'projName projCode' },
        ],
      })
      .populate('memId', 'memName memNic mobileNo')
      .populate('registeredBy', 'userName fullName');

    if (!registry) return null;
    return toPlainObject(registry);
  },

  /**
   * Get registry by mutation number
   */
  async getRegistryByMutationNo(mutationNo: string): Promise<RegistryType | null> {
    const registry = await Registry.findOne({
      mutationNo: mutationNo.toUpperCase(),
      isDeleted: false,
    })
      .populate({
        path: 'plotId',
        select: 'plotNo plotArea plotDimensions',
        populate: [
          { path: 'plotBlockId', select: 'plotBlockName' },
          { path: 'projectId', select: 'projName projCode' },
        ],
      })
      .populate('memId', 'memName memNic mobileNo')
      .populate('registeredBy', 'userName fullName');

    if (!registry) return null;
    return toPlainObject(registry);
  },

  /**
   * Get all registries with pagination
   */
  async getRegistries(params: RegistryQueryParams): Promise<GetRegistriesResult> {
    const {
      page = 1,
      limit = 20,
      search,
      plotId,
      memId,
      registryNo,
      mutationNo,
      mozaVillage,
      khasraNo,
      khewatNo,
      khatoniNo,
      subRegistrarName,
      year,
      verificationStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // Build query
    const query: any = { isDeleted: false };

    // Search across registryNo, mutationNo, mozaVillage
    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { registryNo: { $regex: term, $options: 'i' } },
        { mutationNo: { $regex: term, $options: 'i' } },
        { mozaVillage: { $regex: term, $options: 'i' } },
      ];
    }

    // Filter by plot
    if (plotId) {
      query.plotId = new Types.ObjectId(plotId);
    }

    // Filter by member
    if (memId) {
      query.memId = new Types.ObjectId(memId);
    }

    // Filter by registry number
    if (registryNo) {
      query.registryNo = { $regex: registryNo.toUpperCase(), $options: 'i' };
    }

    // Filter by mutation number
    if (mutationNo) {
      query.mutationNo = { $regex: mutationNo.toUpperCase(), $options: 'i' };
    }

    // Filter by moza/village
    if (mozaVillage) {
      query.mozaVillage = { $regex: mozaVillage, $options: 'i' };
    }

    // Filter by khasra number
    if (khasraNo) {
      query.khasraNo = { $regex: khasraNo, $options: 'i' };
    }

    // Filter by khewat number
    if (khewatNo) {
      query.khewatNo = { $regex: khewatNo, $options: 'i' };
    }

    // Filter by khatoni number
    if (khatoniNo) {
      query.khatoniNo = { $regex: khatoniNo, $options: 'i' };
    }

    // Filter by sub-registrar name
    if (subRegistrarName) {
      query.subRegistrarName = { $regex: subRegistrarName, $options: 'i' };
    }

    // Filter by year
    if (year) {
      query.$expr = {
        $eq: [{ $year: '$createdAt' }, year],
      };
    }

    // Filter by verification status
    if (verificationStatus) {
      query.verificationStatus = verificationStatus;
    }

    // Execute queries - include summary counts for full dataset (respecting filters)
    const [registries, total, summaryCounts] = await Promise.all([
      Registry.find(query)
        .populate({
        path: 'plotId',
        select: 'plotNo plotArea plotDimensions',
        populate: [
          { path: 'plotBlockId', select: 'plotBlockName' },
          { path: 'projectId', select: 'projName projCode' },
        ],
      })
        .populate('memId', 'memName memNic')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      Registry.countDocuments(query),
      Registry.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalRegistries: { $sum: 1 },
            verifiedRegistries: {
              $sum: { $cond: [{ $eq: ['$verificationStatus', 'Verified'] }, 1, 0] },
            },
            pendingVerifications: {
              $sum: { $cond: [{ $eq: ['$verificationStatus', 'Pending'] }, 1, 0] },
            },
            rejectedRegistries: {
              $sum: { $cond: [{ $eq: ['$verificationStatus', 'Rejected'] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const aggSummary = summaryCounts[0] || {
      totalRegistries: 0,
      verifiedRegistries: 0,
      pendingVerifications: 0,
      rejectedRegistries: 0,
    };

    const summary = {
      totalRegistries: aggSummary.totalRegistries,
      verifiedRegistries: aggSummary.verifiedRegistries,
      pendingVerifications: aggSummary.pendingVerifications,
      rejectedRegistries: aggSummary.rejectedRegistries,
      totalAreaKanal: registries.reduce((sum, reg) => sum + (reg.areaKanal || 0), 0),
      totalAreaMarla: registries.reduce((sum, reg) => sum + (reg.areaMarla || 0), 0),
      totalAreaSqft: registries.reduce((sum, reg) => sum + (reg.areaSqft || 0), 0),
      byYear: {} as Record<string, number>,
    };

    // Count registries by year (from current page for display)
    registries.forEach(registry => {
      const year = new Date(registry.createdAt).getFullYear();
      summary.byYear[year] = (summary.byYear[year] || 0) + 1;
    });

    return {
      registries,
      summary,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Update registry
   */
  async updateRegistry(
    id: string,
    data: UpdateRegistryDto,
    userId: Types.ObjectId
  ): Promise<RegistryType | null> {
    // Check if registry exists
    const existingRegistry = await Registry.findById(id);
    if (!existingRegistry || existingRegistry.isDeleted) {
      throw new Error('Registry not found');
    }

    // If registry number is being updated, check for duplicates
    if (data.registryNo && data.registryNo !== existingRegistry.registryNo) {
      const duplicateRegistry = await Registry.findOne({
        registryNo: data.registryNo.toUpperCase(),
        isDeleted: false,
        _id: { $ne: id },
      });

      if (duplicateRegistry) {
        throw new Error('Registry number already exists');
      }
    }

    // If mutation number is being updated, check for duplicates
    if (data.mutationNo && data.mutationNo !== existingRegistry.mutationNo) {
      const duplicateMutation = await Registry.findOne({
        mutationNo: data.mutationNo.toUpperCase(),
        isDeleted: false,
        _id: { $ne: id },
      });

      if (duplicateMutation) {
        throw new Error('Mutation number already exists');
      }
    }

    // Check if plot exists (if being updated)
    if (data.plotId) {
      const plot = await Plot.findById(data.plotId);
      if (!plot || (plot as any).isDeleted) {
        throw new Error('Plot not found');
      }
    }

    // Check if member exists (if being updated)
    if (data.memId) {
      const member = await Member.findById(data.memId);
      if (!member || (member as any).isDeleted) {
        throw new Error('Member not found');
      }
    }

    const updateObj: any = {
      ...data,
      updatedBy: userId,
    };

    // Ensure uppercase for registry and mutation numbers
    if (updateObj.registryNo) {
      updateObj.registryNo = updateObj.registryNo.toUpperCase();
    }
    if (updateObj.mutationNo) {
      updateObj.mutationNo = updateObj.mutationNo.toUpperCase();
    }

    const registry = await Registry.findByIdAndUpdate(
      id,
      {
        $set: updateObj,
      },
      { new: true, runValidators: true }
    )
      .populate({
        path: 'plotId',
        select: 'plotNo plotArea plotDimensions',
        populate: [
          { path: 'plotBlockId', select: 'plotBlockName' },
          { path: 'projectId', select: 'projName projCode' },
        ],
      })
      .populate('memId', 'memName memNic mobileNo')
      .populate('registeredBy', 'userName fullName designation')
      .populate('updatedBy', 'userName fullName designation');

    return registry ? toPlainObject(registry) : null;
  },

  /**
   * Delete registry (soft delete)
   */
  async deleteRegistry(id: string, userId: Types.ObjectId): Promise<boolean> {
    const existingRegistry = await Registry.findById(id);
    if (!existingRegistry || existingRegistry.isDeleted) {
      throw new Error('Registry not found');
    }

    const result = await Registry.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          isActive: false,
          updatedBy: userId,
        },
      },
      { new: true }
    );

    return !!result;
  },

  /**
   * Get registries by plot
   */
  async getRegistriesByPlot(
    plotId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ registries: RegistryType[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const query = {
      plotId: new Types.ObjectId(plotId),
      isDeleted: false,
      isActive: true,
    };

    const [registries, total] = await Promise.all([
      Registry.find(query)
        .populate({
        path: 'plotId',
        select: 'plotNo plotArea plotDimensions',
        populate: [
          { path: 'plotBlockId', select: 'plotBlockName' },
          { path: 'projectId', select: 'projName projCode' },
        ],
      })
        .populate('memId', 'memName memNic mobileNo')
        .populate('registeredBy', 'userName fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      Registry.countDocuments(query),
    ]);

    return {
      registries,
      total,
      pages: Math.ceil(total / limit),
    };
  },

  /**
   * Get registries by member
   */
  async getRegistriesByMember(
    memId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ registries: RegistryType[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const query = {
      memId: new Types.ObjectId(memId),
      isDeleted: false,
      isActive: true,
    };

    const [registries, total] = await Promise.all([
      Registry.find(query)
        .populate({
        path: 'plotId',
        select: 'plotNo plotArea plotDimensions',
        populate: [
          { path: 'plotBlockId', select: 'plotBlockName' },
          { path: 'projectId', select: 'projName projCode' },
        ],
      })
        .populate('memId', 'memName memNic mobileNo')
        .populate('registeredBy', 'userName fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      Registry.countDocuments(query),
    ]);

    return {
      registries,
      total,
      pages: Math.ceil(total / limit),
    };
  },

  /**
   * Search registries
   */
  async searchRegistries(params: RegistrySearchParams): Promise<RegistryType[]> {
    const {
      searchTerm,
      registryNo,
      mutationNo,
      memId,
      plotId,
      mozaVillage,
      khasraNo,
      khewatNo,
      khatoniNo,
      limit = 10,
    } = params;

    // Build query
    const query: any = { isDeleted: false, isActive: true };

    // If search term provided, use text search
    if (searchTerm) {
      query.$text = { $search: searchTerm };
    } else {
      // Otherwise use specific field filters
      if (registryNo) {
        query.registryNo = { $regex: registryNo.toUpperCase(), $options: 'i' };
      }

      if (mutationNo) {
        query.mutationNo = { $regex: mutationNo.toUpperCase(), $options: 'i' };
      }

      if (memId) {
        query.memId = new Types.ObjectId(memId);
      }

      if (plotId) {
        query.plotId = new Types.ObjectId(plotId);
      }

      if (mozaVillage) {
        query.mozaVillage = { $regex: mozaVillage, $options: 'i' };
      }

      if (khasraNo) {
        query.khasraNo = { $regex: khasraNo, $options: 'i' };
      }

      if (khewatNo) {
        query.khewatNo = { $regex: khewatNo, $options: 'i' };
      }

      if (khatoniNo) {
        query.khatoniNo = { $regex: khatoniNo, $options: 'i' };
      }
    }

    const registries = await Registry.find(query)
      .populate({
      path: 'plotId',
      select: 'plotNo plotArea plotDimensions',
      populate: [
        { path: 'plotBlockId', select: 'plotBlockName' },
        { path: 'projectId', select: 'projName projCode' },
      ],
    })
      .populate('memId', 'memName memNic')
      .limit(limit)
      .sort({ createdAt: -1 })
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return registries;
  },

  /**
   * Get registries by year
   */
  async getRegistriesByYear(year: number): Promise<RegistryType[]> {
    const query = {
      isDeleted: false,
      isActive: true,
      $expr: {
        $eq: [{ $year: '$createdAt' }, year],
      },
    };

    const registries = await Registry.find(query)
      .populate({
      path: 'plotId',
      select: 'plotNo plotArea plotDimensions',
      populate: [
        { path: 'plotBlockId', select: 'plotBlockName' },
        { path: 'projectId', select: 'projName projCode' },
      ],
    })
      .populate('memId', 'memName memNic')
      .sort({ createdAt: -1 })
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return registries;
  },

  /**
   * Get registries by sub-registrar
   */
  async getRegistriesBySubRegistrar(
    subRegistrarName: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ registries: RegistryType[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const query = {
      subRegistrarName: { $regex: subRegistrarName, $options: 'i' },
      isDeleted: false,
      isActive: true,
    };

    const [registries, total] = await Promise.all([
      Registry.find(query)
        .populate({
        path: 'plotId',
        select: 'plotNo plotArea plotDimensions',
        populate: [
          { path: 'plotBlockId', select: 'plotBlockName' },
          { path: 'projectId', select: 'projName projCode' },
        ],
      })
        .populate('memId', 'memName memNic')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      Registry.countDocuments(query),
    ]);

    return {
      registries,
      total,
      pages: Math.ceil(total / limit),
    };
  },

  /**
   * Bulk update registries
   */
  async bulkUpdateRegistries(
    registryIds: string[],
    updateData: UpdateRegistryDto,
    userId: Types.ObjectId
  ): Promise<{ matched: number; modified: number }> {
    if (!registryIds || !Array.isArray(registryIds) || registryIds.length === 0) {
      throw new Error('Registry IDs must be a non-empty array');
    }

    const objectIds = registryIds.map(id => {
      try {
        return new Types.ObjectId(id);
      } catch (error) {
        throw new Error(`Invalid registry ID: ${id}`);
      }
    });

    const updateObj: any = {
      ...updateData,
      updatedBy: userId,
    };

    // Ensure uppercase for registry and mutation numbers if provided
    if (updateObj.registryNo) {
      updateObj.registryNo = updateObj.registryNo.toUpperCase();
    }
    if (updateObj.mutationNo) {
      updateObj.mutationNo = updateObj.mutationNo.toUpperCase();
    }

    const result = await Registry.updateMany(
      {
        _id: { $in: objectIds },
        isDeleted: false,
      },
      {
        $set: updateObj,
      }
    );

    return {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    };
  },

  /**
   * Verify registry document
   */
  async verifyRegistryDocument(
    id: string,
    verificationStatus: 'Verified' | 'Rejected',
    verificationRemarks: string | undefined,
    userId: Types.ObjectId
  ): Promise<RegistryType | null> {
    const registry = await Registry.findById(id);

    if (!registry || registry.isDeleted) {
      throw new Error('Registry not found');
    }

    if (registry.verificationStatus === verificationStatus) {
      throw new Error(`Registry is already ${verificationStatus.toLowerCase()}`);
    }

    const updateData: any = {
      verificationStatus,
      verifiedBy: userId,
      verifiedAt: new Date(),
      updatedBy: userId,
    };

    if (verificationRemarks) {
      updateData.verificationRemarks = verificationRemarks;
    }

    const updatedRegistry = await Registry.findByIdAndUpdate(
      id,
      {
        $set: updateData,
      },
      { new: true }
    )
      .populate({
        path: 'plotId',
        select: 'plotNo plotArea plotDimensions',
        populate: [
          { path: 'plotBlockId', select: 'plotBlockName' },
          { path: 'projectId', select: 'projName projCode' },
        ],
      })
      .populate('memId', 'memName memNic mobileNo')
      .populate('verifiedBy', 'userName fullName designation');

    return updatedRegistry ? toPlainObject(updatedRegistry) : null;
  },

  /**
   * Get pending verifications
   */
  async getPendingVerifications(
    page: number = 1,
    limit: number = 20
  ): Promise<{ registries: RegistryType[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const query = {
      verificationStatus: 'Pending',
      isDeleted: false,
      isActive: true,
    };

    const [registries, total] = await Promise.all([
      Registry.find(query)
        .populate({
        path: 'plotId',
        select: 'plotNo plotArea plotDimensions',
        populate: [
          { path: 'plotBlockId', select: 'plotBlockName' },
          { path: 'projectId', select: 'projName projCode' },
        ],
      })
        .populate('memId', 'memName memNic mobileNo')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      Registry.countDocuments(query),
    ]);

    return {
      registries,
      total,
      pages: Math.ceil(total / limit),
    };
  },

  /**
   * Get registry statistics
   */
  async getRegistryStatistics(): Promise<RegistryStatistics> {
    const stats = await Registry.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $group: {
          _id: null,
          totalRegistries: { $sum: 1 },
          verifiedRegistries: {
            $sum: { $cond: [{ $eq: ['$verificationStatus', 'Verified'] }, 1, 0] },
          },
          pendingVerifications: {
            $sum: { $cond: [{ $eq: ['$verificationStatus', 'Pending'] }, 1, 0] },
          },
          rejectedRegistries: {
            $sum: { $cond: [{ $eq: ['$verificationStatus', 'Rejected'] }, 1, 0] },
          },
          totalAreaKanal: { $sum: '$areaKanal' },
          totalAreaMarla: { $sum: '$areaMarla' },
          totalAreaSqft: { $sum: '$areaSqft' },
          registriesWithScanCopy: {
            $sum: { $cond: [{ $ifNull: ['$scanCopyPath', false] }, 1, 0] },
          },
          registriesWithPhoto: {
            $sum: { $cond: [{ $ifNull: ['$landOwnerPhoto', false] }, 1, 0] },
          },
        },
      },
    ]);

    const yearlyStats = await Registry.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $group: {
          _id: { $year: '$createdAt' },
          count: { $sum: 1 },
          totalAreaKanal: { $sum: '$areaKanal' },
          totalAreaMarla: { $sum: '$areaMarla' },
        },
      },
      {
        $sort: { _id: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    const verificationStats = await Registry.aggregate([
      {
        $match: { isDeleted: false, verificationStatus: 'Verified' },
      },
      {
        $group: {
          _id: { $month: '$verifiedAt' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const subRegistrarStats = await Registry.aggregate([
      {
        $match: { isDeleted: false, isActive: true },
      },
      {
        $group: {
          _id: '$subRegistrarName',
          count: { $sum: 1 },
        },
      },
      {
        $match: { _id: { $ne: null } },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    const areaDistribution = await Registry.aggregate([
      {
        $match: { isDeleted: false, isActive: true },
      },
      {
        $bucket: {
          groupBy: '$areaSqft',
          boundaries: [0, 1000, 5000, 10000, 20000, 50000, 100000, 1000000],
          default: 'Above 1,000,000',
          output: {
            count: { $sum: 1 },
            totalArea: { $sum: '$areaSqft' },
          },
        },
      },
    ]);

    const baseStats = stats[0] || {
      totalRegistries: 0,
      verifiedRegistries: 0,
      pendingVerifications: 0,
      rejectedRegistries: 0,
      totalAreaKanal: 0,
      totalAreaMarla: 0,
      totalAreaSqft: 0,
      registriesWithScanCopy: 0,
      registriesWithPhoto: 0,
    };

    const byYear: Record<string, number> = {};
    yearlyStats.forEach(stat => {
      byYear[stat._id] = stat.count;
    });

    const bySubRegistrar: Record<string, number> = {};
    subRegistrarStats.forEach(stat => {
      bySubRegistrar[stat._id] = stat.count;
    });

    const byVerificationMonth: Record<string, number> = {};
    verificationStats.forEach(stat => {
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      byVerificationMonth[monthNames[stat._id - 1]] = stat.count;
    });

    const byAreaRange: Record<string, number> = {};
    areaDistribution.forEach(stat => {
      const label =
        stat._id === 'Above 1,000,000'
          ? 'Above 1,000,000 sq.ft'
          : `${stat._id} - ${stat._id + 999} sq.ft`;
      byAreaRange[label] = stat.count;
    });

    // Calculate averages
    const averageAreaKanal =
      baseStats.totalRegistries > 0 ? baseStats.totalAreaKanal / baseStats.totalRegistries : 0;
    const averageAreaMarla =
      baseStats.totalRegistries > 0 ? baseStats.totalAreaMarla / baseStats.totalRegistries : 0;
    const averageAreaSqft =
      baseStats.totalRegistries > 0 ? baseStats.totalAreaSqft / baseStats.totalRegistries : 0;

    return {
      ...baseStats,
      averageAreaKanal,
      averageAreaMarla,
      averageAreaSqft,
      byYear,
      bySubRegistrar,
      byVerificationMonth,
      byAreaRange,
    };
  },

  /**
   * Get registry timeline
   */
  async getRegistryTimeline(days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const timeline = await Registry.aggregate([
      {
        $match: {
          isDeleted: false,
          isActive: true,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
          totalArea: { $sum: '$areaSqft' },
          registries: {
            $push: {
              id: '$_id',
              registryNo: '$registryNo',
              mutationNo: '$mutationNo',
              verificationStatus: '$verificationStatus',
              createdAt: '$createdAt',
            },
          },
        },
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 },
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day',
            },
          },
          count: 1,
          totalArea: 1,
          registries: { $slice: ['$registries', 5] }, // Limit to 5 per day
        },
      },
    ]);

    return timeline;
  },
};
