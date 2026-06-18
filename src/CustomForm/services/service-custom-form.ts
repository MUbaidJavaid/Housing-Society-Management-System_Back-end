import { Types } from 'mongoose';
import CustomForm, { EntityTypes } from '../models/models-custom-form';
import {
  CreateCustomFormDto,
  CustomFormPlainType,
  CustomFormQueryParams,
  GetCustomFormsResult,
  ReorderItem,
  UpdateCustomFormDto,
  ValidationError,
} from '../types/types-custom-form';

const toPlainObject = (doc: any): CustomFormPlainType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;
  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }
  return plainObj as CustomFormPlainType;
};

export const customFormService = {
  /**
   * Create a new custom form field definition
   */
  async create(
    data: CreateCustomFormDto,
    userId: Types.ObjectId
  ): Promise<CustomFormPlainType> {
    const formData = {
      ...data,
      createdBy: userId,
      modifiedBy: userId,
    };

    const customForm = await CustomForm.create(formData);

    const created = await CustomForm.findById(customForm._id)
      .populate('createdBy', 'userName fullName')
      .populate('modifiedBy', 'userName fullName');

    if (!created) {
      throw new Error('Failed to create custom form field');
    }

    return toPlainObject(created);
  },

  /**
   * Get all custom form fields with pagination
   */
  async getAll(params: CustomFormQueryParams): Promise<GetCustomFormsResult> {
    const {
      page = 1,
      limit = 20,
      search = '',
      entityType,
      fieldType,
      isActive,
      societyId,
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
        { fieldName: { $regex: search, $options: 'i' } },
        { fieldLabel: { $regex: search, $options: 'i' } },
        { section: { $regex: search, $options: 'i' } },
      ];
    }

    if (entityType) {
      query.entityType = entityType;
    }

    if (fieldType) {
      query.fieldType = fieldType;
    }

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    if (societyId) {
      query.societyId = new Types.ObjectId(societyId);
    }

    const [customForms, total] = await Promise.all([
      CustomForm.find(query)
        .populate('createdBy', 'userName fullName')
        .populate('modifiedBy', 'userName fullName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      CustomForm.countDocuments(query),
    ]);

    return {
      customForms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get custom form field by ID
   */
  async getById(id: string): Promise<CustomFormPlainType> {
    const customForm = await CustomForm.findById(id)
      .populate('createdBy', 'userName fullName')
      .populate('modifiedBy', 'userName fullName');

    if (!customForm || customForm.isDeleted) {
      throw new Error('Custom form field not found');
    }

    return toPlainObject(customForm);
  },

  /**
   * Get all fields for an entity type (sorted by order)
   */
  async getByEntity(
    societyId: string,
    entityType: string
  ): Promise<CustomFormPlainType[]> {
    const fields = await CustomForm.getByEntity(societyId, entityType, true);
    return fields.map(doc => toPlainObject(doc));
  },

  /**
   * Update custom form field
   */
  async update(
    id: string,
    data: UpdateCustomFormDto,
    userId: Types.ObjectId
  ): Promise<CustomFormPlainType | null> {
    const existing = await CustomForm.findById(id);
    if (!existing || existing.isDeleted) {
      throw new Error('Custom form field not found');
    }

    const updateObj: any = {
      ...data,
      modifiedBy: userId,
    };

    const customForm = await CustomForm.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'userName fullName')
      .populate('modifiedBy', 'userName fullName');

    return customForm ? toPlainObject(customForm) : null;
  },

  /**
   * Soft delete custom form field
   */
  async delete(id: string, userId: Types.ObjectId): Promise<boolean> {
    const existing = await CustomForm.findById(id);
    if (!existing || existing.isDeleted) {
      throw new Error('Custom form field not found');
    }

    const result = await CustomForm.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          isActive: false,
          modifiedBy: userId,
        },
      },
      { new: true }
    );

    return !!result;
  },

  /**
   * Bulk reorder custom form fields
   */
  async reorder(items: ReorderItem[]): Promise<boolean> {
    const bulkOps = items.map(item => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(item.id) },
        update: { $set: { order: item.order } },
      },
    }));

    await CustomForm.bulkWrite(bulkOps);
    return true;
  },

  /**
   * Get list of supported entity types
   */
  getEntityTypes(): string[] {
    return [...EntityTypes];
  },

  /**
   * Validate custom field values against definitions
   */
  async validateMetadata(
    entityType: string,
    societyId: string,
    metadata: Record<string, any>
  ): Promise<{ valid: boolean; errors: ValidationError[] }> {
    const fields = await CustomForm.getByEntity(societyId, entityType, true);
    const errors: ValidationError[] = [];

    for (const field of fields) {
      const value = metadata[field.fieldName];

      // Check required fields
      if (field.isRequired && (value === undefined || value === null || value === '')) {
        errors.push({
          fieldName: field.fieldName,
          message: `${field.fieldLabel} is required`,
        });
        continue;
      }

      // Skip validation if value is empty and not required
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // Type-specific validation
      switch (field.fieldType) {
        case 'number': {
          if (typeof value !== 'number' && isNaN(Number(value))) {
            errors.push({
              fieldName: field.fieldName,
              message: `${field.fieldLabel} must be a number`,
            });
          }
          break;
        }
        case 'email': {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(String(value))) {
            errors.push({
              fieldName: field.fieldName,
              message: `${field.fieldLabel} must be a valid email`,
            });
          }
          break;
        }
        case 'url': {
          try {
            new URL(String(value));
          } catch {
            errors.push({
              fieldName: field.fieldName,
              message: `${field.fieldLabel} must be a valid URL`,
            });
          }
          break;
        }
        case 'date': {
          if (isNaN(Date.parse(String(value)))) {
            errors.push({
              fieldName: field.fieldName,
              message: `${field.fieldLabel} must be a valid date`,
            });
          }
          break;
        }
        case 'boolean': {
          if (typeof value !== 'boolean') {
            errors.push({
              fieldName: field.fieldName,
              message: `${field.fieldLabel} must be a boolean`,
            });
          }
          break;
        }
        case 'select': {
          if (field.options && field.options.length > 0) {
            const validValues = field.options.map(o => o.value);
            if (!validValues.includes(String(value))) {
              errors.push({
                fieldName: field.fieldName,
                message: `${field.fieldLabel} must be one of: ${validValues.join(', ')}`,
              });
            }
          }
          break;
        }
        case 'multiselect': {
          if (!Array.isArray(value)) {
            errors.push({
              fieldName: field.fieldName,
              message: `${field.fieldLabel} must be an array`,
            });
          } else if (field.options && field.options.length > 0) {
            const validValues = field.options.map(o => o.value);
            const invalidValues = value.filter((v: string) => !validValues.includes(v));
            if (invalidValues.length > 0) {
              errors.push({
                fieldName: field.fieldName,
                message: `${field.fieldLabel} contains invalid values: ${invalidValues.join(', ')}`,
              });
            }
          }
          break;
        }
      }

      // Validation rules
      if (field.validationRules) {
        const rules = field.validationRules;

        if (rules.min !== undefined && Number(value) < rules.min) {
          errors.push({
            fieldName: field.fieldName,
            message: `${field.fieldLabel} must be at least ${rules.min}`,
          });
        }

        if (rules.max !== undefined && Number(value) > rules.max) {
          errors.push({
            fieldName: field.fieldName,
            message: `${field.fieldLabel} must be at most ${rules.max}`,
          });
        }

        if (rules.minLength !== undefined && String(value).length < rules.minLength) {
          errors.push({
            fieldName: field.fieldName,
            message: `${field.fieldLabel} must be at least ${rules.minLength} characters`,
          });
        }

        if (rules.maxLength !== undefined && String(value).length > rules.maxLength) {
          errors.push({
            fieldName: field.fieldName,
            message: `${field.fieldLabel} must be at most ${rules.maxLength} characters`,
          });
        }

        if (rules.pattern) {
          const regex = new RegExp(rules.pattern);
          if (!regex.test(String(value))) {
            errors.push({
              fieldName: field.fieldName,
              message: `${field.fieldLabel} does not match the required pattern`,
            });
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};
