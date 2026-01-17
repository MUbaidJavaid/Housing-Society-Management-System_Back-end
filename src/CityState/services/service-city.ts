import { Types } from 'mongoose';
import { CityQueryParams, CreateCityDto, UpdateCityDto } from '../index-city';
import City from '../models/models-city';

export const cityService = {
  async createCity(data: CreateCityDto, userId: Types.ObjectId): Promise<any> {
    const city = await City.create({
      ...data,
      stateId: new Types.ObjectId(data.stateId),
      statusId: data.statusId ? new Types.ObjectId(data.statusId) : undefined,
      createdBy: userId,
      updatedBy: userId,
    });

    return city;
  },

  async getCityById(id: string): Promise<any | null> {
    const city = await City.findById(id)
      .populate('stateId', 'stateName')
      .populate('statusId', 'statusName')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return city?.toObject() || null;
  },

  async getCities(params: CityQueryParams): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search = '',
      stateId,
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
        { cityName: { $regex: search, $options: 'i' } },
        { cityDescription: { $regex: search, $options: 'i' } },
      ];
    }

    if (stateId) query.stateId = new Types.ObjectId(stateId);
    if (statusId) query.statusId = new Types.ObjectId(statusId);

    const [cities, total] = await Promise.all([
      City.find(query)
        .populate('stateId', 'stateName')
        .populate('statusId', 'statusName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => doc.toObject())),
      City.countDocuments(query),
    ]);

    return {
      cities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getCitiesByState(stateId: string): Promise<any[]> {
    const cities = await City.find({
      stateId: new Types.ObjectId(stateId),
      isDeleted: false,
    })
      .select('cityName')
      .sort('cityName')
      .then(docs => docs.map(doc => doc.toObject()));

    return cities;
  },

  async updateCity(id: string, data: UpdateCityDto, userId: Types.ObjectId): Promise<any | null> {
    const updateData: any = { ...data };

    if (data.stateId) updateData.stateId = new Types.ObjectId(data.stateId);
    if (data.statusId) updateData.statusId = new Types.ObjectId(data.statusId);

    updateData.updatedBy = userId;

    const city = await City.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('stateId', 'stateName')
      .populate('statusId', 'statusName')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return city?.toObject() || null;
  },

  async deleteCity(id: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await City.findByIdAndUpdate(
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

  async checkCityExists(cityName: string, stateId: string, excludeId?: string): Promise<boolean> {
    const query: any = {
      cityName: { $regex: new RegExp(`^${cityName}$`, 'i') },
      stateId: new Types.ObjectId(stateId),
      isDeleted: false,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await City.countDocuments(query);
    return count > 0;
  },

  async getAllCities(): Promise<any[]> {
    const cities = await City.find({ isDeleted: false })
      .populate('stateId', 'stateName')
      .select('cityName stateId')
      .sort('cityName')
      .then(docs =>
        docs.map(doc => ({
          id: doc._id,
          name: doc.cityName,
          state: (doc as any).stateId?.stateName || 'N/A',
        }))
      );

    return cities;
  },
};
