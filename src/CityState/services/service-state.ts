import { Types } from 'mongoose';
import { CreateStateDto, StateQueryParams, UpdateStateDto } from '../index-state';
import City from '../models/models-city';
import State from '../models/models-state';

export const stateService = {
  async createState(data: CreateStateDto, userId: Types.ObjectId): Promise<any> {
    const state = await State.create({
      ...data,
      statusId: data.statusId ? new Types.ObjectId(data.statusId) : undefined,
      createdBy: userId,
      updatedBy: userId,
    });

    return state;
  },

  async getStateById(id: string): Promise<any | null> {
    const state = await State.findById(id)
      .populate('statusId', 'statusName')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return state?.toObject() || null;
  },

  async getStates(params: StateQueryParams): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search = '',
      statusId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { isDeleted: false };

    if (search) {
      query.$or = [
        { stateName: { $regex: search, $options: 'i' } },
        { stateDescription: { $regex: search, $options: 'i' } },
      ];
    }

    if (statusId) query.statusId = new Types.ObjectId(statusId);

    const [states, total] = await Promise.all([
      State.find(query)
        .populate('statusId', 'statusName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => doc.toObject())),
      State.countDocuments(query),
    ]);

    return {
      states,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getStateWithCities(stateId: string): Promise<any | null> {
    const [state, cities] = await Promise.all([
      State.findById(stateId).populate('statusId', 'statusName'),
      City.find({
        stateId: new Types.ObjectId(stateId),
        isDeleted: false,
      })
        .select('cityName')
        .sort('cityName')
        .then(docs => docs.map(doc => doc.toObject())),
    ]);

    if (!state || (state as any).isDeleted) return null;

    return {
      ...state.toObject(),
      cities,
    };
  },

  async updateState(id: string, data: UpdateStateDto, userId: Types.ObjectId): Promise<any | null> {
    const updateData: any = { ...data };

    if (data.statusId) updateData.statusId = new Types.ObjectId(data.statusId);

    updateData.updatedBy = userId;

    const state = await State.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('statusId', 'statusName')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return state?.toObject() || null;
  },

  async deleteState(id: string, userId: Types.ObjectId): Promise<boolean> {
    // Check if state has cities
    const cityCount = await City.countDocuments({
      stateId: new Types.ObjectId(id),
      isDeleted: false,
    });

    if (cityCount > 0) {
      throw new Error('Cannot delete state with associated cities');
    }

    const result = await State.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          updatedBy: userId,
        },
      },
      { new: true }
    );

    return !!result;
  },

  async checkStateExists(stateName: string, excludeId?: string): Promise<boolean> {
    const query: any = {
      stateName: { $regex: new RegExp(`^${stateName}$`, 'i') },
      isDeleted: false,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await State.countDocuments(query);
    return count > 0;
  },

  async getAllStates(): Promise<any[]> {
    const states = await State.find({ isDeleted: false })
      .select('stateName')
      .sort('stateName')
      .then(docs => docs.map(doc => doc.toObject()));

    return states;
  },

  async getStateSummary(): Promise<any> {
    const [totalStates, statesWithCities] = await Promise.all([
      State.countDocuments({ isDeleted: false }),
      State.aggregate([
        { $match: { isDeleted: false } },
        {
          $lookup: {
            from: 'cities',
            let: { stateId: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$stateId', '$$stateId'] }, isDeleted: false } },
              { $count: 'cityCount' },
            ],
            as: 'cities',
          },
        },
        { $unwind: { path: '$cities', preserveNullAndEmptyArrays: true } },
        { $project: { stateName: 1, cityCount: { $ifNull: ['$cities.cityCount', 0] } } },
      ]),
    ]);

    return {
      totalStates,
      statesWithCities,
    };
  },
};
