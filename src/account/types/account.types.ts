// src/types/account.types.ts
export interface IAccount {
  accountId: number; // Keeping original ID for reference
  accountName: string;
  accountHeadId: number | IAccountHead;
  address1: string;
  address2?: string;
  address3?: string;
  phone: string;
  mobile?: string;
  TINNo?: string;
  CSTNo?: string;
  remarks?: string;
  openingBalance: number;
  createdBy?: string; // ObjectId reference to User
  createdOn?: Date;
  modifiedBy?: string; // ObjectId reference to User
  modifiedOn?: Date;
  code?: string;
  memCNIC?: string;
  memberId?: number;
  cityId?: number;
}

export interface IAccountHead {
  accountHeadId: number;
  accountHeadName: string;
  accountMasterId: number | IFinalAccount;
  bookId: number | IBook;
  createdBy?: string;
  createdOn?: Date;
  modifiedBy?: string;
  modifiedOn?: Date;
  code?: string;
}

export interface IFinalAccount {
  accountMasterId: number;
  finalAccountName: string;
  firstColumnType: string;
  firstColumnHeading: string;
  secondColumnHeading: string;
  createdBy?: string;
  createdOn?: Date;
  modifiedBy?: string;
  modifiedOn?: Date;
  code?: string;
}

export interface IBook {
  bookId: number;
  bookName: string;
  description?: string;
  createdBy?: string;
  createdOn?: Date;
  modifiedBy?: string;
  modifiedOn?: Date;
}
