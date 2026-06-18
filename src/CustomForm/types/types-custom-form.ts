import { Types } from 'mongoose';
import { FieldTypeEnum, WidthEnum, IFieldOption, IValidationRules, IVisibility } from '../models/models-custom-form';

export interface CustomFormPlainType {
  _id: Types.ObjectId;
  entityType: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: FieldTypeEnum;
  options: IFieldOption[];
  isRequired: boolean;
  defaultValue: any;
  validationRules: IValidationRules;
  placeholder: string;
  helpText: string;
  order: number;
  section: string;
  visibility: IVisibility;
  width: WidthEnum;
  societyId: Types.ObjectId;
  isActive: boolean;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCustomFormDto {
  entityType: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: FieldTypeEnum;
  options?: IFieldOption[];
  isRequired?: boolean;
  defaultValue?: any;
  validationRules?: IValidationRules;
  placeholder?: string;
  helpText?: string;
  order?: number;
  section?: string;
  visibility?: IVisibility;
  width?: WidthEnum;
  societyId: string;
}

export interface UpdateCustomFormDto {
  entityType?: string;
  fieldName?: string;
  fieldLabel?: string;
  fieldType?: FieldTypeEnum;
  options?: IFieldOption[];
  isRequired?: boolean;
  defaultValue?: any;
  validationRules?: IValidationRules;
  placeholder?: string;
  helpText?: string;
  order?: number;
  section?: string;
  visibility?: IVisibility;
  width?: WidthEnum;
  isActive?: boolean;
}

export interface CustomFormQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  entityType?: string;
  fieldType?: FieldTypeEnum;
  isActive?: boolean;
  societyId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetCustomFormsResult {
  customForms: CustomFormPlainType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ReorderItem {
  id: string;
  order: number;
}

export interface ValidationError {
  fieldName: string;
  message: string;
}
