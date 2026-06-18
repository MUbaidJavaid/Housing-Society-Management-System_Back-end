import { Types } from 'mongoose';
import { AppError } from '../../middleware/error.middleware';
import Listing, { ListingStatus } from '../models/models-listing';
import {
  CategoryStats,
  CreateListingDto,
  GetListingsResult,
  ListingItemType,
  ListingQueryParams,
  UpdateListingDto,
} from '../types/types-marketplace';

const toPlainObject = (doc: any): ListingItemType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;
  if (!plainObj.createdAt && doc.createdAt) plainObj.createdAt = doc.createdAt;
  if (!plainObj.updatedAt && doc.updatedAt) plainObj.updatedAt = doc.updatedAt;
  return plainObj as ListingItemType;
};

const populateFields = [
  { path: 'societyId', select: 'name' },
  { path: 'sellerId', select: 'memName memContEmail memContMob memAddr1' },
  { path: 'createdBy', select: 'firstName lastName email' },
];

export const marketplaceService = {
  async createListing(data: CreateListingDto, userId: Types.ObjectId): Promise<ListingItemType> {
    const listingData: any = {
      ...data,
      societyId: new Types.ObjectId(data.societyId),
      sellerId: new Types.ObjectId(data.sellerId),
      createdBy: userId,
    };

    const listing = await Listing.create(listingData);
    const populated = await Listing.findById(listing._id).populate(populateFields);

    if (!populated) {
      throw new AppError(500, 'Failed to create listing');
    }

    return toPlainObject(populated);
  },

  async getListings(params: ListingQueryParams): Promise<GetListingsResult> {
    const {
      page = 1,
      limit = 20,
      search,
      societyId,
      category,
      listingType,
      condition,
      status,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const query: any = { isDeleted: false };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (societyId) query.societyId = new Types.ObjectId(societyId);
    if (category) query.category = category;
    if (listingType) query.listingType = listingType;
    if (condition) query.condition = condition;
    if (status) query.status = status;

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }

    const skip = (page - 1) * limit;
    const sortObj: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [listings, total] = await Promise.all([
      Listing.find(query)
        .populate(populateFields)
        .sort(sortObj)
        .skip(skip)
        .limit(limit),
      Listing.countDocuments(query),
    ]);

    return {
      items: listings.map(toPlainObject),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getListingById(id: string): Promise<ListingItemType | null> {
    const listing = await Listing.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    }).populate(populateFields);

    if (!listing) return null;
    return toPlainObject(listing);
  },

  async updateListing(id: string, data: UpdateListingDto, _userId: Types.ObjectId): Promise<ListingItemType | null> {
    const updateData: any = { ...data };

    const listing = await Listing.findOneAndUpdate(
      { _id: new Types.ObjectId(id), isDeleted: false },
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate(populateFields);

    if (!listing) return null;
    return toPlainObject(listing);
  },

  async deleteListing(id: string, _userId: Types.ObjectId): Promise<ListingItemType | null> {
    const listing = await Listing.findOneAndUpdate(
      { _id: new Types.ObjectId(id), isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!listing) return null;
    return toPlainObject(listing);
  },

  async markAsSold(id: string, _userId: Types.ObjectId): Promise<ListingItemType | null> {
    const listing = await Listing.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    });

    if (!listing) return null;

    if (listing.status !== ListingStatus.ACTIVE) {
      throw new AppError(400, `Cannot mark as sold. Listing status is "${listing.status}".`);
    }

    listing.status = ListingStatus.SOLD;
    await listing.save();

    const populated = await Listing.findById(listing._id).populate(populateFields);
    return populated ? toPlainObject(populated) : null;
  },

  async toggleFavorite(listingId: string, memberId: Types.ObjectId): Promise<ListingItemType | null> {
    const listing = await Listing.findOne({
      _id: new Types.ObjectId(listingId),
      isDeleted: false,
    });

    if (!listing) return null;

    const memberIdStr = memberId.toString();
    const index = listing.favoritedBy.findIndex(id => id.toString() === memberIdStr);

    if (index === -1) {
      listing.favoritedBy.push(memberId);
      listing.favoriteCount = listing.favoritedBy.length;
    } else {
      listing.favoritedBy.splice(index, 1);
      listing.favoriteCount = listing.favoritedBy.length;
    }

    await listing.save();

    const populated = await Listing.findById(listing._id).populate(populateFields);
    return populated ? toPlainObject(populated) : null;
  },

  async getMyListings(memberId: string, page = 1, limit = 20): Promise<GetListingsResult> {
    const query: any = {
      isDeleted: false,
      sellerId: new Types.ObjectId(memberId),
    };

    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      Listing.find(query)
        .populate(populateFields)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Listing.countDocuments(query),
    ]);

    return {
      items: listings.map(toPlainObject),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getMyFavorites(memberId: string, page = 1, limit = 20): Promise<GetListingsResult> {
    const query: any = {
      isDeleted: false,
      favoritedBy: new Types.ObjectId(memberId),
    };

    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      Listing.find(query)
        .populate(populateFields)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Listing.countDocuments(query),
    ]);

    return {
      items: listings.map(toPlainObject),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async incrementViewCount(id: string): Promise<void> {
    await Listing.findOneAndUpdate(
      { _id: new Types.ObjectId(id), isDeleted: false },
      { $inc: { viewCount: 1 } }
    );
  },

  async getPopularListings(societyId: string, limit = 10): Promise<ListingItemType[]> {
    const listings = await Listing.find({
      isDeleted: false,
      societyId: new Types.ObjectId(societyId),
      status: ListingStatus.ACTIVE,
    })
      .populate(populateFields)
      .sort({ viewCount: -1, favoriteCount: -1 })
      .limit(limit);

    return listings.map(toPlainObject);
  },

  async getCategoryStats(societyId: string): Promise<CategoryStats[]> {
    const stats = await Listing.aggregate([
      {
        $match: {
          isDeleted: false,
          societyId: new Types.ObjectId(societyId),
          status: ListingStatus.ACTIVE,
        },
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    return stats.map((item: any) => ({
      category: item._id,
      count: item.count,
    }));
  },
};
