// src/models/account/Book.model.ts
import mongoose, { Document, Schema } from 'mongoose';
import { IBook } from '../types/account.types';

export interface IBookDocument extends IBook, Document {}

const BookSchema = new Schema<IBookDocument>(
  {
    bookId: { type: Number, required: true, unique: true },
    bookName: { type: String, required: true, trim: true },
    description: { type: String },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    createdOn: { type: Date, default: Date.now },
    modifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    modifiedOn: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    collection: 'books',
  }
);

BookSchema.index({ bookName: 1 });

export const Book = mongoose.model<IBookDocument>('Book', BookSchema);
