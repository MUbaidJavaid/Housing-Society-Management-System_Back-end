import { Types } from 'mongoose';

export enum ListingCategory {
  FURNITURE = 'furniture',
  ELECTRONICS = 'electronics',
  VEHICLES = 'vehicles',
  HOUSEHOLD = 'household',
  CLOTHING = 'clothing',
  BOOKS = 'books',
  SPORTS = 'sports',
  SERVICES = 'services',
  PARKING_SPOT = 'parking_spot',
  ROOM_RENTAL = 'room_rental',
  OTHER = 'other',
}

export enum ListingType {
  SELL = 'sell',
  RENT = 'rent',
  FREE = 'free',
  WANTED = 'wanted',
  SERVICE = 'service',
}

export enum ListingCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

export enum ContactPreference {
  APP_CHAT = 'app_chat',
  PHONE = 'phone',
  WHATSAPP = 'whatsapp',
}

export enum ListingStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  RENTED = 'rented',
  EXPIRED = 'expired',
  REMOVED = 'removed',
}

export interface ListingImageType {
  url: string;
  publicId?: string;
}

export interface ListingItemType {
  _id: Types.ObjectId;
  title: string;
  description: string;
  societyId: Types.ObjectId;
  sellerId: Types.ObjectId;
  category: string;
  listingType: string;
  price?: number;
  currency: string;
  negotiable: boolean;
  condition?: string;
  images: ListingImageType[];
  contactPreference: string;
  location?: string;
  status: string;
  viewCount: number;
  favoriteCount: number;
  favoritedBy: Types.ObjectId[];
  expiresAt: Date;
  metadata?: any;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateListingDto {
  title: string;
  description: string;
  societyId: string;
  sellerId: string;
  category: string;
  listingType: string;
  price?: number;
  currency?: string;
  negotiable?: boolean;
  condition?: string;
  images?: ListingImageType[];
  contactPreference?: string;
  location?: string;
  metadata?: any;
}

export interface UpdateListingDto {
  title?: string;
  description?: string;
  category?: string;
  listingType?: string;
  price?: number;
  currency?: string;
  negotiable?: boolean;
  condition?: string;
  images?: ListingImageType[];
  contactPreference?: string;
  location?: string;
  status?: string;
  metadata?: any;
}

export interface ListingQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  societyId?: string;
  category?: string;
  listingType?: string;
  condition?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface GetListingsResult {
  items: ListingItemType[];
  pagination: PaginationResult;
}

export interface CategoryStats {
  category: string;
  count: number;
}
