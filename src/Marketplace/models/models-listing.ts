import { Document, Schema, Types, model } from 'mongoose';

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

export interface IListingImage {
  url: string;
  publicId?: string;
}

export interface IListing extends Document {
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
  images: IListingImage[];
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

const listingSchema = new Schema<IListing>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Seller ID is required'],
    },
    category: {
      type: String,
      enum: Object.values(ListingCategory),
      required: [true, 'Category is required'],
    },
    listingType: {
      type: String,
      enum: Object.values(ListingType),
      required: [true, 'Listing type is required'],
    },
    price: {
      type: Number,
    },
    currency: {
      type: String,
      default: 'PKR',
    },
    negotiable: {
      type: Boolean,
      default: true,
    },
    condition: {
      type: String,
      enum: Object.values(ListingCondition),
    },
    images: [
      {
        url: { type: String },
        publicId: { type: String },
      },
    ],
    contactPreference: {
      type: String,
      enum: Object.values(ContactPreference),
      default: ContactPreference.APP_CHAT,
    },
    location: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(ListingStatus),
      default: ListingStatus.ACTIVE,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    favoriteCount: {
      type: Number,
      default: 0,
    },
    favoritedBy: [
      {
        type: Schema.Types.ObjectId,
      },
    ],
    expiresAt: {
      type: Date,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
listingSchema.index({ societyId: 1, category: 1, status: 1, isDeleted: 1 });
listingSchema.index({ sellerId: 1 });
listingSchema.index({ expiresAt: 1 });
listingSchema.index(
  { title: 'text', description: 'text' },
  {
    weights: { title: 10, description: 3 },
    name: 'listing_text_search',
  }
);

// Pre-save: auto-set expiresAt to 30 days from creation
listingSchema.pre('save', function (next) {
  if (this.isNew && !this.expiresAt) {
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    this.expiresAt = thirtyDays;
  }
  next();
});

const Listing = model<IListing>('Listing', listingSchema);

export default Listing;
