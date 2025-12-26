import { Document, Types } from 'mongoose';

export interface BaseDocument extends Document {
  _id: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  __v?: number;
}

// User interfaces
export interface IUser {
  userId: number;
  username: string;
  email: string;
  passwordHash?: string; // Made optional for transform
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleId: Types.ObjectId | string;
  isActive: boolean;
  lastLogin?: Date;
  createdBy?: Types.ObjectId | string;
  createdOn: Date;
  modifiedBy?: Types.ObjectId | string;
  modifiedOn?: Date;
  department?: string;
  designation?: string;
  address?: string;
}

export interface IRole {
  roleId: number;
  role: string;
  description?: string;
  isSystemRole: boolean;
  createdBy?: Types.ObjectId | string;
  createdOn: Date;
  modifiedBy?: Types.ObjectId | string;
  modifiedOn?: Date;
}

export interface ISecurity {
  roleId: Types.ObjectId | string;
  formId: Types.ObjectId | string;
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  createdOn: Date;
  modifiedOn?: Date;
}

export interface IForm {
  formId: number;
  formName: string;
  formCaption: string;
  formType: string;
  isActive: boolean;
  createdOn: Date;
  modifiedOn?: Date;
}

// For backward compatibility (you can remove these if not needed)
export interface IUserRole extends BaseDocument {
  roleId: number;
  role: string;
  description?: string;
}

export interface IUserLegacy extends BaseDocument {
  userId: number;
  username: string;
  roleId: number;
  userMobile?: string;
  userEmail: string;
  password: string;
}

export interface ISecurityPermission extends BaseDocument {
  securityId: number;
  roleId: number;
  formId: number;
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}
